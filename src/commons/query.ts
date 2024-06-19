import axios from 'axios';
import { statSync } from 'node:fs';

import type { IAdetailer } from './extensions/adetailer';
import type { ICutOff } from './extensions/cutoff';

import { Cache, Config } from './config';
import { baseParamsAll } from './defaultQuery';
import { type IControlNet, type IControlNetQuery, normalizeControlNetMode, normalizeControlNetResizes } from './extensions/controlNet';
import {
  type ITiledDiffusion,
  type ITiledVAE,
  defaultTiledDiffusionOptions,
  defaultTiledVAEnOptions
} from './extensions/multidiffusionUpscaler';
import { type IUltimateSDUpscale, RedrawMode, TargetSizeType } from './extensions/ultimateSdUpscale';
import { getBase64Image } from './file';
import { loggerInfo, loggerVerbose, mode, writeLog } from './logger';
import { findCheckpoint, findUpscaler, findUpscalerUltimateSDUpscaler } from './models';
import {
  AlwaysOnScriptsNames,
  type IBaseQuery,
  type IImg2ImgQuery,
  type IInterrogateResponse,
  type IModel,
  type ITxt2ImgQuery,
  type IUpscaler
} from './types';

const headerRequest = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

type Txt2ImgQuery = (query: ITxt2ImgQuery, type: 'txt2img') => Promise<void>;
type Img2ImgQuery = (query: IImg2ImgQuery, type: 'img2img') => Promise<void>;

type Query = Img2ImgQuery & Txt2ImgQuery;

export const isTxt2ImgQuery = (query: IBaseQuery | IImg2ImgQuery | ITxt2ImgQuery): query is ITxt2ImgQuery => {
  return (query as unknown as IImg2ImgQuery).init_images === undefined;
};

export const isImg2ImgQuery = (query: IBaseQuery | IImg2ImgQuery | ITxt2ImgQuery): query is IImg2ImgQuery => {
  return (query as unknown as IImg2ImgQuery).init_images !== undefined;
};

const prepareBaseQuery = (baseQuery: Partial<IBaseQuery>, baseQueryRaw: IImg2ImgQuery) => {
  const updatedQuery = { ...baseQuery };

  Object.keys(baseQueryRaw).forEach((key) => {
    const value = baseQueryRaw[key as keyof typeof baseQueryRaw];

    if (value !== undefined) {
      if (typeof value === 'object') {
        if (updatedQuery[key as keyof typeof updatedQuery] === undefined) {
          (updatedQuery as unknown as Record<string, unknown>)[key] = {};
        }

        Object.keys(value).forEach((subKey) => {
          const subValue = value[subKey as keyof typeof value];
          if (subValue !== undefined) {
            (updatedQuery as unknown as Record<string, Record<string, unknown>>)[key][subKey] = subValue;
          }
        });
      } else {
        (updatedQuery as unknown as Record<string, unknown>)[key] = value;
      }
    }
  });

  return updatedQuery;
};

const prepareControlNet = (baseQuery: IBaseQuery, controlNet: IControlNet[] | undefined) => {
  const updatedQuery = { ...baseQuery };
  if (controlNet) {
    const args = controlNet.map((controlNet) => {
      const params: IControlNetQuery = {
        control_mode: normalizeControlNetMode(controlNet.control_mode),
        enabled: true,
        input_image: controlNet.input_image,
        lowvram: controlNet.lowvram,
        model: controlNet.model,
        module: controlNet.module,
        pixel_perfect: controlNet.pixel_perfect,
        resize_mode: normalizeControlNetResizes(controlNet.resize_mode)
      };

      if (params.lowvram === undefined) {
        params.lowvram = true;
      }

      if (params.pixel_perfect === undefined) {
        params.pixel_perfect = true;
      }

      return params;
    });

    updatedQuery.alwayson_scripts[AlwaysOnScriptsNames.ControlNet] = { args };
  }
  return updatedQuery;
};

const prepareAdetailer = (baseQuery: IBaseQuery, adetailer: IAdetailer[] | undefined) => {
  const updatedQuery = { ...baseQuery };
  if (adetailer) {
    updatedQuery.alwayson_scripts[AlwaysOnScriptsNames.ADetailer] = { args: adetailer };
  }

  return updatedQuery;
};

const prepareTiledVAE = (baseQuery: IBaseQuery, tiledVAE: ITiledVAE | undefined, isSDXL: boolean) => {
  const updatedQuery = { ...baseQuery };

  if (Config.get('autoTiledVAE') || (tiledVAE && Object.keys(tiledVAE).length > 0)) {
    const tiledVAEConfig = { ...defaultTiledVAEnOptions, ...(Config.get('autoTiledVAE') ? {} : tiledVAE) } as Required<ITiledVAE>;

    if (isSDXL) {
      // Fast decoder is not supported in SDXL
      tiledVAEConfig.fastDecoder = false;
    }

    updatedQuery.alwayson_scripts[AlwaysOnScriptsNames.TiledVAE] = {
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
  return updatedQuery;
};

const prepareTiledDiffusion = (
  baseQuery: IBaseQuery,
  tiledDiffusion: ITiledDiffusion | undefined,
  defaultUpscaler: IUpscaler | undefined,
  isSDXL: boolean
) => {
  const updatedQuery = { ...baseQuery };

  if (isSDXL === false) {
    if (tiledDiffusion) {
      updatedQuery.alwayson_scripts[AlwaysOnScriptsNames.TiledDiffusion] = {
        args: [
          true,
          tiledDiffusion.method,
          true,
          false,
          updatedQuery.width ?? 1024,
          updatedQuery.height ?? 1024,
          tiledDiffusion.tileWidth ?? defaultTiledDiffusionOptions.tileWidth,
          tiledDiffusion.tileHeight ?? defaultTiledDiffusionOptions.tileHeight,
          tiledDiffusion.tileOverlap ?? defaultTiledDiffusionOptions.tileOverlap,
          tiledDiffusion.tileBatchSize ?? defaultTiledDiffusionOptions.tileBatchSize,
          defaultUpscaler?.name as string,
          tiledDiffusion.scaleFactor ?? defaultTiledDiffusionOptions.scaleFactor
        ]
      };
    } else if (Config.get('autoTiledDiffusion') !== false) {
      updatedQuery.alwayson_scripts[AlwaysOnScriptsNames.TiledDiffusion] = { args: ['True', Config.get('autoTiledDiffusion')] };
    }
  }
  // Ensure that Tiled Diffusion is not used with SDXL
  else if (updatedQuery.alwayson_scripts[AlwaysOnScriptsNames.TiledDiffusion]) {
    delete updatedQuery.alwayson_scripts[AlwaysOnScriptsNames.TiledDiffusion];
  }

  return updatedQuery;
};

const prepareCutOff = (baseQuery: IBaseQuery, cutOff: ICutOff | undefined) => {
  const updatedQuery = { ...baseQuery };

  const autoCutOff = Config.get('cutoff');
  if (autoCutOff || (cutOff && Object.keys(cutOff).length > 0)) {
    const tokens = Array.from(new Set([...(cutOff?.tokens ?? []), ...(autoCutOff ? Array.from(Config.get('cutoffTokens')) : [])]));
    const weight = cutOff?.weight ?? Config.get('cutoffWeight');
    updatedQuery.alwayson_scripts[AlwaysOnScriptsNames.Cutoff] = { args: [true, tokens.join(', '), weight, false, false, '', 'Lerp'] };
  }

  return updatedQuery;
};

const prepareScriptUltimateSDUpscale = (
  script: boolean,
  baseQuery: IBaseQuery,
  ultimateSdUpscale: IUltimateSDUpscale | undefined,
  type: 'img2img' | 'txt2img'
): [boolean, IBaseQuery] => {
  const updatedQuery = { ...baseQuery };

  if (!script && ultimateSdUpscale && type === 'img2img') {
    script = true;
    updatedQuery.script_name = 'Ultimate SD upscale';
    updatedQuery.script_args = [
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

  return [script, updatedQuery];
};

export const prepareRenderQuery = (query: IImg2ImgQuery | ITxt2ImgQuery, type: 'img2img' | 'txt2img') => {
  const { adetailer, controlNet, cutOff, tiledDiffusion, tiledVAE, ultimateSdUpscale, ...baseQueryRaw } = query as IImg2ImgQuery;

  const checkpoint = baseQueryRaw.override_settings.sd_model_checkpoint
    ? findCheckpoint(baseQueryRaw.override_settings.sd_model_checkpoint)
    : ({ version: 'unknown' } as IModel);

  // The following code mutate the baseQuery, so subsequent calls must carry unwanted config
  let baseQuery = JSON.parse(
    JSON.stringify({
      ...baseParamsAll()
    })
  );

  baseQuery = prepareBaseQuery(baseQuery, baseQueryRaw as IImg2ImgQuery);

  let script = false;

  const isSDXL = checkpoint?.version === 'sdxl';

  const defaultUpscaler = findUpscaler('4x-UltraSharp', 'R-ESRGAN 4x+', 'Latent (nearest-exact)');

  if (
    isTxt2ImgQuery(baseQuery) &&
    (baseQuery.hr_upscaler || baseQuery.hr_scale || baseQuery.enable_hr || baseQuery.hr_negative_prompt || baseQuery.hr_prompt)
  ) {
    baseQuery.enable_hr = true;
    baseQuery.hr_upscaler = baseQuery.hr_upscaler ?? (defaultUpscaler?.name as string);
    baseQuery.hr_scale = baseQuery.hr_scale ?? 2;
    baseQuery.hr_negative_prompt = baseQuery.hr_negative_prompt ?? '';
    baseQuery.hr_prompt = baseQuery.hr_prompt ?? '';
  }

  baseQuery = prepareControlNet(baseQuery, controlNet);
  baseQuery = prepareAdetailer(baseQuery, adetailer);
  baseQuery = prepareTiledVAE(baseQuery, tiledVAE, isSDXL);
  baseQuery = prepareTiledDiffusion(baseQuery, tiledDiffusion, defaultUpscaler, isSDXL);
  baseQuery = prepareCutOff(baseQuery, cutOff);

  [script, baseQuery] = prepareScriptUltimateSDUpscale(script, baseQuery, ultimateSdUpscale, type);

  // Remove artifacts from the temporary query
  delete (baseQuery as ITxt2ImgQuery).adetailer;
  delete (baseQuery as ITxt2ImgQuery).controlNet;
  delete (baseQuery as ITxt2ImgQuery).enable_hr;
  delete (baseQuery as ITxt2ImgQuery).cutOff;
  delete (baseQuery as ITxt2ImgQuery).tiledDiffusion;
  delete (baseQuery as ITxt2ImgQuery).tiledVAE;

  return baseQuery;
};

export const renderQuery: Query = async (query, type) => {
  const useScheduler = Config.get('scheduler');

  const endpoint = useScheduler ? `agent-scheduler/v1/queue/${type}` : `sdapi/v1/${type}/`;
  loggerVerbose(`Executing query to ${Config.get('endpoint')}/${endpoint}${useScheduler ? '' : '. This may take some time!'}`);

  const baseQuery = prepareRenderQuery(query, type);

  writeLog({ baseQuery, endpoint });

  if (!mode.simulate) {
    await axios.post(`${Config.get('endpoint')}/${endpoint}`, baseQuery, headerRequest).catch((error) => {
      loggerInfo(`Error: `);
      loggerInfo(error.message);
    });
  }
};

export const interrogateQuery = async (imagePath: string): Promise<IInterrogateResponse | void> => {
  const interrogatorCache = Cache.get('interrogator');

  if (interrogatorCache[imagePath]) {
    if (interrogatorCache[imagePath].timestamp === statSync(imagePath).mtimeMs.toString()) {
      return interrogatorCache[imagePath];
    }

    delete interrogatorCache[imagePath];
  }

  loggerVerbose(`Executing query to interrogator for ${imagePath}`);
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
      loggerInfo(`Error: `);
      loggerInfo(error.message);
    });

  if (response) {
    interrogatorCache[imagePath] = {
      ...response,
      timestamp: statSync(imagePath).mtimeMs.toString()
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
  loggerVerbose(`Executing misc query ${api}`);

  return await axios
    .get(`${Config.get('endpoint')}/${api}`, headerRequest)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      loggerInfo(`Error: `);
      loggerInfo(error.message);
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
