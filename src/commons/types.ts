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
  batch_size?: number;
  cfg_scale?: number;
  denoising_strength?: number;
  disable_extra_networks?: boolean;
  do_not_save_grid?: boolean;
  do_not_save_samples?: boolean;
  eta?: number;
  height?: number;
  n_iter?: number;
  negative_prompt?: string;
  override_settings: Partial<IOverrideSettings>;
  override_settings_restore_afterwards?: boolean;
  prompt: string;
  refiner_checkpoint?: string;
  refiner_switch_at?: number;
  restore_faces?: boolean;
  s_churn?: number;
  s_min_uncond?: number;
  s_tmax?: number;
  s_tmin?: number;
  sampler_index?: string;
  sampler_name?: string;
  save_images?: boolean;
  script_args?: ScriptsArgs;
  script_name?: string;
  seed?: number;
  seed_resize_from_h?: number;
  seed_resize_from_w?: number;
  send_images?: boolean;
  steps?: number;
  styles?: string[];
  subseed?: number;
  subseed_strength?: number;
  tiling?: boolean;
  width?: number;
}

export interface ITxt2ImgQuery
  extends Omit<IBaseQuery, 'alwayson_scripts' | 'override_settings_restore_afterwards' | 'script_args' | 'script_name'> {
  adetailer?: IAdetailer[];
  controlNet?: IControlNet[];
  cutOff?: ICutOff;
  enable_hr?: boolean;
  firstphase_height?: number;
  firstphase_width?: number;
  hr_negative_prompt?: string;
  hr_prompt?: string;
  hr_scale?: number;
  hr_upscaler?: string;
  lcm?: boolean;
  tiledDiffusion?: ITiledDiffusion;
  //ultimateSdUpscale?: number;

  //init_images: string[];
}

export interface IImg2ImgQuery
  extends Omit<IBaseQuery, 'alwayson_scripts' | 'override_settings_restore_afterwards' | 'script_args' | 'script_name'> {
  adetailer?: IAdetailer[];
  controlNet?: IControlNet[];
  cutOff?: ICutOff;
  include_init_images?: boolean;
  init_images: string[];
  initial_noise_multiplier?: number;
  inpaint_full_res?: boolean;
  inpaint_full_res_padding?: number;
  inpainting_fill?: number;
  inpainting_mask_invert?: number;
  latent_mask?: string;
  lcm?: boolean;
  mask?: string;
  mask_blur?: number;
  mask_blur_x?: number;
  mask_blur_y?: number;
  tiledDiffusion?: ITiledDiffusion;

  ultimateSdUpscale?: IUltimateSDUpscale;
}

export type MetadataVersionKey = 'sd14' | 'sd15' | 'sd20' | 'sd20-768' | 'sd21' | 'sd21-768' | 'sdxl' | 'unknown';
export type MetadataAccelerator = 'distilled' | 'lcm' | 'lightning' | 'none' | 'turbo';
export type VersionKey =
  | 'Pony'
  | 'SD 1.4'
  | 'SD 1.5 LCM'
  | 'SD 1.5'
  | 'SD 2.0 768'
  | 'SD 2.0'
  | 'SD 2.1 768'
  | 'SD 2.1'
  | 'SDXL 0.9'
  | 'SDXL 1.0 LCM'
  | 'SDXL 1.0'
  | 'SDXL Distilled'
  | 'SDXL Lightning'
  | 'SDXL Turbo';

export const Version: Record<string, MetadataVersionKey> = {
  SD14: 'sd14',
  SD15: 'sd15',
  SD20: 'sd20',
  SD21: 'sd21',
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
  accelarator?: MetadataAccelerator;
  name: string;
  version: MetadataVersionKey;
}

export interface IModelWithHash extends IModel {
  hash?: string;
}

export interface ILora {
  alias: string;
  keywords: string[];
  name: string;
  version: MetadataVersionKey;
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
  accelerator: MetadataAccelerator;
  keywords: string[];
  sdVersion: MetadataVersionKey;
}

export interface IMetadataCheckpoint extends Omit<IMetadata, 'keywords'> {}

export interface IMetadataLora extends Omit<IMetadata, 'accelerator'> {}

export interface ICivitAIInfoFile {
  baseModel: VersionKey;
  description?: string;
  model?: {
    description?: string;
  };
  trainedWords: string[];
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
