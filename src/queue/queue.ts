import fs from 'fs';
import { Validator } from 'jsonschema';

import { IAdetailer } from '../commons/extensions/adetailer';
import { getCutOffTokens } from '../commons/extensions/cutoff';
import { logger, writeLog } from '../commons/logger';
import { findADetailersModel, findCheckpoint, findStyle, findUpscaler, findVAE } from '../commons/models';
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

interface ICheckpointWithVAE {
  checkpoint: string;
  vae: string;
}
export interface IPrompt {
  adetailer?: IAdetailerPrompt[];
  autoCutOff?: 'both' | boolean;
  autoLCM?: 'both' | boolean;
  cfg?: number | number[];
  checkpoints?: ICheckpointWithVAE[] | string | string[];
  clipSkip: number | number[];
  count?: number;
  denoising?: number | number[];
  enableHighRes?: 'both' | boolean;
  filename?: string;
  height?: number | number[];
  negativePrompt?: string;
  pattern?: string;
  prompt: string;
  restoreFaces?: 'both' | boolean;
  sampler?: string | string[];
  seed?: number | number[];
  steps?: number | number[];
  styles?: string | string[];
  stylesSets?: Array<string | string[]>;
  upscaler?: string | string[];
  vae?: string | string[];
  width?: number | number[];
}

export interface IPromptSingle {
  adetailer?: IAdetailerPrompt[];
  autoCutOff: boolean;
  autoLCM: boolean;
  cfg?: number;
  checkpoints?: string;
  clipSkip?: number;
  denoising?: number;
  enableHighRes: boolean;
  filename?: string;
  height?: number;
  negativePrompt?: string;
  pattern?: string;
  prompt: string;
  restoreFaces: boolean;
  sampler?: string;
  seed?: number;
  steps?: number;
  styles?: string[];
  upscaler?: string;
  vae?: string;
  width?: number;
}
//
export type IPrompts = IPrompt[];

const validator = new Validator();

const prepareQueries = (basePrompts: IPrompts): IPromptSingle[] => {
  const prompts = new Map<string, IPromptSingle>();

  basePrompts.forEach((basePrompt) => {
    const autoCutOffArray = basePrompt.autoCutOff === 'both' ? [true, false] : [basePrompt.autoCutOff ?? false];
    const autoLCMArray = basePrompt.autoLCM === 'both' ? [true, false] : [basePrompt.autoLCM ?? false];
    const enableHighResArray = basePrompt.enableHighRes === 'both' ? [true, false] : [basePrompt.enableHighRes ?? false];
    const restoreFacesArray = basePrompt.restoreFaces === 'both' ? [true, false] : [basePrompt.restoreFaces ?? false];

    const cfgArray = Array.isArray(basePrompt.cfg) ? basePrompt.cfg : [basePrompt.cfg ?? undefined];
    const denoisingArray = Array.isArray(basePrompt.denoising) ? basePrompt.denoising : [basePrompt.denoising ?? undefined];
    const heightArray = Array.isArray(basePrompt.height) ? basePrompt.height : [basePrompt.height ?? undefined];
    const samplerArray = Array.isArray(basePrompt.sampler) ? basePrompt.sampler : [basePrompt.sampler ?? undefined];
    const seedArray = Array.isArray(basePrompt.seed) ? basePrompt.seed : [basePrompt.seed ?? undefined];
    const stepsArray = Array.isArray(basePrompt.steps) ? basePrompt.steps : [basePrompt.steps ?? undefined];
    const upscalerArray = Array.isArray(basePrompt.upscaler) ? basePrompt.upscaler : [basePrompt.upscaler ?? undefined];
    const vaeArray = Array.isArray(basePrompt.vae) ? basePrompt.vae : [basePrompt.vae ?? undefined];
    const widthArray = Array.isArray(basePrompt.width) ? basePrompt.width : [basePrompt.width ?? undefined];
    const clipSkipArray = Array.isArray(basePrompt.clipSkip) ? basePrompt.clipSkip : [basePrompt.clipSkip ?? undefined];
    const stylesSetsArray = Array.isArray(basePrompt.stylesSets) ? basePrompt.stylesSets : [basePrompt.stylesSets ?? [undefined]];

    const checkpointsArray = Array.isArray(basePrompt.checkpoints) ? basePrompt.checkpoints : [basePrompt.checkpoints ?? undefined];

    autoCutOffArray.forEach((autoCutOff) => {
      autoLCMArray.forEach((autoLCM) => {
        enableHighResArray.forEach((enableHighRes) => {
          restoreFacesArray.forEach((restoreFaces) => {
            cfgArray.forEach((cfg) => {
              denoisingArray.forEach((denoising) => {
                heightArray.forEach((height) => {
                  samplerArray.forEach((sampler) => {
                    seedArray.forEach((seed) => {
                      stepsArray.forEach((steps) => {
                        upscalerArray.forEach((upscaler) => {
                          vaeArray.forEach((vaeOption) => {
                            widthArray.forEach((width) => {
                              checkpointsArray.forEach((checkpointsOption) => {
                                clipSkipArray.forEach((clipSkip) => {
                                  stylesSetsArray.forEach((stylesSets) => {
                                    const count = basePrompt.count ?? 1;

                                    for (let i = 0; i < count; i++) {
                                      const stylesSet = Array.isArray(stylesSets) ? stylesSets : [stylesSets];
                                      const styles = Array.isArray(basePrompt.styles)
                                        ? basePrompt.styles
                                        : [basePrompt.styles ?? undefined];

                                      const vae =
                                        checkpointsOption && typeof checkpointsOption === 'object' ? checkpointsOption.vae : vaeOption;
                                      const checkpoints =
                                        checkpointsOption && typeof checkpointsOption === 'object'
                                          ? checkpointsOption.checkpoint
                                          : checkpointsOption;

                                      const prompt: IPromptSingle = {
                                        adetailer: basePrompt.adetailer,
                                        autoCutOff,
                                        autoLCM,
                                        cfg,
                                        checkpoints,
                                        clipSkip,
                                        denoising,
                                        enableHighRes,
                                        filename: basePrompt.filename,
                                        height,
                                        negativePrompt: basePrompt.negativePrompt,
                                        pattern: basePrompt.pattern,
                                        prompt: basePrompt.prompt,
                                        restoreFaces,
                                        sampler,
                                        seed: seed !== undefined && seed !== -1 ? seed + i : undefined,
                                        steps,
                                        styles: Array.from(new Set([...styles, ...stylesSet])).filter(
                                          (style) => style !== undefined
                                        ) as string[],
                                        upscaler,
                                        vae,
                                        width
                                      };

                                      prompts.set(
                                        (checkpoints ?? '') + (vae ?? '') + (upscaler ?? '') + JSON.stringify(prompt) + i,
                                        prompt
                                      );
                                    }

                                    //
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  const sorted = Array.from(prompts.keys()).sort((a, b) => a.localeCompare(b));

  return sorted.map((key) => prompts.get(key) as IPromptSingle);
};

export const queue = async (source: string, validateOnly: boolean) => {
  if (!fs.existsSync(source)) {
    logger(`Source file ${source} does not exist`);
    process.exit(1);
  }

  let jsonContent: IPrompts = [];
  try {
    const data = fs.readFileSync(source, 'utf8');
    jsonContent = JSON.parse(data);
  } catch (err) {
    logger(`Unable to parse JSON in ${source}`);
    process.exit(1);
  }

  if (!Array.isArray(jsonContent)) {
    logger(`Invalid JSON in ${source}. Must be an array of objects`);
    process.exit(1);
  }

  const validation = validator.validate(jsonContent, queueSchema, { nestedErrors: true });

  if (!validation.valid) {
    logger(`JSON has invalid properties : ${validation.toString()}`);
    process.exit(1);
  }

  const queries: ITxt2ImgQuery[] = [];

  const queriesArray = prepareQueries(jsonContent);

  queriesArray.forEach((jsonQuery) => {
    const query: ITxt2ImgQuery = {
      cfg_scale: jsonQuery.cfg,
      denoising_strength: jsonQuery.denoising,
      enable_hr: jsonQuery.enableHighRes,
      height: jsonQuery.height,
      lcm: jsonQuery.autoLCM ?? false,
      negative_prompt: jsonQuery.negativePrompt,
      override_settings: {},
      prompt: jsonQuery.prompt,
      restore_faces: jsonQuery.restoreFaces,
      sampler_name: jsonQuery.sampler,
      sdxl: false,
      seed: jsonQuery.seed,
      steps: jsonQuery.steps,
      width: jsonQuery.width
    };

    if (jsonQuery.vae) {
      const foundVAE = findVAE(jsonQuery.vae);
      if (foundVAE) {
        query.vae = foundVAE;
      } else {
        logger(`Invalid VAE ${jsonQuery.vae} in ${source}`);
        process.exit(1);
      }
    }

    if (jsonQuery.autoCutOff) {
      const tokens = getCutOffTokens(jsonQuery.prompt);
      query.cutOff = {
        tokens
      };
    }

    if (jsonQuery.upscaler && typeof jsonQuery.upscaler === 'string') {
      const foundUpscaler = findUpscaler(jsonQuery.upscaler);

      if (foundUpscaler) {
        query.hr_upscaler = foundUpscaler.name;
      } else {
        logger(`Invalid Upscaler ${jsonQuery.upscaler} in ${source}`);
        process.exit(1);
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

    if (jsonQuery.clipSkip) {
      query.override_settings.CLIP_stop_at_last_layers = jsonQuery.clipSkip;
    }

    if (jsonQuery.adetailer && jsonQuery.adetailer.length > 0) {
      query.adetailer = [];

      jsonQuery.adetailer.forEach((adetailer) => {
        const foundModel = findADetailersModel(adetailer.model);
        if (foundModel) {
          const adetailerQuery: IAdetailer = {
            ad_denoising_strength: adetailer.strength,
            ad_model: foundModel,
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
      const modelCheckpoint = findCheckpoint(jsonQuery.checkpoints);
      if (modelCheckpoint) {
        query.override_settings.sd_model_checkpoint = modelCheckpoint.name;
      } else {
        logger(`Invalid checkpoints ${jsonQuery.checkpoints} in ${source}`);
        process.exit(1);
      }
    }

    if (jsonQuery.pattern) {
      query.override_settings.samples_filename_pattern = jsonQuery.pattern;

      if (jsonQuery.filename) {
        if (!query.override_settings.samples_filename_pattern.includes('{filename}')) {
          query.override_settings.samples_filename_pattern = '{filename}-' + query.override_settings.samples_filename_pattern;
        }

        query.override_settings.samples_filename_pattern = query.override_settings.samples_filename_pattern.replace(
          '{filename}',
          jsonQuery.filename
        );
      }
    } else if (jsonQuery.filename) {
      query.override_settings.samples_filename_pattern = `${jsonQuery.filename}-[datetime]`;
    }

    if (jsonQuery.styles && jsonQuery.styles.length > 0) {
      jsonQuery.styles.forEach((styleName) => {
        if (!styleName) {
          return;
        }

        const foundStyle = findStyle(styleName);

        if (foundStyle) {
          query.styles = query.styles ?? [];
          query.styles.push(foundStyle.name);

          if (foundStyle.prompt) {
            if (foundStyle.prompt.includes('{prompt}')) {
              query.prompt = foundStyle.prompt.replace('{prompt}', query.prompt);
            } else {
              query.prompt = `${query.prompt}, ${foundStyle.prompt}`;
            }
          }

          if (foundStyle.negativePrompt) {
            if (foundStyle.negativePrompt.includes('{prompt}')) {
              query.negative_prompt = foundStyle.negativePrompt.replace('{prompt}', query.negative_prompt ?? '');
            } else {
              query.negative_prompt = `${query.negative_prompt ?? ''}, ${foundStyle.negativePrompt}`;
            }
          }
        } else {
          logger(`Invalid Style ${styleName} in ${source}`);
          process.exit(1);
        }
      });
    }

    queries.push(query);
  });

  logger(`Your configuration seems valid. ${queries.length} queries has been generated.`);
  if (validateOnly) {
    writeLog(queries);
    process.exit(0);
  }

  for await (const queryParams of queries) {
    await renderQuery(queryParams, 'txt2img');
  }
};
