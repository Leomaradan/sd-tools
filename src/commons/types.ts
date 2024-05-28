import { type IAdetailer } from './extensions/adetailer';
import { type IControlNet, type IControlNetQuery } from './extensions/controlNet';
import { type ICutOff } from './extensions/cutoff';
import { type ITiledDiffusion, type ITiledVAE, TiledDiffusionMethods } from './extensions/multidiffusionUpscaler';
import { type IUltimateSDUpscale, type UltimateSDUpscaleArgs } from './extensions/ultimateSdUpscale';

export type AlwaysOnScripts = { args: Array<boolean | number | string> } | { args: IAdetailer[] } | { args: IControlNetQuery[] };

export enum AlwaysOnScriptsNames {
  ADetailer = 'ADetailer',
  ControlNet = 'controlnet',
  Cutoff = 'Cutoff',
  TiledDiffusion = 'Tiled Diffusion',
  TiledVAE = 'Tiled VAE'
}

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
  alwayson_scripts: Partial<Record<AlwaysOnScriptsNames, AlwaysOnScripts>>;
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
  tiledVAE?: ITiledVAE;
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
  tiledVAE?: ITiledVAE;
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
  SD20Full: 'sd20-768',
  SD21: 'sd21',
  SD21Full: 'sd21-768',
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
  alias?: string;
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

export interface IAutoAdetailer extends IAdetailer {
  trigger: string;
}

export interface IAutoControlnetPose {
  afterPrompt?: string;
  beforePrompt?: string;
  pose: string;
  trigger: string;
}

export interface IConfig {
  adetailersModels: string[];
  autoAdetailers: IAutoAdetailer[];
  autoControlnetPose: IAutoControlnetPose[];
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

export interface IAdetailerPrompt {
  height?: number;
  model: string;
  negative?: string;
  prompt?: string;
  strength?: number;
  width?: number;
}

export interface ICheckpointWithVAE {
  addAfterFilename?: string;
  addAfterNegativePrompt?: string;
  addAfterPrompt?: string;
  addBeforeFilename?: string;
  addBeforeNegativePrompt?: string;
  addBeforePrompt?: string;
  checkpoint: string;
  vae?: string;
}

type ControlNetSchema = Omit<IControlNet, 'image_name'>;

export interface IPrompt {
  adetailer?: IAdetailerPrompt[];
  autoCutOff?: 'both' | boolean;
  autoLCM?: 'both' | boolean;
  cfg?: number | number[];
  checkpoints?: ICheckpointWithVAE[] | string | string[];
  clipSkip?: number | number[];
  controlNet?: ControlNetSchema | ControlNetSchema[];
  count?: number;
  denoising?: number | number[];
  enableHighRes?: 'both' | boolean;
  filename?: string;
  height?: number | number[];
  highRes?: {
    afterNegativePrompt?: string;
    afterPrompt?: string;
    beforeNegativePrompt?: string;
    beforePrompt?: string;
  };
  initImageOrFolder?: string | string[];
  negativePrompt?: string | string[];
  outDir?: string;
  pattern?: string;
  prompt: string | string[];
  restoreFaces?: 'both' | boolean;
  sampler?: string | string[];
  scaleFactor?: number | number[];
  seed?: `${number}-${number}` | number | number[];
  steps?: number | number[];
  styles?: string | string[];
  stylesSets?: Array<string | string[]>;
  tiledDiffusion?: ITiledDiffusion | ITiledDiffusion[];
  tiledVAE?: 'both' | ITiledVAE | boolean;
  tiling?: 'both' | boolean;
  ultimateSdUpscale?: 'both' | boolean;
  upscaler?: string | string[];
  upscalingNegativePrompt?: string | string[];
  upscalingPrompt?: string | string[];
  vae?: string | string[];
  width?: number | number[];
}

export interface IPromptSingle {
  adetailer?: IAdetailerPrompt[];
  autoCutOff?: boolean;
  autoLCM?: boolean;
  cfg?: number;
  checkpoints?: string;
  clipSkip?: number;
  controlNet?: IControlNet[];
  denoising?: number;
  enableHighRes?: boolean;
  filename?: string;
  height?: number;
  highRes?: {
    afterNegativePrompt?: string;
    afterPrompt?: string;
    beforeNegativePrompt?: string;
    beforePrompt?: string;
  };
  initImage?: string;
  negativePrompt?: string;
  outDir?: string;
  pattern?: string;
  prompt: string;
  restoreFaces?: boolean;
  sampler?: string;
  scaleFactor?: number;
  seed?: number;
  steps?: number;
  styles?: string[];
  tiledDiffusion?: ITiledDiffusion;
  tiledVAE?: ITiledVAE;
  tiling?: boolean;
  ultimateSdUpscale?: IUltimateSDUpscale;
  upscaler?: string;
  upscalingNegativePrompt?: string;
  upscalingPrompt?: string;
  vae?: string;
  width?: number;
}

export interface IPromptSingleSchema extends Omit<IPromptSingle, 'controlNet'> {
  controlNet?: ControlNetSchema[];
}
interface IPromptReplace {
  from: string;
  to: string;
}

export interface IPromptPermutations {
  afterFilename?: string;
  afterNegativePrompt?: string;
  afterPrompt?: string;
  beforeFilename?: string;
  beforeNegativePrompt?: string;
  beforePrompt?: string;
  filenameReplace?: IPromptReplace[];
  overwrite?: Partial<IPromptSingleSchema>;
  promptReplace?: IPromptReplace[];
}

interface IPromptsCommon {
  $schema?: string;
  multiValueMethod?: 'permutation' | 'random-selection';
  permutations?: IPromptPermutations[];
}

interface IPromptsWithPrompt extends IPromptsCommon {
  basePrompt?: Partial<IPrompt>;
  extends?: string;
  prompts: IPrompt[];
}

interface IPromptsWithBasePrompt extends IPromptsCommon {
  basePrompt: Partial<IPrompt>;
  extends?: string;
  prompts?: IPrompt[];
}

interface IPromptsWithExtends extends IPromptsCommon {
  basePrompt?: Partial<IPrompt>;
  extends: string;
  prompts?: IPrompt[];
}

export type IPrompts = IPromptsWithBasePrompt | IPromptsWithExtends | IPromptsWithPrompt;

export interface IPromptsResolved extends IPromptsCommon {
  prompts: IPrompt[];
}
