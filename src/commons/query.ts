import axios from 'axios';

import { getBase64Image } from './file';
import { IBaseQuery, IImg2ImgQuery, ITxt2ImgQuery, RedrawMode, TargetSizeType, Upscaler } from './types';

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
  sampler_name: 'DPM++ 2M Karras',
  save_images: true,
  seed: -1,
  steps: 20,
  styles: [],
  width: 512
};

type Txt2ImgQuery = (query: ITxt2ImgQuery, type: 'txt2img', useScheduler?: boolean) => Promise<void>;
type Img2ImgQuery = (query: IImg2ImgQuery, type: 'img2img', useScheduler?: boolean) => Promise<void>;

type Query = Txt2ImgQuery & Img2ImgQuery;

export const renderQuery: Query = async (query, type, useScheduler) => {
  const { controlNet, ultimateSdUpscale, ...baseQueryRaw } = query as IImg2ImgQuery;

  const baseQuery = { ...defaultQuery, ...baseQueryRaw } as IBaseQuery;

  let script = false;

  if (controlNet) {
    baseQuery.alwayson_scripts['controlnet'] = controlNet;
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
      2 // custom_scale
    ];
  }

  const endpoint = useScheduler ? `agent-scheduler/v1/queue/${type}` : `api/${type}/`;
  //override_settings_restore_afterwards
  console.log(`Executing query to ${endpoint}`);
  const { init_images: _init_images, ...exported } = baseQuery as unknown as IImg2ImgQuery;
  console.log(`Parameters:`, exported);
  await axios.post(`http://127.0.0.1:7860/${endpoint}`, baseQuery, headerRequest).catch((error) => {
    console.log(`Error: `);
    console.log(error);
  });
};

interface IInterrogateResponse {
  prompt: string;
}

export const interrogateQuery = async (imagePath: string): Promise<IInterrogateResponse | void> => {
  const base64Image = getBase64Image(imagePath);

  const query = {
    clip_model_name: 'ViT-L-14/openai',
    image: base64Image,
    mode: 'fast'
  };

  return await axios
    .post<IInterrogateResponse>(`http://127.0.0.1:7860/interrogator/prompt`, query, headerRequest)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(`Error: `);
      console.log(error);
    });
};
