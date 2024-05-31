import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, parse, relative, resolve, sep } from 'node:path';

import { Config } from './config';
import { getDefaultQuery } from './defaultQuery';
import { type IAdetailer } from './extensions/adetailer';
import {
  ControlNetMode,
  ControlNetResizes,
  type IControlNet,
  normalizeControlNetMode,
  normalizeControlNetResizes
} from './extensions/controlNet';
import { getCutOffTokens } from './extensions/cutoff';
import { type ITiledDiffusion, type ITiledVAE, defaultTiledDiffusionOptions } from './extensions/multidiffusionUpscaler';
import { getBase64Image, getImageSize } from './file';
import { ExitCodes, loggerInfo, writeLog } from './logger';
import {
  findADetailersModel,
  findCheckpoint,
  findControlnetModel,
  findControlnetModule,
  findSampler,
  findStyle,
  findUpscaler,
  findVAE
} from './models';
import { isTxt2ImgQuery, renderQuery } from './query';
import {
  type ICheckpointWithVAE,
  type IClassicPrompt,
  type IImg2ImgQuery,
  type IModel,
  type IPrompt,
  type IPromptPermutations,
  type IPromptSingle,
  type IPromptsResolved,
  type IStyle,
  type IStyleSubjectPrompt,
  type ITxt2ImgQuery
} from './types';

interface IPrepareSingleQuery {
  autoCutOff: boolean | undefined;
  autoLCM: boolean | undefined;
  cfg: number | undefined;
  checkpointsOption: ICheckpointWithVAE | string | undefined;
  clipSkip: number | undefined;
  controlNet: IControlNet[] | undefined;
  denoising: number | undefined;
  enableHighRes: boolean | undefined;
  height: number | undefined;
  initImage: string | undefined;
  negativePrompt: string | undefined;
  negativePromptStyle: string | undefined;
  negativePromptSubject: string | undefined;
  prompt: string | undefined;
  promptStyle: string | undefined;
  promptSubject: string | undefined;
  restoreFaces: boolean | undefined;
  sampler: string | undefined;
  scaleFactor: number | undefined;
  seed: number | undefined;
  steps: number | undefined;
  stylesSets: string | string[] | undefined[];
  tiledDiffusion: ITiledDiffusion | undefined;
  tiledVAE: ITiledVAE | undefined;
  tiling: boolean | undefined;
  ultimateSdUpscale: boolean | undefined;
  upscaler: string | undefined;
  upscalingNegativePrompt: string | undefined;
  upscalingPrompt: string | undefined;
  vaeOption: string | undefined;
  width: number | undefined;
}

interface IPrepareSingleQueryFromArray {
  autoCutOffArray: Array<boolean | undefined>;
  autoLCMArray: Array<boolean | undefined>;
  cfgArray: (number | undefined)[];
  checkpointsArray: Array<ICheckpointWithVAE | string | undefined>;
  clipSkipArray: (number | undefined)[];
  //controlNet?: IControlNet | IControlNet[];
  controlNetArray: Array<IControlNet[] | undefined>;
  denoisingArray: (number | undefined)[];
  enableHighResArray: Array<boolean | undefined>;
  heightArray: (number | undefined)[];
  initImageArray: (string | undefined)[];
  negativePromptArray: (string | undefined)[];
  negativePromptStyleArray: (string | undefined)[];
  negativePromptSubjectArray: (string | undefined)[];
  permutations?: IPromptPermutations[];
  promptArray: string[];
  promptStyleArray: string[];
  promptSubjectArray: string[];
  restoreFacesArray: Array<boolean | undefined>;
  samplerArray: (string | undefined)[];
  scaleFactorsArray: (number | undefined)[];
  seedArray: (number | undefined)[];
  stepsArray: (number | undefined)[];
  stylesSetsArray: Array<string | string[] | undefined[]>;
  tiledDiffusionArray: (ITiledDiffusion | undefined)[];
  tiledVAEArray: (ITiledVAE | undefined)[];
  tilingArray: Array<boolean | undefined>;
  ultimateSdUpscaleArray: Array<boolean | undefined>;
  upscalerArray: (string | undefined)[];
  upscalingNegativePromptArray: (string | undefined)[];
  upscalingPromptArray: (string | undefined)[];
  vaeArray: (string | undefined)[];
  widthArray: (number | undefined)[];
}

const PROMPT_REGEX = /\{prompt\}/i;

const removePromptToken = (input: string) => {
  return input.replace(/\{prompt\}/gi, '').trim();
};

const updateFilename = (query: IImg2ImgQuery | ITxt2ImgQuery, token: string, value: string) => {
  query.override_settings.samples_filename_pattern = (query.override_settings.samples_filename_pattern as string).replace(
    `{${token}}`,
    value
  );
};

const resolveStyleSubjectPrompt = (promptStyle: string, promptSubject: string): string => {
  const styleHasPrompt = PROMPT_REGEX.test(promptStyle);
  const subjectHasPrompt = PROMPT_REGEX.test(promptSubject);

  let mergedPrompt = `${promptSubject} BREAK ${promptStyle}`;

  if (styleHasPrompt) {
    mergedPrompt = promptStyle.replace(PROMPT_REGEX, promptSubject);
  } else if (subjectHasPrompt) {
    mergedPrompt = promptSubject.replace(PROMPT_REGEX, promptStyle);
  }

  mergedPrompt = removePromptToken(mergedPrompt);

  return mergedPrompt;
};

const resolvePermutations = (permutation: IPromptPermutations, prompt: IPromptSingle, updatedPrompt: IPrompt) => {
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
    permutedPrompt.filename = updatedPrompt.filename ? `${updatedPrompt.filename}${permutation.afterFilename}` : permutation.afterFilename;
  }

  if (permutation.beforeFilename) {
    permutedPrompt.filename = updatedPrompt.filename
      ? `${permutation.beforeFilename}${updatedPrompt.filename}`
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
    permutedPrompt.prompt = permutedPrompt.prompt ? `${permutation.beforePrompt}, ${permutedPrompt.prompt}` : permutation.beforePrompt;
  }

  return permutedPrompt;
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
    negativePromptStyle,
    negativePromptSubject,
    prompt: promptOption,
    promptStyle,
    promptSubject,
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
    upscalingNegativePrompt,
    upscalingPrompt,
    vaeOption,
    width
  } = options;

  const updatedPrompt: IPrompt = { ...basePrompt };

  const prompts: [string, IPromptSingle][] = [];

  let resolvedPrompt = promptOption ?? '';
  let resolvedNegativePrompt = negativePrompt;
  let resolvedUpscalingPrompt = upscalingPrompt;
  let resolvedUpscalingNegativePrompt = upscalingNegativePrompt;

  if (promptStyle !== undefined && promptSubject !== undefined) {
    resolvedPrompt = resolveStyleSubjectPrompt(promptStyle, promptSubject);

    resolvedUpscalingPrompt = removePromptToken(promptSubject);

    // Force removing negative prompt to ensure only "new" style+subject negative prompt is used
    resolvedNegativePrompt = undefined;
  }

  if (negativePromptStyle !== undefined && negativePromptSubject !== undefined) {
    resolvedNegativePrompt = resolveStyleSubjectPrompt(negativePromptStyle, negativePromptSubject);

    resolvedUpscalingNegativePrompt = removePromptToken(negativePromptSubject);
  }

  const count = updatedPrompt.count ?? 1;

  for (let i = 0; i < count; i++) {
    const stylesSet = Array.isArray(stylesSets) ? stylesSets : [stylesSets];
    const styles = Array.isArray(updatedPrompt.styles) ? updatedPrompt.styles : [updatedPrompt.styles ?? undefined];

    let vae = vaeOption;
    let checkpoints;

    let promptText = resolvedPrompt;
    let negativePromptText = resolvedNegativePrompt;

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
          updatedPrompt.filename = updatedPrompt.filename
            ? `${updatedPrompt.filename}${checkpointsOption.addAfterFilename}`
            : checkpointsOption.addAfterFilename;
        }

        if (checkpointsOption.addBeforeFilename) {
          updatedPrompt.filename = updatedPrompt.filename
            ? `${checkpointsOption.addBeforeFilename}${updatedPrompt.filename}`
            : checkpointsOption.addBeforeFilename;
        }
      }
    }

    const prompt: IPromptSingle = {
      ...(updatedPrompt as IPromptSingle),
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
      pattern: updatedPrompt.pattern,
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
      upscalingNegativePrompt: resolvedUpscalingNegativePrompt,
      upscalingPrompt: resolvedUpscalingPrompt,
      vae,
      width
    };

    if (prompt.initImage) {
      const { height, width } = getImageSize(prompt.initImage);
      prompt.width = !prompt.width && width != -1 ? width : undefined;
      prompt.height = !prompt.height && height != -1 ? height : undefined;
    }

    if (controlNet) {
      prompt.controlNet = controlNet;

      if (prompt.controlNet.some((controlNet) => controlNet.input_image)) {
        const firstImage = prompt.controlNet.find((controlNet) => controlNet.input_image)?.input_image;
        if (firstImage) {
          const { height, width } = getImageSize(firstImage);
          prompt.width = !prompt.width && width != -1 ? width : undefined;
          prompt.height = !prompt.height && height != -1 ? height : undefined;
        }
      }
    }

    if (prompt.pattern?.includes('{count}')) {
      prompt.pattern = prompt.pattern.replace('{count}', String(i + 1));
    }

    if (ultimateSdUpscale) {
      const scaleFactor = prompt.scaleFactor ?? 2;
      prompt.ultimateSdUpscale = {
        height: scaleFactor * (prompt.height ?? 512),
        scale: scaleFactor,
        width: scaleFactor * (prompt.width ?? 512)
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

      if (prompt.pattern?.includes('{scaleFactor}')) {
        prompt.pattern = prompt.pattern.replace('{scaleFactor}', String(prompt.scaleFactor));
      }

      delete prompt.scaleFactor;
    }

    prompts.push([(checkpoints ?? '') + (vae ?? '') + (upscaler ?? '') + JSON.stringify(prompt) + i, prompt]);

    if (permutations) {
      permutations.forEach((permutation) => {
        const result = resolvePermutations(permutation, { ...prompt }, updatedPrompt);

        prompts.push([(result.checkpoints ?? '') + (result.vae ?? '') + (result.upscaler ?? '') + JSON.stringify(result) + i, result]);
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
    negativePromptStyleArray,
    negativePromptSubjectArray,
    permutations,
    promptArray,
    promptStyleArray,
    promptSubjectArray,
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
    upscalingNegativePromptArray,
    upscalingPromptArray,
    vaeArray,
    widthArray
  } = options;

  // Initial value NEED to be not empty
  let permutationsArray: Partial<IPrepareSingleQuery>[] = promptArray.map((prompt) => ({ prompt }));

  // If there is no prompt, we are on the style-subject prompt format
  if (permutationsArray.length === 0) {
    permutationsArray = promptStyleArray.map((prompt) => ({ prompt }));
  } else {
    permutationsArray = getPermutations(permutationsArray, promptStyleArray, 'promptStyle');
  }

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
  permutationsArray = getPermutations(permutationsArray, negativePromptStyleArray, 'negativePromptStyle');
  permutationsArray = getPermutations(permutationsArray, negativePromptSubjectArray, 'negativePromptSubject');
  permutationsArray = getPermutations(permutationsArray, promptSubjectArray, 'promptSubject');
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
  permutationsArray = getPermutations(permutationsArray, upscalingPromptArray, 'upscalingPrompt');
  permutationsArray = getPermutations(permutationsArray, upscalingNegativePromptArray, 'upscalingNegativePrompt');
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
        negativePromptStyle: permutationItem.negativePromptStyle,
        negativePromptSubject: permutationItem.negativePromptSubject,
        prompt: permutationItem.prompt,
        promptStyle: permutationItem.promptStyle,
        promptSubject: permutationItem.promptSubject,
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
        upscalingNegativePrompt: permutationItem.upscalingNegativePrompt,
        upscalingPrompt: permutationItem.upscalingPrompt,
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
    controlNetArray,
    denoisingArray,
    enableHighResArray,
    heightArray,
    initImageArray,
    negativePromptArray,
    negativePromptStyleArray,
    negativePromptSubjectArray,
    permutations,
    promptArray,
    promptStyleArray,
    promptSubjectArray,
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
    upscalingNegativePromptArray,
    upscalingPromptArray,
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
  const controlNet = pickRandomItem(controlNetArray);
  const upscalingPrompt = pickRandomItem(upscalingPromptArray);
  const upscalingNegativePrompt = pickRandomItem(upscalingNegativePromptArray);
  const negativePromptStyle = pickRandomItem(negativePromptStyleArray);
  const negativePromptSubject = pickRandomItem(negativePromptSubjectArray);
  const promptStyle = pickRandomItem(promptStyleArray);
  const promptSubject = pickRandomItem(promptSubjectArray);

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
    negativePromptStyle,
    negativePromptSubject,
    prompt,
    promptStyle,
    promptSubject,
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
    upscalingNegativePrompt,
    upscalingPrompt,
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

    if (first === undefined || Number.isNaN(first) || last === undefined || Number.isNaN(last)) {
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

const getArraysBoolean = (value: 'both' | boolean | undefined): [undefined] | boolean[] => {
  if (value === 'both') {
    return [true, false];
  }

  if (value === undefined) {
    return [undefined];
  }

  return [value];
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

type SeriesItem = { input_image?: string[] } & Omit<IControlNet, 'input_image'>;

const cartesianProduct = <T>(...arrays: T[][]): T[][] => {
  return arrays.reduce((acc, curr) => acc.flatMap((arr) => curr.map((item) => [...arr, item])), [[]] as T[][]);
};

const permuteSeries = (series: SeriesItem[]): IControlNet[][] => {
  // Helper function to compute the cartesian product of arrays

  // Extract all image arrays
  const imageArrays = series.map((item) => item.input_image as string[]);

  // Generate the cartesian product of all image arrays
  const combinations = cartesianProduct(...imageArrays);

  // Map each combination back to the series structure
  return combinations.map((combination) =>
    combination.map((image, index) => ({
      ...series[index],
      image_name: relative(series[index].image_name ?? '', image).replace(sep, '-'),
      input_image: image
    }))
  );
};

export const getArraysControlNet = (value: IControlNet | IControlNet[] | undefined): Array<IControlNet[] | undefined> => {
  if (value === undefined) {
    return [undefined];
  }

  const controlNetArray = Array.isArray(value) ? value : [value];

  const noImages = controlNetArray.every((controlNet) => !controlNet.input_image);

  if (noImages) {
    return [controlNetArray];
  }

  const noDirectories = controlNetArray.every((controlNet) => !controlNet.input_image || !statSync(controlNet.input_image).isDirectory());

  if (noDirectories) {
    return [
      controlNetArray.map((controlNet) => {
        if (!controlNet.input_image) {
          return controlNet;
        }

        const initImage = controlNet.input_image;
        const initImageBase = dirname(initImage);
        const promptFile = resolve(initImageBase, `${parse(initImage).name}.txt`);
        let prompt: string | undefined;

        if (existsSync(promptFile)) {
          prompt = readFileSync(promptFile, 'utf-8').replace(/\n/g, '').trim();
        }

        return { ...controlNet, image_name: relative(initImageBase, initImage).replace(sep, '-'), input_image: initImage, prompt };
      })
    ];
  }

  const temporaryControlNetArray: Array<{ input_image?: string[] } & Omit<IControlNet, 'input_image'>> = [];

  controlNetArray.forEach((controlNet) => {
    const controlNetImage = controlNet.input_image;

    if (!controlNetImage) {
      temporaryControlNetArray.push({ ...controlNet, input_image: [''] });
      return;
    }

    let initImageBase = dirname(controlNetImage);

    if (statSync(controlNetImage).isDirectory()) {
      initImageBase = resolve(controlNetImage, '..');
      let files = readdirSync(controlNetImage);

      if (controlNet.regex) {
        files = files.filter((file) => new RegExp(controlNet.regex as string).test(file));
      }

      files = files.filter((file) => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));

      if (files.length === 0) {
        files = [''];
      }

      temporaryControlNetArray.push({
        ...controlNet,
        image_name: initImageBase,
        input_image: files.map((file) => resolve(controlNetImage, file))
      });
    } else {
      temporaryControlNetArray.push({ ...controlNet, image_name: initImageBase, input_image: [controlNetImage] });
    }
  });

  const result = permuteSeries(temporaryControlNetArray);

  return result.map((current) => {
    return current.map((controlNet) => {
      const controlNetNormalized = {
        ...controlNet,
        image_name: controlNet.image_name ? controlNet.image_name : undefined,
        input_image: controlNet.input_image ? controlNet.input_image : undefined
      };

      if (controlNetNormalized.input_image) {
        const promptFile = resolve(dirname(controlNetNormalized.input_image), `${parse(controlNetNormalized.input_image).name}.txt`);

        if (existsSync(promptFile)) {
          controlNetNormalized.prompt = readFileSync(promptFile, 'utf-8').replace(/\n/g, '').trim();
        }
      }

      return controlNetNormalized;
    });
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

    const promptArray = getArrays((basePrompt as IClassicPrompt).prompt);
    const negativePromptArray = getArrays((basePrompt as IClassicPrompt).negativePrompt);
    const upscalingPromptArray = getArrays((basePrompt as IClassicPrompt).upscalingPrompt);
    const upscalingNegativePromptArray = getArrays((basePrompt as IClassicPrompt).upscalingNegativePrompt);

    const promptStyleArray = getArrays((basePrompt as IStyleSubjectPrompt).promptStyle);
    const promptSubjectArray = getArrays((basePrompt as IStyleSubjectPrompt).promptSubject);
    const negativePromptStyleArray = getArrays((basePrompt as IStyleSubjectPrompt).negativePromptStyle);
    const negativePromptSubjectArray = getArrays((basePrompt as IStyleSubjectPrompt).negativePromptSubject);

    // const negativePromptArray = getArrays(basePrompt.negativePrompt)

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
      negativePromptStyleArray,
      negativePromptSubjectArray,
      permutations: basePrompts.permutations,
      promptArray,
      promptStyleArray,
      promptSubjectArray,
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
      upscalingNegativePromptArray,
      upscalingPromptArray,
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
      loggerInfo(`Invalid token ${match} in ${template}`);
      process.exit(ExitCodes.PROMPT_INVALID_STRING_TOKEN);
    }
  });
};

export const preparePrompts = (config: IPromptsResolved): Array<IImg2ImgQuery | ITxt2ImgQuery> => {
  const queries: Array<IImg2ImgQuery | ITxt2ImgQuery> = [];

  const queriesArray = prepareQueries(config);

  const autoAdetailers = Config.get('autoAdetailers');
  const autoControlnetPose = Config.get('autoControlnetPose');

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
      upscalingNegativePrompt,
      upscalingPrompt,
      vae,
      width
    } = singleQuery;

    let query: IImg2ImgQuery & ITxt2ImgQuery = {
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
      loggerInfo(`Invalid sampler for this model (must be ${defaultValues.forcedSampler})`);
      process.exit(ExitCodes.PROMPT_INVALID_SAMPLER);
    }

    if (controlNet) {
      controlNet.forEach((controlNetPrompt) => {
        const controlNetModule = findControlnetModule(controlNetPrompt.module);
        const controlNetModel = findControlnetModel(controlNetPrompt.model);

        if (!controlNetModule) {
          loggerInfo(`Invalid ControlNet module ${controlNetPrompt.module}`);
          process.exit(ExitCodes.PROMPT_INVALID_CONTROLNET_MODULE);
        }

        if (!controlNetModel) {
          loggerInfo(`Invalid ControlNet model ${controlNetPrompt.model}`);
          process.exit(ExitCodes.PROMPT_INVALID_CONTROLNET_MODEL);
        }

        if (!query.controlNet) {
          query.controlNet = [];
        }

        if (controlNetPrompt.prompt) {
          if (PROMPT_REGEX.test(controlNetPrompt.prompt)) {
            query.prompt = controlNetPrompt.prompt.replace(PROMPT_REGEX, query.prompt);
            query.prompt = removePromptToken(query.prompt);
          } else {
            query.prompt += `, ${controlNetPrompt.prompt}`;
          }
        }

        query.controlNet.push({
          control_mode: normalizeControlNetMode(controlNetPrompt.control_mode ?? ControlNetMode.Balanced),
          image_name: controlNetPrompt.image_name ?? controlNetPrompt.input_image,
          input_image: controlNetPrompt.input_image ? getBase64Image(controlNetPrompt.input_image) : undefined,
          model: controlNetModel.name,
          module: controlNetModule,
          resize_mode: normalizeControlNetResizes(controlNetPrompt.resize_mode ?? ControlNetResizes.Envelope)
        });
      });
    }

    const findPose = autoControlnetPose.filter((pose) => query.prompt.includes(`!pose:${pose.trigger}`));
    if (findPose.length > 1) {
      loggerInfo(`Multiple controlnet poses found in prompt`);
      process.exit(ExitCodes.PROMPT_INVALID_CONTROLNET_POSE);
    }

    if (findPose.length === 1) {
      const pose = findPose[0];

      query.prompt = query.prompt.replace(`!pose:${pose.trigger}`, '');

      if (query.controlNet === undefined) {
        query.controlNet = [];
      }

      const findExistingPose = query.controlNet.find((controlNet) => controlNet.model.includes('openpose'));

      if (!findExistingPose) {
        const model = (
          checkpoint?.version === 'sdxl' ? findControlnetModel('xl_openpose', 'xl_dw_openpose') : findControlnetModel('sd15_openpose')
        )?.name;

        if (model && existsSync(pose.pose)) {
          if (pose.beforePrompt || pose.afterPrompt) {
            query.prompt = `${pose.beforePrompt ?? ''},${query.prompt},${pose.afterPrompt ?? ''}`;
          }

          query.controlNet.push({
            control_mode: ControlNetMode.Balanced,
            image_name: pose.pose,
            input_image: getBase64Image(pose.pose),
            model,
            module: 'none',
            resize_mode: ControlNetResizes.Envelope
          });
        }
      }
    }

    if (sampler) {
      const foundSampler = findSampler(sampler);
      if (foundSampler) {
        query.sampler_name = foundSampler.name;
      } else {
        loggerInfo(`Invalid Sampler ${sampler}`);
        process.exit(ExitCodes.PROMPT_INVALID_SAMPLER);
      }
    }

    if (vae) {
      const foundVAE = findVAE(vae);
      if (foundVAE) {
        query.override_settings.sd_vae = foundVAE === 'None' ? '' : foundVAE;
      } else {
        loggerInfo(`Invalid VAE ${vae}`);
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
        loggerInfo(`Invalid Upscaler ${upscaler}`);
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
        query.hr_prompt = upscalingPrompt ?? '';
        query.hr_negative_prompt = upscalingNegativePrompt ?? '';
      }
    } else {
      (query as ITxt2ImgQuery).enable_hr = false;
    }

    if (clipSkip) {
      query.override_settings.CLIP_stop_at_last_layers = clipSkip;
    }

    if (isTxt2ImgQuery(query) && highRes) {
      const { afterNegativePrompt, afterPrompt, beforeNegativePrompt, beforePrompt } = highRes;

      query.hr_negative_prompt = `${beforeNegativePrompt ?? ''},${upscalingNegativePrompt ?? query.negative_prompt ?? ''},${afterNegativePrompt ?? ''}`;

      query.hr_prompt = `${beforePrompt ?? ''},${upscalingPrompt ?? query.prompt ?? ''},${afterPrompt ?? ''}`;
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
            ad_confidence: adetailer.confidence,
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
          loggerInfo(`Invalid Adetailer model ${adetailer.model}`);
          process.exit(ExitCodes.PROMPT_INVALID_ADETAILER_MODEL);
        }
      });
    }

    const allAdTriggers = (query.prompt.match(/!ad:([a-z0-9]+)/gi) ?? []) as string[];
    const globalAdTriggers = query.prompt.match(/!ad( |,|$)/gi);

    if (allAdTriggers.length > 0 || globalAdTriggers) {
      query.prompt = query.prompt.replace(/!ad:([a-z0-9]+)/gi, '');
      query.prompt = query.prompt.replace(/!ad( |,|$)/gi, '');
      autoAdetailers.forEach((autoAdetailer) => {
        const trigger = `!ad:${autoAdetailer.trigger}`;
        if (allAdTriggers.includes(trigger) || globalAdTriggers) {
          if (query.adetailer === undefined) {
            query.adetailer = [];
          }

          const existing = query.adetailer.find((adetailer) => adetailer.ad_model === autoAdetailer.ad_model);
          if (!existing) {
            query.adetailer.push(autoAdetailer);
          }
        }
      });
    }

    if (checkpoints && typeof checkpoints === 'string') {
      const modelCheckpoint = findCheckpoint(checkpoints);
      if (modelCheckpoint) {
        query.override_settings.sd_model_checkpoint = modelCheckpoint.name;
      } else {
        loggerInfo(`Invalid checkpoints ${checkpoints}`);
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
        'width',
        'pose'
      ];

      const matches = pattern.match(/\{([a-z0-9_]+)\}/gi);

      if (matches) {
        matches.forEach((match) => {
          if (!allowedTokens.includes(match.replace('{', '').replace('}', ''))) {
            loggerInfo(`Invalid pattern token ${match}`);
            process.exit(ExitCodes.PROMPT_INVALID_PATTERN_TOKEN);
          }
        });
      }

      if (filename && !query.override_settings.samples_filename_pattern.includes('{filename}')) {
        query.override_settings.samples_filename_pattern = '{filename}-' + query.override_settings.samples_filename_pattern;
      }

      updateFilename(query, 'filename', filename ?? '');

      const findExistingPose = query.controlNet?.find((controlNet) => controlNet.model.includes('openpose'));

      // Alias to official tokens
      updateFilename(query, 'cfg', query.cfg_scale !== undefined ? '[cfg]' : '');
      updateFilename(query, 'checkpoint', query.override_settings.sd_model_checkpoint !== undefined ? '[model_name]' : '');
      updateFilename(query, 'clipSkip', query.override_settings.CLIP_stop_at_last_layers !== undefined ? '[clip_skip]' : '');
      updateFilename(query, 'height', query.height !== undefined ? '[height]' : '');
      updateFilename(query, 'seed', query.seed !== undefined ? '[seed]' : '');
      updateFilename(query, 'steps', query.steps !== undefined ? '[steps]' : '');
      updateFilename(query, 'width', query.width !== undefined ? '[width]' : '');

      updateFilename(query, 'cutOff', autoCutOff !== undefined ? autoCutOff.toString() : '');
      updateFilename(query, 'denoising', query.denoising_strength?.toFixed(2) ?? '');
      updateFilename(query, 'enableHighRes', enableHighRes !== undefined ? enableHighRes.toString() : '');
      updateFilename(query, 'pose', findExistingPose?.image_name ? findExistingPose.image_name.toString() : '');
      updateFilename(query, 'restoreFaces', query.restore_faces !== undefined ? query.restore_faces.toString() : '');
      updateFilename(query, 'sampler', query.sampler_name !== undefined ? query.sampler_name.toString() : '');
      updateFilename(query, 'scaleFactor', scaleFactor?.toFixed(0) ?? '');
      updateFilename(query, 'tiling', tiling !== undefined ? tiling.toString() : '');
      updateFilename(query, 'upscaler', query.hr_upscaler !== undefined ? query.hr_upscaler.toString() : '');
      updateFilename(query, 'vae', query.override_settings.sd_vae !== undefined ? query.override_settings.sd_vae.toString() : '');
    } else if (filename) {
      query.override_settings.samples_filename_pattern = `${filename}-[datetime]`;
    }

    if (query.override_settings.samples_filename_pattern) {
      validateTemplate(query.override_settings.samples_filename_pattern);
      query.override_settings.samples_filename_pattern = query.override_settings.samples_filename_pattern.trim();
    }

    if (styles && styles.length > 0) {
      styles.forEach((styleName) => {
        if (!styleName) {
          return;
        }

        const foundStyle = findStyle(styleName);

        if (!foundStyle) {
          loggerInfo(`Invalid Style ${styleName}`);
          process.exit(ExitCodes.PROMPT_INVALID_STYLE);
        }

        query = resolveStyles(query, foundStyle);
      });
    }

    queries.push(query);
  });

  return queries;
};

const resolveStyles = (query: IImg2ImgQuery & ITxt2ImgQuery, foundStyle: IStyle): IImg2ImgQuery & ITxt2ImgQuery => {
  const updatedQuery = { ...query };

  if (!updatedQuery.styles) {
    updatedQuery.styles = [];
  }

  updatedQuery.styles.push(foundStyle.name);

  if (foundStyle.prompt) {
    if (PROMPT_REGEX.test(foundStyle.prompt)) {
      updatedQuery.prompt = foundStyle.prompt.replace(PROMPT_REGEX, updatedQuery.prompt);
      updatedQuery.prompt = removePromptToken(updatedQuery.prompt);
    } else {
      updatedQuery.prompt = `${updatedQuery.prompt}, ${foundStyle.prompt}`;
    }
  }

  if (foundStyle.negativePrompt) {
    if (PROMPT_REGEX.test(foundStyle.negativePrompt)) {
      updatedQuery.negative_prompt = foundStyle.negativePrompt.replace(PROMPT_REGEX, updatedQuery.negative_prompt ?? '');
      updatedQuery.negative_prompt = removePromptToken(updatedQuery.negative_prompt ?? '');
    } else {
      updatedQuery.negative_prompt = `${updatedQuery.negative_prompt ?? ''}, ${foundStyle.negativePrompt}`;
    }
  }

  return updatedQuery;
};

export const prompts = async (config: IPromptsResolved, validateOnly: boolean) => {
  const queries = preparePrompts(config);

  loggerInfo(`Your configuration seems valid. ${queries.length} queries has been generated.`);
  if (validateOnly) {
    writeLog({ queries }, true);
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
