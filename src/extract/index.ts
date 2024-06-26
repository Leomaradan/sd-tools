import { resolve } from 'node:path';
import yargs from 'yargs';

import { addBaseCommandOptions, resolveBaseOptions } from '../commons/command';
import { type IExtractOptions, type IExtractOptionsFull } from '../commons/extract';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { extract } from './extract';

export const command = 'extract <source> <format>';
export const describe = 'extract prompts from directory';
export const builder = (builder: yargs.Argv<object>) => {
  return addBaseCommandOptions(builder)
    .positional('source', {
      demandOption: true,
      describe: 'source directory',
      type: 'string'
    })
    .positional('format', {
      choices: ['textbox', 'json'],
      demandOption: true,
      describe: 'format of result',
      type: 'string'
    })
    .options({
      'add-before': {
        alias: 'a',
        describe: 'add before prompt. Use | to separate (will generate multiple prompts)',
        type: 'string'
      },
      output: {
        alias: 'o',
        describe: 'Optional output. If omitted, will print to stdout',
        type: 'string'
      },
      recursive: {
        alias: 'r',
        describe: 'Recursively extract prompts from subdirectories',
        type: 'boolean'
      }
    })
    .fail((msg) => {
      loggerInfo(msg);
      process.exit(ExitCodes.EXTRACT_INVALID_PARAMS);
    });
};

export const handler = (argv: IExtractOptionsFull) => {
  const source = resolve(argv.source);

  resolveBaseOptions(argv);

  const options: IExtractOptions = {
    addBefore: argv.addBefore ?? undefined,
    format: argv.format as 'json' | 'textbox',
    output: argv.output ?? undefined,
    recursive: argv.recursive ?? false
  };

  extract(source, options);
};
