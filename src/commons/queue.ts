import { IAdetailer } from '../commons/extensions/adetailer';
import { getCutOffTokens } from '../commons/extensions/cutoff';
import { logger, writeLog } from '../commons/logger';
import { findADetailersModel, findCheckpoint, findStyle, findUpscaler, findVAE } from '../commons/models';
import { renderQuery } from '../commons/query';
import { IControlNet, IImg2ImgQuery, ITxt2ImgQuery, IUltimateSDUpscale } from '../commons/types';
import { getBase64Image } from './file';

export interface IAdetailerPrompt {
  height?: number;
  model: string;
  negative?: string;
  prompt?: string;
  strength?: number;
  width?: number;
}

interface ICheckpointWithVAE {
  addAfterNegativePrompt?: string;
  addAfterPrompt?: string;
  addBeforeNegativePrompt?: string;
  addBeforePrompt?: string;
  checkpoint: string;
  vae: string;
}

export interface IPrompt {
  adetailer?: IAdetailerPrompt[];
  autoCutOff?: 'both' | boolean;
  autoLCM?: 'both' | boolean;
  cfg?: number | number[];
  checkpoints?: ICheckpointWithVAE[] | string | string[];
  clipSkip?: number | number[];
  controlNet?: IControlNet | IControlNet[];
  count?: number;
  denoising?: number | number[];
  enableHighRes?: 'both' | boolean;
  filename?: string;
  height?: number | number[];
  highRes?:{
    afterNegativePrompt?: string,
    afterPrompt?: string,
    beforeNegativePrompt?: string,
    beforePrompt?: string,
  };
  initImage?: string | string[];
  negativePrompt?: string;
  outDir?: string;
  pattern?: string;
  prompt: string;
  restoreFaces?: 'both' | boolean;
  sampler?: string | string[];
  scaleFactor?: number | number[];
  seed?: `${number}-${number}` | number | number[];
  steps?: number | number[];
  styles?: string | string[];
  stylesSets?: Array<string | string[]>;
  ultimateSdUpscale?: 'both' | boolean;
  upscaler?: string | string[];
  vae?: string | string[];
  width?: number | number[];
}

export interface IPromptSingle {
  adetailer?: IAdetailerPrompt[];
  autoCutOff?: boolean;
  autoLCM?: boolean;
  cfg?: number;
  checkpoints?: string;
  clipSkip?: number;
  controlNet?: IControlNet[];
  denoising?: number;
  enableHighRes?: boolean;
  filename?: string;
  height?: number;
  highRes?:{
    afterNegativePrompt?: string,
    afterPrompt?: string,
    beforeNegativePrompt?: string,
    beforePrompt?: string,
  };
  initImage?: string;
  negativePrompt?: string;
  outDir?: string;
  pattern?: string;
  prompt: string;
  restoreFaces?: boolean;
  sampler?: string;
  scaleFactor?: number;
  seed?: number;
  steps?: number;
  styles?: string[];
  ultimateSdUpscale?: IUltimateSDUpscale;
  upscaler?: string;
  vae?: string;
  width?: number;
}

interface IPromptReplace {
  from: string;
  to: string;
}

export interface IPromptPermutations {
  afterFilename?: string;
  afterNegativePrompt?: string;
  afterPrompt?: string;
  beforeFilename?: string;
  beforeNegativePrompt?: string;
  beforePrompt?: string;
  overwrite?: Partial<IPromptSingle>;
  promptReplace?: IPromptReplace[];
}

//
export interface IPrompts {
  $schema?: string;
  permutations?: IPromptPermutations[];
  prompts: IPrompt[];
}

interface IPrepareSingleQueryPermutations {
  autoCutOffArray: boolean[];
  autoLCMArray: boolean[];
  cfgArray: (number | undefined)[];
  checkpointsArray: Array<ICheckpointWithVAE | string | undefined>;
  clipSkipArray: (number | undefined)[];
  denoisingArray: (number | undefined)[];
  enableHighResArray: boolean[];
  heightArray: (number | undefined)[];
  initImageArray: (string | undefined)[];
  permutations?: IPromptPermutations[];
  restoreFacesArray: boolean[];
  samplerArray: (string | undefined)[];
  scaleFactorsArray: (number | undefined)[];
  seedArray: (number | undefined)[];
  stepsArray: (number | undefined)[];
  stylesSetsArray: Array<string | string[] | undefined[]>;
  ultimateSdUpscaleArray: boolean[];
  upscalerArray: (string | undefined)[];
  vaeArray: (string | undefined)[];
  widthArray: (number | undefined)[];
}

const prepareSingleQueryPermutations = (basePrompt: IPrompt, options: IPrepareSingleQueryPermutations): [string, IPromptSingle][] => {
  const prompts: [string, IPromptSingle][] = [];
  const {
    autoCutOffArray,
    autoLCMArray,
    cfgArray,
    checkpointsArray,
    clipSkipArray,
    denoisingArray,
    enableHighResArray,
    heightArray,
    initImageArray,
    permutations,
    restoreFacesArray,
    samplerArray,
    scaleFactorsArray,
    seedArray,
    stepsArray,
    stylesSetsArray,
    ultimateSdUpscaleArray,
    upscalerArray,
    vaeArray,
    widthArray
  } = options;
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
                      initImageArray.forEach((initImage) => {
                        upscalerArray.forEach((upscaler) => {
                          scaleFactorsArray.forEach((scaleFactor) => {
                            vaeArray.forEach((vaeOption) => {
                              widthArray.forEach((width) => {
                                checkpointsArray.forEach((checkpointsOption) => {
                                  clipSkipArray.forEach((clipSkip) => {
                                    ultimateSdUpscaleArray.forEach((ultimateSdUpscale) => {
                                      stylesSetsArray.forEach((stylesSets) => {
                                        const count = basePrompt.count ?? 1;

                                        for (let i = 0; i < count; i++) {
                                          const stylesSet = Array.isArray(stylesSets) ? stylesSets : [stylesSets];
                                          const styles = Array.isArray(basePrompt.styles)
                                            ? basePrompt.styles
                                            : [basePrompt.styles ?? undefined];

                                          let vae = vaeOption;
                                          let checkpoints;

                                          let promptText = basePrompt.prompt;
                                          let negativePromptText = basePrompt.negativePrompt;

                                          if (checkpointsOption) {
                                            if (typeof checkpointsOption === 'string') {
                                              checkpoints = checkpointsOption;
                                            } else {
                                              vae = checkpointsOption.vae ?? vae;
                                              checkpoints = checkpointsOption.checkpoint;
                                              promptText = checkpointsOption.addAfterPrompt
                                                ? `${promptText}, ${checkpointsOption.addAfterPrompt}`
                                                : promptText;
                                              promptText = checkpointsOption.addBeforePrompt
                                                ? `${checkpointsOption.addBeforePrompt}, ${promptText}`
                                                : promptText;
                                              if (
                                                !negativePromptText &&
                                                (checkpointsOption.addBeforeNegativePrompt || checkpointsOption.addAfterNegativePrompt)
                                              ) {
                                                negativePromptText = '';
                                              }
                                              negativePromptText = checkpointsOption.addAfterNegativePrompt
                                                ? `${negativePromptText}, ${checkpointsOption.addAfterNegativePrompt}`
                                                : negativePromptText;
                                              negativePromptText = checkpointsOption.addBeforeNegativePrompt
                                                ? `${checkpointsOption.addBeforeNegativePrompt}, ${negativePromptText}`
                                                : negativePromptText;
                                            }
                                          }

                                          const prompt: IPromptSingle = {
                                            ...(basePrompt as IPromptSingle),
                                            autoCutOff,
                                            autoLCM,
                                            cfg,
                                            checkpoints,
                                            clipSkip,
                                            denoising,
                                            enableHighRes,
                                            height,
                                            initImage,
                                            negativePrompt: negativePromptText,
                                            pattern: basePrompt.pattern,
                                            prompt: promptText,
                                            restoreFaces,
                                            sampler,
                                            scaleFactor,
                                            seed: seed !== undefined && seed !== -1 ? seed + i : undefined,
                                            steps,
                                            styles: Array.from(new Set([...styles, ...stylesSet])).filter(
                                              (style) => style !== undefined
                                            ) as string[],
                                            upscaler,
                                            vae,
                                            width
                                          };

                                          if (basePrompt.controlNet) {
                                            prompt.controlNet = Array.isArray(basePrompt.controlNet)
                                              ? basePrompt.controlNet
                                              : [basePrompt.controlNet];
                                          }

                                          if (ultimateSdUpscale) {
                                            const scaleFactor = prompt.scaleFactor ?? 2;
                                            prompt.ultimateSdUpscale = {
                                              height: prompt.height ? prompt.height * scaleFactor : 2048,
                                              scale: scaleFactor,
                                              width: prompt.width ? prompt.width * scaleFactor : 2048
                                            };
                                          }

                                          prompts.push([
                                            (checkpoints ?? '') + (vae ?? '') + (upscaler ?? '') + JSON.stringify(prompt) + i,
                                            prompt
                                          ]);

                                          if (permutations) {
                                            permutations.forEach((permutation) => {
                                              const permutedPrompt = { ...prompt };

                                              if (permutation.overwrite) {
                                                Object.assign(permutedPrompt, permutation.overwrite);
                                              }

                                              if (permutation.promptReplace) {
                                                permutation.promptReplace.forEach((promptReplace) => {
                                                  permutedPrompt.prompt = permutedPrompt.prompt.replace(
                                                    promptReplace.from,
                                                    promptReplace.to
                                                  );
                                                  if (permutedPrompt.negativePrompt) {
                                                    permutedPrompt.negativePrompt = permutedPrompt.negativePrompt.replace(
                                                      promptReplace.from,
                                                      promptReplace.to
                                                    );
                                                  }
                                                });
                                              }

                                              if (permutation.afterFilename) {
                                                permutedPrompt.filename = permutedPrompt.filename
                                                  ? `${permutedPrompt.filename}${permutation.afterFilename}`
                                                  : permutation.afterFilename;
                                              }

                                              if (permutation.beforeFilename) {
                                                permutedPrompt.filename = permutedPrompt.filename
                                                  ? `${permutation.beforeFilename}${permutedPrompt.filename}`
                                                  : permutation.beforeFilename;
                                              }

                                              if (permutation.afterPrompt) {
                                                permutedPrompt.prompt = permutedPrompt.prompt
                                                  ? `${permutedPrompt.prompt}, ${permutation.afterPrompt}`
                                                  : permutation.afterPrompt;
                                              }

                                              if (permutation.beforePrompt) {
                                                permutedPrompt.prompt = permutedPrompt.prompt
                                                  ? `${permutation.beforePrompt}, ${permutedPrompt.prompt}`
                                                  : permutation.beforePrompt;
                                              }

                                              prompts.push([
                                                (permutedPrompt.checkpoints ?? '') +
                                                  (permutedPrompt.vae ?? '') +
                                                  (permutedPrompt.upscaler ?? '') +
                                                  JSON.stringify(permutedPrompt) +
                                                  i,
                                                permutedPrompt
                                              ]);
                                            });
                                          }
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
    });
  });

  return prompts;
};

const getSeedArray = (seeds: `${string}-${string}` | number | number[] | undefined): [undefined] | number[] => {
  if (seeds === undefined) {
    return [undefined];
  }

  if (typeof seeds === 'number') {
    return [seeds];
  }

  if (typeof seeds === 'string') {
    const [first, last] = seeds.split('-').map((s) => parseInt(s, 10));

    if (first === undefined || last === undefined) {
      return [undefined];
    }

    const result = [];

    for (let i = first; i <= last; i++) {
      result.push(i);
    }

    return result;
  }

  return seeds;
};

const prepareQueries = (basePrompts: IPrompts): IPromptSingle[] => {
  const prompts = new Map<string, IPromptSingle>();

  basePrompts.prompts.forEach((basePrompt) => {
    const autoCutOffArray = basePrompt.autoCutOff === 'both' ? [true, false] : [basePrompt.autoCutOff ?? false];
    const autoLCMArray = basePrompt.autoLCM === 'both' ? [true, false] : [basePrompt.autoLCM ?? false];
    const enableHighResArray = basePrompt.enableHighRes === 'both' ? [true, false] : [basePrompt.enableHighRes ?? false];
    const restoreFacesArray = basePrompt.restoreFaces === 'both' ? [true, false] : [basePrompt.restoreFaces ?? false];
    const ultimateSdUpscaleArray = basePrompt.ultimateSdUpscale === 'both' ? [true, false] : [basePrompt.ultimateSdUpscale ?? false];

    const cfgArray = Array.isArray(basePrompt.cfg) ? basePrompt.cfg : [basePrompt.cfg ?? undefined];
    const denoisingArray = Array.isArray(basePrompt.denoising) ? basePrompt.denoising : [basePrompt.denoising ?? undefined];
    const heightArray = Array.isArray(basePrompt.height) ? basePrompt.height : [basePrompt.height ?? undefined];
    const samplerArray = Array.isArray(basePrompt.sampler) ? basePrompt.sampler : [basePrompt.sampler ?? undefined];
    const seedArray = getSeedArray(basePrompt.seed);
    const stepsArray = Array.isArray(basePrompt.steps) ? basePrompt.steps : [basePrompt.steps ?? undefined];
    const scaleFactorsArray = Array.isArray(basePrompt.scaleFactor) ? basePrompt.scaleFactor : [basePrompt.scaleFactor ?? undefined];
    const upscalerArray = Array.isArray(basePrompt.upscaler) ? basePrompt.upscaler : [basePrompt.upscaler ?? undefined];
    const initImageArray = Array.isArray(basePrompt.initImage) ? basePrompt.initImage : [basePrompt.initImage ?? undefined];
    const vaeArray = Array.isArray(basePrompt.vae) ? basePrompt.vae : [basePrompt.vae ?? undefined];
    const widthArray = Array.isArray(basePrompt.width) ? basePrompt.width : [basePrompt.width ?? undefined];
    const clipSkipArray = Array.isArray(basePrompt.clipSkip) ? basePrompt.clipSkip : [basePrompt.clipSkip ?? undefined];
    const stylesSetsArray = Array.isArray(basePrompt.stylesSets) ? basePrompt.stylesSets : [basePrompt.stylesSets ?? [undefined]];

    const checkpointsArray = Array.isArray(basePrompt.checkpoints) ? basePrompt.checkpoints : [basePrompt.checkpoints ?? undefined];

    const results = prepareSingleQueryPermutations(basePrompt, {
      autoCutOffArray,
      autoLCMArray,
      cfgArray,
      checkpointsArray,
      clipSkipArray,
      denoisingArray,
      enableHighResArray,
      heightArray,
      initImageArray,
      permutations: basePrompts.permutations,
      restoreFacesArray,
      samplerArray,
      scaleFactorsArray,
      seedArray,
      stepsArray,
      stylesSetsArray,
      ultimateSdUpscaleArray,
      upscalerArray,
      vaeArray,
      widthArray
    });

    results.forEach(([key, prompt]) => {
      prompts.set(key, prompt);
    });
  });

  const sorted = Array.from(prompts.keys()).sort((a, b) => a.localeCompare(b));

  return sorted.map((key) => prompts.get(key) as IPromptSingle);
};

const validTokensTemplate = [
  '[seed]',
  '[seed_first]',
  '[seed_last]',
  '[steps]',
  '[cfg]',
  '[sampler]',
  '[model_name]',
  '[model_hash]',
  '[width]',
  '[height]',
  '[styles]',
  '[date]',
  '[datetime]',
  '[job_timestamp]',
  '[prompt_no_styles]',
  '[prompt_spaces]',
  '[prompt]',
  '[prompt_words]',
  '[prompt_hash]',
  '[negative_prompt_hash]',
  '[full_prompt_hash]',
  '[clip_skip]',
  '[generation_number]',
  '[user]',
  '[image_hash]',
  '[none]'
];
const validateTemplate = (template: string) => {
  const tokens = /\[([a-z0-9_]+)\]/gi;

  const matches = template.match(tokens);

  if (!matches) {
    return;
  }

  matches.forEach((match) => {
    if (!validTokensTemplate.includes(match)) {
      logger(`Invalid token ${match} in ${template}`);
      process.exit(1);
    }
  });
};

export const prepareQueue = (config: IPrompts): Array<IImg2ImgQuery | ITxt2ImgQuery> => {
  const queries: Array<IImg2ImgQuery | ITxt2ImgQuery> = [];

  const queriesArray = prepareQueries(config);

  queriesArray.forEach((singleQuery) => {
    const {
      adetailer,
      autoCutOff,
      autoLCM,
      cfg,
      checkpoints,
      clipSkip,
      controlNet,
      denoising,
      enableHighRes,
      filename,
      height,
      highRes,
      initImage,
      negativePrompt,
      outDir,
      pattern,
      prompt,
      restoreFaces,
      sampler,
      scaleFactor,
      seed,
      steps,
      styles,
      ultimateSdUpscale,
      upscaler,
      vae,
      width
    } = singleQuery;

    const query: IImg2ImgQuery | ITxt2ImgQuery = {
      cfg_scale: cfg,
      controlNet,
      denoising_strength: denoising,
      enable_hr: enableHighRes,
      height: height,
      hr_scale: scaleFactor,
      init_images: initImage ? [getBase64Image(initImage)] : undefined,
      lcm: autoLCM ?? false,
      negative_prompt: negativePrompt,
      override_settings: {},
      prompt: prompt,
      restore_faces: restoreFaces,
      sampler_name: sampler,
      sdxl: false,
      seed: seed,
      steps: steps,
      ultimateSdUpscale,
      width: width
    };

    if (vae) {
      const foundVAE = findVAE(vae);
      if (foundVAE) {
        query.override_settings.sd_vae = foundVAE === 'None' ? '' : foundVAE;
      } else {
        logger(`Invalid VAE ${vae}`);
        process.exit(1);
      }
    }

    if (autoCutOff) {
      const tokens = getCutOffTokens(prompt);
      query.cutOff = {
        tokens
      };
    }

    if (upscaler && typeof upscaler === 'string') {
      const foundUpscaler = findUpscaler(upscaler);

      if (foundUpscaler) {
        query.hr_upscaler = foundUpscaler.name;
      } else {
        logger(`Invalid Upscaler ${upscaler}`);
        process.exit(1);
      }
    }

    if ((query as IImg2ImgQuery).init_images) {
      query.enable_hr = false;
    } else {
      if (query.enable_hr === false) {
        query.enable_hr = query.denoising_strength !== undefined || query.hr_upscaler !== undefined;
      }

      if (query.enable_hr === true) {
        query.hr_scale = 2;
        query.denoising_strength = query.denoising_strength ?? 0.5;
        query.hr_prompt = '';
        query.hr_negative_prompt = '';
      }
    }

    if (clipSkip) {
      query.override_settings.CLIP_stop_at_last_layers = clipSkip;
    }

    if(highRes){
      const {afterNegativePrompt, afterPrompt, beforeNegativePrompt, beforePrompt} = highRes;

      if(beforeNegativePrompt || afterNegativePrompt){
        query.hr_negative_prompt = `${beforeNegativePrompt ?? ''},${query.negative_prompt ?? ''},${afterNegativePrompt ?? ''}`;
      }

      if(beforePrompt || afterPrompt){
        query.hr_prompt = `${beforePrompt ?? ''},${query.prompt ?? ''},${afterPrompt ?? ''}`;
      }
    }

    if (outDir) {
      if ((query as IImg2ImgQuery).init_images) {
        query.override_settings.outdir_img2img_samples = outDir;
      } else {
        query.override_settings.outdir_txt2img_samples = outDir;
      }
    }

    if (adetailer && adetailer.length > 0) {
      query.adetailer = [];

      adetailer.forEach((adetailer) => {
        const foundModel = findADetailersModel(adetailer.model);
        if (foundModel) {
          const adetailerQuery: IAdetailer = {
            ad_denoising_strength: adetailer.strength,
            ad_model: foundModel,
            ad_negative_prompt: adetailer.negative,
            ad_prompt: adetailer.prompt
          };
          if (adetailer.height || adetailer.width) {
            adetailerQuery.ad_inpaint_height = adetailer.height ?? height ?? 512;
            adetailerQuery.ad_inpaint_width = adetailer.width ?? width ?? 512;
            adetailerQuery.ad_use_inpaint_width_height = true;
          }

          (query.adetailer as IAdetailer[]).push(adetailerQuery);
        } else {
          logger(`Invalid Adetailer model ${adetailer.model}`);
          process.exit(1);
        }
      });
    }

    if (checkpoints && typeof checkpoints === 'string') {
      const modelCheckpoint = findCheckpoint(checkpoints);
      if (modelCheckpoint) {
        query.override_settings.sd_model_checkpoint = modelCheckpoint.name;
      } else {
        logger(`Invalid checkpoints ${checkpoints}`);
        process.exit(1);
      }
    }

    //console.log('HERE1', {denoising, config: config.prompts, pattern, samples_filename_pattern: query.override_settings.samples_filename_pattern});
    if (pattern) {
      query.override_settings.samples_filename_pattern = pattern;

      if (filename) {
        if (!query.override_settings.samples_filename_pattern.includes('{filename}')) {
          query.override_settings.samples_filename_pattern = '{filename}-' + query.override_settings.samples_filename_pattern;
        }

        query.override_settings.samples_filename_pattern = query.override_settings.samples_filename_pattern.replace('{filename}', filename);
      }

      //console.log('HERE2', {denoising, pattern, samples_filename_pattern: query.override_settings.samples_filename_pattern});
      if (denoising) {
        //console.log('HERE3', {denoising, pattern, samples_filename_pattern: query.override_settings.samples_filename_pattern});
        query.override_settings.samples_filename_pattern = query.override_settings.samples_filename_pattern.replace(
          '{denoising}',
          denoising.toFixed(2)
        );
      }

      if (clipSkip) {
        //console.log('HERE3', {denoising, pattern, samples_filename_pattern: query.override_settings.samples_filename_pattern});
        query.override_settings.samples_filename_pattern = query.override_settings.samples_filename_pattern.replace(
          '{clipSkip}',
          clipSkip.toFixed(0)
        );
      }
    } else if (filename) {
      query.override_settings.samples_filename_pattern = `${filename}-[datetime]`;
    }

    if (query.override_settings.samples_filename_pattern) {
      validateTemplate(query.override_settings.samples_filename_pattern);
    }

    if (styles && styles.length > 0) {
      styles.forEach((styleName) => {
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
          logger(`Invalid Style ${styleName}`);
          process.exit(1);
        }
      });
    }

    queries.push(query);
  });

  return queries;
};

export const queue = async (config: IPrompts, validateOnly: boolean) => {
  const queries = prepareQueue(config);

  logger(`Your configuration seems valid. ${queries.length} queries has been generated.`);
  if (validateOnly) {
    writeLog(queries);
    process.exit(0);
  }

  for await (const queryParams of queries) {
    if ((queryParams as IImg2ImgQuery).init_images) {
      await renderQuery(queryParams as IImg2ImgQuery, 'img2img');
    } else {
      await renderQuery(queryParams as ITxt2ImgQuery, 'txt2img');
    }
  }
};
