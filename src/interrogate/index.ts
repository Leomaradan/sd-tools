import { resolve } from 'node:path';
import yargs from 'yargs';

import { addBaseCommandOptions, resolveBaseOptions } from '../commons/command';
import { type IInterrogateOptions, type IInterrogateOptionsFull } from '../commons/extract';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { interrogate } from './interrogate';

export const command = 'interrogate <source>';
export const describe = 'interrogate source directory for prompts';
export const builder = (builder: yargs.Argv<object>) => {
  return addBaseCommandOptions(builder)
    .positional('source', {
      demandOption: true,
      describe: 'source directory',
      type: 'string'
    })
    .options({
      'add-before': {
        alias: 'a',
        describe: 'add before prompt. Use {filename} to insert filename without extension',
        type: 'string'
      },
      deepBooru: {
        alias: 'b',
        describe: 'Use DeepBooru to extract tags from images',
        type: 'boolean'
      },
      recursive: {
        alias: 'r',
        describe: 'Recursively extract prompts from subdirectories',
        type: 'boolean'
      }
    })
    .fail((msg) => {
      loggerInfo(msg);
      process.exit(ExitCodes.INTERROGATE_INVALID_PARAMS);
    });
};

export const handler = (argv: IInterrogateOptionsFull) => {
  const source = resolve(argv.source);

  resolveBaseOptions(argv);

  const options: IInterrogateOptions = {
    addBefore: argv.addBefore ?? undefined,
    deepBooru: argv.deepBooru ?? false,
    recursive: argv.recursive ?? false
  };

  interrogate(source, options);
};
