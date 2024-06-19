import { type IControlNet } from '../extensions/controlNet';
import { type ITiledDiffusion, type ITiledVAE } from '../extensions/multidiffusionUpscaler';
import { type ICheckpointWithVAE, type IPromptPermutations } from '../types';

export interface IPrepareSingleQuery {
  autoCutOff: boolean | undefined;
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

export interface IPrepareSingleQueryFromArray {
  autoCutOffArray: Array<boolean | undefined>;
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

export interface IResolvedPrompts {
  resolvedNegativePrompt?: string;
  resolvedPrompt: string;
  resolvedUpscalingNegativePrompt?: string;
  resolvedUpscalingPrompt?: string;
}

export type SeriesItem = { input_image?: string[] } & Omit<IControlNet, 'input_image'>;

export const PROMPT_REGEX = /\{prompt\}/i;
