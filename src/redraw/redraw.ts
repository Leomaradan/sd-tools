import fs from 'fs';
import { basename } from 'path';

import { Config } from '../commons/config';
import { IFile, getBase64Image, getFiles } from '../commons/file';
import { logger } from '../commons/logger';
import { getModelControlnet, getModelSamplers } from '../commons/models';
import { interrogateQuery, renderQuery } from '../commons/query';
import { ControlNetMode, ControlNetModules, ControlNetResizes, IImg2ImgQuery, IRedrawOptions } from '../commons/types';

const prepareQueryData = (baseParamsProps: IImg2ImgQuery, file: IFile) => {
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
  baseParams.init_images = [getBase64Image(file.filename)];

  if (negativePrompt !== undefined && negativePrompt !== '') {
    baseParams.negative_prompt += negativePrompt;
  }

  if (steps !== undefined) {
    baseParams.steps = steps;
  }

  if (sampler !== undefined) {
    const foundSampler = getModelSamplers(sampler);
    baseParams.sampler_name = foundSampler;
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
      sd_model_checkpoint = redrawModels.animeXL;
    } else {
      sd_model_checkpoint = redrawModels.anime15;
    }
  } else if (sdxl) {
    sd_model_checkpoint = redrawModels.realistXL;
  }

  return sd_model_checkpoint;
};

const prepareQuery = async (file: IFile, style: 'anime' | 'realism', denoising_strength: number, addToPrompt?: string, sdxl?: boolean) => {
  let { height, width } = file;

  if (width === -1 || height === -1) {
    width = 512;
    height = 512;
  }

  const sd_model_checkpoint = getModelCheckpoint(style, sdxl);

  const controlnetModelName = sdxl ? 't2i-adapter_diffusers_xl_lineart' : 'control_v11p_sd15_lineart';
  const controlnet_model = getModelControlnet(controlnetModelName);

  if (!controlnet_model) {
    logger(`Controlnet model ${controlnetModelName} not found`);
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

const getCombination = (filesList: IFile[], denoising: number[], scaleFactors: number[]) => {
  const combinations: Array<{ denoising_strength: number; file: IFile; scaleFactor: number }> = [];
  for (const file of filesList) {
    for (const denoising_strength of denoising) {
      for (const scaleFactor of scaleFactors) {
        combinations.push({ denoising_strength, file, scaleFactor });
      }
    }
  }

  return combinations;
};

export const redraw = async (
  source: string,
  { addToPrompt, denoising: denoisingArray, recursive, scheduler, sdxl, style, upscaler, upscales: upscalingArray }: IRedrawOptions
) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  const queries: IImg2ImgQuery[] = [];

  const filesList = getFiles(source, recursive);

  const denoising = denoisingArray ?? [0.55];
  const upscaling = upscalingArray ?? [1];

  const combinations = getCombination(filesList, denoising, upscaling);

  for await (const combination of combinations) {
    const prefix = [addToPrompt, combination.file.prefix].filter(Boolean).join(', ');
    const query = await prepareQuery(combination.file, style, combination.denoising_strength, prefix, sdxl);

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

      queries.push(baseParams);
    }
  }

  //checkpoint: "481d75ae9d",

  for await (const queryParams of queries) {
    await renderQuery(queryParams, 'img2img', scheduler);
  }
};
