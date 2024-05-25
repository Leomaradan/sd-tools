import { type MetadataVersionKey, Version } from '../types';

type ControlNetModules =
  | 'animal_openpose'
  | 'anime_face_segment'
  | 'blur_gaussian'
  | 'canny'
  | 'clip_vision'
  | 'color'
  | 'densepose'
  | 'densepose_parula'
  | 'depth'
  | 'depth_anything'
  | 'depth_hand_refiner'
  | 'depth_leres'
  | 'depth_leres++'
  //| 'depth_midas' => depth
  | 'depth_zoe'
  | 'dw_openpose_full'
  | 'hed'
  | 'hed_safe'
  | 'inpaint'
  | 'inpaint_only'
  | 'inpaint_only+lama'
  | 'instant_id_face_embedding'
  | 'instant_id_face_keypoints'
  | 'invert'
  | 'ip-adapter_clip_sd15'
  | 'ip-adapter_clip_sdxl'
  | 'ip-adapter_clip_sdxl_plus_vith'
  | 'ip-adapter_face_id'
  | 'ip-adapter_face_id_plus'
  | 'lineart'
  | 'lineart_anime'
  | 'lineart_anime_denoise'
  | 'lineart_coarse'
  // | 'lineart_realistic' => lineart
  | 'lineart_standard'
  | 'mediapipe_face'
  | 'mlsd'
  | 'none'
  | 'normal_bae'
  | 'normal_map'
  //| 'normal_midas' => normal_map
  | 'oneformer_ade20k'
  | 'oneformer_coco'
  | 'openpose'
  | 'openpose_face'
  | 'openpose_faceonly'
  | 'openpose_full'
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
  // version?: MetadataVersionKey;
}

/*const controlNetTypes15: ControlNetType[] = [
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
];*/

/*
{
  "module_list": [
    "animal_openpose",
    "anime_face_segment",
    "blur_gaussian",
    "canny",
    "clip_vision",
    "color",
    "densepose",
    "densepose_parula",
    "depth",
    "depth_anything",
    "depth_hand_refiner",
    "depth_leres",
    "depth_leres++",
    "depth_zoe",
    "dw_openpose_full",
    "hed",
    "hed_safe",
    "inpaint",
    "inpaint_only",
    "inpaint_only+lama",
    "instant_id_face_embedding",
    "instant_id_face_keypoints",
    "invert",
    "ip-adapter_clip_sd15",
    "ip-adapter_clip_sdxl",
    "ip-adapter_clip_sdxl_plus_vith",
    "ip-adapter_face_id",
    "ip-adapter_face_id_plus",
    "lineart",
    "lineart_anime",
    "lineart_anime_denoise",
    "lineart_coarse",
    "lineart_standard",
    "mediapipe_face",
    "mlsd",
    "none",
    "normal_bae",
    "normal_map",
    "oneformer_ade20k",
    "oneformer_coco",
    "openpose",
    "openpose_face",
    "openpose_faceonly",
    "openpose_full",
    "openpose_hand",
    "pidinet",
    "pidinet_safe",
    "pidinet_scribble",
    "pidinet_sketch",
    "recolor_intensity",
    "recolor_luminance",
    "reference_adain",
    "reference_adain+attn",
    "reference_only",
    "revision_clipvision",
    "revision_ignore_prompt",
    "scribble_hed",
    "scribble_xdog",
    "segmentation",
    "shuffle",
    "te_hed"
    "threshold",
    "tile_colorfix",
    "tile_colorfix+sharp",
    "tile_resample",
  ],
  "module_detail": {
    "none": {
      "model_free": false,
      "sliders": []
    },
    "canny": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        },
        {
          "name": "Canny Low Threshold",
          "value": 100,
          "min": 1,
          "max": 255
        },
        {
          "name": "Canny High Threshold",
          "value": 200,
          "min": 1,
          "max": 255
        }
      ]
    },
    "depth": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "depth_leres": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        },
        {
          "name": "Remove Near %",
          "min": 0,
          "max": 100,
          "value": 0,
          "step": 0.1
        },
        {
          "name": "Remove Background %",
          "min": 0,
          "max": 100,
          "value": 0,
          "step": 0.1
        }
      ]
    },
    "depth_leres++": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        },
        {
          "name": "Remove Near %",
          "min": 0,
          "max": 100,
          "value": 0,
          "step": 0.1
        },
        {
          "name": "Remove Background %",
          "min": 0,
          "max": 100,
          "value": 0,
          "step": 0.1
        }
      ]
    },
    "depth_hand_refiner": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        }
      ]
    },
    "depth_anything": {
      "model_free": false,
      "sliders": []
    },
    "hed": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "hed_safe": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "mediapipe_face": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        },
        {
          "name": "Max Faces",
          "value": 1,
          "min": 1,
          "max": 10,
          "step": 1
        },
        {
          "name": "Min Face Confidence",
          "value": 0.5,
          "min": 0.01,
          "max": 1,
          "step": 0.01
        }
      ]
    },
    "mlsd": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        },
        {
          "name": "MLSD Value Threshold",
          "min": 0.01,
          "max": 2,
          "value": 0.1,
          "step": 0.01
        },
        {
          "name": "MLSD Distance Threshold",
          "min": 0.01,
          "max": 20,
          "value": 0.1,
          "step": 0.01
        }
      ]
    },
    "normal_map": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        },
        {
          "name": "Normal Background Threshold",
          "min": 0,
          "max": 1,
          "value": 0.4,
          "step": 0.01
        }
      ]
    },
    "openpose": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "openpose_hand": {
      "model_free": false,
      "sliders": []
    },
    "openpose_face": {
      "model_free": false,
      "sliders": []
    },
    "openpose_faceonly": {
      "model_free": false,
      "sliders": []
    },
    "openpose_full": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "dw_openpose_full": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "animal_openpose": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "clip_vision": {
      "model_free": false,
      "sliders": []
    },
    "revision_clipvision": {
      "model_free": true,
      "sliders": [
        null,
        {
          "name": "Noise Augmentation",
          "value": 0,
          "min": 0,
          "max": 1
        }
      ]
    },
    "revision_ignore_prompt": {
      "model_free": true,
      "sliders": [
        null,
        {
          "name": "Noise Augmentation",
          "value": 0,
          "min": 0,
          "max": 1
        }
      ]
    },
    "ip-adapter_clip_sd15": {
      "model_free": false,
      "sliders": []
    },
    "ip-adapter_clip_sdxl_plus_vith": {
      "model_free": false,
      "sliders": []
    },
    "ip-adapter_clip_sdxl": {
      "model_free": false,
      "sliders": []
    },
    "ip-adapter_face_id": {
      "model_free": false,
      "sliders": []
    },
    "ip-adapter_face_id_plus": {
      "model_free": false,
      "sliders": []
    },
    "instant_id_face_keypoints": {
      "model_free": false,
      "sliders": []
    },
    "instant_id_face_embedding": {
      "model_free": false,
      "sliders": []
    },
    "color": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        }
      ]
    },
    "pidinet": {
      "model_free": false,
      "sliders": []
    },
    "pidinet_safe": {
      "model_free": false,
      "sliders": []
    },
    "pidinet_sketch": {
      "model_free": false,
      "sliders": []
    },
    "pidinet_scribble": {
      "model_free": false,
      "sliders": []
    },
    "scribble_xdog": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        },
        {
          "name": "XDoG Threshold",
          "min": 1,
          "max": 64,
          "value": 32
        }
      ]
    },
    "scribble_hed": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "segmentation": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "threshold": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        },
        {
          "name": "Binarization Threshold",
          "min": 0,
          "max": 255,
          "value": 127
        }
      ]
    },
    "depth_zoe": {
      "model_free": false,
      "sliders": []
    },
    "normal_bae": {
      "model_free": false,
      "sliders": []
    },
    "oneformer_coco": {
      "model_free": false,
      "sliders": []
    },
    "oneformer_ade20k": {
      "model_free": false,
      "sliders": []
    },
    "lineart": {
      "model_free": false,
      "sliders": []
    },
    "lineart_coarse": {
      "model_free": false,
      "sliders": []
    },
    "lineart_anime": {
      "model_free": false,
      "sliders": []
    },
    "lineart_standard": {
      "model_free": false,
      "sliders": []
    },
    "shuffle": {
      "model_free": false,
      "sliders": []
    },
    "tile_resample": {
      "model_free": false,
      "sliders": [
        null,
        {
          "name": "Down Sampling Rate",
          "value": 1,
          "min": 1,
          "max": 8,
          "step": 0.01
        }
      ]
    },
    "invert": {
      "model_free": false,
      "sliders": []
    },
    "lineart_anime_denoise": {
      "model_free": false,
      "sliders": []
    },
    "reference_only": {
      "model_free": true,
      "sliders": [
        null,
        {
          "name": "Style Fidelity (only for \"Balanced\" mode)",
          "value": 0.5,
          "min": 0,
          "max": 1,
          "step": 0.01
        }
      ]
    },
    "reference_adain": {
      "model_free": true,
      "sliders": [
        null,
        {
          "name": "Style Fidelity (only for \"Balanced\" mode)",
          "value": 0.5,
          "min": 0,
          "max": 1,
          "step": 0.01
        }
      ]
    },
    "reference_adain+attn": {
      "model_free": true,
      "sliders": [
        null,
        {
          "name": "Style Fidelity (only for \"Balanced\" mode)",
          "value": 0.5,
          "min": 0,
          "max": 1,
          "step": 0.01
        }
      ]
    },
    "inpaint": {
      "model_free": false,
      "sliders": []
    },
    "inpaint_only": {
      "model_free": false,
      "sliders": []
    },
    "inpaint_only+lama": {
      "model_free": false,
      "sliders": []
    },
    "tile_colorfix": {
      "model_free": false,
      "sliders": [
        null,
        {
          "name": "Variation",
          "value": 8,
          "min": 3,
          "max": 32,
          "step": 1
        }
      ]
    },
    "tile_colorfix+sharp": {
      "model_free": false,
      "sliders": [
        null,
        {
          "name": "Variation",
          "value": 8,
          "min": 3,
          "max": 32,
          "step": 1
        },
        {
          "name": "Sharpness",
          "value": 1,
          "min": 0,
          "max": 2,
          "step": 0.01
        }
      ]
    },
    "recolor_luminance": {
      "model_free": false,
      "sliders": [
        null,
        {
          "name": "Gamma Correction",
          "value": 1,
          "min": 0.1,
          "max": 2,
          "step": 0.001
        }
      ]
    },
    "recolor_intensity": {
      "model_free": false,
      "sliders": [
        null,
        {
          "name": "Gamma Correction",
          "value": 1,
          "min": 0.1,
          "max": 2,
          "step": 0.001
        }
      ]
    },
    "blur_gaussian": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        },
        {
          "name": "Sigma",
          "min": 0.01,
          "max": 64,
          "value": 9
        }
      ]
    },
    "anime_face_segment": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        }
      ]
    },
    "densepose": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "densepose_parula": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "min": 64,
          "max": 2048,
          "value": 512
        }
      ]
    },
    "te_hed": {
      "model_free": false,
      "sliders": [
        {
          "name": "Preprocessor Resolution",
          "value": 512,
          "min": 64,
          "max": 2048
        },
        {
          "name": "Safe Steps",
          "min": 0,
          "max": 10,
          "value": 2,
          "step": 1
        }
      ]
    }
  }
}
*/

/*const controlNetTypesXL: ControlNetType[] = [
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
];*/

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
  lowvram?: boolean;
  model: string;
  module: string;
  pixel_perfect?: boolean;
  resize_mode: ControlNetResizes;
}

export const checkControlNet = (model: string, moduleName: ControlNetModules, version: MetadataVersionKey) => {};


export const CONTROLNET_URL = 'https://github.com/Mikubill/sd-webui-controlnet.git';