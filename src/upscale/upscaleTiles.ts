import fs from 'fs';
import { basename } from 'path';

import { IFile, getBase64Image, readFiles } from '../commons/file';
import { interrogateQuery, renderQuery } from '../commons/query';
import {
  ControlNetMode,
  ControlNetModels,
  ControlNetModules,
  ControlNetResizes,
  ICommonRenderOptions,
  IImg2ImgQuery,
  IUltimateSDUpscale
} from '../commons/types';

export const upscaleTiles = async (source: string, { checkpoint, scheduler, upscaler, upscales }: ICommonRenderOptions) => {
  if (!fs.existsSync(source)) {
    console.log(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  const queries: IImg2ImgQuery[] = [];
  const filesList: IFile[] = [];

  readFiles(source).forEach((file) => {
    filesList.push(file);
  });

  //1.5/realistic/cyberrealistic_v40.safetensors [481d75ae9d]
  for await (const file of filesList) {
    console.log(file.filename);
    //console.log(file.data);

    //const addBeforePrompts = addBefore ? addBefore.split("|") : [""];

    let { height, width } = file;

    if (width === -1 || height === -1) {
      width = 512;
      height = 512;
    }

    const baseParams: IImg2ImgQuery = {
      controlNet: {
        control_mode: ControlNetMode.ControleNetImportant,
        controlnet_model: ControlNetModels.tile,
        controlnet_module: ControlNetModules.TileResample,
        resize_mode: ControlNetResizes.Resize
      },
      denoising_strength: 0.3,
      init_images: [getBase64Image(file.filename)],

      negative_prompt: `(bad-hands-5:1.0), (badhandv4:1.0), (easynegative:0.8), (bad-artist-anime:0.8), (bad-artist:0.8), (bad_prompt:0.8), (bad-picture-chill-75v:0.8), (bad_prompt_version2:0.8), (bad-image-v2-39000:0.8) (verybadimagenegative_v1.3:0.8)`,
      //checkpoint: "481d75ae9d",
      //hr_upscaler: "4x-UltraSharp",
      override_settings: {
        samples_filename_pattern: `[datetime]-${basename(file.file, '.png')}`
      },
      prompt: '',
      ultimateSdUpscale: {
        height: height * 2,
        width: width * 2
      }
    };

    let ready = false;
    if (file.data) {
      const [basePrompt, negativePromptRaw, otherParams] = file.data;

      const negativePrompt = negativePromptRaw.replace('Negative prompt: ', '');

      const stepsTest = /Steps: ([0-9]+),/.exec(otherParams);
      const samplerTest = /Sampler: ([a-z0-9 +]+), /i.exec(otherParams);
      const cfgTest = /CFG scale: ([0-9.]+), /i.exec(otherParams);
      const seedTest = /Seed: ([0-9]+),/i.exec(otherParams);
      const sizesTest = /Size: ([0-9]+)x([0-9]+),/i.exec(otherParams);

      const steps = stepsTest ? Number(stepsTest[1]) : undefined;
      const sampler = samplerTest ? samplerTest[1] : undefined;
      const cfg = cfgTest ? Number(cfgTest[1]) : undefined;
      const seed = seedTest ? Number(seedTest[1]) : undefined;

      const promptWidth = sizesTest ? Number(sizesTest[1]) : undefined;
      const promptHeight = sizesTest ? Number(sizesTest[2]) : undefined;

      baseParams.prompt = basePrompt;
      baseParams.init_images = [getBase64Image(file.filename)];

      if (negativePrompt !== undefined && negativePrompt !== '') {
        baseParams.negative_prompt += negativePrompt;
      }

      if (steps !== undefined) {
        baseParams.steps = steps;
      }

      if (sampler !== undefined) {
        baseParams.sampler_name = sampler;
      }

      if (cfg !== undefined) {
        baseParams.cfg_scale = cfg;
      }

      if (seed !== undefined) {
        baseParams.seed = seed;
      }

      if (promptWidth !== undefined) {
        baseParams.width = promptWidth;
        (baseParams.ultimateSdUpscale as IUltimateSDUpscale).width = promptWidth * 2;
      }

      if (promptHeight !== undefined) {
        baseParams.height = promptHeight;
        (baseParams.ultimateSdUpscale as IUltimateSDUpscale).height = promptHeight * 2;
      }
      ready = true;
    } else {
      const prompt = await interrogateQuery(file.filename);

      if (prompt) {
        baseParams.prompt = prompt.prompt;
        ready = true;
      }
    }

    if (upscales) {
      baseParams.enable_hr = true;
      baseParams.hr_scale = upscales;
      baseParams.width = width * upscales;
      baseParams.height = height * upscales;
    }

    if (upscaler) {
      baseParams.hr_upscaler = upscaler;
    }

    if (checkpoint) {
      baseParams.override_settings.sd_model_checkpoint = checkpoint;
    }

    if (ready) {
      queries.push(baseParams);
    }
  }

  for await (const queryParams of queries) {
    await renderQuery(queryParams, 'img2img', scheduler);
  }
};
