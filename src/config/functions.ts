import { Config } from '../commons/config';
import { loggerInfo } from '../commons/logger';
import { BaseUpscalers } from '../commons/models';

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
