import { IAdetailer } from './extensions/adetailer';
import { IControlNet } from './extensions/controlNet';
import { ICutOff } from './extensions/cutoff';
import { ITiledDiffusion, TiledDiffusionMethods } from './extensions/multidiffusionUpscaler';
import { IUltimateSDUpscale, UltimateSDUpscaleArgs } from './extensions/ultimateSdUpscale';

export * from './extensions/controlNet';
export * from './extensions/ultimateSdUpscale';

export type AlwaysOnScripts = { args: Array<boolean | number | string> } | { args: IAdetailer[] } | { args: IControlNet[] };

export type ScriptsArgs = [] | UltimateSDUpscaleArgs;

export interface IOverrideSettings {
  CLIP_stop_at_last_layers: number;
  directories_filename_pattern: string;
  outdir_img2img_samples: string;
  outdir_txt2img_samples: string;
  samples_filename_pattern: string;
  sd_model_checkpoint: string;
  sd_vae: string;
}

export interface IBaseQuery {
  alwayson_scripts: Record<string, AlwaysOnScripts>;
  cfg_scale?: number;
  denoising_strength?: number;
  enable_hr?: boolean;
  height?: number;
  hr_negative_prompt?: string;
  hr_prompt?: string;
  hr_scale?: number;
  hr_upscaler?: string;
  negative_prompt?: string;
  override_settings: Partial<IOverrideSettings>;
  override_settings_restore_afterwards?: boolean;
  prompt: string;
  restore_faces?: boolean;
  sampler_name?: string;
  save_images?: boolean;
  script_args?: ScriptsArgs;
  script_name?: string;
  seed?: number;
  send_images?: boolean;
  steps?: number;
  styles?: string[];
  width?: number;
}

export interface ITxt2ImgQuery
  extends Omit<IBaseQuery, 'alwayson_scripts' | 'override_settings_restore_afterwards' | 'script_args' | 'script_name'> {
  adetailer?: IAdetailer[];
  controlNet?: IControlNet[];
  cutOff?: ICutOff;
  lcm?: boolean;
  sdxl: boolean;
  tiledDiffusion?: ITiledDiffusion;
  //ultimateSdUpscale?: number;

  //init_images: string[];
}

export interface IImg2ImgQuery extends ITxt2ImgQuery {
  init_images: string[];

  ultimateSdUpscale?: IUltimateSDUpscale;
}

export type VersionKey = 'sd15' | 'sdxl' | 'unknown';

export const Version: Record<string, VersionKey> = {
  SD15: 'sd15',
  SDXL: 'sdxl',
  Unknown: 'unknown'
};

export enum IRedrawMethod {
  Both = 'both',
  Classical = 'classical',
  IPAdapter = 'ip-adapter'
}

export enum IRedrawStyle {
  Anime = 'anime',
  Both = 'both',
  Realism = 'realism'
}

export interface IRedrawOptions {
  addToPrompt?: string;
  denoising?: number[];
  method: IRedrawMethod;
  recursive?: boolean;
  sdxl?: boolean;
  style: IRedrawStyle;
  upscaler?: string;
  upscales?: number[];
}

export type Extensions = 'adetailer' | 'controlnet' | 'cutoff' | 'scheduler' | 'tiled diffusion' | 'tiled vae' | 'ultimate-sd-upscale';

export interface IModel {
  name: string;
  version: VersionKey;
}

export interface IModelWithHash extends IModel {
  hash?: string;
}

export interface ILora {
  alias: string;
  name: string;
  version: VersionKey;
}

export interface ISampler {
  aliases: string[];
  name: string;
}

export interface IUpscaler {
  filename?: string;
  index?: number; // If no index, cannot be used in Ultimate SD Upscale
  name: string;
}

export interface IStyle {
  name: string;
  negativePrompt: string;
  prompt: string;
}

export interface IMetadata {
  preferredWeight?: string;
  sdVersion: VersionKey;
}

export interface IInterrogateResponse {
  prompt: string;
}
export type CacheMetadata = Record<string, IMetadata & { timestamp: string }>;
export type CacheInterrogator = Record<string, IInterrogateResponse & { timestamp: string }>;
export type CacheImageData = Record<string, { data: string[]; timestamp: string }>;

export interface IConfig {
  adetailersModels: string[];
  autoTiledDiffusion: TiledDiffusionMethods | false;
  autoTiledVAE: boolean;
  commonNegative?: string;
  commonNegativeXL?: string;
  commonPositive?: string;
  commonPositiveXL?: string;
  configVersion: number;
  controlnetModels: IModel[];
  controlnetModules: string[];
  cutoff: boolean;
  cutoffTokens: string[];
  cutoffWeight: number;
  embeddings: string[];
  endpoint: string;
  extensions: Extensions[];
  initialized: boolean;
  lcm: {
    auto: boolean;
    sd15?: string;
    sdxl?: string;
  };
  loras: ILora[];
  models: IModelWithHash[];
  redrawModels: {
    anime15?: string;
    animexl?: string;
    realist15?: string;
    realistxl?: string;
  };
  samplers: ISampler[];
  scheduler: boolean;
  styles: IStyle[];
  upscalers: IUpscaler[];
  vae: string[];
}

export interface ICache {
  imageData: CacheImageData;
  interrogator: CacheInterrogator;
  metadata: CacheMetadata;
}
