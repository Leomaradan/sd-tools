import type { IPrepareSingleQuery, IPrepareSingleQueryFromArray } from './types';

import { type IPrompt, type IPromptSingle } from '../types';
import { prepareSingleQuery } from './prepareSingleQuery';

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

export const prepareSingleQueryPermutations = (basePrompt: IPrompt, options: IPrepareSingleQueryFromArray): [string, IPromptSingle][] => {
  let prompts: [string, IPromptSingle][] = [];
  const {
    autoCutOffArray,
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

export const prepareSingleQueryRandomSelection = (
  basePrompt: IPrompt,
  options: IPrepareSingleQueryFromArray
): [string, IPromptSingle][] => {
  const {
    autoCutOffArray,
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
