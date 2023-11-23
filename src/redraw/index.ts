import path from 'path';
import yargs from 'yargs';

import { IRedrawOptions, Upscaler } from '../commons/types';
import { redraw } from './redraw';

interface IRedrawArgsOptions {
  'add-before'?: string;
  scheduler?: boolean;
  source: string;
  style: string;
  upscaler?: string;
  upscaling?: number;
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
      scheduler: {
        alias: 's',
        describe: 'If set, the Agent Scheduler endpoint will be used',
        type: 'boolean'
      },
      upscaler: {
        alias: 'u',
        describe: 'upscaler',
        type: 'string'
      },
      upscaling: {
        alias: 'n',
        describe: 'upscales',
        type: 'number'
      }
    })
    .fail((msg) => {
      console.log(msg);
      process.exit(1);
    });
};

export const handler = (argv: IRedrawArgsOptions) => {
  const source = path.resolve(argv.source);

  const options: IRedrawOptions = {
    addToPrompt: argv['add-before'] ?? undefined,
    scheduler: argv.scheduler ?? false,
    style: argv.style as 'anime' | 'realism',
    upscaler: (argv.upscaler as Upscaler) ?? undefined,
    upscales: argv.upscaling ?? undefined
  };

  redraw(source, options);
};
