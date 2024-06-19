import { Separator, checkbox, input, select } from '@inquirer/prompts';
import { existsSync } from 'node:fs';

import type {
  IAutoAdetailer,
  IAutoControlnetPose,
  IConfig,
  IDefaultQueryConfig,
  IDefaultQueryTemplate,
  IForcedQueryConfig,
  IModelWithHash,
  IPromptSingleSimple,
  MetadataAccelerator,
  MetadataVersionKey
} from '../commons/types';

import { Config, getParamBoolean } from '../commons/config';
import { mergeConfigs } from '../commons/defaultQuery';
import { CUTOFF_URL } from '../commons/extensions/cutoff';
import { MULTIDIFFUSION_URL, TiledDiffusionMethods } from '../commons/extensions/multidiffusionUpscaler';
import { SCHEDULER_URL } from '../commons/extensions/scheduler';
import { ExitCodes, loggerInfo, loggerVerbose } from '../commons/logger';
import { BaseUpscalers, findCheckpoint } from '../commons/models';

export type ReadonlyOptions =
  | 'adetailers-models'
  | 'config-version'
  | 'controlnet-models'
  | 'controlnet-modules'
  | 'embeddings'
  | 'extensions'
  | 'loras'
  | 'models'
  | 'samplers'
  | 'styles'
  | 'upscalers'
  | 'vae';

export type EditableOptions =
  | 'auto-adetailers'
  | 'auto-controlnet-pose'
  | 'auto-cutoff'
  | 'auto-tiled-diffusion'
  | 'auto-tiled-vae'
  | 'common-negative'
  | 'common-negative-xl'
  | 'common-positive'
  | 'common-positive-xl'
  | 'cutoff-tokens'
  | 'cutoff-weight'
  | 'default-configs'
  | 'default-templates'
  | 'endpoint'
  | 'forced-configs'
  | 'redraw-models'
  | 'scheduler';

export type Options = EditableOptions | ReadonlyOptions;

const displayList = (list: { name: string }[] | Set<{ name: string } | string> | string[]) => {
  if (list instanceof Set) {
    list = Array.from(list) as { name: string }[];
  }

  return '\n' + list.map((item) => `  - ${typeof item === 'string' ? item : item.name}`).join('\n');
};

const SELECT_ACTION_TYPE = 'Select action type';

export const getConfigVersion = () => loggerInfo(`Config version: ${Config.get('configVersion') ?? 0}`);
export const getConfigControlnetModels = () => loggerInfo(`ControlNet Models: ${displayList(Config.get('controlnetModels'))}`);
export const getConfigControlnetModules = () => loggerInfo(`ControlNet Modules: ${displayList(Config.get('controlnetModules'))}`);
export const getConfigEmbeddings = () => loggerInfo(`Embeddings: ${displayList(Config.get('embeddings'))}`);
export const getConfigExtensions = () => loggerInfo(`Managed extensions: ${displayList(Config.get('extensions'))}`);
export const getConfigLoras = () => loggerInfo(`LoRAs: ${displayList(Config.get('loras'))}`);
export const getConfigModels = () => loggerInfo(`Stable Diffusion Checkpoints: ${displayList(Config.get('models'))}`);
export const getConfigSamplers = () => loggerInfo(`Samplers: ${displayList(Config.get('samplers'))}`);
export const getConfigStyles = () => loggerInfo(`Styles: ${displayList(Config.get('styles'))}`);
export const getConfigUpscalers = () => loggerInfo(`Upscalers: ${displayList([...BaseUpscalers, ...Config.get('upscalers')])}`);
export const getConfigVAE = () => loggerInfo(`VAE: ${displayList(Config.get('vae'))}`);

export const getConfigAddDetailerModels = () => loggerInfo(`Add Detailers models: ${displayList(Config.get('adetailersModels'))}`);

export const getConfigAutoTiledDiffusion = () => {
  const auto = Config.get('autoTiledDiffusion');
  loggerInfo(`Auto Tiled Diffusion: ${auto || 'disabled'}`);
};
export const getConfigAutoTiledVAE = () => {
  const auto = Config.get('autoTiledVAE');
  loggerInfo(`Auto Tiled VAE: ${auto ? 'enabled' : 'disabled'}`);
};
export const getConfigCommonNegative = () => loggerInfo(`Common negative prompt: ${Config.get('commonNegative')}`);
export const getConfigCommonNegativeXL = () => loggerInfo(`Common negative prompt (SDXL): ${Config.get('commonNegativeXL')}`);
export const getConfigCommonPositive = () => loggerInfo(`Common positive prompt: ${Config.get('commonPositive')}`);
export const getConfigCommonPositiveXL = () => loggerInfo(`Common positive prompt (SDXL): ${Config.get('commonPositiveXL')}`);
export const getConfigCutoff = () => loggerInfo(`Auto CutOff: ${Config.get('cutoff') ? 'enabled' : 'disabled'}`);
export const getConfigCutoffTokens = () => loggerInfo(`CutOff Auto Tokens: ${displayList(Config.get('cutoffTokens'))}`);
export const getConfigCutoffWeight = () => loggerInfo(`CutOff Weight: ${Config.get('cutoffWeight')}`);
export const getConfigEndpoint = () => loggerInfo(`Endpoint: ${Config.get('endpoint')}`);

export const getConfigRedrawModels = () => {
  const { anime15, animexl, realist15, realistxl } = Config.get('redrawModels');
  loggerInfo(`Redraw models: 
- Anime : ${anime15}
- Anime (SDXL) : ${animexl}
- Realist : ${realist15}
- Realist (SDXL) : ${realistxl}`);
};
export const getConfigScheduler = () => loggerInfo(`Scheduler: ${Config.get('scheduler') ? 'enabled' : 'disabled'}`);

export const getConfigAutoAdetailers = () => {
  const autoAdetailers = Config.get('autoAdetailers');

  const list = autoAdetailers.map((item) => {
    const {
      ad_denoising_strength,
      ad_inpaint_height,
      ad_inpaint_width,
      ad_model,
      ad_negative_prompt,
      ad_prompt,
      ad_use_inpaint_width_height,
      trigger
    } = item;
    let text = `!ad:${trigger}: ${ad_model}`;
    if (ad_prompt) {
      text += ` | Prompt: ${ad_prompt}`;
    }
    if (ad_negative_prompt) {
      text += ` | Negative Prompt: ${ad_negative_prompt}`;
    }
    if (ad_denoising_strength) {
      text += ` | Denoising Strength: ${ad_denoising_strength}`;
    }
    if (ad_inpaint_height && ad_inpaint_width) {
      text += ` | Inpaint Size: ${ad_inpaint_height}x${ad_inpaint_width}`;
    }
    if (ad_use_inpaint_width_height) {
      text += ` | Use Inpaint Width/Height: ${ad_use_inpaint_width_height}`;
    }

    return text;
  });

  loggerInfo(`Auto Add Detailers: ${displayList(list)}`);
};

export const getConfigAutoControlnetPoses = () => {
  const autoControlnetPose = Config.get('autoControlnetPose');

  const list = autoControlnetPose.map((item) => {
    const { afterPrompt, beforePrompt, pose, trigger } = item;
    let text = `!pose:${trigger}: ${pose}`;

    if (beforePrompt) {
      text += ` | Before Prompt: "${beforePrompt}"`;
    }

    if (afterPrompt) {
      text += ` | After Prompt: "${afterPrompt}"`;
    }

    return text;
  });

  loggerInfo(`Auto ControlNet Poses: ${displayList(list)}`);
};

export const setConfigAutoTiledDiffusion = (value: TiledDiffusionMethods | false) => {
  if (!Config.get('extensions').includes('tiled diffusion')) {
    loggerInfo(`MultiDiffusion Upscaler extension must be installed. Re-Run "sd-tools init" after installing it`);
    loggerVerbose(`MultiDiffusion Upscaler extension url: ${MULTIDIFFUSION_URL}`);
    process.exit(ExitCodes.CONFIG_SET_NO_MULTIDIFFUSION_INSTALLED);
  }

  if (!value || (value as string) === 'false') {
    Config.set('autoTiledDiffusion', false);
  } else if (![TiledDiffusionMethods.MixtureOfDiffusers, TiledDiffusionMethods.MultiDiffusion].includes(value)) {
    loggerInfo(`Value must be either "${TiledDiffusionMethods.MixtureOfDiffusers}" or "${TiledDiffusionMethods.MultiDiffusion}"`);
    process.exit(ExitCodes.CONFIG_SET_INVALID_MULTIDIFFUSION);
  } else {
    Config.set('autoTiledDiffusion', value);
  }

  Config.set('autoTiledDiffusion', (value as string) === 'false' ? false : value);
  getConfigAutoTiledDiffusion();
};

export const setConfigAutoTiledVAE = (value: boolean) => {
  if (!Config.get('extensions').includes('tiled vae')) {
    loggerInfo(`MultiDiffusion Upscaler extension must be installed. Re-Run "sd-tools init" after installing it`);
    loggerVerbose(`MultiDiffusion Upscaler extension url: ${MULTIDIFFUSION_URL}`);
    process.exit(ExitCodes.CONFIG_SET_NO_MULTIDIFFUSION_INSTALLED);
  }

  Config.set('autoTiledVAE', getParamBoolean(value));
  getConfigAutoTiledVAE();
};

export const setConfigCommonNegative = (value: string) => {
  Config.set('commonNegative', value);
  getConfigCommonNegative();
};

export const setConfigCommonNegativeXL = (value: string) => {
  Config.set('commonNegativeXL', value);
  getConfigCommonNegativeXL();
};

export const setConfigCommonPositive = (value: string) => {
  Config.set('commonPositive', value);
  getConfigCommonPositive();
};

export const setConfigCommonPositiveXL = (value: string) => {
  Config.set('commonPositiveXL', value);
  getConfigCommonPositiveXL();
};

export const setConfigAutoCutoff = (value: boolean) => {
  if (!Config.get('extensions').includes('cutoff')) {
    loggerInfo(`Cutoff extension must be installed. Re-Run "sd-tools init" after installing it`);
    loggerVerbose(`Cutoff extension url: ${CUTOFF_URL}`);
    process.exit(ExitCodes.CONFIG_SET_NO_CUTOFF_INSTALLED);
  }

  Config.set('cutoff', getParamBoolean(value));
  getConfigCutoff();
};

export const setConfigCutoffTokens = (value: string[]) => {
  let valueArray = value;
  if (!Array.isArray(value)) {
    valueArray = (value as string).split(',');
  }

  if (valueArray.some((val) => typeof val !== 'string')) {
    loggerInfo(`Value must be a array of string`);
    process.exit(ExitCodes.CONFIG_SET_CUTOFF_INVALID_TOKEN);
  }

  if (!Config.get('extensions').includes('cutoff')) {
    loggerInfo(`Cutoff extension must be installed. Re-Run "sd-tools init" after installing it`);
    loggerVerbose(`Cutoff extension url: ${CUTOFF_URL}`);
    process.exit(ExitCodes.CONFIG_SET_NO_CUTOFF_INSTALLED);
  }

  Config.set('cutoffTokens', Array.from(new Set(valueArray)));
  getConfigCutoffTokens();
};

export const setConfigCutoffWeight = (value: number) => {
  const valueNumber = Number(value);
  if (typeof valueNumber !== 'number' || isNaN(valueNumber)) {
    loggerInfo(`Value must be a number`);
    process.exit(ExitCodes.CONFIG_SET_CUTOFF_INVALID_WEIGHT);
  }

  if (!Config.get('extensions').includes('cutoff')) {
    loggerInfo(`Cutoff extension must be installed. Re-Run "sd-tools init" after installing it`);
    loggerVerbose(`Cutoff extension url: ${CUTOFF_URL}`);
    process.exit(ExitCodes.CONFIG_SET_NO_CUTOFF_INSTALLED);
  }

  Config.set('cutoffWeight', valueNumber);
  getConfigCutoffWeight();
};

export const setConfigEndpoint = (value: string) => {
  Config.set('endpoint', value);
  getConfigEndpoint();
};

export const setConfigRedrawModelsCommandLine = (value: string[]) => {
  let valueArray = value;
  if (!Array.isArray(value)) {
    valueArray = (value as string).split(',');
  }
  if (
    valueArray.some((val) => {
      if (val.indexOf(':') === -1) {
        return true;
      }

      const [category, model] = val.split(':');

      if (!['anime15', 'animexl', 'realist15', 'realistxl'].includes(category.toLocaleLowerCase())) {
        loggerInfo(`Category is invalid`);
        return true;
      }

      const foundModel = findCheckpoint(model);

      return !foundModel;
    })
  ) {
    loggerInfo(
      `Value contains invalid value. Values must start with "realist15:", "realistXL:", "anime15:" or "animeXL:" followed by a valid model name`
    );
    process.exit(ExitCodes.CONFIG_SET_REDRAW_INVALID_MODELS);
  }

  const redrawModels = Config.get('redrawModels');

  valueArray.forEach((keyValue) => {
    const [category, model] = keyValue.split(':');

    const foundModel = findCheckpoint(model);
    if (foundModel) {
      redrawModels[category.toLowerCase() as keyof typeof redrawModels] = foundModel.name;
    }
  });

  setConfigRedrawModels(redrawModels);
};

export const setConfigRedrawModels = (redrawModels: IConfig['redrawModels']) => {
  Config.set('redrawModels', redrawModels);
  getConfigRedrawModels();
};

export const setConfigScheduler = (value: boolean) => {
  if (!Config.get('extensions').includes('scheduler')) {
    loggerInfo(`Agent Scheduler extension must be installed. Re-Run "sd-tools init" after installing it`);
    loggerVerbose(`Agent Scheduler extension url: ${SCHEDULER_URL}`);
    process.exit(ExitCodes.CONFIG_SET_NO_AGENT_INSTALLED);
  }

  Config.set('scheduler', getParamBoolean(value));
  getConfigScheduler();
};

export const setInquirerAdetailerTriggers = async () => {
  const actionType = await select({
    choices: [
      { name: 'Add a trigger', value: 'add' },
      { name: 'Remove a trigger', value: 'remove' }
    ],
    message: SELECT_ACTION_TYPE
  });

  if (actionType === 'add') {
    await setInquirerAdetailerTriggersAdd();
  } else {
    await setInquirerAdetailerTriggersRemove();
  }
};

const setInquirerAdetailerTriggersAdd = async () => {
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
};

const setInquirerAdetailerTriggersRemove = async () => {
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
};

export const setInquirerControlNetPoseTriggers = async () => {
  const actionType = await select({
    choices: [
      { name: 'Add a trigger', value: 'add' },
      { name: 'Remove a trigger', value: 'remove' }
    ],
    message: SELECT_ACTION_TYPE
  });

  if (actionType === 'add') {
    await setInquirerControlNetPoseTriggersAdd();
  } else {
    await setInquirerControlNetPoseTriggersRemove();
  }
};

const setInquirerControlNetPoseTriggersAdd = async () => {
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
};

const setInquirerControlNetPoseTriggersRemove = async () => {
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
};

const getDefaultMessage = (baseMessage: string, defaultValue?: boolean | number | string) => {
  if (!defaultValue) {
    return `${baseMessage}. Leave empty to ignore property`;
  }

  return `${baseMessage}. Leave empty to to use template value (${defaultValue})`;
};

const inquirerValidateFloat =
  (allowEmpty: boolean) =>
  (value: string): boolean | string => {
    if (!value) {
      if (allowEmpty) {
        return true;
      }
      return 'The value cannot be empty';
    }
    const num = Number.parseFloat(value);

    if (Number.isNaN(num)) {
      return 'The value is not a valid number';
    }

    if (num <= 0) {
      return 'The value must be greater than 0';
    }

    return true;
  };

const inquirerSelectBooleanEmpty = async (message: string) => {
  const result = await select({
    choices: [
      { name: 'Yes', value: '1' },
      { name: 'No', value: '0' },
      { name: 'N/A', value: '-' }
    ],
    default: '-',
    message
  });

  if (result === '-') {
    return;
  }

  return result === '1';
};

const inquirerValidateInteger =
  (allowEmpty: boolean) =>
  (value: string): boolean | string => {
    if (!value) {
      if (allowEmpty) {
        return true;
      }
      return 'The value cannot be empty';
    }
    const num = Number.parseInt(value);

    if (Number.isNaN(num)) {
      return 'The value is not a valid number';
    }

    if (num <= 0) {
      return 'The value must be greater than 0';
    }

    return true;
  };

const inquirerConvertFloat = (value: string): number | undefined => {
  if (!value) {
    return;
  }
  return Number.parseFloat(value);
};

const inquirerConvertInteger = (value: string): number | undefined => {
  if (!value) {
    return;
  }
  return Number.parseInt(value);
};

/*
export interface IPromptSingleSimple {

  tiledDiffusion?: ITiledDiffusion;
  tiledVAE?: ITiledVAE;
} 
 */

const getQueryOptions = async (versions: MetadataVersionKey[], defaultValues?: IPromptSingleSimple): Promise<IPromptSingleSimple> => {
  const listSamplers = Config.get('samplers');
  const listUpscaler = Config.get('upscalers');
  const listVAE = Config.get('vae');

  const cfg = await input({
    message: getDefaultMessage('Enter CFG', defaultValues?.cfg),
    validate: inquirerValidateFloat(true)
  });

  const clipSkip = await input({
    message: getDefaultMessage('Enter Clip Skip', defaultValues?.clipSkip),
    validate: inquirerValidateInteger(true)
  });
  const denoising = await input({
    message: getDefaultMessage('Enter Denoising strength (for upscaling)', defaultValues?.denoising),
    validate: inquirerValidateFloat(true)
  });
  const enableHighRes = await inquirerSelectBooleanEmpty(getDefaultMessage('Enable High-Res', defaultValues?.denoising));

  const height = await input({
    message: getDefaultMessage('Enter Height', defaultValues?.height),
    validate: inquirerValidateInteger(true)
  });

  const restoreFaces = await inquirerSelectBooleanEmpty(getDefaultMessage('Enable Face Restoration', defaultValues?.restoreFaces));

  const sampler = await select({
    choices: [{ name: 'N/A', value: '-' }, ...listSamplers.map((sampler) => ({ value: sampler.name }))],
    default: '-',
    message: getDefaultMessage('Select the Sampler', defaultValues?.sampler)
  });

  const scaleFactor = await input({
    message: getDefaultMessage('Enter Scale Factor (for upscaling)', defaultValues?.scaleFactor),
    validate: inquirerValidateFloat(true)
  });

  const steps = await input({
    message: getDefaultMessage('Enter Steps', defaultValues?.steps),
    validate: inquirerValidateInteger(true)
  });

  const tiling = await inquirerSelectBooleanEmpty(getDefaultMessage('Enable Tiling', defaultValues?.tiling));

  const upscaler = await select({
    choices: [{ name: 'N/A', value: '-' }, ...listUpscaler.map((upscaler) => ({ value: upscaler.name }))],
    default: '-',
    message: getDefaultMessage('Select the Upscaler', defaultValues?.upscaler)
  });

  const vae = await select({
    choices: [{ name: 'N/A', value: '-' }, ...listVAE.map((upscaler) => ({ value: upscaler }))],
    default: '-',
    message: getDefaultMessage('Select the VAE', defaultValues?.vae)
  });

  const width = await input({
    message: getDefaultMessage('Enter Width', defaultValues?.width),
    validate: inquirerValidateInteger(true)
  });

  return {
    cfg: inquirerConvertFloat(cfg),
    clipSkip: inquirerConvertInteger(clipSkip),
    denoising: inquirerConvertFloat(denoising),
    enableHighRes,
    height: inquirerConvertInteger(height),
    restoreFaces,
    sampler,
    scaleFactor: inquirerConvertFloat(scaleFactor),
    steps: inquirerConvertInteger(steps),
    tiling,
    upscaler,
    vae,
    width: inquirerConvertInteger(width)
  };
};

export const setInquirerDefaultQueryTemplates = async () => {
  const actionType = await select({
    choices: [
      { name: 'Add a template', value: 'add' },
      { name: 'Remove a template', value: 'remove' }
    ],
    message: SELECT_ACTION_TYPE
  });

  if (actionType === 'add') {
    await setInquirerDefaultQueryTemplatesAdd();
  } else {
    await setInquirerDefaultQueryTemplatesRemove();
  }
};

const TEMPLATE_NAME = 'Template name';

const setInquirerDefaultQueryTemplatesAdd = async () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');

  const templateName = await input({
    message: TEMPLATE_NAME,
    validate: (value) => {
      if (!value) {
        return `${TEMPLATE_NAME} must not be empty`;
      }

      const found = defaultQueryTemplates.find((model) => model.templateName === value);

      if (found) {
        return `${TEMPLATE_NAME} already exists`;
      }

      return true;
    }
  });

  if (!templateName) {
    return;
  }

  const accelerator = await select<MetadataAccelerator>({
    choices: [
      { name: 'None', value: 'none' },
      { name: 'LCM', value: 'lcm' },
      { name: 'Turbo', value: 'turbo' },
      { name: 'Lightning', value: 'lightning' },
      { name: 'Distilled', value: 'distilled' }
    ],
    default: 'none',
    message: 'Select the accelerator'
  });

  const version = await checkbox<MetadataVersionKey>({
    choices: [
      { name: 'SD 1.4', value: 'sd14' },
      { name: 'SD 1.5', value: 'sd15' },
      { name: 'SD 2.0', value: 'sd20' },
      { name: 'SD 2.0 768', value: 'sd20-768' },
      { name: 'SD 2.1', value: 'sd21' },
      { name: 'SD 2.1 768', value: 'sd21-768' },
      { name: 'SD XL', value: 'sdxl' }
    ],
    message: 'Select the versions',
    required: true
  });

  const options = await getQueryOptions(version);

  const newTemplate: IDefaultQueryTemplate = {
    ...options,
    accelerator,
    templateName,
    versions: version
  };

  Config.set('defaultQueryTemplates', Array.from(new Set([...defaultQueryTemplates, newTemplate])));
};

const setInquirerDefaultQueryTemplatesRemove = async () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');

  const template = await select({
    choices: [
      { name: '(Cancel)', value: '-' },
      new Separator(),
      ...defaultQueryTemplates.map((template) => {
        const disabled = defaultQueryConfigs.filter((config) => config.extends === template.templateName);

        return {
          description: `Version(s): "${template.versions.join(', ')}", Accelerator: ${template.accelerator ?? 'none'}`,
          disabled: disabled.length > 0,
          name: `${template.templateName} (Used in ${disabled.length} model(s))`,
          value: template.templateName
        };
      }),
      new Separator()
    ],
    message: 'Select template to remove'
  });
  if (template === '-') {
    return;
  }

  const index = defaultQueryTemplates.findIndex((model) => model.templateName === template);
  defaultQueryTemplates.splice(index, 1);
  Config.set('defaultQueryTemplates', defaultQueryTemplates);
};

export const getDefaultTemplates = () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');

  const list = defaultQueryTemplates.map((item) => {
    const { accelerator, templateName, versions: version, ...other } = item;

    let text = `${templateName} (For version "${version.join(', ')}", Accelerator: ${accelerator})`;

    Object.keys(other).forEach((key) => {
      const value = other[key as keyof typeof other];

      text += ` | ${key}: "${value}"`;
    });

    return text;
  });

  loggerInfo(`Default Templates: ${displayList(list)}`);
};

export const setInquirerDefaultQueryConfigs = async () => {
  const actionType = await select({
    choices: [
      { name: 'Add a config', value: 'add' },
      { name: 'Remove a config', value: 'remove' }
    ],
    message: SELECT_ACTION_TYPE
  });

  if (actionType === 'add') {
    await setInquirerDefaultQueryConfigsAdd();
  } else {
    await setInquirerDefaultQueryConfigsRemove();
  }
};

const setInquirerDefaultQueryConfigsAdd = async () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');
  const models = Config.get('models');
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');

  const templateName = await input({
    message: TEMPLATE_NAME,
    validate: (value) => {
      if (!value) {
        return `${TEMPLATE_NAME} must not be empty`;
      }

      const found = defaultQueryConfigs.find((model) => model.templateName === value);

      if (found) {
        return `${TEMPLATE_NAME} already exists`;
      }

      return true;
    }
  });

  if (!templateName) {
    return;
  }

  const modelName = await select({
    choices: models.map((model) => ({ description: `Version: ${model.version}`, value: model.name })),
    message: 'Select the model'
  });

  const selectedModel = models.find((model) => model.name === modelName) as IModelWithHash;

  const availableTemplates = defaultQueryTemplates.filter((template) => template.versions.includes(selectedModel.version));

  const extendsName = await select({
    choices: availableTemplates.map((template) => ({ description: `Accelerator: ${template.accelerator}`, value: template.templateName })),
    message: 'Select the template'
  });

  const selectedTemplate = availableTemplates.find((template) => template.templateName === extendsName) as IDefaultQueryTemplate;

  const options = await getQueryOptions([selectedModel.version], selectedTemplate);

  const newConfig: IDefaultQueryConfig = {
    ...options,
    extends: extendsName,
    modelName,
    templateName
  };

  Config.set('defaultQueryConfigs', Array.from(new Set([...defaultQueryConfigs, newConfig])));
};

const setInquirerDefaultQueryConfigsRemove = async () => {
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');

  const template = await select({
    choices: [
      { name: '(Cancel)', value: '-' },
      new Separator(),
      ...defaultQueryConfigs.map((config) => {
        return {
          description: `Template(s): "${config.extends}", Model: ${config.modelName}`,
          name: config.templateName,
          value: config.templateName
        };
      }),
      new Separator()
    ],
    message: 'Select config to remove'
  });
  if (template === '-') {
    return;
  }

  const index = defaultQueryConfigs.findIndex((model) => model.templateName === template);
  defaultQueryConfigs.splice(index, 1);
  Config.set('defaultQueryConfigs', defaultQueryConfigs);
};

export const getDefaultConfigs = () => {
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');

  const list = defaultQueryConfigs.map((item) => {
    const { extends: extendsName, modelName, templateName, ...other } = item;

    const realConfig = mergeConfigs(item, defaultQueryTemplates);

    let text = `${templateName} (${modelName}, extending ${extendsName})`;

    Object.keys(realConfig).forEach((key) => {
      const value = other[key as keyof typeof realConfig];
      const fromTemplateText = other[key as keyof typeof other] === undefined ? ' (from template)' : '';

      text += ` | ${key}: "${value}"${fromTemplateText}`;
    });

    return text;
  });

  loggerInfo(`Default Configs: ${displayList(list)}`);
};

export const setInquirerForcedQueryConfigs = async () => {
  const actionType = await select({
    choices: [
      { name: 'Add a config', value: 'add' },
      { name: 'Remove a config', value: 'remove' }
    ],
    message: SELECT_ACTION_TYPE
  });

  if (actionType === 'add') {
    await setInquirerForcedQueryConfigsAdd();
  } else {
    await setInquirerForcedQueryConfigsRemove();
  }
};

const setInquirerForcedQueryConfigsAdd = async () => {
  const models = Config.get('models');
  const forcedQueryConfigs = Config.get('forcedQueryConfigs');

  const templateName = await input({
    message: 'Template name',
    validate: (value) => {
      if (!value) {
        return 'Template name must not be empty';
      }

      const found = forcedQueryConfigs.find((model) => model.templateName === value);

      if (found) {
        return 'Template name already exists';
      }

      return true;
    }
  });

  if (!templateName) {
    return;
  }

  const modelName = await select({
    choices: models.map((model) => ({ description: `Version: ${model.version}`, value: model.name })),
    message: 'Select the model'
  });

  const selectedModel = models.find((model) => model.name === modelName) as IModelWithHash;

  const options = await getQueryOptions([selectedModel.version]);

  const newConfig: IForcedQueryConfig = {
    ...options,
    modelName,
    templateName
  };

  Config.set('forcedQueryConfigs', Array.from(new Set([...forcedQueryConfigs, newConfig])));
};

const setInquirerForcedQueryConfigsRemove = async () => {
  const forcedQueryConfigs = Config.get('forcedQueryConfigs');

  const template = await select({
    choices: [
      { name: '(Cancel)', value: '-' },
      new Separator(),
      ...forcedQueryConfigs.map((config) => {
        return {
          description: `Model: ${config.modelName}`,
          name: config.templateName,
          value: config.templateName
        };
      }),
      new Separator()
    ],
    message: 'Select config to remove'
  });
  if (template === '-') {
    return;
  }

  const index = forcedQueryConfigs.findIndex((model) => model.templateName === template);
  forcedQueryConfigs.splice(index, 1);
  Config.set('forcedQueryConfigs', forcedQueryConfigs);
};

export const getForcedConfigs = () => {
  const forcedQueryConfigs = Config.get('forcedQueryConfigs');

  const list = forcedQueryConfigs.map((item) => {
    const { modelName, templateName, ...other } = item;
    let text = `${templateName} (${modelName})`;

    Object.keys(other).forEach((key) => {
      const value = other[key as keyof typeof other];
      text += ` | ${key}: "${value}"`;
    });

    return text;
  });

  loggerInfo(`Forced Configs: ${displayList(list)}`);
};
