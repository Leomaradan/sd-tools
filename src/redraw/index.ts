import { resolve } from 'node:path';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { addBaseCommandOptions, resolveBaseOptions } from '../commons/command';
import { Config } from '../commons/config';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { findUpscaler } from '../commons/models';
import { IRedrawMethod, type IRedrawOptions, IRedrawStyle, RedrawMethods, RedrawStyles } from '../commons/types';
import { redraw } from './redraw';

interface IRedrawArgsOptions {
  addAfter?: string;
  addBefore?: string;
  denoising?: number[];
  filenameRemove?: string[];
  method?: string[];
  negativePrompt?: string;
  negativePromptRemove?: string[];
  noLora?: boolean;
  noTime?: boolean;
  promptRemove?: string[];
  recursive?: boolean;
  sdxl?: boolean;
  source: string;
  style?: string[];
  upscaler?: string;
  upscaling?: number[];
}

export const command = 'redraw <source>';
export const describe = 'redraw image in specific style';
export const builder = (builder: Argv<object>) => {
  return addBaseCommandOptions(builder, true)
    .positional('source', {
      demandOption: true,
      describe: 'source directory',
      type: 'string'
    })
    .options({
      'add-after': {
        alias: 'a',
        describe: 'add after prompt',
        type: 'string'
      },
      'add-before': {
        alias: 'b',
        describe: 'add before prompt',
        type: 'string'
      },
      denoising: {
        alias: 'd',
        coerce: (arg?: number[]) => {
          if (!arg) {
            return undefined;
          }

          arg.forEach((val) => {
            if (val <= 0) {
              throw new Error(`Minimal denoising is 0.`);
            }

            if (val >= 1) {
              throw new Error(`Maximal denoising is 1.`);
            }
          });

          return arg;
        },
        describe: 'denoising factor. If multiple values are provided, multiple upscales will be generated',
        type: 'array'
      },
      filenameRemove: {
        alias: 'f',
        array: true,
        describe: 'filename text to remove from the existing configuration',
        type: 'string'
      },
      method: {
        alias: 'm',
        array: true,
        choices: RedrawMethods,
        default: ['denoise'],
        describe: 'method to draw image',
        type: 'string'
      },
      negativePrompt: {
        alias: 'n',
        describe: 'negative prompt to use instead of the existing configuration',
        type: 'string'
      },
      negativePromptRemove: {
        array: true,
        describe: 'negative prompt to remove from the existing configuration',
        type: 'string'
      },
      noLora: {
        alias: 'l',
        default: true,
        describe: 'do not use Lora models for redraw',
        type: 'boolean'
      },
      noTime: {
        alias: 't',
        default: false,
        describe: 'do not add timestamp to the output filename',
        type: 'boolean'
      },
      promptRemove: {
        alias: 'p',
        array: true,
        describe: 'prompt to remove from the existing configuration',
        type: 'string'
      },
      recursive: {
        alias: 'r',
        describe: 'Recursively upscale images from subdirectories',
        type: 'boolean'
      },
      sdxl: {
        default: true,
        describe: 'If set, the SDXL models will be used',
        type: 'boolean'
      },
      style: {
        alias: 's',
        array: true,
        choices: RedrawStyles,
        default: ['realism'],
        describe: 'style of render',
        type: 'string'
      },
      upscaler: {
        alias: 'u',
        coerce: (arg) => {
          if (!arg) {
            return undefined;
          }

          const foundUpscaler = findUpscaler(arg);

          if (!foundUpscaler) {
            throw new Error(
              `Upscaler ${arg} is not supported. Supported values are: ${Config.get('upscalers')
                .map((up) => up.name)
                .join(', ')}`
            );
          }

          return arg;
        },
        describe: 'upscaler',
        type: 'string'
      },
      upscaling: {
        alias: 'x',
        coerce: (arg?: number[]) => {
          if (!arg) {
            return undefined;
          }

          arg.forEach((val) => {
            if (val < 1) {
              throw new Error(`Minimal upscales is 1.`);
            }

            if (val > 8) {
              throw new Error(`Maximal upscales is 8.`);
            }
          });

          return arg;
        },
        describe: 'upscaling factor. If multiple values are provided, multiple upscales will be generated',
        type: 'array'
      }
    })
    .fail((msg) => {
      loggerInfo(msg);
      process.exit(ExitCodes.REDRAW_INVALID_PARAMS);
    });
};

export const handler = (argv: ArgumentsCamelCase<IRedrawArgsOptions>) => {
  const source = resolve(argv.source);

  resolveBaseOptions(argv);

  const initialized = Config.get('initialized');

  if (!initialized) {
    loggerInfo('Config must be initialized first');
    process.exit(ExitCodes.CONFIG_NOT_INITIALIZED);
  }

  const options: IRedrawOptions = {
    addAfterPrompt: argv.addAfter ?? undefined,
    addBeforePrompt: argv.addBefore ?? undefined,
    denoising: argv.denoising ?? undefined,
    filenameRemove: argv.filenameRemove?.map((item) => item.replaceAll(String.raw`\-`, '-')) ?? undefined,
    method: argv.method as IRedrawMethod[],
    negativePrompt: argv.negativePrompt,
    negativePromptRemove: argv.negativePromptRemove,
    noTime: argv.noTime ?? false,
    promptRemove: argv.promptRemove,
    recursive: argv.recursive ?? false,
    sdxl: argv.sdxl ?? true,
    style: argv.style as IRedrawStyle[],
    upscaler: argv.upscaler ?? undefined,
    upscales: argv.upscaling ?? undefined
  }; //0.55 //1

  redraw(source, options);
};
