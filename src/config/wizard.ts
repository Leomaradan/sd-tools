import { Separator, confirm, input, select } from '@inquirer/prompts';

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
  setConfigScheduler,
  setInquirerAdetailerTriggers,
  setInquirerControlNetPoseTriggers
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
    callback: setInquirerAdetailerTriggers,
    description: 'Set the Auto Add Detailers triggers',
    name: 'Auto Adetailers',
    value: 'auto-adetailers'
  },
  {
    callback: setInquirerControlNetPoseTriggers,
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
