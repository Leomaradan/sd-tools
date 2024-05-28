import { Separator, confirm, input, select } from '@inquirer/prompts';
import { existsSync } from 'fs';

import type { IAutoAdetailer, IAutoControlnetPose } from '../commons/types';

import { Config } from '../commons/config';
import { TiledDiffusionMethods } from '../commons/extensions/multidiffusionUpscaler';
import {
  type EditableOptions,
  setConfigAutoCutoff,
  setConfigAutoLCM,
  setConfigAutoTiledDiffusion,
  setConfigAutoTiledVAE,
  setConfigCommonNegative,
  setConfigCommonNegativeXL,
  setConfigCommonPositive,
  setConfigCommonPositiveXL,
  setConfigCutoffWeight,
  setConfigEndpoint,
  setConfigLCM,
  setConfigRedrawModels,
  setConfigScheduler
} from './functions';

export const command = 'wizard';
export const describe = 'wizard helping configuring values';

interface IWizardOptions {
  callback: () => Promise<void>;
  description: string;
  name: string;
  value: EditableOptions;
}

export const wizardOptions: Array<IWizardOptions | Separator> = [
  new Separator('Basic options'),
  {
    callback: async () => {
      const prompt = Config.get('commonPositive');
      const response = await input({ default: prompt, message: 'Common prompt?' });
      setConfigCommonPositive(response);
    },
    description: 'Set common positive prompt',
    name: 'Common Positive',
    value: 'common-positive'
  },
  {
    callback: async () => {
      const prompt = Config.get('commonPositiveXL');
      const response = await input({ default: prompt, message: 'Common prompt (SDXL) ?' });
      setConfigCommonPositiveXL(response);
    },
    description: 'Set common positive prompt for SDXL',
    name: 'Common Positive XL',
    value: 'common-positive-xl'
  },
  {
    callback: async () => {
      const prompt = Config.get('commonNegative');
      const response = await input({ default: prompt, message: 'Common negative prompt?' });
      setConfigCommonNegative(response);
    },
    description: 'Set common negative prompt',
    name: 'Common Negative',
    value: 'common-negative'
  },
  {
    callback: async () => {
      const prompt = Config.get('commonNegativeXL');
      const response = await input({ default: prompt, message: 'Common negative prompt (SDXL) ?' });
      setConfigCommonNegativeXL(response);
    },
    description: 'Set common negative prompt for SDXL',
    name: 'Common Negative XL',
    value: 'common-negative-xl'
  },
  new Separator('Select models'),
  {
    callback: async () => {
      const redrawModels = Config.get('redrawModels');

      const actionType = await select<keyof typeof redrawModels>({
        choices: [
          { name: 'Anime for SD 1.5', value: 'anime15' },
          { name: 'Realist for SD 1.5', value: 'realist15' },
          { name: 'Anime for SDXL', value: 'animexl' },
          { name: 'Realist for SDXL', value: 'realistxl' }
        ],
        message: 'Select model type'
      });

      const modelType = actionType === 'anime15' || actionType === 'realist15' ? 'sd15' : 'sdxl';
      const listModels = Config.get('models');
      const listModelsFiltered = listModels.filter((model) => model.version === modelType);
      const selectedModels = redrawModels[actionType] as string;

      const model = await select({
        choices: [{ name: 'None', value: 'none' }, ...listModelsFiltered.map((model) => ({ value: model.name }))],
        default: selectedModels,
        message: 'Select the model'
      });

      if (model === 'none') {
        delete redrawModels[actionType];
      } else {
        redrawModels[actionType] = model;
      }

      setConfigRedrawModels(redrawModels);
    },
    description: 'Set redraw models',
    name: 'Redraw Models',
    value: 'redraw-models'
  },
  {
    callback: async () => {
      const lcm = Config.get('lcm');

      const actionType = await select<keyof typeof lcm>({
        choices: [
          { name: 'SD 1.5', value: 'sd15' },
          { name: 'SDXL', value: 'sdxl' }
        ],
        message: 'Select model type'
      });

      const listLoras = Config.get('loras');
      const listLorasFiltered = listLoras.filter((loras) => loras.version === actionType);
      const selectedLoras = lcm[actionType] as string;

      const model = await select({
        choices: [{ name: 'None', value: 'none' }, ...listLorasFiltered.map((model) => ({ value: model.name }))],
        default: selectedLoras,
        message: 'Select the model'
      });

      if (model === 'none') {
        delete lcm[actionType];
      } else if (actionType === 'sd15' || actionType === 'sdxl') {
        lcm[actionType] = model;
      }

      setConfigLCM(lcm);
    },
    description: 'Set LCM models',
    name: 'LCM Models',
    value: 'lcm'
  },
  new Separator('Execution options'),
  {
    callback: async () => {
      const prompt = Config.get('endpoint');
      const response = await input({
        default: prompt,
        message: 'New Endpoint URL',
        validate: (value) => {
          if (value.startsWith('http://') || value.startsWith('https://')) {
            return true;
          }
          return 'Please enter a valid URL';
        }
      });
      setConfigEndpoint(response);
    },
    description: 'Set endpoint',
    name: 'Endpoint URL',
    value: 'endpoint'
  },
  {
    callback: async () => {
      const scheduler = Config.get('scheduler');
      const response = await confirm({ default: scheduler, message: 'Activate Agent Scheduler ?' });
      setConfigScheduler(response);
    },
    description: 'Enable or disable using Agent Scheduler',
    name: 'Agent Scheduler',
    value: 'scheduler'
  },
  new Separator('Automatic actions'),
  {
    callback: async () => {
      const lcm = Config.get('lcm');
      const response = await confirm({ default: lcm.auto, message: 'Activate Auto-LCM ?' });
      setConfigAutoLCM(response);
    },
    description: 'Enable or disable auto lcm',
    name: 'Auto LCM',
    value: 'auto-lcm'
  },
  {
    callback: async () => {
      const actionType = await select({
        choices: [
          { name: 'Add a trigger', value: 'add' },
          { name: 'Remove a trigger', value: 'remove' }
        ],
        message: 'Select action type'
      });

      if (actionType === 'add') {
        const adetailersModels = Config.get('adetailersModels');
        const autoAdetailers = Config.get('autoAdetailers');

        const triggerName = await input({
          message: 'Enter trigger',
          validate: (value) => {
            const pass = RegExp(/^[a-z0-9_-]+$/i).exec(value);
            if (!pass) {
              return 'Trigger must be a string with only letters, numbers, dash and underscore';
            }

            const found = autoAdetailers.find((model) => model.trigger === value);

            if (found) {
              return 'Trigger already exists';
            }

            return true;
          }
        });

        if (!triggerName) {
          return;
        }

        const usableModels = adetailersModels.filter((model) => !autoAdetailers.some((autoModel) => autoModel.ad_model === model));

        const triggerModel = await select({
          choices: [{ name: '(Cancel)', value: '-' }, new Separator(), ...usableModels.map((model) => ({ value: model }))],
          message: 'Select model to trigger'
        });

        if (triggerName === '-') {
          return;
        }

        const prompt = await input({ message: 'Enter optional prompt. Leave empty to skip' });
        const negativePrompt = await input({ message: 'Enter optional negative prompt. Leave empty to skip' });
        const denoisingStrength = await input({ message: 'Enter optional denoising strength. Leave empty to skip' });

        const newAutoAdetailers: IAutoAdetailer = {
          ad_denoising_strength: denoisingStrength ? Number(denoisingStrength) : undefined,
          ad_model: triggerModel,
          ad_negative_prompt: negativePrompt !== '' ? negativePrompt : undefined,
          ad_prompt: prompt !== '' ? prompt : undefined,
          trigger: triggerName
        };

        Config.set('autoAdetailers', Array.from(new Set([...autoAdetailers, newAutoAdetailers])));
      } else {
        const autoAdetailers = Config.get('autoAdetailers');

        const triggerModel = await select({
          choices: [
            { name: '(Cancel)', value: '-' },
            new Separator(),
            ...autoAdetailers.map((model) => ({
              description: `Prompt: "${model.ad_prompt ?? 'N/A'}", Negative Prompt: "${model.ad_negative_prompt ?? 'N/A'}", Denoising Strength: ${model.ad_denoising_strength ?? 'N/A'}`,
              name: `!pose:${model.trigger} (${model.ad_model})`,
              value: model.ad_model
            })),
            new Separator()
          ],
          message: 'Select trigger to remove'
        });
        if (triggerModel === '-') {
          return;
        }

        const index = autoAdetailers.findIndex((model) => model.ad_model === triggerModel);
        autoAdetailers.splice(index, 1);
        Config.set('autoAdetailers', autoAdetailers);
      }
    },
    description: 'Set the Auto Add Detailers triggers',
    name: 'Auto Adetailers',
    value: 'auto-adetailers'
  },
  {
    callback: async () => {
      const actionType = await select({
        choices: [
          { name: 'Add a trigger', value: 'add' },
          { name: 'Remove a trigger', value: 'remove' }
        ],
        message: 'Select action type'
      });

      if (actionType === 'add') {
        const autoControlnetPose = Config.get('autoControlnetPose');

        const triggerName = await input({
          message: 'Enter trigger',
          validate: (value) => {
            const pass = RegExp(/^[a-z0-9_-]+$/i).exec(value);
            if (!pass) {
              return 'Trigger must be a string with only letters, numbers, dash and underscore';
            }

            const found = autoControlnetPose.find((model) => model.trigger === value);

            if (found) {
              return 'Trigger already exists';
            }

            return true;
          }
        });

        if (!triggerName) {
          return;
        }

        const triggerPose = await input({
          message: 'Select the path to the pose image',
          validate: (value) => {
            const found = autoControlnetPose.find((model) => model.pose === value);

            if (found) {
              return 'Pose is already used';
            }

            if (!existsSync(value)) {
              return 'Pose file does not exist';
            }

            return true;
          }
        });

        if (!triggerName) {
          return;
        }

        const beforePrompt = await input({ message: 'Enter optional prompt that will be APPEND to the query prompt. Leave empty to skip' });
        const afterPrompt = await input({ message: 'Enter optional prompt that will be PREPEND to the query prompt. Leave empty to skip' });

        const newAutoControlNetPose: IAutoControlnetPose = {
          afterPrompt: afterPrompt !== '' ? afterPrompt : undefined,
          beforePrompt: beforePrompt !== '' ? beforePrompt : undefined,
          pose: triggerPose,
          trigger: triggerName
        };

        Config.set('autoControlnetPose', Array.from(new Set([...autoControlnetPose, newAutoControlNetPose])));
      } else {
        const autoControlnetPose = Config.get('autoControlnetPose');

        const triggerModel = await select({
          choices: [
            { name: '(Cancel)', value: '-' },
            new Separator(),
            ...autoControlnetPose.map((model) => ({
              description: `Before Prompt: "${model.beforePrompt ?? 'N/A'}", After Prompt: ${model.afterPrompt ?? 'N/A'}`,
              name: `!ad:${model.trigger} (${model.pose})`,
              value: model.pose
            })),
            new Separator()
          ],
          message: 'Select trigger to remove'
        });
        if (triggerModel === '-') {
          return;
        }

        const index = autoControlnetPose.findIndex((model) => model.pose === triggerModel);
        autoControlnetPose.splice(index, 1);
        Config.set('autoControlnetPose', autoControlnetPose);
      }
    },
    description: 'Set the Controlnet OpenPose triggers',
    name: 'Auto Controlnet OpenPose',
    value: 'auto-controlnet-pose'
  },
  {
    callback: async () => {
      const cutoff = Config.get('cutoff');
      const response = await confirm({ default: cutoff, message: 'Activate Auto-CutOff ?' });
      setConfigAutoCutoff(response);
    },
    description: 'Enable or disable auto cutoff',
    name: 'Auto CutOff',
    value: 'auto-cutoff'
  },
  {
    callback: async () => {
      const autoTiledDiffusion = Config.get('autoTiledDiffusion');
      const response = await select<'false' | TiledDiffusionMethods>({
        choices: [
          { name: 'Mixture of Diffusers', value: TiledDiffusionMethods.MixtureOfDiffusers },
          { name: 'MultiDiffusion', value: TiledDiffusionMethods.MultiDiffusion },
          { name: 'Deactivate Auto-TiledDiffusion', value: 'false' }
        ],
        default: autoTiledDiffusion,
        message: 'Activate Auto-TiledDiffusion ?'
      });

      if (response === 'false') {
        setConfigAutoTiledDiffusion(false);
      } else {
        setConfigAutoTiledDiffusion(response);
      }
    },
    description: 'Enable or disable auto tiled diffusion',
    name: 'Auto TiledDiffusion',
    value: 'auto-tiled-diffusion'
  },
  {
    callback: async () => {
      const autoTiledVAE = Config.get('autoTiledVAE');
      const response = await confirm({ default: autoTiledVAE, message: 'Activate Auto-TiledVAE ?' });
      setConfigAutoTiledVAE(response);
    },
    description: 'Enable or disable auto tiled vae',
    name: 'Auto TiledVAE',
    value: 'auto-tiled-vae'
  },
  new Separator('Cutoff Options'),
  {
    callback: async () => {
      const actionType = await select({
        choices: [
          { name: 'Add a token', value: 'add' },
          { name: 'Remove a token', value: 'remove' }
        ],
        message: 'Select action type'
      });

      if (actionType === 'add') {
        const token = await input({ message: 'Enter token to add' });
        if (!token) {
          return;
        }
        const cutoffTokens = Config.get('cutoffTokens');
        cutoffTokens.push(token);
        Config.set('cutoffTokens', Array.from(new Set(cutoffTokens)));
      } else {
        const token = await select({
          choices: [
            { name: '(Cancel)', value: '-' },
            new Separator(),
            ...Config.get('cutoffTokens').map((token) => ({ value: token })),
            new Separator()
          ],
          message: 'Select token to remove'
        });
        if (token === '-') {
          return;
        }
        const cutoffTokens = Config.get('cutoffTokens');
        const index = cutoffTokens.indexOf(token);
        cutoffTokens.splice(index, 1);
        Config.set('cutoffTokens', cutoffTokens);
      }
    },
    description: 'Set cutoff tokens',
    name: 'CutOff Tokens',
    value: 'cutoff-tokens'
  },
  {
    callback: async () => {
      const prompt = Config.get('cutoffWeight');
      const response = await input({
        default: String(prompt),
        message: 'Cutoff weight',
        validate: (value) => {
          const pass = RegExp(/^\d+$/).exec(value);
          if (!pass) {
            return 'Please enter a valid URL';
          }
          return true;
        }
      });
      setConfigCutoffWeight(Number(response));
    },
    description: 'Set cutoff weight',
    name: 'CutOff Weight',
    value: 'cutoff-weight'
  }
];

const wizardOptionsValues = wizardOptions.filter((option) => (option as IWizardOptions)?.value) as IWizardOptions[];

let selectedOption: string | undefined = undefined;

const runWizard = async () => {
  const configSelect = await select({
    choices: wizardOptions,
    default: selectedOption,
    message: 'Which option do you want to configure?'
  });

  const configOption = wizardOptionsValues.find((option) => option?.value === configSelect);

  selectedOption = configSelect;

  if (configOption?.callback) {
    await configOption.callback();
  }
};

export const handler = async () => {
  let run = true;

  while (run) {
    await runWizard();

    const response = await confirm({ message: 'Do you want to configure another option?' });

    if (!response) {
      run = false;
    }
  }
};
