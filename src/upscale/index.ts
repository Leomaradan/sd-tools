import path from 'node:path';
import yargs from 'yargs';

import { Config } from '../commons/config';
import { logger } from '../commons/logger';
import { findCheckpoint, findControlnetModel } from '../commons/models';
import { type IUpscaleOptions, type IUpscaleOptionsFull } from './types';
import { upscaleTiledDiffusion } from './upscaleTiledDiffusion';
import { upscaleTiles } from './upscaleTiles';

const OPTION_CONTROLNET = 'controlnet';
const OPTION_TILED_DIFFUSION = 'tiled-diffusion';

export const command = 'upscale <source> [method]';
export const describe = 'upscale image';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('source', {
      demandOption: true,
      describe: 'source directory',
      type: 'string'
    })
    .positional('method', {
      choices: [OPTION_CONTROLNET, OPTION_TILED_DIFFUSION],
      default: OPTION_CONTROLNET,
      demandOption: false,
      describe: 'upscaling method',
      type: 'string'
    })
    .options({
      checkpoint: {
        alias: 'c',
        coerce: (arg) => {
          if (!arg) {
            return undefined;
          }

          const foundModel = findCheckpoint(arg);

          if (!foundModel) {
            throw new Error(`Checkpoint ${arg} is not supported.`);
          }

          return foundModel.name;
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
        describe: 'upscaling factor. If multiple values are provided, multiple upscale will be generated',
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
  const { method } = argv;

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(1);
  }

  const options: IUpscaleOptions = {
    checkpoint: argv.checkpoint ?? undefined,
    denoising: argv.denoising ?? undefined,
    recursive: argv.recursive ?? false,
    upscaling: argv.upscaling ?? undefined
  };

  if (method === OPTION_CONTROLNET) {
    const hasControlnet = Config.get('extensions').includes('controlnet');

    if (!hasControlnet) {
      logger('ControlNet is required');
      process.exit(1);
    }

    const tiles = findControlnetModel('control_v11f1e_sd15_tile');
    if (!tiles) {
      logger('ControlNet Tiles model is required');
      process.exit(1);
    }

    upscaleTiles(source, options);
  }

  if (method === OPTION_TILED_DIFFUSION) {
    const hasTiledDiffusion = Config.get('extensions').includes('tiled diffusion');

    if (!hasTiledDiffusion) {
      logger('Tiled Diffusion is required');
      process.exit(1);
    }

    upscaleTiledDiffusion(source, options);
  }
};
