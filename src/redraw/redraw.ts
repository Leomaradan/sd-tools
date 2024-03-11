import fs from 'fs';
import { basename } from 'path';

import { Config } from '../commons/config';
import { IFile, getBase64Image, getFiles } from '../commons/file';
import { logger } from '../commons/logger';
import { findControlnetModel, findControlnetModule, findSampler } from '../commons/models';
import { interrogateQuery } from '../commons/query';
import { IPrompt, queue } from '../commons/queue';
import { ControlNetMode, ControlNetResizes, IControlNet, IRedrawMethod, IRedrawOptions, IRedrawStyle } from '../commons/types';

const IP_ADAPTER = 'ip-adapter';
const LINEART = 'lineart';
const HED = 'hed';

const prepareQueryData = (baseParamsProps: IPrompt & { sdxl: boolean }, file: IFile) => {
  const baseParams = { ...baseParamsProps };
  const [basePrompt, negativePromptRaw, otherParams] = file.data as string[];

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

const getModelCheckpoint = (style: 'anime' | 'realism', sdxl?: boolean) => {
  const redrawModels = Config.get('redrawModels');
  let sd_model_checkpoint = redrawModels.realist15;

  if (style === 'anime') {
    if (sdxl) {
      sd_model_checkpoint = redrawModels.animexl;
    } else {
      sd_model_checkpoint = redrawModels.anime15;
    }
  } else if (sdxl) {
    sd_model_checkpoint = redrawModels.realistxl;
  }

  return sd_model_checkpoint;
};

const getControlNetLineart = (sdxl: boolean, style: 'anime' | 'realism'): IControlNet | undefined => {
  let controlnetModelName: string[] = [];

  if (sdxl) {
    controlnetModelName = ['t2i-adapter_diffusers_xl_lineart'];
  } else if (style === 'anime') {
    controlnetModelName = ['control_v11p_sd15s2_lineart_anime', 'control_v11p_sd15_lineart'];
  } else {
    controlnetModelName = ['control_v11p_sd15_lineart'];
  }

  const controlnetModel = findControlnetModel(...controlnetModelName)?.name;
  const controlnetModule =
    style === 'anime' ? findControlnetModule('lineart_anime', 'lineart') : findControlnetModule('lineart_realistic', 'lineart');

  if (controlnetModel !== undefined && controlnetModule !== undefined) {
    return {
      control_mode: ControlNetMode.ControleNetImportant,
      model: controlnetModel,
      module: controlnetModule,
      resize_mode: ControlNetResizes.Resize
    };
  }
};

const getControlNetOpenPose = (sdxl: boolean, style: 'anime' | 'realism', input_image?: IFile): IControlNet | undefined => {
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
      input_image: input_image ? getBase64Image(input_image.filename) : undefined,
      model: controlnetModel,
      module: controlnetModule,
      resize_mode: ControlNetResizes.Resize
    };
  }
};

const getControlNetIPAdapter = (sdxl: boolean, file: IFile): IControlNet | undefined => {
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
      input_image: getBase64Image(file.filename),
      model: controlnetModel,
      module: controlnetModule,
      resize_mode: ControlNetResizes.Resize
    };
  }
};

const prepareQueryClassical = async (
  file: IFile,
  style: 'anime' | 'realism',
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

  let baseParams: IPrompt & { sdxl: boolean } = {
    checkpoints: sd_model_checkpoint,
    controlNet: [],
    denoising: denoising_strength,
    enableHighRes: true,
    filename: basename(file.file).replace('.png', '').replace('.jpg', '').replace('.jpeg', ''),
    height,
    initImageOrFolder: file.filename,
    negativePrompt: sdxl ? Config.get('commonNegative') : Config.get('commonNegativeXL'),
    pattern: `[datetime]-{denoising}-${style}-classical-{filename}`,
    prompt: addToPrompt ? `${addToPrompt}, ` : '',
    restoreFaces: true,
    sdxl: !!sdxl,
    styles: style === 'anime' ? ['Anime (SDXL)'] : [],
    width
  };

  const controlNet1 = getControlNetLineart(sdxl ?? false, style);
  const controlNet2 = getControlNetOpenPose(sdxl ?? false, style);

  if (controlNet1) {
    (baseParams.controlNet as IControlNet[]).push(controlNet1);
  } else {
    logger(`Controlnet models for lineart not found`);
    process.exit(1);
  }

  if (controlNet2) {
    (baseParams.controlNet as IControlNet[]).push(controlNet2);
  }

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return baseParams;
  }
};

const prepareQueryIpAdapter = async (
  file: IFile,
  style: 'anime' | 'realism',
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

  let baseParams: IPrompt & { sdxl: boolean } = {
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
    styles: style === 'anime' ? ['Anime (SDXL)'] : [],
    sdxl: !!sdxl,
    width
  };

  const controlNet1 = getControlNetIPAdapter(sdxl ?? false, file);
  const controlNet2 = getControlNetOpenPose(sdxl ?? false, style, file);

  if (controlNet1) {
    (baseParams.controlNet as IControlNet[]).push(controlNet1);
  } else {
    logger(`Controlnet models for ip-adapter not found`);
    process.exit(1);
  }

  if (controlNet2) {
    (baseParams.controlNet as IControlNet[]).push(controlNet2);
  }

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return baseParams;
  }
};

const getCombination = (filesList: IFile[], styles: IRedrawStyle, methods: IRedrawMethod) => {
  const combinations: Array<{
    file: IFile;
    method: 'classical' | 'ip-adapter';
    style: 'anime' | 'realism';
  }> = [];

  const methodArray: Array<'classical' | 'ip-adapter'> = methods === 'both' ? [IP_ADAPTER, 'classical'] : [methods];
  const stylesArray: Array<'anime' | 'realism'> = styles === 'both' ? ['anime', 'realism'] : [styles];

  for (const file of filesList) {
    for (const style of stylesArray) {
      for (const method of methodArray) {
        combinations.push({ file, method, style });
      }
    }
  }

  return combinations;
};

export const redraw = async (
  source: string,
  { addToPrompt, denoising: denoisingArray, method, recursive, sdxl, style, upscaler, upscales: upscalingArray }: IRedrawOptions
) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  const queries: IPrompt[] = [];

  const filesList = getFiles(source, recursive);

  const denoising = denoisingArray ?? [0.55];
  const upscaling = upscalingArray ?? [1];

  const combinations = getCombination(filesList, style, method);

  for await (const combination of combinations) {
    const prefix = [addToPrompt, combination.file.prefix].filter(Boolean).join(', ');

    const prepareQuery = combination.method === IP_ADAPTER ? prepareQueryIpAdapter : prepareQueryClassical;

    const query = await prepareQuery(combination.file, combination.style, denoising, prefix, sdxl);

    if (query) {
      query.prompt = Array.isArray(query.prompt)
        ? query.prompt.map((prompt) => prompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, ''))
        : query.prompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, '');

      if (query.negativePrompt) {
        query.negativePrompt = Array.isArray(query.negativePrompt)
          ? query.negativePrompt.map((prompt) => prompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, ''))
          : query.negativePrompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, '');
      }

      query.scaleFactor = upscaling;

      query.upscaler = upscaler;

      queries.push(query);
    }
  }

  //checkpoint: "481d75ae9d",

  queries.sort((a, b) => (a.checkpoints as string).localeCompare(b.checkpoints as string));

  /*queriesImg2Img.sort((a, b) =>
    (a.override_settings.sd_model_checkpoint as string).localeCompare(b.override_settings.sd_model_checkpoint as string)
  );*/

  queue({ prompts: queries }, false);

  /*for await (const queryParams of queriesTxt2Img) {
    await renderQuery(queryParams, 'txt2img');
  }

  for await (const queryParams of queriesImg2Img) {
    await renderQuery(queryParams, 'img2img');
  }*/
};
