import type { IConfig } from '../commons/types';

import { Config, getParamBoolean } from '../commons/config';
import { CUTOFF_URL } from '../commons/extensions/cutoff';
import { MULTIDIFFUSION_URL, TiledDiffusionMethods } from '../commons/extensions/multidiffusionUpscaler';
import { SCHEDULER_URL } from '../commons/extensions/scheduler';
import { ExitCodes, loggerInfo, loggerVerbose } from '../commons/logger';
import { BaseUpscalers, findCheckpoint, findLORA } from '../commons/models';

export type ReadonlyOptions =
  | 'adetailers-models'
  | 'auto-adetailers'
  | 'auto-controlnet-pose'
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
  | 'auto-cutoff'
  | 'auto-lcm'
  | 'auto-tiled-diffusion'
  | 'auto-tiled-vae'
  | 'common-negative'
  | 'common-negative-xl'
  | 'common-positive'
  | 'common-positive-xl'
  | 'cutoff-tokens'
  | 'cutoff-weight'
  | 'endpoint'
  | 'lcm'
  | 'redraw-models'
  | 'scheduler';

export type Options = EditableOptions | ReadonlyOptions;

const displayList = (list: { name: string }[] | Set<{ name: string } | string> | string[]) => {
  if (list instanceof Set) {
    list = Array.from(list) as { name: string }[];
  }

  return '\n' + list.map((item) => `  - ${typeof item === 'string' ? item : item.name}`).join('\n');
};

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
export const getConfigAutoLCM = () => {
  const { auto } = Config.get('lcm');
  loggerInfo(`Auto LCM: ${auto ? 'enabled' : 'disabled'}`);
};
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
export const getConfigLCM = () => {
  const { sd15, sdxl } = Config.get('lcm');
  loggerInfo(`Redraw models: 
  - SD 1.5 : ${sd15}
  - SDXL : ${sdxl}`);
};
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

  loggerInfo(`Auto Adetailers: ${displayList(list)}`);
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

export const setConfigAutoLCM = (value: boolean) => {
  const lcm = Config.get('lcm');
  lcm.auto = getParamBoolean(value);
  Config.set('lcm', lcm);
  getConfigAutoLCM();
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

export const setConfigLCMCommandLine = (value: string[]) => {
  let valueArray = value;
  if (!Array.isArray(value)) {
    valueArray = (value as string).split(',');
  }

  if (
    valueArray.some((val) => {
      if (val.indexOf(':') === -1) {
        return true;
      }

      const [category, lora] = val.split(':');

      if (!['sd15', 'sdxl'].includes(category.toLowerCase())) {
        loggerInfo(`Category is invalid`);
        return true;
      }

      const foundLora = findLORA(lora);

      return !foundLora;
    })
  ) {
    loggerInfo(`Value contains invalid value. Values must start with "sd15:" or "sdxl:" followed by a valid lora name`);
    process.exit(ExitCodes.CONFIG_SET_LCM_INVALID_TOKEN);
  }

  const lcm = Config.get('lcm');

  valueArray.forEach((keyValue) => {
    const [category, model] = keyValue.split(':');

    const foundModel = findLORA(model);
    if (category.toLowerCase() === 'sdxl') {
      lcm.sdxl = foundModel?.name;
    } else {
      lcm.sd15 = foundModel?.name;
    }
  });

  setConfigLCM(lcm);
};

export const setConfigLCM = (lcm: IConfig['lcm']) => {
  Config.set('lcm', lcm);
  getConfigLCM();
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
}

export const setConfigScheduler = (value: boolean) => {
  if (!Config.get('extensions').includes('scheduler')) {
    loggerInfo(`Agent Scheduler extension must be installed. Re-Run "sd-tools init" after installing it`);
    loggerVerbose(`Agent Scheduler extension url: ${SCHEDULER_URL}`);
    process.exit(ExitCodes.CONFIG_SET_NO_AGENT_INSTALLED);
  }

  Config.set('scheduler', getParamBoolean(value));
  getConfigScheduler();
};
