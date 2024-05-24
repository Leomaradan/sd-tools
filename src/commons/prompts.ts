import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { getDefaultQuery } from './defaultQuery';
import { type IAdetailer } from './extensions/adetailer';
import { getCutOffTokens } from './extensions/cutoff';
import { type ITiledDiffusion, type ITiledVAE, defaultTiledDiffusionOptions } from './extensions/multidiffusionUpscaler';
import { getBase64Image, getImageSize } from './file';
import { ExitCodes, logger, writeLog } from './logger';
import { findADetailersModel, findCheckpoint, findControlnetModel, findControlnetModule, findStyle, findUpscaler, findVAE } from './models';
import { isTxt2ImgQuery, renderQuery } from './query';
import {
  ControlNetMode,
  ControlNetResizes,
  type ICheckpointWithVAE,
  type IControlNet,
  type IImg2ImgQuery,
  type IModel,
  type IPrompt,
  type IPromptPermutations,
  type IPromptSingle,
  type IPromptsResolved,
  type ITxt2ImgQuery
} from './types';

interface IPrepareSingleQuery {
  autoCutOff: boolean;
  autoLCM: boolean;
  cfg: number | undefined;
  checkpointsOption: ICheckpointWithVAE | string | undefined;
  clipSkip: number | undefined;
  controlNet: IControlNet[] | undefined;
  denoising: number | undefined;
  enableHighRes: boolean;
  height: number | undefined;
  initImage: string | undefined;
  negativePrompt: string | undefined;
  prompt: string;
  restoreFaces: boolean;
  sampler: string | undefined;
  scaleFactor: number | undefined;
  seed: number | undefined;
  steps: number | undefined;
  stylesSets: string | string[] | undefined[];
  tiledDiffusion: ITiledDiffusion | undefined;
  tiledVAE: ITiledVAE | undefined;
  tiling: boolean;
  ultimateSdUpscale: boolean;
  upscaler: string | undefined;
  vaeOption: string | undefined;
  width: number | undefined;
}

interface IPrepareSingleQueryFromArray {
  autoCutOffArray: boolean[];
  autoLCMArray: boolean[];
  cfgArray: (number | undefined)[];
  checkpointsArray: Array<ICheckpointWithVAE | string | undefined>;
  clipSkipArray: (number | undefined)[];
  //controlNet?: IControlNet | IControlNet[];
  controlNetArray: Array<IControlNet[] | undefined>;
  denoisingArray: (number | undefined)[];
  enableHighResArray: boolean[];
  heightArray: (number | undefined)[];
  initImageArray: (string | undefined)[];
  negativePromptArray: (string | undefined)[];
  permutations?: IPromptPermutations[];
  promptArray: string[];
  restoreFacesArray: boolean[];
  samplerArray: (string | undefined)[];
  scaleFactorsArray: (number | undefined)[];
  seedArray: (number | undefined)[];
  stepsArray: (number | undefined)[];
  stylesSetsArray: Array<string | string[] | undefined[]>;
  tiledDiffusionArray: (ITiledDiffusion | undefined)[];
  tiledVAEArray: (ITiledVAE | undefined)[];
  tilingArray: boolean[];
  ultimateSdUpscaleArray: boolean[];
  upscalerArray: (string | undefined)[];
  vaeArray: (string | undefined)[];
  widthArray: (number | undefined)[];
}

const updateFilename = (query: IImg2ImgQuery | ITxt2ImgQuery, token: string, value: string) => {
  query.override_settings.samples_filename_pattern = (query.override_settings.samples_filename_pattern as string).replace(
    `{${token}}`,
    value
  );
};

const prepareSingleQuery = (
  basePrompt: IPrompt,
  permutations: IPromptPermutations[] | undefined,
  options: IPrepareSingleQuery
): [string, IPromptSingle][] => {
  const {
    autoCutOff,
    autoLCM,
    cfg,
    checkpointsOption,
    clipSkip,
    controlNet,
    denoising,
    enableHighRes,
    height,
    initImage,
    negativePrompt,
    prompt: promptOption,
    restoreFaces,
    sampler,
    scaleFactor,
    seed,
    steps,
    stylesSets,
    tiledDiffusion,
    tiledVAE,
    tiling,
    ultimateSdUpscale,
    upscaler,
    vaeOption,
    width
  } = options;

  const prompts: [string, IPromptSingle][] = [];

  const count = basePrompt.count ?? 1;

  for (let i = 0; i < count; i++) {
    const stylesSet = Array.isArray(stylesSets) ? stylesSets : [stylesSets];
    const styles = Array.isArray(basePrompt.styles) ? basePrompt.styles : [basePrompt.styles ?? undefined];

    let vae = vaeOption;
    let checkpoints;

    let promptText = promptOption;
    let negativePromptText = negativePrompt;

    if (checkpointsOption) {
      if (typeof checkpointsOption === 'string') {
        checkpoints = checkpointsOption;
      } else {
        vae = checkpointsOption.vae ?? vae;
        checkpoints = checkpointsOption.checkpoint;
        promptText = checkpointsOption.addAfterPrompt ? `${promptText}, ${checkpointsOption.addAfterPrompt}` : promptText;
        promptText = checkpointsOption.addBeforePrompt ? `${checkpointsOption.addBeforePrompt}, ${promptText}` : promptText;
        if (!negativePromptText && (checkpointsOption.addBeforeNegativePrompt || checkpointsOption.addAfterNegativePrompt)) {
          negativePromptText = '';
        }
        negativePromptText = checkpointsOption.addAfterNegativePrompt
          ? `${negativePromptText}, ${checkpointsOption.addAfterNegativePrompt}`
          : negativePromptText;
        negativePromptText = checkpointsOption.addBeforeNegativePrompt
          ? `${checkpointsOption.addBeforeNegativePrompt}, ${negativePromptText}`
          : negativePromptText;

        if (checkpointsOption.addAfterFilename) {
          basePrompt.filename = basePrompt.filename
            ? `${basePrompt.filename}${checkpointsOption.addAfterFilename}`
            : checkpointsOption.addAfterFilename;
        }

        if (checkpointsOption.addBeforeFilename) {
          basePrompt.filename = basePrompt.filename
            ? `${checkpointsOption.addBeforeFilename}${basePrompt.filename}`
            : checkpointsOption.addBeforeFilename;
        }
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
      styles: Array.from(new Set([...styles, ...stylesSet])).filter((style) => style !== undefined) as string[],
      tiledVAE,
      tiling,
      upscaler,
      vae,
      width
    };

    if (prompt.initImage) {
      const { height, width } = getImageSize(prompt.initImage);
      prompt.width = !prompt.width && width != -1 ? width : undefined;
      prompt.height = !prompt.height && height != -1 ? height : undefined;
    }

    if (controlNet) {
      prompt.controlNet = Array.isArray(controlNet) ? controlNet : [controlNet];

      if (prompt.controlNet.some((controlNet) => controlNet.input_image)) {
        const firstImage = prompt.controlNet.find((controlNet) => controlNet.input_image)?.input_image;
        if (firstImage) {
          const { height, width } = getImageSize(firstImage);
          prompt.width = !prompt.width && width != -1 ? width : undefined;
          prompt.height = !prompt.height && height != -1 ? height : undefined;
        }
      }
    }

    if (scaleFactor && prompt.pattern?.includes('{scaleFactor}')) {
      prompt.pattern = prompt.pattern.replace('{scaleFactor}', String(scaleFactor));
    }

    if (count && prompt.pattern?.includes('{count}')) {
      prompt.pattern = prompt.pattern.replace('{count}', String(i + 1));
    }

    if (ultimateSdUpscale) {
      const scaleFactor = prompt.scaleFactor ?? 2;
      prompt.ultimateSdUpscale = {
        height: prompt.height ? prompt.height * scaleFactor : 2048,
        scale: scaleFactor,
        width: prompt.width ? prompt.width * scaleFactor : 2048
      };
    }

    if (tiledDiffusion) {
      const scaleFactor = prompt.scaleFactor ?? 1;

      prompt.tiledDiffusion = {
        ...defaultTiledDiffusionOptions,
        ...tiledDiffusion,
        scaleFactor
      };

      prompt.width = scaleFactor * (prompt.width ?? 512);
      prompt.height = scaleFactor * (prompt.height ?? 512);
      delete prompt.scaleFactor;
    }

    prompts.push([(checkpoints ?? '') + (vae ?? '') + (upscaler ?? '') + JSON.stringify(prompt) + i, prompt]);

    if (permutations) {
      permutations.forEach((permutation) => {
        const permutedPrompt = { ...prompt };

        if (permutation.overwrite) {
          Object.assign(permutedPrompt, permutation.overwrite);
        }

        if (permutation.promptReplace) {
          permutation.promptReplace.forEach((promptReplace) => {
            permutedPrompt.prompt = permutedPrompt.prompt.replace(promptReplace.from, promptReplace.to);
            if (permutedPrompt.negativePrompt) {
              permutedPrompt.negativePrompt = permutedPrompt.negativePrompt.replace(promptReplace.from, promptReplace.to);
            }
          });
        }

        if (permutation.afterFilename) {
          permutedPrompt.filename = basePrompt.filename ? `${basePrompt.filename}${permutation.afterFilename}` : permutation.afterFilename;
        }

        if (permutation.beforeFilename) {
          permutedPrompt.filename = basePrompt.filename
            ? `${permutation.beforeFilename}${basePrompt.filename}`
            : permutation.beforeFilename;
        }

        if (permutation.filenameReplace) {
          permutation.filenameReplace.forEach((filenameReplace) => {
            if (!permutedPrompt.filename) {
              permutedPrompt.filename = filenameReplace.to;
            } else {
              permutedPrompt.filename = permutedPrompt.filename.replace(filenameReplace.from, filenameReplace.to);
            }
          });
        }

        if (permutation.afterPrompt) {
          permutedPrompt.prompt = permutedPrompt.prompt ? `${permutedPrompt.prompt}, ${permutation.afterPrompt}` : permutation.afterPrompt;
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

  return prompts;
};

const getPermutations = (permutations: Partial<IPrepareSingleQuery>[], options: unknown[], property: keyof IPrepareSingleQuery) => {
  return permutations.reduce((acc, current) => {
    // current = ['a', undefined, undefined]

    [...options].forEach((param) => {
      // param2 = 1

      acc.push({ ...current, [property]: param });
      // ['a', 1, undefined]
    });

    return acc;
  }, [] as Partial<IPrepareSingleQuery>[]);
};

const prepareSingleQueryPermutations = (basePrompt: IPrompt, options: IPrepareSingleQueryFromArray): [string, IPromptSingle][] => {
  let prompts: [string, IPromptSingle][] = [];
  const {
    autoCutOffArray,
    autoLCMArray,
    cfgArray,
    checkpointsArray,
    clipSkipArray,
    controlNetArray,
    denoisingArray,
    enableHighResArray,
    heightArray,
    initImageArray,
    negativePromptArray,
    permutations,
    promptArray,
    restoreFacesArray,
    samplerArray,
    scaleFactorsArray,
    seedArray,
    stepsArray,
    stylesSetsArray,
    tiledDiffusionArray,
    tiledVAEArray,
    tilingArray,
    ultimateSdUpscaleArray,
    upscalerArray,
    vaeArray,
    widthArray
  } = options;

  // Initial value NEED to be not empty
  let permutationsArray: Partial<IPrepareSingleQuery>[] = promptArray.map((prompt) => ({ prompt }));

  permutationsArray = getPermutations(permutationsArray, autoCutOffArray, 'autoCutOff');
  permutationsArray = getPermutations(permutationsArray, autoLCMArray, 'autoLCM');
  permutationsArray = getPermutations(permutationsArray, cfgArray, 'cfg');
  permutationsArray = getPermutations(permutationsArray, checkpointsArray, 'checkpointsOption');
  permutationsArray = getPermutations(permutationsArray, clipSkipArray, 'clipSkip');
  permutationsArray = getPermutations(permutationsArray, denoisingArray, 'denoising');
  permutationsArray = getPermutations(permutationsArray, enableHighResArray, 'enableHighRes');
  permutationsArray = getPermutations(permutationsArray, heightArray, 'height');
  permutationsArray = getPermutations(permutationsArray, initImageArray, 'initImage');
  permutationsArray = getPermutations(permutationsArray, negativePromptArray, 'negativePrompt');
  permutationsArray = getPermutations(permutationsArray, restoreFacesArray, 'restoreFaces');
  permutationsArray = getPermutations(permutationsArray, samplerArray, 'sampler');
  permutationsArray = getPermutations(permutationsArray, scaleFactorsArray, 'scaleFactor');
  permutationsArray = getPermutations(permutationsArray, seedArray, 'seed');
  permutationsArray = getPermutations(permutationsArray, stepsArray, 'steps');
  permutationsArray = getPermutations(permutationsArray, stylesSetsArray, 'stylesSets');
  permutationsArray = getPermutations(permutationsArray, tiledDiffusionArray, 'tiledDiffusion');
  permutationsArray = getPermutations(permutationsArray, tiledVAEArray, 'tiledVAE');
  permutationsArray = getPermutations(permutationsArray, tilingArray, 'tiling');
  permutationsArray = getPermutations(permutationsArray, ultimateSdUpscaleArray, 'ultimateSdUpscale');
  permutationsArray = getPermutations(permutationsArray, upscalerArray, 'upscaler');
  permutationsArray = getPermutations(permutationsArray, vaeArray, 'vaeOption');
  permutationsArray = getPermutations(permutationsArray, widthArray, 'width');

  permutationsArray = getPermutations(permutationsArray, controlNetArray, 'controlNet');

  (permutationsArray as IPrepareSingleQuery[]).forEach((permutationItem) => {
    prompts = [
      ...prompts,
      ...prepareSingleQuery(basePrompt, permutations, {
        autoCutOff: permutationItem.autoCutOff,
        autoLCM: permutationItem.autoLCM,
        cfg: permutationItem.cfg,
        checkpointsOption: permutationItem.checkpointsOption,
        clipSkip: permutationItem.clipSkip,
        controlNet: permutationItem.controlNet,
        denoising: permutationItem.denoising,
        enableHighRes: permutationItem.enableHighRes,
        height: permutationItem.height,
        initImage: permutationItem.initImage,
        negativePrompt: permutationItem.negativePrompt,
        prompt: permutationItem.prompt,
        restoreFaces: permutationItem.restoreFaces,
        sampler: permutationItem.sampler,
        scaleFactor: permutationItem.scaleFactor,
        seed: permutationItem.seed,
        steps: permutationItem.steps,
        stylesSets: permutationItem.stylesSets,
        tiledDiffusion: permutationItem.tiledDiffusion,
        tiledVAE: permutationItem.tiledVAE,
        tiling: permutationItem.tiling,
        ultimateSdUpscale: permutationItem.ultimateSdUpscale,
        upscaler: permutationItem.upscaler,
        vaeOption: permutationItem.vaeOption,
        width: permutationItem.width
      })
    ];
  });

  return prompts;
};

const pickRandomItem = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const prepareSingleQueryRandomSelection = (basePrompt: IPrompt, options: IPrepareSingleQueryFromArray): [string, IPromptSingle][] => {
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
    negativePromptArray,
    permutations,
    promptArray,
    restoreFacesArray,
    samplerArray,
    scaleFactorsArray,
    seedArray,
    stepsArray,
    stylesSetsArray,
    tiledDiffusionArray,
    tiledVAEArray,
    tilingArray,
    ultimateSdUpscaleArray,
    upscalerArray,
    vaeArray,
    widthArray
  } = options;

  const autoCutOff = pickRandomItem(autoCutOffArray);
  const autoLCM = pickRandomItem(autoLCMArray);
  const cfg = pickRandomItem(cfgArray);
  const checkpointsOption = pickRandomItem(checkpointsArray);
  const clipSkip = pickRandomItem(clipSkipArray);
  const denoising = pickRandomItem(denoisingArray);
  const enableHighRes = pickRandomItem(enableHighResArray);
  const height = pickRandomItem(heightArray);
  const initImage = pickRandomItem(initImageArray);
  const negativePrompt = pickRandomItem(negativePromptArray);
  const prompt = pickRandomItem(promptArray);
  const restoreFaces = pickRandomItem(restoreFacesArray);
  const sampler = pickRandomItem(samplerArray);
  const scaleFactor = pickRandomItem(scaleFactorsArray);
  const seed = pickRandomItem(seedArray);
  const steps = pickRandomItem(stepsArray);
  const stylesSets = pickRandomItem(stylesSetsArray);
  const tiledDiffusion = pickRandomItem(tiledDiffusionArray);
  const tiledVAE = pickRandomItem(tiledVAEArray);
  const tiling = pickRandomItem(tilingArray);
  const ultimateSdUpscale = pickRandomItem(ultimateSdUpscaleArray);
  const upscaler = pickRandomItem(upscalerArray);
  const vaeOption = pickRandomItem(vaeArray);
  const width = pickRandomItem(widthArray);
  const controlNet = pickRandomItem(options.controlNetArray);

  return prepareSingleQuery(basePrompt, permutations, {
    autoCutOff,
    autoLCM,
    cfg,
    checkpointsOption,
    clipSkip,
    controlNet,
    denoising,
    enableHighRes,
    height,
    initImage,
    negativePrompt,
    prompt,
    restoreFaces,
    sampler,
    scaleFactor,
    seed,
    steps,
    stylesSets,
    tiledDiffusion,
    tiledVAE,
    tiling,
    ultimateSdUpscale,
    upscaler,
    vaeOption,
    width
  });
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

const getArraysBoolean = (value: 'both' | boolean | undefined): boolean[] => {
  if (value === 'both') {
    return [true, false];
  }

  return [value ?? false];
};

const getArrays = <T>(value: T | T[] | undefined, defaultValue: unknown = undefined): T[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined) {
    return [defaultValue as T];
  }

  return [value];
};

const getArraysInitImage = (value: string | string[] | undefined, defaultValue: unknown = undefined): string[] => {
  if (value === undefined) {
    return [defaultValue as string];
  }

  const initImageOrFolderArray = Array.isArray(value) ? value : [value];

  const initImagesArray: string[] = [];

  initImageOrFolderArray.forEach((initImageOrFolder) => {
    if (statSync(initImageOrFolder).isDirectory()) {
      const files = readdirSync(initImageOrFolder);
      initImagesArray.push(...files);
      //initImagesArray.push(...readFiles(initImageOrFolder, initImageOrFolder)) :
    } else {
      initImagesArray.push(initImageOrFolder);
    }
  });

  return initImagesArray;
};

const getArraysControlNet = (value: IControlNet | IControlNet[] | undefined): Array<IControlNet[] | undefined> => {
  if (value === undefined) {
    return [undefined];
  }

  const controlNetArray = Array.isArray(value) ? value : [value];
  const controlNetImage = controlNetArray[0].input_image;

  if (!controlNetImage) {
    return [controlNetArray];
  }

  const initImagesArray: string[] = [];

  if (statSync(controlNetImage).isDirectory()) {
    const files = readdirSync(controlNetImage);
    initImagesArray.push(...files.map((file) => resolve(controlNetImage, file)));
    //initImagesArray.push(...readFiles(initImageOrFolder, initImageOrFolder)) :
  } else {
    initImagesArray.push(controlNetImage);
  }

  return initImagesArray.map((initImage) => {
    const [first, ...rest] = controlNetArray;

    return [{ ...first, input_image: initImage }, ...rest];
  });
};

const getArraysTiledVAE = (value: 'both' | ITiledVAE | boolean | undefined): Array<ITiledVAE | undefined> => {
  if (typeof value === 'object') {
    return [value];
  }

  if (typeof value === 'boolean') {
    return [{}];
  }

  if (value === 'both') {
    return [{}, undefined];
  }

  return [value ?? ({} as ITiledVAE)];
};

const prepareQueries = (basePrompts: IPromptsResolved): IPromptSingle[] => {
  const prompts = new Map<string, IPromptSingle>();

  const isPermutation = (basePrompts.multiValueMethod ?? 'permutation') === 'permutation';

  basePrompts.prompts.forEach((basePrompt) => {
    const autoCutOffArray = getArraysBoolean(basePrompt.autoCutOff);
    const autoLCMArray = getArraysBoolean(basePrompt.autoLCM);
    const enableHighResArray = getArraysBoolean(basePrompt.enableHighRes);
    const restoreFacesArray = getArraysBoolean(basePrompt.restoreFaces);
    const tilingArray = getArraysBoolean(basePrompt.tiling);
    const tiledVAEArray = getArraysTiledVAE(basePrompt.tiledVAE);
    const ultimateSdUpscaleArray = getArraysBoolean(basePrompt.ultimateSdUpscale);

    const promptArray = Array.isArray(basePrompt.prompt) ? basePrompt.prompt : [basePrompt.prompt];
    const negativePromptArray = Array.isArray(basePrompt.negativePrompt)
      ? basePrompt.negativePrompt
      : [basePrompt.negativePrompt ?? undefined];

    const cfgArray = getArrays(basePrompt.cfg);
    const denoisingArray = getArrays(basePrompt.denoising);
    const heightArray = getArrays(basePrompt.height);
    const samplerArray = getArrays(basePrompt.sampler);
    const seedArray = getSeedArray(basePrompt.seed);
    const stepsArray = getArrays(basePrompt.steps);
    const scaleFactorsArray = getArrays(basePrompt.scaleFactor);
    const upscalerArray = getArrays(basePrompt.upscaler);
    const initImageArray = getArraysInitImage(basePrompt.initImageOrFolder);
    const vaeArray = getArrays(basePrompt.vae);
    const widthArray = getArrays(basePrompt.width);
    const clipSkipArray = getArrays(basePrompt.clipSkip);
    const stylesSetsArray = getArrays(basePrompt.stylesSets, [undefined]);
    const controlNetArray = getArraysControlNet(basePrompt.controlNet);

    const checkpointsArray = Array.isArray(basePrompt.checkpoints) ? basePrompt.checkpoints : [basePrompt.checkpoints ?? undefined];

    const tiledDiffusionArray = Array.isArray(basePrompt.tiledDiffusion)
      ? basePrompt.tiledDiffusion
      : [basePrompt.tiledDiffusion ?? undefined];

    const prepareSingleQueryParameter: IPrepareSingleQueryFromArray = {
      autoCutOffArray,
      autoLCMArray,
      cfgArray,
      checkpointsArray,
      clipSkipArray,
      controlNetArray,
      denoisingArray,
      enableHighResArray,
      heightArray,
      initImageArray,
      negativePromptArray,
      permutations: basePrompts.permutations,
      promptArray,
      restoreFacesArray,
      samplerArray,
      scaleFactorsArray,
      seedArray,
      stepsArray,
      stylesSetsArray,
      tiledDiffusionArray,
      tiledVAEArray,
      tilingArray,
      ultimateSdUpscaleArray,
      upscalerArray,
      vaeArray,
      widthArray
    };

    const results = isPermutation
      ? prepareSingleQueryPermutations(basePrompt, prepareSingleQueryParameter)
      : prepareSingleQueryRandomSelection(basePrompt, prepareSingleQueryParameter);

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
      process.exit(ExitCodes.PROMPT_INVALID_STRING_TOKEN);
    }
  });
};

export const preparePrompts = (config: IPromptsResolved): Array<IImg2ImgQuery | ITxt2ImgQuery> => {
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
      tiledDiffusion,
      tiledVAE,
      tiling,
      ultimateSdUpscale,
      upscaler,
      vae,
      width
    } = singleQuery;

    const query: IImg2ImgQuery & ITxt2ImgQuery = {
      cfg_scale: cfg,
      controlNet: [],
      denoising_strength: denoising,
      enable_hr: enableHighRes,
      height: height,
      hr_scale: scaleFactor,
      init_images: (initImage ? [getBase64Image(initImage)] : undefined) as string[],
      lcm: autoLCM ?? false,
      negative_prompt: negativePrompt,
      override_settings: {},
      prompt: prompt,
      restore_faces: restoreFaces,
      sampler_name: sampler,
      seed: seed,
      steps: steps,
      tiledDiffusion,
      tiledVAE,
      tiling,
      ultimateSdUpscale,
      width: width
    };

    const checkpoint = checkpoints ? findCheckpoint(checkpoints) : ({ version: 'unknown' } as IModel);

    const defaultValues = getDefaultQuery(checkpoint?.version ?? 'unknown', checkpoint?.accelarator ?? 'none');

    if (query.sampler_name !== undefined && defaultValues.forcedSampler && query.sampler_name !== defaultValues.forcedSampler) {
      logger(`Invalid sampler for this model (must be ${defaultValues.forcedSampler})`);
      process.exit(ExitCodes.PROMPT_INVALID_SAMPLER);
    }

    if (controlNet) {
      controlNet.forEach((controlNetPrompt) => {
        const controlNetModule = findControlnetModule(controlNetPrompt.module);
        const controlNetModel = findControlnetModel(controlNetPrompt.model);

        if (!controlNetModule) {
          logger(`Invalid ControlNet module ${controlNetPrompt.module}`);
          process.exit(ExitCodes.PROMPT_INVALID_CONTROLNET_MODULE);
        }

        if (!controlNetModel) {
          logger(`Invalid ControlNet model ${controlNetPrompt.model}`);
          process.exit(ExitCodes.PROMPT_INVALID_CONTROLNET_MODEL);
        }

        query.controlNet?.push({
          control_mode: controlNetPrompt.control_mode ?? ControlNetMode.Balanced,
          input_image: controlNetPrompt.input_image ? getBase64Image(controlNetPrompt.input_image) : undefined,
          model: controlNetModel.name,
          module: controlNetModule,
          resize_mode: controlNetPrompt.resize_mode ?? ControlNetResizes.Envelope
        });
      });
    }

    if (vae) {
      const foundVAE = findVAE(vae);
      if (foundVAE) {
        query.override_settings.sd_vae = foundVAE === 'None' ? '' : foundVAE;
      } else {
        logger(`Invalid VAE ${vae}`);
        process.exit(ExitCodes.PROMPT_INVALID_VAE);
      }
    }

    if (autoCutOff) {
      const tokens = getCutOffTokens(prompt);
      query.cutOff = {
        tokens
      };
    }

    if (isTxt2ImgQuery(query) && upscaler && typeof upscaler === 'string') {
      const foundUpscaler = findUpscaler(upscaler);

      if (foundUpscaler) {
        query.hr_upscaler = foundUpscaler.name;
      } else {
        logger(`Invalid Upscaler ${upscaler}`);
        process.exit(ExitCodes.PROMPT_INVALID_UPSCALER);
      }
    }

    if (isTxt2ImgQuery(query)) {
      if (query.enable_hr === false) {
        query.enable_hr = query.denoising_strength !== undefined || query.hr_upscaler !== undefined;
      }

      if (query.enable_hr === true) {
        query.hr_scale = 2;
        query.denoising_strength = query.denoising_strength ?? 0.5;
        query.hr_prompt = '';
        query.hr_negative_prompt = '';
      }
    } else {
      (query as ITxt2ImgQuery).enable_hr = false;
    }

    if (clipSkip) {
      query.override_settings.CLIP_stop_at_last_layers = clipSkip;
    }

    if (isTxt2ImgQuery(query) && highRes) {
      const { afterNegativePrompt, afterPrompt, beforeNegativePrompt, beforePrompt } = highRes;

      if (beforeNegativePrompt || afterNegativePrompt) {
        query.hr_negative_prompt = `${beforeNegativePrompt ?? ''},${query.negative_prompt ?? ''},${afterNegativePrompt ?? ''}`;
      }

      if (beforePrompt || afterPrompt) {
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
          process.exit(ExitCodes.PROMPT_INVALID_ADETAILER_MODEL);
        }
      });
    }

    if (checkpoints && typeof checkpoints === 'string') {
      const modelCheckpoint = findCheckpoint(checkpoints);
      if (modelCheckpoint) {
        query.override_settings.sd_model_checkpoint = modelCheckpoint.name;
      } else {
        logger(`Invalid checkpoints ${checkpoints}`);
        process.exit(ExitCodes.PROMPT_INVALID_CHECKPOINT);
      }
    }

    if (pattern) {
      query.override_settings.samples_filename_pattern = pattern;

      const allowedTokens = [
        'filename',
        'cfg',
        'checkpoint',
        'clipSkip',
        'cutOff',
        'denoising',
        'enableHighRes',
        'height',
        'restoreFaces',
        'sampler',
        'scaleFactor',
        'seed',
        'steps',
        'tiling',
        'upscaler',
        'vae',
        'width'
      ];

      const matches = pattern.match(/\{([a-z0-9_]+)\}/gi);

      if (matches) {
        matches.forEach((match) => {
          if (!allowedTokens.includes(match.replace('{', '').replace('}', ''))) {
            logger(`Invalid pattern token ${match}`);
            process.exit(ExitCodes.PROMPT_INVALID_PATTERN_TOKEN);
          }
        });
      }

      if (filename) {
        if (!query.override_settings.samples_filename_pattern.includes('{filename}')) {
          query.override_settings.samples_filename_pattern = '{filename}-' + query.override_settings.samples_filename_pattern;
        }

        updateFilename(query, 'filename', filename);
      }

      // Alias to official tokens

      updateFilename(query, 'cfg', '[cfg]');
      updateFilename(query, 'checkpoint', '[model_name]');
      updateFilename(query, 'clipSkip', '[clip_skip]');
      updateFilename(query, 'height', '[height]');
      updateFilename(query, 'seed', '[seed]');
      updateFilename(query, 'steps', '[steps]');
      updateFilename(query, 'width', '[width]');

      updateFilename(query, 'cutOff', autoCutOff !== undefined ? autoCutOff.toString() : '');
      updateFilename(query, 'denoising', denoising?.toFixed(2) ?? '');
      updateFilename(query, 'enableHighRes', enableHighRes !== undefined ? enableHighRes.toString() : '');
      updateFilename(query, 'restoreFaces', restoreFaces !== undefined ? restoreFaces.toString() : '');
      updateFilename(query, 'sampler', sampler !== undefined ? sampler.toString() : '');
      updateFilename(query, 'scaleFactor', scaleFactor?.toFixed(0) ?? '');
      updateFilename(query, 'tiling', tiling !== undefined ? tiling.toString() : '');
      updateFilename(query, 'upscaler', upscaler !== undefined ? upscaler.toString() : '');
      updateFilename(query, 'vae', vae !== undefined ? vae.toString() : '');
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
          process.exit(ExitCodes.PROMPT_INVALID_STYLE);
        }
      });
    }

    queries.push(query);
  });

  return queries;
};

export const prompts = async (config: IPromptsResolved, validateOnly: boolean) => {
  const queries = preparePrompts(config);

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
