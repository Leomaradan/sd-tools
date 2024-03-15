export enum TiledDiffusionMethods {
  MixtureOfDiffusers = 'Mixture of Diffusers',
  MultiDiffusion = 'MultiDiffusion'
}

export interface ITiledDiffusionRegion {
  blend_mode: 'Background' | 'Foreground';
  feather_ratio?: number;
  h: number;
  neg_prompt?: string;
  prompt: string;
  seed?: number;
  w: number;
  x: number;
  y: number;
}

export interface ITiledDiffusion {
  method: TiledDiffusionMethods;
  scaleFactor?: number;
  // regionalPrompt?: ITiledDiffusionRegion[];
  tileBatchSize?: number;
  tileHeight?: number;
  tileOverlap?: number;
  tileWidth?: number;
}

export interface ITiledVAE {
  colorFix?: boolean;
  decoderTileSize?: number;
  encoderTileSize?: number;
  fastDecoder?: boolean;
  fastEncoder?: boolean;
  vaeToGPU?: boolean;
}

export const defaultTiledDiffusionOptions: Required<ITiledDiffusion> = {
  method: TiledDiffusionMethods.MultiDiffusion,
  scaleFactor: 2,
  tileBatchSize: 4,
  tileHeight: 96,
  tileOverlap: 48,
  tileWidth: 96
};

export const defaultTiledDiffusionRegionOptions: ITiledDiffusionRegion = {
  blend_mode: 'Background',
  feather_ratio: 0.2,
  h: 0.2,
  prompt: '',
  seed: -1,
  w: 0.2,
  x: 0.4,
  y: 0.4
};

export const defaultTiledVAEnOptions: Required<ITiledVAE> = {
  colorFix: false,
  decoderTileSize: 64,
  encoderTileSize: 960,
  fastDecoder: true,
  fastEncoder: true,
  vaeToGPU: true
};

/*
def process(self, p: Processing,
            enabled: bool, method: str,
            overwrite_size: bool, keep_input_size: bool, image_width: int, image_height: int,
            tile_width: int, tile_height: int, overlap: int, tile_batch_size: int,
            upscaler_name: str, scale_factor: float,
            noise_inverse: bool, noise_inverse_steps: int, noise_inverse_retouch: float, noise_inverse_renoise_strength: float, noise_inverse_renoise_kernel: int,
            control_tensor_cpu: bool, 
            enable_bbox_control: bool, draw_background: bool, causal_layers: bool, 
            *bbox_control_states: List[Any],
        ):
*/
