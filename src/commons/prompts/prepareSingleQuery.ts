import { type IControlNet } from '../extensions/controlNet';
import { type ITiledDiffusion, defaultTiledDiffusionOptions } from '../extensions/multidiffusionUpscaler';
import { getImageSize } from '../file';
import { type IPrompt, type IPromptPermutations, type IPromptSingle } from '../types';
import { type IPrepareSingleQuery, type IResolvedPrompts, PROMPT_REGEX } from './types';

const removePromptToken = (input: string) => {
  return input.replace(/\{prompt\}/gi, '').trim();
};

const addBefore = <T = string | undefined>(base: string | undefined, add: string | undefined, separator = ','): T => {
  if (!add) {
    return base as T;
  }

  return (base !== undefined ? `${add}${separator}${base}` : add) as T;
};

const addAfter = <T = string | undefined>(base: string | undefined, add: string | undefined, separator = ','): T => {
  if (!add) {
    return base as T;
  }

  return (base !== undefined ? `${base}${separator}${add}` : add) as T;
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

const resolvePermutations = (permutation: IPromptPermutations, prompt: IPromptSingle) => {
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
    permutedPrompt.filename = addAfter(permutedPrompt.filename, permutation.afterFilename, '');
  }

  if (permutation.beforeFilename) {
    permutedPrompt.filename = addBefore(permutedPrompt.filename, permutation.beforeFilename, '');
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
    permutedPrompt.prompt = addAfter(permutedPrompt.prompt, permutation.afterPrompt);
  }

  if (permutation.beforePrompt) {
    permutedPrompt.prompt = addBefore(permutedPrompt.prompt, permutation.beforePrompt);
  }

  if (permutation.afterNegativePrompt) {
    permutedPrompt.negativePrompt = addAfter(permutedPrompt.negativePrompt, permutation.afterNegativePrompt);
  }

  if (permutation.beforeNegativePrompt) {
    permutedPrompt.negativePrompt = addBefore(permutedPrompt.negativePrompt, permutation.beforeNegativePrompt);
  }

  return permutedPrompt;
};

const resolvePrompt = (options: IPrepareSingleQuery): IResolvedPrompts => {
  const {
    negativePrompt,
    negativePromptStyle,
    negativePromptSubject,
    prompt,
    promptStyle,
    promptSubject,
    upscalingNegativePrompt,
    upscalingPrompt
  } = options;

  let resolvedPrompt = prompt ?? '';
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

  return { resolvedNegativePrompt, resolvedPrompt, resolvedUpscalingNegativePrompt, resolvedUpscalingPrompt };
};

const resolveCheckpoint = (
  { checkpointsOption, vaeOption }: IPrepareSingleQuery,
  { resolvedNegativePrompt, resolvedPrompt }: IResolvedPrompts,
  updatedPrompt: IPrompt
) => {
  let promptText = resolvedPrompt;
  let negativePromptText = resolvedNegativePrompt;

  if (!checkpointsOption) {
    return { checkpoints: undefined, negativePromptText, promptText, updatedPrompt, vae: vaeOption };
  }

  if (typeof checkpointsOption === 'string') {
    return { checkpoints: checkpointsOption, negativePromptText, promptText, updatedPrompt, vae: vaeOption };
  }

  const vae = checkpointsOption.vae ?? vaeOption;
  const checkpoints = checkpointsOption.checkpoint;

  promptText = addAfter(promptText, checkpointsOption.addAfterPrompt);
  promptText = addBefore(promptText, checkpointsOption.addBeforePrompt);

  if (!negativePromptText && (checkpointsOption.addBeforeNegativePrompt || checkpointsOption.addAfterNegativePrompt)) {
    negativePromptText = '';
  }

  negativePromptText = addAfter(negativePromptText, checkpointsOption.addAfterNegativePrompt);
  negativePromptText = addBefore(negativePromptText, checkpointsOption.addBeforeNegativePrompt);

  if (checkpointsOption.addAfterFilename) {
    updatedPrompt.filename = addAfter(updatedPrompt.filename, checkpointsOption.addAfterFilename, '');
  }

  if (checkpointsOption.addBeforeFilename) {
    updatedPrompt.filename = addBefore(updatedPrompt.filename, checkpointsOption.addBeforeFilename, '');
  }

  return { checkpoints, negativePromptText, promptText, updatedPrompt, vae };
};

const prepareInitImage = (oldPrompt: IPromptSingle): IPromptSingle => {
  if (!oldPrompt.initImage) {
    return oldPrompt;
  }

  const prompt = { ...oldPrompt };

  const { height, width } = getImageSize(prompt.initImage as string);
  prompt.width = !prompt.width && width != -1 ? width : undefined;
  prompt.height = !prompt.height && height != -1 ? height : undefined;

  return prompt;
};

const prepareControlNet = (oldPrompt: IPromptSingle, controlNet: IControlNet[] | undefined): IPromptSingle => {
  if (!controlNet) {
    return oldPrompt;
  }

  const prompt = { ...oldPrompt };

  prompt.controlNet = controlNet;

  if (prompt.controlNet.some((controlNet) => controlNet.input_image)) {
    const firstImage = prompt.controlNet.find((controlNet) => controlNet.input_image)?.input_image;
    if (firstImage) {
      const { height, width } = getImageSize(firstImage);
      prompt.width = !prompt.width && width != -1 ? width : undefined;
      prompt.height = !prompt.height && height != -1 ? height : undefined;
    }
  }

  return prompt;
};

const prepareCountPattern = (oldPrompt: IPromptSingle, iteration: number): IPromptSingle => {
  const prompt = { ...oldPrompt };
  if (prompt.pattern?.includes('{count}')) {
    prompt.pattern = prompt.pattern.replace('{count}', String(iteration + 1));
  }

  return prompt;
};

const prepareUltimateSdUpscale = (oldPrompt: IPromptSingle, ultimateSdUpscale: boolean | undefined): IPromptSingle => {
  if (!ultimateSdUpscale) {
    return oldPrompt;
  }

  const prompt = { ...oldPrompt };

  const scaleFactor = prompt.scaleFactor ?? 2;
  prompt.ultimateSdUpscale = {
    height: scaleFactor * (prompt.height ?? 512),
    scale: scaleFactor,
    width: scaleFactor * (prompt.width ?? 512)
  };

  return prompt;
};

const prepareTiledDiffusion = (oldPrompt: IPromptSingle, tiledDiffusion: ITiledDiffusion | undefined): IPromptSingle => {
  if (!tiledDiffusion) {
    return oldPrompt;
  }

  const prompt = { ...oldPrompt };

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

  return prompt;
};

const prepareSingleQueryCount = (
  options: IPrepareSingleQuery,
  permutations: IPromptPermutations[] | undefined,
  basePrompt: IPrompt,
  resolvedPrompts: IResolvedPrompts,
  iteration: number
): [string, IPromptSingle][] => {
  const prompts: [string, IPromptSingle][] = [];
  let updatedPrompt: IPrompt = { ...basePrompt };

  const { resolvedUpscalingNegativePrompt, resolvedUpscalingPrompt } = resolvedPrompts;

  const {
    autoCutOff,
    cfg,
    clipSkip,
    controlNet,
    denoising,
    enableHighRes,
    height,
    initImage,
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
    width
  } = options;
  const stylesSet = Array.isArray(stylesSets) ? stylesSets : [stylesSets];
  const styles = Array.isArray(updatedPrompt.styles) ? updatedPrompt.styles : [updatedPrompt.styles ?? undefined];

  const resolvedCheckpoint = resolveCheckpoint(options, resolvedPrompts, updatedPrompt);

  const { checkpoints, negativePromptText, promptText, vae } = resolvedCheckpoint;
  updatedPrompt = resolvedCheckpoint.updatedPrompt;

  let prompt: IPromptSingle = {
    ...(updatedPrompt as IPromptSingle),
    autoCutOff,
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
    seed: seed !== undefined && seed !== -1 ? seed + iteration : undefined,
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

  prompt = prepareInitImage(prompt);

  prompt = prepareControlNet(prompt, controlNet);

  prompt = prepareCountPattern(prompt, iteration);

  prompt = prepareUltimateSdUpscale(prompt, ultimateSdUpscale);

  prompt = prepareTiledDiffusion(prompt, tiledDiffusion);

  prompts.push([(checkpoints ?? '') + (vae ?? '') + (upscaler ?? '') + JSON.stringify(prompt) + iteration, prompt]);

  if (permutations) {
    permutations.forEach((permutation) => {
      const result = resolvePermutations(permutation, { ...prompt });

      prompts.push([
        (result.checkpoints ?? '') + (result.vae ?? '') + (result.upscaler ?? '') + JSON.stringify(result) + iteration,
        result
      ]);
    });
  }

  return prompts;
};

export const prepareSingleQuery = (
  basePrompt: IPrompt,
  permutations: IPromptPermutations[] | undefined,
  options: IPrepareSingleQuery
): [string, IPromptSingle][] => {
  let prompts: [string, IPromptSingle][] = [];

  const resolvedPrompts = resolvePrompt(options);

  const count = basePrompt.count ?? 1;

  for (let iteration = 0; iteration < count; iteration++) {
    prompts = [...prompts, ...prepareSingleQueryCount(options, permutations, basePrompt, resolvedPrompts, iteration)];
  }

  return prompts;
};
