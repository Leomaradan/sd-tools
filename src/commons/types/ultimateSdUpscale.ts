export enum RedrawMode {
  Chess = 1,
  Linear = 0,
  None = 2
}

export enum SeamsFixType {
  BandPass = 1,
  HalfTile = 2,
  HalfTilePlusIntersection = 3,
  None = 0
}

export enum TargetSizeType {
  Base = 0,
  CustomScale = 2,
  CustomSize = 1
}

export interface IUltimateSDUpscale {
  height: number;
  scale: number;
  tileHeight?: number;
  tileWidth?: number;
  width: number;
}

export type UltimateSDUpscaleArgs = [
  null, // _ (not used)
  number, // tile_width
  number, // tile_height
  number, // mask_blur
  number, // padding
  number, // seams_fix_width
  number, // seams_fix_denoise
  number, // seams_fix_padding
  number, // upscaler_index
  boolean, // save_upscaled_image a.k.a Upscaled
  RedrawMode, // redraw_mode
  boolean, // save_seams_fix_image a.k.a Seams fix
  number, // seams_fix_mask_blur
  SeamsFixType, // seams_fix_type
  TargetSizeType, // target_size_type
  number, // custom_width
  number, // custom_height
  number // custom_scale
];
