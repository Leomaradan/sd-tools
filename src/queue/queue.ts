import fs from 'fs';
import { Validator } from 'jsonschema';

import { IAdetailer } from '../commons/extensions/adetailer';
import { getCutOffTokens } from '../commons/extensions/cutoff';
import { logger } from '../commons/logger';
import { getModelAdetailers, getModelCheckpoint, getModelUpscaler, getModelVAE } from '../commons/models';
import { renderQuery } from '../commons/query';
import queueSchema from '../commons/schema/queue.json';
import { ITxt2ImgQuery } from '../commons/types';

interface IAdetailerPrompt {
  height?: number;
  model: string;
  negative?: string;
  prompt?: string;
  strength?: number;
  width?: number;
}

export interface IPrompt {
  adetailer?: IAdetailerPrompt[];
  autoCutOff?: boolean;
  cfg?: number;
  checkpoints?: string;
  denoising?: number;
  enableHighRes?: boolean;
  filename?: string;
  height?: number;
  negative?: string;
  pattern?: string;
  prompt: string;
  restoreFaces?: boolean;
  sampler?: string;
  seed?: number;
  steps?: number;
  upscaler?: string;
  vae?: string;
  width?: number;
}

export type IPrompts = IPrompt[];

const validator = new Validator();

export const queue = async (source: string, scheduler: boolean) => {
  if (!fs.existsSync(source)) {
    logger(`Source file ${source} does not exist`);
    process.exit(1);
  }

  let jsonContent: IPrompts = [];
  try {
    const data = fs.readFileSync(source, 'utf8');
    jsonContent = JSON.parse(data);
  } catch (err) {
    logger(`Invalid JSON in ${source}`);
    process.exit(1);
  }

  if (!Array.isArray(jsonContent)) {
    logger(`Invalid JSON in ${source}`);
    process.exit(1);
  }

  const validation = validator.validate(jsonContent, queueSchema);

  if (!validation.valid) {
    logger(`JSON has invalid properties : ${validation.toString()}`);
    process.exit(1);
  }

  const queries: ITxt2ImgQuery[] = [];

  jsonContent.forEach((jsonQuery) => {
    const query: ITxt2ImgQuery = {
      cfg_scale: jsonQuery.cfg,
      denoising_strength: jsonQuery.denoising,
      enable_hr: jsonQuery.enableHighRes,
      height: jsonQuery.height,
      negative_prompt: jsonQuery.negative,
      override_settings: {},
      prompt: jsonQuery.prompt,
      restore_faces: jsonQuery.restoreFaces,
      sampler_name: jsonQuery.sampler,
      seed: jsonQuery.seed,
      steps: jsonQuery.steps,
      width: jsonQuery.width
    };

    if (jsonQuery.vae) {
      const foundVAE = getModelVAE(jsonQuery.vae);
      if (foundVAE) {
        query.vae = foundVAE[1];
      }
    }

    if (jsonQuery.autoCutOff) {
      const tokens = getCutOffTokens(jsonQuery.prompt);
      query.cutOff = {
        tokens
      };
    }

    if (jsonQuery.upscaler && typeof jsonQuery.upscaler === 'string') {
      const foundUpscaler = getModelUpscaler(jsonQuery.upscaler);

      if (foundUpscaler) {
        query.hr_upscaler = foundUpscaler[1];
      }
    }

    if (query.enable_hr === false) {
      query.enable_hr = query.denoising_strength !== undefined || query.hr_upscaler !== undefined;
    }

    if (query.enable_hr === true) {
      query.hr_scale = 2;
      query.denoising_strength = query.denoising_strength ?? 0.5;
      query.hr_prompt = '';
      query.hr_negative_prompt = '';
    }

    if (jsonQuery.adetailer && jsonQuery.adetailer.length > 0) {
      query.adetailer = [];

      jsonQuery.adetailer.forEach((adetailer) => {
        const foundModel = getModelAdetailers(adetailer.model);
        if (foundModel) {
          const adetailerQuery: IAdetailer = {
            ad_denoising_strength: adetailer.strength,
            ad_model: foundModel[1],
            ad_negative_prompt: adetailer.negative,
            ad_prompt: adetailer.prompt
          };
          if (adetailer.height || adetailer.width) {
            adetailerQuery.ad_inpaint_height = adetailer.height ?? jsonQuery.height ?? 512;
            adetailerQuery.ad_inpaint_width = adetailer.width ?? jsonQuery.width ?? 512;
            adetailerQuery.ad_use_inpaint_width_height = true;
          }

          (query.adetailer as IAdetailer[]).push(adetailerQuery);
        } else {
          logger(`Invalid Adetailer model ${adetailer.model} in ${source}`);
          process.exit(1);
        }
      });
    }

    if (jsonQuery.checkpoints && typeof jsonQuery.checkpoints === 'string') {
      const modelCheckpoint = getModelCheckpoint(jsonQuery.checkpoints);
      if (modelCheckpoint) {
        query.override_settings.sd_model_checkpoint = modelCheckpoint[1];
      } else {
        logger(`Invalid checkpoints ${jsonQuery.checkpoints} in ${source}`);
        process.exit(1);
      }
    }

    if (jsonQuery.pattern) {
      query.override_settings.samples_filename_pattern = jsonQuery.pattern;

      if (jsonQuery.filename) {
        query.styles = [jsonQuery.filename];

        if (!query.override_settings.samples_filename_pattern.includes('[styles]')) {
          query.override_settings.samples_filename_pattern = '[styles]' + query.override_settings.samples_filename_pattern;
        }
      }
    } else if (jsonQuery.filename) {
      query.override_settings.samples_filename_pattern = '[styles]-[datetime]';
      query.styles = [jsonQuery.filename];
    }

    queries.push(query);
  });

  for await (const queryParams of queries) {
    await renderQuery(queryParams, 'txt2img', scheduler);
  }
};
