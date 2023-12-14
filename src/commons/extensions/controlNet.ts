export enum ControlNetModules {
  Blur = 'blur_gaussian',
  Canny = 'canny',
  Clip = 'clip_vision',
  Color = 'color',
  Depth = 'depth',
  DepthLeres = 'depth_leres',
  DepthLeresPlus = 'depth_leres++',
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
  LineArtStandard = 'lineart_standard',
  MSLD = 'mlsd',
  None = 'none',
  Normal = 'normal_map',
  NormalBae = 'normal_bae',
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
  controlnet_module: ControlNetModules;
  input_image?: string;
  resize_mode: ControlNetResizes;
}
