import { Version } from '../types';

enum ControlNetModules {
  Blur = 'blur_gaussian',
  Canny = 'canny',
  Clip = 'clip_vision',
  Color = 'color',
  Depth = 'depth',
  DepthLeres = 'depth_leres',
  DepthLeresPlus = 'depth_leres++',
  DepthMidas = 'depth_midas',
  DepthZoe = 'depth_zoe',
  Face = 'mediapipe_face',
  Hed = 'hed',
  HedSafe = 'hed_safe',
  IPAdapter = 'ip-adapter_clip_sd15',
  IPAdapterXL = 'ip-adapter_clip_sdxl',
  IPAdapterXLPlus = 'ip-adapter_clip_sdxl_plus_vith',
  Inpaint = 'inpaint',
  InpaintOnly = 'inpaint_only',
  InpaintOnlyLama = 'inpaint_only+lama',
  Invert = 'invert',
  LineArt = 'lineart',
  LineArtAnime = 'lineart_anime',
  LineArtAnimeDenoise = 'lineart_anime_denoise',
  LineArtCoarse = 'lineart_coarse',
  LineArtRealistic = 'lineart_realistic',
  LineArtStandard = 'lineart_standard',
  MSLD = 'mlsd',
  None = 'none',
  Normal = 'normal_map',
  NormalBae = 'normal_bae',
  NormalMidas = 'normal_midas',
  OneFormerAde20k = 'oneformer_ade20k',
  OneFormerCoco = 'oneformer_coco',
  OpenPose = 'openpose',
  OpenPoseFace = 'openpose_face',
  OpenPoseFaceOnly = 'openpose_faceonly',
  OpenPoseFull = 'openpose_full',
  OpenPoseFullXL = 'dw_openpose_full',
  OpenPoseHand = 'openpose_hand',
  Pidinet = 'pidinet',
  PidinetSafe = 'pidinet_safe',
  PidinetScribble = 'pidinet_scribble',
  PidinetSketch = 'pidinet_sketch',
  RecolorIntensity = 'recolor_intensity',
  RecolorLuminance = 'recolor_luminance',
  ReferenceAdain = 'reference_adain',
  ReferenceAdainAttn = 'reference_adain+attn',
  ReferenceOnly = 'reference_only',
  RevisionClip = 'revision_clipvision',
  RevisionIgnorePrompt = 'revision_ignore_prompt',
  ScribbleHed = 'scribble_hed',
  ScribbleXdog = 'scribble_xdog',
  Segmentation = 'segmentation',
  Shuffle = 'shuffle',
  Threshold = 'threshold',
  TileColorFix = 'tile_colorfix',
  TileColorFixSharp = 'tile_colorfix+sharp',
  TileResample = 'tile_resample'
}

interface ControlNetType {
  modelRegex: RegExp;
  module: ControlNetModules[];
  name: string;
  version?: Version;
}

const controlNetTypes: ControlNetType[] = [
  {
    modelRegex: /^canny$/,
    module: [ControlNetModules.None, ControlNetModules.Canny, ControlNetModules.Invert],
    name: 'Canny'
  },
  {
    modelRegex: /^depth$/,
    module: [
      ControlNetModules.None,
      ControlNetModules.Depth,
      ControlNetModules.DepthMidas,
      ControlNetModules.DepthLeres,
      ControlNetModules.DepthLeresPlus,
      ControlNetModules.DepthZoe
    ],
    name: 'Depth'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'NormalMap'
  },
  {
    modelRegex: /^openpose$/,
    module: [ControlNetModules.None, ControlNetModules.OpenPoseFullXL],
    name: 'OpenPoseXL',
    version: Version.SDXL
  },
  {
    modelRegex: /^openpose$/,
    module: [
      ControlNetModules.None,
      ControlNetModules.OpenPose,
      ControlNetModules.OpenPoseFace,
      ControlNetModules.OpenPoseFaceOnly,
      ControlNetModules.OpenPoseFull,
      ControlNetModules.OpenPoseHand
    ],
    name: 'OpenPose',
    version: Version.SD15
  },
  {
    modelRegex: /^mlsd$/,
    module: [ControlNetModules.None, ControlNetModules.MSLD, ControlNetModules.Invert],
    name: 'MSLD'
  },
  {
    modelRegex: /^lineart$/,
    module: [
      ControlNetModules.None,
      ControlNetModules.LineArt,
      ControlNetModules.LineArtRealistic,
      ControlNetModules.LineArtAnime,
      ControlNetModules.LineArtAnimeDenoise,
      ControlNetModules.LineArtCoarse,
      ControlNetModules.LineArtStandard,
      ControlNetModules.Invert
    ],
    name: 'Lineart'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'SoftEdge'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'Scribble/Sketch'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'Segmentation'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'Shuffle'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'Tile/Blur'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'Inpaint'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'InstructP2P'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'Reference'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'Recolor'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'Revision'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
    name: 'T2I-Adapter'
  },
  {
    modelRegex: /^normal$/,
    module: [ControlNetModules.None, ControlNetModules.Normal, ControlNetModules.NormalMidas, ControlNetModules.NormalBae],
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
  controlnet_model: string;
  controlnet_module: string;
  input_image?: string;
  resize_mode: ControlNetResizes;
}

export const checkControlNet = (model: string, moduleName: ControlNetModules, version: Version) => {};
