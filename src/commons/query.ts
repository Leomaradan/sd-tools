import axios from 'axios';

import { getBase64Image } from './file';
import { logger } from './logger';
import { IBaseQuery, IImg2ImgQuery, ITxt2ImgQuery, RedrawMode, Samplers, TargetSizeType, Upscaler } from './types';

const headerRequest = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

const defaultQuery: IBaseQuery = {
  alwayson_scripts: {},
  cfg_scale: 7,
  denoising_strength: 0.7,
  enable_hr: false,
  height: 512,
  hr_scale: 2,
  hr_upscaler: Upscaler.UltraSharp,
  negative_prompt: '',
  override_settings: {},
  override_settings_restore_afterwards: true,
  prompt: '',
  restore_faces: false,
  sampler_name: Samplers.DPMPlusPlus2MKarras,
  save_images: true,
  seed: -1,
  send_images: false,
  steps: 20,
  styles: [],
  width: 512
};

type Txt2ImgQuery = (query: ITxt2ImgQuery, type: 'txt2img', useScheduler?: boolean) => Promise<void>;
type Img2ImgQuery = (query: IImg2ImgQuery, type: 'img2img', useScheduler?: boolean) => Promise<void>;

type Query = Txt2ImgQuery & Img2ImgQuery;

export const renderQuery: Query = async (query, type, useScheduler) => {
  const { adetailer, controlNet, cutOff, ultimateSdUpscale, ...baseQueryRaw } = query as IImg2ImgQuery;

  const baseQuery = { ...defaultQuery, ...baseQueryRaw } as IBaseQuery;

  let script = false;

  if (controlNet) {
    baseQuery.alwayson_scripts['controlnet'] = controlNet;
  }

  if (adetailer) {
    baseQuery.alwayson_scripts['ADetailer'] = { args: adetailer };
  }

  if (cutOff) {
    baseQuery.alwayson_scripts['Cutoff'] = { args: [true, ...cutOff.tokens, cutOff.weight ?? 1] };
  }

  if (!script && ultimateSdUpscale && type === 'img2img') {
    script = true;
    baseQuery.script_name = 'Ultimate SD upscale';
    baseQuery.script_args = [
      null, // _ (not used)
      ultimateSdUpscale.tileWidth ?? 512, // tile_width
      ultimateSdUpscale.tileHeight ?? 512, // tile_height
      8, // mask_blur
      32, // padding
      64, // seams_fix_width
      0.35, // seams_fix_denoise
      32, // seams_fix_padding
      10, // upscaler_index
      true, // save_upscaled_image a.k.a Upscaled
      RedrawMode.None, // redraw_mode
      false, // save_seams_fix_image a.k.a Seams fix
      8, // seams_fix_mask_blur
      0, // seams_fix_type
      TargetSizeType.CustomSize, // target_size_type
      ultimateSdUpscale.width, // custom_width
      ultimateSdUpscale.height, // custom_height
      ultimateSdUpscale.scale // custom_scale
    ];
  }

  const endpoint = useScheduler ? `agent-scheduler/v1/queue/${type}` : `api/${type}/`;
  //override_settings_restore_afterwards
  logger(`Executing query to ${endpoint}`);
  // console.log(JSON.stringify(baseQuery, null, 2));

  await axios.post(`http://127.0.0.1:7860/${endpoint}`, baseQuery, headerRequest).catch((error) => {
    logger(`Error: `);
    logger(error.message);
  });
};

interface IInterrogateResponse {
  prompt: string;
}

const interrogatorCache: Record<string, IInterrogateResponse> = {};

export const interrogateQuery = async (imagePath: string): Promise<IInterrogateResponse | void> => {
  if (interrogatorCache[imagePath]) {
    return interrogatorCache[imagePath];
  }

  logger(`Executing query to interrogator for ${imagePath}`);
  const base64Image = getBase64Image(imagePath);

  const query = {
    clip_model_name: 'ViT-L-14/openai',
    image: base64Image,
    mode: 'fast'
  };

  const response = await axios
    .post<IInterrogateResponse>(`http://127.0.0.1:7860/interrogator/prompt`, query, headerRequest)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      logger(`Error: `);
      logger(error.message);
    });

  if (response) {
    interrogatorCache[imagePath] = response;
  }

  return response;
};
