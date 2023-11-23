import path from 'path';
import yargs from 'yargs';

import { logger } from '../commons/logger';
import { IRedrawOptions, Upscaler } from '../commons/types';
import { redraw } from './redraw';

interface IRedrawArgsOptions {
  'add-before'?: string;
  denoising?: number[];
  recursive?: boolean;
  scheduler?: boolean;
  sdxl?: boolean;
  source: string;
  style: string;
  upscaler?: string;
  upscaling?: number[];
}

export const command = 'redraw <source> <style>';
export const describe = 'redraw image in specific style';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('source', {
      demandOption: true,
      describe: 'source directory',
      type: 'string'
    })
    .positional('style', {
      choices: ['realism', 'anime'],
      demandOption: true,
      describe: 'source directory',
      type: 'string'
    })
    .options({
      'add-before': {
        alias: 'a',
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
      recursive: {
        alias: 'r',
        describe: 'Recursively upscale images from subdirectories',
        type: 'boolean'
      },
      scheduler: {
        alias: 's',
        describe: 'If set, the Agent Scheduler endpoint will be used',
        type: 'boolean'
      },
      sdxl: {
        describe: 'If set, the SDXL models will be used',
        type: 'boolean'
      },
      upscaler: {
        alias: 'u',
        coerce: (arg) => {
          if (!arg) {
            return undefined;
          }

          if (!Object.values(Upscaler).includes(arg as Upscaler)) {
            throw new Error(`Upscaler ${arg} is not supported. Supported values are: ${Object.values(Upscaler).join(', ')}`);
          }

          return arg as Upscaler;
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
      logger(msg);
      process.exit(1);
    });
};

export const handler = (argv: IRedrawArgsOptions) => {
  const source = path.resolve(argv.source);

  const options: IRedrawOptions = {
    addToPrompt: argv['add-before'] ?? undefined,
    denoising: argv.denoising ?? undefined,
    recursive: argv.recursive ?? false,
    scheduler: argv.scheduler ?? false,
    sdxl: argv.sdxl ?? false,
    style: argv.style as 'anime' | 'realism',
    upscaler: (argv.upscaler as Upscaler) ?? undefined,
    upscales: argv.upscaling ?? undefined
  }; //0.55 //1

  redraw(source, options);
};
