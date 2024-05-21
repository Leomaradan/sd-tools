import axios from 'axios';
import fs from 'node:fs';

import { Cache, Config } from './config';
import { getDefaultQuery } from './defaultQuery';
import { type ITiledVAE, defaultTiledDiffusionOptions, defaultTiledVAEnOptions } from './extensions/multidiffusionUpscaler';
import { getBase64Image } from './file';
import { ExitCodes, logger, writeLog } from './logger';
import { findCheckpoint, findUpscaler, findUpscalerUltimateSDUpscaler } from './models';
import {
  type IBaseQuery,
  type IImg2ImgQuery,
  type IInterrogateResponse,
  type IModel,
  type ITxt2ImgQuery,
  RedrawMode,
  TargetSizeType
} from './types';

const headerRequest = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

type Txt2ImgQuery = (query: ITxt2ImgQuery, type: 'txt2img') => Promise<void>;
type Img2ImgQuery = (query: IImg2ImgQuery, type: 'img2img') => Promise<void>;

type Query = Txt2ImgQuery & Img2ImgQuery;

export const isTxt2ImgQuery = (query: IBaseQuery | IImg2ImgQuery | ITxt2ImgQuery): query is ITxt2ImgQuery => {
  return (query as unknown as IImg2ImgQuery).init_images === undefined;
};

export const isImg2ImgQuery = (query: IBaseQuery | IImg2ImgQuery | ITxt2ImgQuery): query is IImg2ImgQuery => {
  return (query as unknown as IImg2ImgQuery).init_images !== undefined;
};

export const renderQuery: Query = async (query, type) => {
  const { adetailer, controlNet, cutOff, lcm, tiledDiffusion, tiledVAE, ultimateSdUpscale, ...baseQueryRaw } = query as IImg2ImgQuery;

  const checkpoint = baseQueryRaw.override_settings.sd_model_checkpoint
    ? findCheckpoint(baseQueryRaw.override_settings.sd_model_checkpoint)
    : ({ version: 'unknown' } as IModel);

  /*const baseQuery = {
    ...getDefaultQuery(checkpoint?.version ?? 'unknown', checkpoint?.accelarator ?? 'none'),
    ...baseQueryRaw
  } as IBaseQuery & { forcedSampler?: string };*/

  const baseQuery = getDefaultQuery(checkpoint?.version ?? 'unknown', checkpoint?.accelarator ?? 'none') as IBaseQuery & {
    forcedSampler?: string;
  };

  Object.keys(baseQueryRaw).forEach((key) => {
    const value = baseQueryRaw[key as keyof typeof baseQueryRaw];

    if (value !== undefined) {
      if (typeof value === 'object') {
        if (baseQuery[key as keyof typeof baseQuery] === undefined) {
          (baseQuery as unknown as Record<string, unknown>)[key] = {};
        }

        Object.keys(value).forEach((subKey) => {
          const subValue = value[subKey as keyof typeof value];
          if (subValue !== undefined) {
            (baseQuery as unknown as Record<string, Record<string, unknown>>)[key][subKey] = subValue;
          }
        });
      } else {
        (baseQuery as unknown as Record<string, unknown>)[key] = value;
      }
    }
  });

  if (baseQuery.forcedSampler && baseQuery.sampler_name !== baseQuery.forcedSampler) {
    logger(`Invalid sampler for this model (must be ${baseQuery.forcedSampler})`);
    process.exit(ExitCodes.QUERY_INVALID_SAMPLER);
  }

  let script = false;

  const isSDXL = checkpoint?.version === 'sdxl';

  const defaultUpscaler = findUpscaler('4x-UltraSharp', 'R-ESRGAN 4x+', 'Latent (nearest-exact)');

  if (
    isTxt2ImgQuery(baseQuery) &&
    ((baseQuery as ITxt2ImgQuery).hr_upscaler ||
      (baseQuery as ITxt2ImgQuery).hr_scale ||
      (baseQuery as ITxt2ImgQuery).enable_hr ||
      (baseQuery as ITxt2ImgQuery).hr_negative_prompt ||
      (baseQuery as ITxt2ImgQuery).hr_prompt)
  ) {
    (baseQuery as ITxt2ImgQuery).enable_hr = true;
    (baseQuery as ITxt2ImgQuery).hr_upscaler = (baseQuery as ITxt2ImgQuery).hr_upscaler ?? (defaultUpscaler?.name as string);
    (baseQuery as ITxt2ImgQuery).hr_scale = (baseQuery as ITxt2ImgQuery).hr_scale ?? 2;
    (baseQuery as ITxt2ImgQuery).hr_negative_prompt = (baseQuery as ITxt2ImgQuery).hr_negative_prompt ?? '';
    (baseQuery as ITxt2ImgQuery).hr_prompt = (baseQuery as ITxt2ImgQuery).hr_prompt ?? '';
  }

  if (controlNet) {
    const args = controlNet.map((controlNet) => {
      const params = { ...controlNet };

      if (params.lowvram === undefined) {
        params.lowvram = true;
      }

      if (params.pixel_perfect === undefined) {
        params.pixel_perfect = true;
      }

      return params;
    });

    baseQuery.alwayson_scripts['controlnet'] = { args };
  }

  if (adetailer) {
    baseQuery.alwayson_scripts['ADetailer'] = { args: adetailer };
  }

  if (Config.get('autoTiledVAE') || tiledVAE) {
    const tiledVAEConfig = { ...defaultTiledVAEnOptions, ...(Config.get('autoTiledVAE') ? {} : tiledVAE) } as Required<ITiledVAE>;

    if (isSDXL) {
      // Fast decoder is not supported in SDXL
      tiledVAEConfig.fastDecoder = false;
    }

    baseQuery.alwayson_scripts['Tiled VAE'] = {
      args: [
        'True',
        tiledVAEConfig.encoderTileSize,
        tiledVAEConfig.decoderTileSize,
        tiledVAEConfig.vaeToGPU,
        tiledVAEConfig.fastDecoder,
        tiledVAEConfig.fastEncoder,
        tiledVAEConfig.colorFix
      ]
    };
  }

  // TiledDiffusion cannot be use with SDXL
  if (Config.get('autoTiledDiffusion') !== false && isSDXL === false) {
    baseQuery.alwayson_scripts['Tiled Diffusion'] = { args: ['True', Config.get('autoTiledDiffusion')] };
  }

  // TiledDiffusion cannot be use with SDXL
  if (tiledDiffusion && isSDXL === false) {
    baseQuery.alwayson_scripts['Tiled Diffusion'] = {
      args: [
        true,
        tiledDiffusion.method,
        true,
        false,
        baseQuery.width ?? 1024,
        baseQuery.height ?? 1024,
        tiledDiffusion.tileWidth ?? defaultTiledDiffusionOptions.tileWidth,
        tiledDiffusion.tileHeight ?? defaultTiledDiffusionOptions.tileHeight,
        tiledDiffusion.tileOverlap ?? defaultTiledDiffusionOptions.tileOverlap,
        tiledDiffusion.tileBatchSize ?? defaultTiledDiffusionOptions.tileBatchSize,
        defaultUpscaler?.name as string,
        tiledDiffusion.scaleFactor ?? defaultTiledDiffusionOptions.scaleFactor
      ]
    };
  }

  const autoCutOff = Config.get('cutoff');
  if (cutOff || autoCutOff) {
    const tokens = Array.from(new Set([...(cutOff?.tokens ?? []), ...(autoCutOff ? Array.from(Config.get('cutoffTokens')) : [])]));
    const weight = cutOff?.weight ?? Config.get('cutoffWeight');
    baseQuery.alwayson_scripts['Cutoff'] = { args: [true, ...tokens, weight] };
  }

  const { auto: autoLcm, sd15: lcm15, sdxl: lcmXL } = Config.get('lcm');
  const accelarator = checkpoint?.accelarator ?? 'none';
  const addLCM = (lcm ?? accelarator === 'lcm') || autoLcm;
  if (addLCM) {
    const lcmModel = isSDXL ? lcmXL : lcm15;
    if (lcmModel) {
      const defaultValues = getDefaultQuery(isSDXL ? 'sdxl' : 'sd15', 'lcm');

      baseQuery.prompt = `<lora:${lcmModel}:1> ${baseQuery.prompt}`;
      baseQuery.cfg_scale = defaultValues.cfg_scale;
      baseQuery.steps = defaultValues.steps;
      baseQuery.sampler_name = defaultValues.sampler_name;
    }
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
      findUpscalerUltimateSDUpscaler('4x-UltraSharp', 'R-ESRGAN 4x+', 'Nearest')?.index ?? 0, // 10, // upscaler_index
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

  const useScheduler = Config.get('scheduler');
  const endpoint = useScheduler ? `agent-scheduler/v1/queue/${type}` : `sdapi/v1/${type}/`;
  logger(`Executing query to ${Config.get('endpoint')}/${endpoint}${useScheduler ? '' : '. This may take some time!'}`);

  writeLog(endpoint, baseQuery);

  await axios.post(`${Config.get('endpoint')}/${endpoint}`, baseQuery, headerRequest).catch((error) => {
    logger(`Error: `);
    logger(error.message);
  });
};

export const interrogateQuery = async (imagePath: string): Promise<IInterrogateResponse | void> => {
  const interrogatorCache = Cache.get('interrogator');

  if (interrogatorCache[imagePath]) {
    if (interrogatorCache[imagePath].timestamp === fs.statSync(imagePath).mtimeMs.toString()) {
      return interrogatorCache[imagePath];
    }

    delete interrogatorCache[imagePath];
  }

  logger(`Executing query to interrogator for ${imagePath}`);
  const base64Image = getBase64Image(imagePath);

  const query = {
    clip_model_name: 'ViT-L-14/openai',
    image: base64Image,
    mode: 'fast'
  };

  const response = await axios
    .post<IInterrogateResponse>(`${Config.get('endpoint')}/interrogator/prompt`, query, headerRequest)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      logger(`Error: `);
      logger(error.message);
    });

  if (response) {
    interrogatorCache[imagePath] = {
      ...response,
      timestamp: fs.statSync(imagePath).mtimeMs.toString()
    };
  }

  return response;
};

type MiscQueryApi =
  | 'adetailer/v1/ad_model'
  | 'agent-scheduler/v1/history?limit=1'
  | 'controlnet/model_list'
  | 'controlnet/module_list'
  | 'sdapi/v1/embeddings'
  | 'sdapi/v1/loras'
  | 'sdapi/v1/prompt-styles'
  | 'sdapi/v1/samplers'
  | 'sdapi/v1/scripts'
  | 'sdapi/v1/sd-models'
  | 'sdapi/v1/sd-vae'
  | 'sdapi/v1/upscalers';

const miscQuery = async <Response>(api: MiscQueryApi): Promise<Response | void> => {
  logger(`Executing misc query ${api}`);

  return await axios
    .get(`${Config.get('endpoint')}/${api}`, headerRequest)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      logger(`Error: `);
      logger(error.message);
    });
};

export const getModelsQuery = () => miscQuery<{ filename: string; model_name: string; title: string }[]>('sdapi/v1/sd-models');
export const getVAEQuery = () => miscQuery<{ model_name: string }[]>('sdapi/v1/sd-vae');
export const getSamplersQuery = () => miscQuery<{ aliases: string[]; name: string }[]>('sdapi/v1/samplers');
export const getUpscalersQuery = () => miscQuery<{ model_path: null | string; name: string }[]>('sdapi/v1/upscalers');
export const getExtensionsQuery = () => miscQuery<{ img2img: string[] }>('sdapi/v1/scripts');
export const getSchedulerQuery = () => miscQuery<{ tasks: string[] }>('agent-scheduler/v1/history?limit=1');
export const getLORAsQuery = () => miscQuery<{ alias: string; name: string; path: string }[]>('sdapi/v1/loras');
export const getEmbeddingsQuery = () =>
  miscQuery<{ loaded: Record<string, unknown>; skipped: Record<string, unknown> }>('sdapi/v1/embeddings');
export const getStylesQuery = () => miscQuery<{ name: string; negative_prompt: string; prompt: string }[]>('sdapi/v1/prompt-styles');
export const getAdModelQuery = () => miscQuery<{ ad_model: string[] }>('adetailer/v1/ad_model');

export const getControlnetModelsQuery = () => miscQuery<{ model_list: string[] }>('controlnet/model_list');
export const getControlnetModulesQuery = () => miscQuery<{ module_list: string[] }>('controlnet/module_list');
