import { IAdetailer } from './extensions/adetailer';
import { IControlNet } from './extensions/controlNet';
import { ICutOff } from './extensions/cutoff';
import { IUltimateSDUpscale, UltimateSDUpscaleArgs } from './extensions/ultimateSdUpscale';

export * from './extensions/controlNet';
export * from './extensions/ultimateSdUpscale';

export type AlwaysOnScripts = { args: Array<boolean | number | string> } | { args: IAdetailer[] } | { args: IControlNet[] };

export type ScriptsArgs = [] | UltimateSDUpscaleArgs;

export interface IOverrideSettings {
  samples_filename_pattern: string;
  sd_model_checkpoint: string;
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
  vae?: string;
  width?: number;
}

export interface ITxt2ImgQuery
  extends Omit<IBaseQuery, 'alwayson_scripts' | 'override_settings_restore_afterwards' | 'script_args' | 'script_name'> {
  adetailer?: IAdetailer[];
  controlNet?: IControlNet;
  cutOff?: ICutOff;
  lcm?: boolean;
  sdxl: boolean;
  //ultimateSdUpscale?: number;

  //init_images: string[];
}

export interface IImg2ImgQuery extends ITxt2ImgQuery {
  init_images: string[];

  ultimateSdUpscale?: IUltimateSDUpscale;
}

export interface IRedrawOptions {
  addToPrompt?: string;
  denoising?: number[];
  method: 'both' | 'ip-adapter' | 'lineart';
  recursive?: boolean;
  scheduler?: boolean;
  sdxl?: boolean;
  style: 'anime' | 'both' | 'realism';
  upscaler?: string;
  upscales?: number[];
}

export type Extensions = 'adetailer' | 'controlnet' | 'cutoff' | 'scheduler' | 'ultimate-sd-upscale';
export interface Model {
  hash?: string;
  name: string;
  version: 'sd15' | 'sdxl' | 'unknown';
}

export interface Lora {
  alias: string;
  name: string;
  version: 'sd15' | 'sdxl' | 'unknown';
}

export interface Sampler {
  aliases: string[];
  name: string;
}

export interface Upscaler {
  filename?: string;
  index: number;
  name: string;
}

export interface IMetadata {
  // description: string;
  preferredWeight?: string;
  sdVersion: 'sd15' | 'sdxl' | 'unknown';
}
export type CacheMetadata = Record<string, IMetadata>;

export interface IConfig {
  adetailersCustomModels: string[];
  cacheMetadata: CacheMetadata;
  commonNegative?: string;
  commonNegativeXL?: string;
  commonPositive?: string;
  commonPositiveXL?: string;
  controlnetModels: Model[];
  controlnetModules: string[];
  cutoff: boolean;
  cutoffTokens: string[];
  cutoffWeight: number;
  embeddings: string[];
  extensions: Extensions[];
  initialized: boolean;
  lcm: {
    auto: boolean;
    sd15?: string;
    sdxl?: string;
  };
  loras: Lora[];
  models: Model[];
  redrawModels: {
    anime15?: string;
    animexl?: string;
    realist15?: string;
    realistxl?: string;
  };
  samplers: Sampler[];
  scheduler: boolean;
  upscalers: Upscaler[];
  vae: string[];
}
