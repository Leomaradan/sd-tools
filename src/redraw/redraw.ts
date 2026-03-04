import { existsSync } from 'node:fs';
import { basename } from 'node:path';

import { Config } from '../commons/config';
import { ControlNetMode, ControlNetResizes, type IControlNet } from '../commons/extensions/controlNet';
import { getFiles, type IFile } from '../commons/file';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { findControlnetModel, findControlnetModule, findSampler } from '../commons/models';
import { prompts } from '../commons/prompts';
import { interrogateQuery } from '../commons/query';
import { type IClassicPrompt, IRedrawMethod, type IRedrawOptions, IRedrawStyle } from '../commons/types';

const INTERROGATE_MODEL_LAION = 'ViT-H-14/laion2b_s32b_b79k';
const INTERROGATE_MODEL_OPENAI = 'ViT-L-14/openai';

const prepareQueryData = (baseParamsProps: IClassicPrompt & { sdxl: boolean }, file: IFile) => {
  const baseParams = { ...baseParamsProps };
  const [basePrompt, negativePromptRaw, otherParams] = file.data;

  const negativePrompt = negativePromptRaw.replace('Negative prompt: ', '');

  const stepsTest = /Steps: (\d+),/.exec(otherParams);
  const samplerTest = /Sampler: ([a-z0-9 +]+), /i.exec(otherParams);
  const cfgTest = /CFG scale: ([0-9.]+), /i.exec(otherParams);
  const seedTest = /Seed: (\d+),/i.exec(otherParams);
  const sizesTest = /Size: (\d+)x(\d+),/i.exec(otherParams);

  const steps = stepsTest ? Number(stepsTest[1]) : undefined;
  const sampler = samplerTest ? samplerTest[1] : undefined;
  const cfg = cfgTest ? Number(cfgTest[1]) : undefined;
  const seed = seedTest ? Number(seedTest[1]) : undefined;

  const promptWidth = sizesTest ? Number(sizesTest[1]) : undefined;
  const promptHeight = sizesTest ? Number(sizesTest[2]) : undefined;

  baseParams.prompt += basePrompt;

  if (negativePrompt !== undefined && negativePrompt !== '') {
    baseParams.negativePrompt += negativePrompt;
  }

  if (steps !== undefined) {
    baseParams.steps = steps;
  }

  if (sampler !== undefined) {
    const foundSampler = findSampler(sampler);
    baseParams.sampler = foundSampler?.name;
  }

  if (cfg !== undefined) {
    baseParams.cfg = cfg;
  }

  if (seed !== undefined) {
    baseParams.seed = seed;
  }

  if (promptWidth !== undefined) {
    baseParams.width = promptWidth;
  }

  if (promptHeight !== undefined) {
    baseParams.height = promptHeight;
  }

  return baseParams;
};

const getModelCheckpoint = (style: IRedrawStyle, sdxl?: boolean) => {
  const redrawModels = Config.get('redrawModels');
  let sd_model_checkpoint = redrawModels.realist15;

  if (style === IRedrawStyle.Anime) {
    if (sdxl) {
      sd_model_checkpoint = redrawModels.animexl;
    } else {
      sd_model_checkpoint = redrawModels.anime15;
    }
  } else if (style === IRedrawStyle.PixelArt) {
    if (sdxl) {
      sd_model_checkpoint = redrawModels.pixelxl;
    } else {
      sd_model_checkpoint = redrawModels.pixel15;
    }
  } else if (sdxl) {
    sd_model_checkpoint = redrawModels.realistxl;
  }

  return sd_model_checkpoint;
};

const getControlNetLineart = (sdxl: boolean, style: IRedrawStyle, weight = 1): IControlNet | undefined => {
  let controlnetModelName: string[] = [];

  let controlnetModule = findControlnetModule('lineart_realistic', 'lineart');
  if (style === 'anime') {
    controlnetModule = findControlnetModule('lineart_anime', 'lineart');
  }
  if (sdxl) {
    controlnetModule = findControlnetModule('canny');
  }

  if (sdxl) {
    controlnetModelName = ['control-lora-canny-rank256'];
  } else if (style === 'anime') {
    controlnetModelName = ['control_v11p_sd15s2_lineart_anime', 'control_v11p_sd15_lineart'];
  } else {
    controlnetModelName = ['control_v11p_sd15_lineart'];
  }

  const controlnetModel = findControlnetModel(...controlnetModelName)?.name;

  if (controlnetModel !== undefined && controlnetModule !== undefined) {
    return {
      control_mode: ControlNetMode.ControleNetImportant,
      model: controlnetModel,
      module: controlnetModule,
      resize_mode: ControlNetResizes.Resize,
      weight
    };
  }
};

const getControlNetOpenPose = (sdxl: boolean, style: IRedrawStyle, input_image?: IFile, weight = 1): IControlNet | undefined => {
  let controlnetModelName: string[] = [];

  if (sdxl) {
    controlnetModelName = [
      't2i-adapter_diffusers_xl_openpose',
      't2i-adapter_xl_openpose',
      'thibaud_xl_openpose',
      'thibaud_xl_openpose_256lora'
    ];
    if (style === 'anime') {
      controlnetModelName = ['kohya_controllllite_xl_openpose_anime', 'kohya_controllllite_xl_openpose_anime_v2', ...controlnetModelName];
    }
  } else {
    controlnetModelName = ['control_v11p_sd15_openpose'];
  }

  const controlnetModel = findControlnetModel(...controlnetModelName)?.name;
  const controlnetModule = sdxl ? findControlnetModule('dw_openpose_full') : findControlnetModule('openpose_full', 'openpose');

  if (controlnetModel !== undefined && controlnetModule !== undefined) {
    return {
      control_mode: ControlNetMode.PromptImportant,
      image: input_image?.filename,
      model: controlnetModel,
      module: controlnetModule,
      resize_mode: ControlNetResizes.Resize,
      weight
    };
  }
};

const getControlNetIPAdapter = (sdxl: boolean, input_image: IFile, weight = 1): IControlNet | undefined => {
  let controlnetModelName: string[] = [];

  if (sdxl) {
    controlnetModelName = ['ip-adapter_xl'];
  } else {
    controlnetModelName = ['ip-adapter_sd15_plus', 'ip-adapter_sd15'];
  }

  const controlnetModel = findControlnetModel(...controlnetModelName)?.name;
  const controlnetModule = sdxl
    ? findControlnetModule('ip-adapter_clip_sdxl_plus_vith', 'adapter_clip_sdxl')
    : findControlnetModule('ip-adapter_clip_sd15');

  if (controlnetModel !== undefined && controlnetModule !== undefined) {
    return {
      control_mode: ControlNetMode.ControleNetImportant,
      image: input_image.filename,
      model: controlnetModel,
      module: controlnetModule,
      resize_mode: ControlNetResizes.Resize,
      weight
    };
  }
};

const prepareQueryClassicalBase = (
  file: IFile,
  style: IRedrawStyle,
  method: IRedrawMethod,
  denoising_strength: number | number[],
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let { height, width } = file;

  if (width === -1 || height === -1) {
    width = 512;
    height = 512;
  }

  const sd_model_checkpoint = getModelCheckpoint(style, sdxl);

  const stylesArray = [];

  if (style === IRedrawStyle.Anime) {
    stylesArray.push('Anime (SDXL)');
  }

  if (style === IRedrawStyle.PixelArt && !sdxl) {
    stylesArray.push('Pixel Art');
  }

  const baseParams: IClassicPrompt & { sdxl: boolean } = {
    checkpoints: sd_model_checkpoint,
    controlNet: [],
    denoising: denoising_strength,
    enableHighRes: true,
    filename: basename(file.file).replace('.png', '').replace('.jpg', '').replace('.jpeg', ''),
    height,
    initImageOrFolder: file.filename,
    negativePrompt: sdxl ? Config.get('commonNegativeXL') : Config.get('commonNegative'),
    pattern: `[datetime]-{denoising}-${style}-${method}-{filename}`,
    prompt: addToPrompt ? `${addToPrompt}, ` : '',
    restoreFaces: false,
    sdxl: !!sdxl,
    styles: stylesArray,
    width
  };

  return baseParams;
};

const prepareQueryDenoise = async (
  file: IFile,
  style: IRedrawStyle,
  denoising_strength: number | number[],
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let baseParams = prepareQueryClassicalBase(file, style, IRedrawMethod.Denoise, denoising_strength, addToPrompt, sdxl);

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename, [sdxl ? INTERROGATE_MODEL_LAION : INTERROGATE_MODEL_OPENAI]);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return baseParams;
  }
};

const prepareQueryLineart = async (
  file: IFile,
  style: IRedrawStyle,
  denoising_strength: number | number[],
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let baseParams = prepareQueryClassicalBase(file, style, IRedrawMethod.Lineart, denoising_strength, addToPrompt, sdxl);

  const controlNet = getControlNetLineart(sdxl ?? false, style);

  if (controlNet) {
    (baseParams.controlNet as IControlNet[]).push(controlNet);
  } else {
    loggerInfo(`Controlnet models for lineart not found`);
    process.exit(ExitCodes.REDRAW_LINEART_MODEL_NOT_FOUND);
  }

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename, [sdxl ? INTERROGATE_MODEL_LAION : INTERROGATE_MODEL_OPENAI]);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return baseParams;
  }
};

const prepareQueryOpenpose = async (
  file: IFile,
  style: IRedrawStyle,
  denoising_strength: number | number[],
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let baseParams = prepareQueryClassicalBase(file, style, IRedrawMethod.Openpose, denoising_strength, addToPrompt, sdxl);

  const controlNet = getControlNetOpenPose(sdxl ?? false, style);

  if (controlNet) {
    (baseParams.controlNet as IControlNet[]).push(controlNet);
  } else {
    loggerInfo(`OpenPose models for openpose not found`);
    process.exit(ExitCodes.REDRAW_LINEART_MODEL_NOT_FOUND);
  }

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename, [sdxl ? INTERROGATE_MODEL_LAION : INTERROGATE_MODEL_OPENAI]);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return baseParams;
  }
};

const prepareQueryLineAndPose = async (
  file: IFile,
  style: IRedrawStyle,
  denoising_strength: number | number[],
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let baseParams = prepareQueryClassicalBase(file, style, IRedrawMethod.LinePose, denoising_strength, addToPrompt, sdxl);

  const controlNet1 = getControlNetLineart(sdxl ?? false, style, 0.5);
  const controlNet2 = getControlNetOpenPose(sdxl ?? false, style, undefined, 0.5);

  if (controlNet1) {
    (baseParams.controlNet as IControlNet[]).push(controlNet1);
  } else {
    loggerInfo(`Controlnet models for lineart not found`);
    process.exit(ExitCodes.REDRAW_LINEART_MODEL_NOT_FOUND);
  }

  if (controlNet2) {
    (baseParams.controlNet as IControlNet[]).push(controlNet2);
  }

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename, [sdxl ? INTERROGATE_MODEL_LAION : INTERROGATE_MODEL_OPENAI]);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return baseParams;
  }
};

const prepareQueryIpAdapterBase = (
  file: IFile,
  style: IRedrawStyle,
  denoising_strength: number | number[],
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let { height, width } = file;

  if (width === -1 || height === -1) {
    width = 512;
    height = 512;
  }

  const sd_model_checkpoint = getModelCheckpoint(style, sdxl);

  const stylesArray = [];

  if (style === IRedrawStyle.Anime) {
    stylesArray.push('Anime (SDXL)');
  }

  if (style === IRedrawStyle.PixelArt && !sdxl) {
    stylesArray.push('Pixel Art');
  }

  const baseParams: IClassicPrompt & { sdxl: boolean } = {
    checkpoints: sd_model_checkpoint,
    controlNet: [],
    denoising: denoising_strength,
    enableHighRes: true,
    filename: basename(file.file).replace('.png', '').replace('.jpg', '').replace('.jpeg', ''),
    height,
    negativePrompt: sdxl ? Config.get('commonNegative') : Config.get('commonNegativeXL'),
    pattern: `[datetime]-{denoising}-${style}-ipadapter-{filename}`,
    prompt: addToPrompt ? `${addToPrompt}, ` : '',
    restoreFaces: true,
    sdxl: !!sdxl,
    styles: stylesArray,
    width
  };

  return baseParams;
};

const prepareQueryIpAdapter = async (
  file: IFile,
  style: IRedrawStyle,
  denoising_strength: number | number[],
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let baseParams = prepareQueryIpAdapterBase(file, style, denoising_strength, addToPrompt, sdxl);

  const controlNet1 = getControlNetIPAdapter(sdxl ?? false, file, 0.5);
  const controlNet2 = getControlNetOpenPose(sdxl ?? false, style, undefined, 0.5);

  if (controlNet1) {
    (baseParams.controlNet as IControlNet[]).push(controlNet1);
  } else {
    loggerInfo(`Controlnet models for ip-adapter not found`);
    process.exit(ExitCodes.REDRAW_IPADAPTER_MODEL_NOT_FOUND);
  }

  if (controlNet2) {
    (baseParams.controlNet as IControlNet[]).push(controlNet2);
  }

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename, [sdxl ? INTERROGATE_MODEL_LAION : INTERROGATE_MODEL_OPENAI]);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return baseParams;
  }
};

const getCombination = (filesList: IFile[], styles: IRedrawStyle[], methods: IRedrawMethod[]) => {
  const combinations: Array<{
    file: IFile;
    method: IRedrawMethod;
    style: IRedrawStyle;
  }> = [];

  const methodArray = methods.length > 0 ? [...methods] : [IRedrawMethod.Denoise];
  const stylesArray = styles.length > 0 ? [...styles] : [IRedrawStyle.Realism];

  for (const file of filesList) {
    for (const style of stylesArray) {
      for (const method of methodArray) {
        combinations.push({ file, method, style });
      }
    }
  }

  return combinations;
};

export interface IRedrawOptionsCompleted extends IRedrawOptions {
  denoising: number[];
  upscales: number[];
}

type QueryPreparationFunction = (
  file: IFile,
  style: IRedrawStyle,
  denoising_strength: number | number[],
  addToPrompt?: string,
  sdxl?: boolean
) => Promise<IClassicPrompt | undefined>;

const prepareQueries = async (
  combinations: {
    file: IFile;
    method: IRedrawMethod;
    style: IRedrawStyle;
  }[],
  {
    addAfterPrompt,
    addBeforePrompt,
    denoising,
    filenameRemove,
    negativePrompt,
    negativePromptRemove,
    noTime,
    promptRemove,
    sdxl,
    upscaler,
    upscales
  }: IRedrawOptionsCompleted
) => {
  const queries: IClassicPrompt[] = [];

  for (const combination of combinations) {
    const prefix = [combination.file.prefix].filter(Boolean).join(', ');

    let prepareQuery: QueryPreparationFunction;

    switch (combination.method) {
      case IRedrawMethod.IPAdapter:
        prepareQuery = prepareQueryIpAdapter;
        break;
      case IRedrawMethod.Lineart:
        prepareQuery = prepareQueryLineart;
        break;
      case IRedrawMethod.LinePose:
        prepareQuery = prepareQueryLineAndPose;
        break;
      case IRedrawMethod.Openpose:
        prepareQuery = prepareQueryOpenpose;
        break;
      case IRedrawMethod.Denoise:
      default:
        prepareQuery = prepareQueryDenoise;
        break;
    }

    const query = await prepareQuery(combination.file, combination.style, denoising, prefix, sdxl);

    if (noTime && query) {
      query.pattern = query.pattern?.replace('[datetime]-', '');
    }

    if (query) {
      query.prompt = Array.isArray(query.prompt)
        ? query.prompt.map((prompt) => prompt.replaceAll(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, ''))
        : query.prompt.replaceAll(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, '');

      if (query.negativePrompt) {
        query.negativePrompt = Array.isArray(query.negativePrompt)
          ? query.negativePrompt.map((prompt) => prompt.replaceAll(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, ''))
          : query.negativePrompt.replaceAll(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, '');
      }

      if (negativePrompt) {
        query.negativePrompt = negativePrompt;
      }

      if (negativePromptRemove && query.negativePrompt) {
        if (Array.isArray(query.negativePrompt)) {
          for (const npRemove of negativePromptRemove) {
            query.negativePrompt = query.negativePrompt.map((prompt) => prompt.replace(npRemove, ''));
          }
        } else {
          for (const npRemove of negativePromptRemove) {
            if (query.negativePrompt.includes(npRemove)) {
              query.negativePrompt = query.negativePrompt.replace(npRemove, '');
            }
          }
        }
      }

      if (promptRemove) {
        if (Array.isArray(query.prompt)) {
          for (const pRemove of promptRemove) {
            query.prompt = query.prompt.map((prompt) => prompt.replace(pRemove, ''));
          }
        } else {
          for (const pRemove of promptRemove) {
            if (query.prompt.includes(pRemove)) {
              query.prompt = query.prompt.replace(pRemove, '');
            }
          }
        }
      }

      if (addAfterPrompt) {
        query.prompt = Array.isArray(query.prompt)
          ? query.prompt.map((prompt) => `${prompt}, ${addAfterPrompt}`)
          : `${query.prompt}, ${addAfterPrompt}`;
      }

      if (addBeforePrompt) {
        query.prompt = Array.isArray(query.prompt)
          ? query.prompt.map((prompt) => `${addBeforePrompt}, ${prompt}`)
          : `${addBeforePrompt}, ${query.prompt}`;
      }

      query.scaleFactor = upscales;

      query.upscaler = upscaler;

      if (filenameRemove) {
        for (const fRemove of filenameRemove) {
          if (query.filename?.includes(fRemove)) {
            query.filename = query.filename.replace(fRemove, '');
          }
        }
      }

      queries.push(query);
    }
  }

  loggerInfo(`Prepared ${queries.length} redraw queries`);

  return queries;
};

export const redraw = async (source: string, options: IRedrawOptions) => {
  if (!existsSync(source)) {
    loggerInfo(`Source directory ${source} does not exist`);
    process.exit(ExitCodes.REDRAW_NO_SOURCE);
  }

  const { denoising: denoisingArray, method, recursive, style, upscales: upscalingArray } = options;

  const filesList = await getFiles(source, recursive);

  const combinations = getCombination(filesList, style, method);

  const denoising = denoisingArray ?? [0.55];
  const upscales = upscalingArray ?? [1];

  const queries = await prepareQueries(combinations, {
    ...options,
    denoising,
    upscales
  });

  queries.sort((a, b) => (a.checkpoints as string).localeCompare(b.checkpoints as string));

  prompts({ prompts: queries }, false);
};
