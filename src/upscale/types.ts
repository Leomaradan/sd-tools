export interface IUpscaleOptions {
  checkpoint?: string;
  denoising?: number[];
  recursive?: boolean;
  upscaling?: number[];
}

export interface IUpscaleOptionsFull extends IUpscaleOptions {
  method: string;
  source: string;
}
