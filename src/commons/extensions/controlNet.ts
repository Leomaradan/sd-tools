/* export enum ControlNetModels {
  canny = 'control_v11p_sd15_canny [d14c016b]',
  depth = 'control_v11f1p_sd15_depth [cfd03158]',
  inpaint = 'control_v11p_sd15_inpaint [ebff9138]',
  ip2p = 'control_v11e_sd15_ip2p [c4bb465c]',
  lineart = 'control_v11p_sd15_lineart [43d4be0d]',
  lineartAnime = 'control_v11p_sd15s2_lineart_anime [3825e83e]',
  lineartXl = 't2i-adapter_diffusers_xl_lineart [bae0efef]',
  mlsd = 'control_v11p_sd15_mlsd [aca30ff0]',
  normal = 'control_v11p_sd15_normalbae [316696f1]',
  openPose = 'control_v11p_sd15_openpose [cab727d4]',
  scribble = 'control_v11p_sd15_scribble [d4ba51ff]',
  segment = 'control_v11p_sd15_seg [e1f51eb9]',
  shuffle = 'control_v11e_sd15_shuffle [526bfdae]',
  softEdge = 'control_v11p_sd15_softedge [a8575a2a]',
  tile = 'control_v11f1e_sd15_tile [a371b31b]'
} */

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
  IPAdapterPlus = 'ip-adapter_clip_sdxl_plus_vith',
  IPAdapterXL = 'ip-adapter_clip_sdxl',
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
  resize_mode: ControlNetResizes;
}
