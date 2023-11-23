import { IControlNet } from './types/controlNet';
import { IUltimateSDUpscale, UltimateSDUpscaleArgs } from './types/ultimateSdUpscale';

export * from './types/controlNet';
export * from './types/ultimateSdUpscale';

export enum Upscaler {
  ESRGAN = 'ESRGAN_4x',
  Foolhardy = '4x_foolhardy_Remacri',
  LDSR = 'LDSR',
  Lanczos = 'Lanczos',
  Latent = 'Latent',
  LatentAntiAliased = 'Latent (antialiased)',
  LatentBicubic = 'Latent (bicubic)',
  LatentBicubicAntiAliased = 'Latent (bicubic antialiased)',
  LatentNearest = 'Latent (nearest)',
  LatentNearestExact = 'Latent (nearest-exact)',
  Nearest = 'Nearest',
  None = 'None',
  RESRGAN = 'R-ESRGAN 4x+',
  RESRGANAnime = 'R-ESRGAN 4x+ Anime6B',
  ScuNET = 'ScuNET',
  ScuNET_PSNR = 'ScuNET PSNR',
  SwinIR = 'SwinIR_4x',
  UltraSharp = '4x-UltraSharp'
}

export enum Checkpoints {
  AbsoluteReality = '1.5/realistic/absolutereality_v181.safetensors [463d6a9fe8]',
  AnimeArtXL = 'xl/anime/animeArtDiffusionXL_alpha3.safetensors [53bb4fdc63]',
  AnyLora = '1.5/anime/anyloraCheckpoint_bakedvaeBlessedFp16.safetensors [ef49fbb25f]',
  AnythingV3 = '1.5/anime/anythingV3_fp16.ckpt [812cd9f9d9]',
  BBB = 'xl/dreamlike/bbbSDXL_bbbBetaV2.safetensors [8a52830f54]',
  BabesV2 = '1.5/dreamlike/babes2.safetensors',
  BabesV3 = '1.5/dreamlike/babes3.safetensors [2bcf0556be]',
  CopaxCuteXL = 'xl/dreamlike/copaxCuteXLSDXL10_v2.safetensors [1f4fa0fe6e]',
  CopaxTimelessxlSDXL = 'xl/realistic/copaxTimelessxlSDXL1_v8.safetensors [a771b2b5e8]',
  Corneos = '1.5/anime/.nsfw/corneos-nsfw.safetensors [7ffbd01916]',
  CyberRealistic3 = '1.5/realistic/cyberrealistic_v33.safetensors [3c8530cb22]',
  CyberRealistic4 = '1.5/realistic/cyberrealistic_v40.safetensors [481d75ae9d]',
  DeliberateV2 = '1.5/dreamlike/deliberate_v2.safetensors [9aba26abdf]',
  DeliberateV3 = '1.5/dreamlike/deliberate_v3.safetensors [aadddd3d75]',
  Dreamshaper7 = '1.5/dreamlike/dreamshaper_7.safetensors [ed989d673d]',
  Dreamshaper8 = '1.5/dreamlike/dreamshaper_8.safetensors [879db523c3]',
  DreamshaperXL = 'xl/dreamlike/dreamshaperXL10_alpha2Xl10.safetensors [0f1b80cfe8]',
  DuchaitenAiartSDXLv09 = 'xl/anime/duchaitenAiartSDXL_v09.safetensors [8fed0602c7]',
  DuchaitenAiartSDXLv099 = 'xl/anime/duchaitenAiartSDXL_v099.safetensors [a9c0b61a71]',
  DuchaitenAiartSDXLv10 = 'xl/anime/duchaitenAiartSDXL_v10.safetensors [882d0a68e2]',
  DuchaitenAiartSDXLv20 = 'xl/anime/duchaitenAiartSDXL_v20.safetensors [bb85cd6dfd]',
  EndJourneyXL = 'xl/dreamlike/endjourneyXL_v11.safetensors [87a1e3be9f]',
  EpicPhotogasm = '1.5/realistic/epicphotogasm_lastUnicorn.safetensors [62bb78983a]',
  GhostMix = '1.5/anime/ghostmix_v20Bakedvae.safetensors [e3edb8a26f]',
  HephaistosXLv33 = 'xl/realistic/xl6HEPHAISTOSSD10XLSFW_v33BakedVAE.safetensors [11168f6cc3]',
  JuggernautXL5 = 'xl/realistic/juggernautXL_version5.safetensors [70229e1d56]',
  JuggernautXL6 = 'xl/realistic/juggernautXL_version6Rundiffusion.safetensors [1fe6c7ec54]',
  MeinaAura = '1.5/anime/meinaunreal_v41.safetensors [613844c3d2]',
  MeinaMix = '1.5/anime/meinamix_meinaV11.safetensors [54ef3e3610]',
  MeinaPastel = '1.5/anime/meinapastel_v6Pastel.safetensors [6292dd40d6]',
  PerfectDeliberate = '1.5/dreamlike/.nsfw/perfect-deliberate-nsfw.safetensors [886c73d806]',
  Photon = '1.5/realistic/photon_v1.safetensors [ec41bd2a82]',
  RealisticVision = '1.5/realistic/realisticVisionV51_v51VAE.safetensors [15012c538f]',
  RevAnimated = '1.5/anime/revAnimated_v122.safetensors [4199bcdd14]',
  RunDiffusionXL = 'xl/dreamlike/rundiffusionXL_beta.safetensors [f3efadbbaf]',
  SDXL = 'xl/sdXL_v10VAEFix.safetensors [e6bb9ea85b]',
  Sdvn6RealXL = 'xl/realistic/sdvn6Realxl_detailface.safetensors [777f31751a]',
  ThinkDiffusionXL = 'xl/realistic/thinkdiffusionxl_v10.safetensors [a21c9949ef]',
  URPM12 = '1.5/realistic/.nsfw/uber-realistic-porn-merge-12-nsfw.safetensors [fcfaf106f2]',
  URPM13 = '1.5/realistic/.nsfw/uber-realistic-porn-merge-13-nsfw.safetensors [f93e6a50ac]',
  ZovyaPhotoreal = '1.5/realistic/aZovyaPhotoreal_v2.safetensors [5594efef1c]'
}

export type AlwaysOnScripts = IControlNet;

export type ScriptsArgs = [] | UltimateSDUpscaleArgs;

export interface IOverrideSettings {
  samples_filename_pattern: string;
  sd_model_checkpoint: Checkpoints;
}

export interface IBaseQuery {
  alwayson_scripts: Record<string, AlwaysOnScripts>;
  cfg_scale?: number;
  denoising_strength?: number;
  enable_hr?: boolean;
  height?: number;
  hr_scale?: number;
  hr_upscaler?: Upscaler;
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
  controlNet?: IControlNet;
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
  recursive?: boolean;
  scheduler?: boolean;
  sdxl?: boolean;
  style: 'anime' | 'realism';
  upscaler?: Upscaler;
  upscales?: number[];
}
