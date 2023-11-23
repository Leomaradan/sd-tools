import path from 'path';
import yargs from 'yargs';

import { logger } from '../commons/logger';
import { IExtractOptions, IExtractOptionsFull, extract } from './extract';

export const command = 'extract <source>';
export const describe = 'extract prompts from directory';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('source', {
      demandOption: true,
      describe: 'source directory',
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
      logger(msg);
      process.exit(1);
    });
};

export const handler = (argv: IExtractOptionsFull) => {
  const source = path.resolve(argv.source);

  const options: IExtractOptions = {
    addBefore: argv.addBefore ?? undefined,
    output: argv.output ?? undefined,
    recursive: argv.recursive ?? false
  };

  extract(source, options);
};
