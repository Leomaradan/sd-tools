import path from 'path';
import yargs from 'yargs';

import { allCheckpoints } from '../commons/checkpoints';
import { Checkpoints, ICommonRenderOptions, Upscaler } from '../commons/types';
import { upscaleTiles } from './upscaleTiles';

interface IUpscaleOptions {
  checkpoint?: string;
  scheduler?: boolean;
  source: string;
  upscaler?: string;
  upscaling?: number;
}

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

          const found = allCheckpoints.find(({ filename, full, hash }) => {
            if (full === arg) {
              return true;
            }

            if (filename !== undefined && filename === arg) {
              return true;
            }

            return hash === arg;
          });

          if (!found) {
            throw new Error(`Checkpoint ${arg} is not supported.`);
          }

          return found.full as Checkpoints;
        },
        describe: 'checkpoint',
        type: 'string'
      },
      scheduler: {
        alias: 's',
        describe: 'If set, the Agent Scheduler endpoint will be used',
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
        coerce: (arg) => {
          if (!arg) {
            return undefined;
          }

          if (arg < 1) {
            throw new Error(`Minimal upscales is 1.`);
          }

          if (arg > 8) {
            throw new Error(`Maximal upscales is 8.`);
          }

          return arg;
        },
        describe: 'upscaling factor',
        type: 'number'
      }
    })
    .fail((msg) => {
      console.log(msg);
      process.exit(1);
    });
};

export const handler = (argv: IUpscaleOptions) => {
  const source = path.resolve(argv.source);

  const options: ICommonRenderOptions = {
    checkpoint: (argv.checkpoint as Checkpoints) ?? undefined,
    scheduler: argv.scheduler ?? false,
    upscaler: (argv.upscaler as Upscaler) ?? undefined,
    upscales: argv.upscaling ?? undefined
  };

  upscaleTiles(source, options);
};
