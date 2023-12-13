import Configstore from 'configstore';

export type Extensions = 'adetailer' | 'controlnet' | 'cutoff' | 'scheduler' | 'ultimate-sd-upscale';

export interface IConfig {
  adetailersCustomModels: string[];
  commonNegative?: string;
  commonNegativeXL?: string;
  commonPositive?: string;
  commonPositiveXL?: string;
  controlnetModels: { hash?: string; name: string }[];
  controlnetModules: string[];
  cutoff: boolean;
  cutoffTokens: string[];
  cutoffWeight: number;
  embeddings: { name: string; sdxl?: boolean }[];
  extensions: Extensions[];
  initialized: boolean;
  loras: { name: string; sdxl?: boolean }[];
  models: { hash?: string; name: string }[];
  redrawModels: {
    anime15?: string;
    animeXL?: string;
    realist15?: string;
    realistXL?: string;
  };
  samplers: { aliases: string[]; name: string }[];
  scheduler: boolean;
  upscalers: { filename?: string; index: number; name: string }[];
  vae: string[];
}

const config = new Configstore('sd-tools');

export const Config = {
  get: <T extends keyof IConfig>(key: T): IConfig[T] => config.get(key),
  set: <T extends keyof IConfig>(key: T, value: IConfig[T]): void => config.set(key, value)
};
