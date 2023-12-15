import fs from 'fs';
import { basename } from 'path';

import { Config } from '../commons/config';
import { IFile, getBase64Image, getFiles } from '../commons/file';
import { logger } from '../commons/logger';
import { findControlnetModel, findSampler } from '../commons/models';
import { interrogateQuery, renderQuery } from '../commons/query';
import {
  ControlNetMode,
  ControlNetModules,
  ControlNetResizes,
  IImg2ImgQuery,
  IRedrawMethod,
  IRedrawOptions,
  IRedrawStyle,
  ITxt2ImgQuery
} from '../commons/types';

const prepareQueryData = (baseParamsProps: IImg2ImgQuery | ITxt2ImgQuery, file: IFile) => {
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
    baseParams.negative_prompt += negativePrompt;
  }

  if (steps !== undefined) {
    baseParams.steps = steps;
  }

  if (sampler !== undefined) {
    const foundSampler = findSampler(sampler);
    baseParams.sampler_name = foundSampler?.name;
  }

  if (cfg !== undefined) {
    baseParams.cfg_scale = cfg;
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

const prepareQueryLineart = async (
  file: IFile,
  style: 'anime' | 'realism',
  denoising_strength: number,
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let { height, width } = file;

  if (width === -1 || height === -1) {
    width = 512;
    height = 512;
  }

  const sd_model_checkpoint = getModelCheckpoint(style, sdxl);

  const controlnetModelName = sdxl ? ['t2i-adapter_diffusers_xl_lineart'] : ['control_v11p_sd15_lineart'];

  const controlnet_model = findControlnetModel(...controlnetModelName)?.name;

  if (!controlnet_model) {
    logger(`Controlnet models "${controlnetModelName.join(', ')}" not found`);
    process.exit(1);
  }

  let baseParams: IImg2ImgQuery = {
    controlNet: {
      control_mode: ControlNetMode.ControleNetImportant,
      controlnet_model,
      controlnet_module: ControlNetModules.LineArt,
      resize_mode: ControlNetResizes.Resize
    },
    denoising_strength,
    height,
    init_images: [getBase64Image(file.filename)],
    negative_prompt: sdxl ? Config.get('commonNegative') : Config.get('commonNegativeXL'),
    override_settings: {
      samples_filename_pattern: `[datetime]-${denoising_strength}-${basename(file.file)
        .replace('.png', '')
        .replace('.jpg', '')
        .replace('.jpeg', '')}`,
      sd_model_checkpoint
    },
    prompt: addToPrompt ? `${addToPrompt}, ` : '',
    restore_faces: true,
    sdxl: !!sdxl,
    width
  };

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file) as IImg2ImgQuery;

    width = baseParams.width ?? width;
    height = baseParams.height ?? height;

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return { baseParams, height, width };
  }
};

const prepareQueryIpAdapter = async (
  file: IFile,
  style: 'anime' | 'realism',
  denoising_strength: number,
  addToPrompt?: string,
  sdxl?: boolean
) => {
  let { height, width } = file;

  if (width === -1 || height === -1) {
    width = 512;
    height = 512;
  }

  const sd_model_checkpoint = getModelCheckpoint(style, sdxl);

  const controlnetModelName = sdxl ? ['ip-adapter_xl'] : ['ip-adapter_sd15_plus', 'ip-adapter_sd15'];

  const controlnet_model = findControlnetModel(...controlnetModelName)?.name;

  if (!controlnet_model) {
    logger(`Controlnet models "${controlnetModelName.join(', ')}" not found`);
    process.exit(1);
  }

  let baseParams: ITxt2ImgQuery = {
    controlNet: {
      control_mode: ControlNetMode.ControleNetImportant,
      controlnet_model,
      controlnet_module: sdxl ? ControlNetModules.IPAdapterXL : ControlNetModules.IPAdapter,
      input_image: getBase64Image(file.filename),
      resize_mode: ControlNetResizes.Resize
    },
    denoising_strength,
    height,
    // ,
    negative_prompt: sdxl ? Config.get('commonNegative') : Config.get('commonNegativeXL'),
    override_settings: {
      samples_filename_pattern: `[datetime]-${denoising_strength}-${basename(file.file)
        .replace('.png', '')
        .replace('.jpg', '')
        .replace('.jpeg', '')}`,
      sd_model_checkpoint
    },
    prompt: addToPrompt ? `${addToPrompt}, ` : '',
    restore_faces: true,
    sdxl: !!sdxl,
    width
  };

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);

    width = baseParams.width ?? width;
    height = baseParams.height ?? height;

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename);

    if (prompt) {
      baseParams.prompt += prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return { baseParams, height, width };
  }
};

const getCombination = (filesList: IFile[], denoising: number[], scaleFactors: number[], styles: IRedrawStyle, methods: IRedrawMethod) => {
  const combinations: Array<{
    denoising_strength: number;
    file: IFile;
    method: 'ip-adapter' | 'lineart';
    scaleFactor: number;
    style: 'anime' | 'realism';
  }> = [];

  const methodArray: Array<'ip-adapter' | 'lineart'> = methods === 'both' ? ['ip-adapter', 'lineart'] : [methods];
  const stylesArray: Array<'anime' | 'realism'> = styles === 'both' ? ['anime', 'realism'] : [styles];

  for (const file of filesList) {
    for (const denoising_strength of denoising) {
      for (const scaleFactor of scaleFactors) {
        for (const style of stylesArray) {
          for (const method of methodArray) {
            combinations.push({ denoising_strength, file, method, scaleFactor, style });
          }
        }
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

  const queriesImg2Img: IImg2ImgQuery[] = [];
  const queriesTxt2Img: ITxt2ImgQuery[] = [];

  const filesList = getFiles(source, recursive);

  const denoising = denoisingArray ?? [0.55];
  const upscaling = upscalingArray ?? [1];

  const combinations = getCombination(filesList, denoising, upscaling, style, method);

  for await (const combination of combinations) {
    const prefix = [addToPrompt, combination.file.prefix].filter(Boolean).join(', ');

    const store = combination.method === 'ip-adapter' ? queriesTxt2Img : queriesImg2Img;
    const prepareQuery = combination.method === 'ip-adapter' ? prepareQueryIpAdapter : prepareQueryLineart;

    const query = await prepareQuery(combination.file, combination.style, combination.denoising_strength, prefix, sdxl);

    if (query) {
      const { baseParams, height, width } = query;
      if (combination.scaleFactor !== 1) {
        baseParams.enable_hr = true;
        baseParams.hr_scale = combination.scaleFactor;
        baseParams.width = width * combination.scaleFactor;
        baseParams.height = height * combination.scaleFactor;
      }

      if (upscaler) {
        baseParams.hr_upscaler = upscaler;
      }

      store.push(baseParams);
    }
  }

  //checkpoint: "481d75ae9d",

  queriesTxt2Img.sort((a, b) =>
    (a.override_settings.sd_model_checkpoint as string).localeCompare(b.override_settings.sd_model_checkpoint as string)
  );

  queriesImg2Img.sort((a, b) =>
    (a.override_settings.sd_model_checkpoint as string).localeCompare(b.override_settings.sd_model_checkpoint as string)
  );

  for await (const queryParams of queriesTxt2Img) {
    await renderQuery(queryParams, 'txt2img');
  }

  for await (const queryParams of queriesImg2Img) {
    await renderQuery(queryParams, 'img2img');
  }
};
