import { Config } from '../commons/config';
import { logger } from '../commons/logger';

export type ReadonlyOptions =
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
  | 'adetailers-custom-models'
  | 'auto-lcm'
  | 'auto-tiled-diffusion'
  | 'auto-tiled-vae'
  | 'common-negative'
  | 'common-negative-xl'
  | 'common-positive'
  | 'common-positive-xl'
  | 'cutoff'
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
  return list.map((item) => `  - ${typeof item === 'string' ? item : item.name}`).join('\n');
};

export const getConfigVersion = () => logger(`Config version: ${Config.get('configVersion') ?? 0}`);
export const getConfigControlnetModels = () => logger(`ControlNet Models: ${displayList(Config.get('controlnetModels'))}`);
export const getConfigControlnetModules = () => logger(`ControlNet Modules: ${displayList(Config.get('controlnetModules'))}`);
export const getConfigEmbeddings = () => logger(`Embeddings: ${displayList(Config.get('embeddings'))}`);
export const getConfigExtensions = () => logger(`Managed extensions: ${displayList(Config.get('extensions'))}`);
export const getConfigLoras = () => logger(`LoRAs: ${displayList(Config.get('loras'))}`);
export const getConfigModels = () => logger(`Stable Diffusion Checkpoints: ${displayList(Config.get('models'))}`);
export const getConfigSamplers = () => logger(`Samplers: ${displayList(Config.get('samplers'))}`);
export const getConfigStyles = () => logger(`Styles: ${displayList(Config.get('styles'))}`);
export const getConfigUpscalers = () => logger(`Upscalers: ${displayList(Config.get('upscalers'))}`);
export const getConfigVAE = () => logger(`VAE: ${displayList(Config.get('vae'))}`);

export const getConfigAddDetailerCustomModels = () =>
  logger(`Add Detailers Custom models: ${displayList(Config.get('adetailersCustomModels'))}`);
export const getConfigAutoLCM = () => {
  const { auto } = Config.get('lcm');
  logger(`Auto LCM: ${auto ? 'enabled' : 'disabled'}`);
};
export const getConfigAutoTiledDiffusion = () => {
  const auto = Config.get('autoTiledDiffusion');
  logger(`Auto Tiled Diffusion: ${auto || 'disabled'}`);
};
export const getConfigAutoTiledVAE = () => {
  const auto = Config.get('autoTiledVAE');
  logger(`Auto Tiled VAE: ${auto ? 'enabled' : 'disabled'}`);
};
export const getConfigCommonNegative = () => logger(`Common negative prompt: ${Config.get('commonNegative')}`);
export const getConfigCommonNegativeXL = () => logger(`Common negative prompt (SDXL): ${Config.get('commonNegativeXL')}`);
export const getConfigCommonPositive = () => logger(`Common positive prompt: ${Config.get('commonPositive')}`);
export const getConfigCommonPositiveXL = () => logger(`Common positive prompt (SDXL): ${Config.get('commonPositiveXL')}`);
export const getConfigCutoff = () => logger(`Auto CutOff: ${Config.get('cutoff') ? 'enabled' : 'disabled'}`);
export const getConfigCutoffTokens = () => logger(`CutOff Auto Tokens: ${displayList(Config.get('cutoffTokens'))}`);
export const getConfigCutoffWeight = () => logger(`CutOff Weight: ${Config.get('cutoffWeight')}`);
export const getConfigEndpoint = () => logger(`Endpoint: ${Config.get('endpoint')}`);
export const getConfigLCM = () => {
  const { sd15, sdxl } = Config.get('lcm');
  logger(`Redraw models: 
  - SD 1.5 : ${sd15}
  - SDXL : ${sdxl}`);
};
export const getConfigRedrawModels = () => {
  const { anime15, animexl, realist15, realistxl } = Config.get('redrawModels');
  logger(`Redraw models: 
- Anime : ${anime15}
- Anime (SDXL) : ${animexl}
- Realist : ${realist15}
- Realist (SDXL) : ${realistxl}`);
};
export const getConfigScheduler = () => logger(`Scheduler: ${Config.get('scheduler') ? 'enabled' : 'disabled'}`);
