import path from 'path';
import yargs from 'yargs';

import { Config } from '../commons/config';
import { logger } from '../commons/logger';
import { getModelCheckpoint } from '../commons/models';
import { IUpscaleOptions, IUpscaleOptionsFull, upscaleTiles } from './upscaleTiles';

export const command = 'upscale <source>';
export const describe = 'upscale image using controlnet tiles';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('source', {
      demandOption: true,
      describe: 'source directory',
      type: 'string'
    })
    .options({
      checkpoint: {
        alias: 'c',
        coerce: (arg) => {
          if (!arg) {
            return undefined;
          }

          const foundModel = getModelCheckpoint(arg);

          if (!foundModel) {
            throw new Error(`Checkpoint ${arg} is not supported.`);
          }

          return foundModel;
        },
        describe: 'checkpoint',
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

export const handler = (argv: IUpscaleOptionsFull) => {
  const source = path.resolve(argv.source);

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(1);
  }

  const options: IUpscaleOptions = {
    checkpoint: argv.checkpoint ?? undefined,
    denoising: argv.denoising ?? undefined,
    recursive: argv.recursive ?? false,
    scheduler: argv.scheduler ?? Config.get('scheduler'),
    upscaling: argv.upscaling ?? undefined
  };

  upscaleTiles(source, options);
};
