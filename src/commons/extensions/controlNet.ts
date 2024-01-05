import { Version } from '../types';

type ControlNetModules =
  | 'blur_gaussian'
  | 'canny'
  | 'clip_vision'
  | 'color'
  | 'depth'
  | 'depth_leres'
  | 'depth_leres++'
  | 'depth_midas'
  | 'depth_zoe'
  | 'mediapipe_face'
  | 'hed'
  | 'hed_safe'
  | 'ip-adapter_clip_sd15'
  | 'ip-adapter_clip_sdxl'
  | 'ip-adapter_clip_sdxl_plus_vith'
  | 'inpaint'
  | 'inpaint_only'
  | 'inpaint_only+lama'
  | 'invert'
  | 'lineart'
  | 'lineart_anime'
  | 'lineart_anime_denoise'
  | 'lineart_coarse'
  | 'lineart_realistic'
  | 'lineart_standard'
  | 'mlsd'
  | 'none'
  | 'normal_map'
  | 'normal_bae'
  | 'normal_midas'
  | 'oneformer_ade20k'
  | 'oneformer_coco'
  | 'openpose'
  | 'openpose_face'
  | 'openpose_faceonly'
  | 'openpose_full'
  | 'dw_openpose_full'
  | 'openpose_hand'
  | 'pidinet'
  | 'pidinet_safe'
  | 'pidinet_scribble'
  | 'pidinet_sketch'
  | 'recolor_intensity'
  | 'recolor_luminance'
  | 'reference_adain'
  | 'reference_adain+attn'
  | 'reference_only'
  | 'revision_clipvision'
  | 'revision_ignore_prompt'
  | 'scribble_hed'
  | 'scribble_xdog'
  | 'segmentation'
  | 'shuffle'
  | 'threshold'
  | 'tile_colorfix'
  | 'tile_colorfix+sharp'
  | 'tile_resample';

interface ControlNetType {
  modelRegex: RegExp;
  module: ControlNetModules[];
  name: string;
  version?: Version;
}

const controlNetTypes: ControlNetType[] = [
  {
    modelRegex: /^canny$/,
    module: ['none', 'canny', 'invert'],
    name: 'Canny'
  },
  {
    modelRegex: /^depth$/,
    module: ['none', 'depth', 'depth_midas', 'depth_leres', 'depth_leres++', 'depth_zoe'],
    name: 'Depth'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Normal Map'
  },
  {
    modelRegex: /^openpose$/,
    module: ['none', 'dw_openpose_full'],
    name: 'OpenPose XL',
    version: Version.SDXL
  },
  {
    modelRegex: /^openpose$/,
    module: ['none', 'openpose', 'openpose_face', 'openpose_faceonly', 'openpose_full', 'openpose_hand'],
    name: 'OpenPose',
    version: Version.SD15
  },
  {
    modelRegex: /^mlsd$/,
    module: ['none', 'mlsd', 'invert'],
    name: 'MLSD'
  },
  {
    modelRegex: /^lineart$/,
    module: [
      'none',
      'lineart',
      'lineart_realistic',
      'lineart_anime',
      'lineart_anime_denoise',
      'lineart_coarse',
      'lineart_standard',
      'invert'
    ],
    name: 'LineArt'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'SoftEdge'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Scribble/Sketch'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Segmentation'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Shuffle'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Tile/Blur'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Inpaint'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'InstructP2P'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Reference'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Recolor'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'Revision'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'T2I-Adapter'
  },
  {
    modelRegex: /^normal$/,
    module: ['none', 'normal_map', 'normal_midas', 'normal_bae'],
    name: 'IP-Adapter'
  }
];

export enum ControlNetResizes {
  Envelope = 2,
  Resize = 0,
  ScaleToFit = 1
}

export enum ControlNetMode {
  Balanced = 0,
  ControleNetImportant = 2,
  PromptImportant = 1
}

export interface IControlNet {
  control_mode: ControlNetMode;
  input_image?: string;
  model: string;
  module: string;
  resize_mode: ControlNetResizes;
}

export const checkControlNet = (model: string, moduleName: ControlNetModules, version: Version) => {};
