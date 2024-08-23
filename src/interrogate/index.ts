import { resolve } from 'node:path';
import yargs from 'yargs';

import { addBaseCommandOptions, resolveBaseOptions } from '../commons/command';
import { type IInterrogateOptions, type IInterrogateOptionsFull } from '../commons/extract';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { type InterrogateModelsAll, interrogateModelsAll } from '../commons/types';
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
      models: {
        alias: 'm',
        coerce: (models: string) => {
          if (!models || models === '') {
            return undefined;
          }

          const modelsList = models.split(',') as InterrogateModelsAll[];

          if (modelsList.every((model) => interrogateModelsAll.includes(model))) {
            return modelsList;
          }

          throw new Error(`Models must be one of the following: ${interrogateModelsAll}`);
        },
        describe: `Models to use, separated by comma. Can be anything from the following list: ${interrogateModelsAll}`,
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
      process.exit(ExitCodes.INTERROGATE_INVALID_PARAMS);
    });
};

export const handler = (argv: IInterrogateOptionsFull) => {
  const source = resolve(argv.source);

  resolveBaseOptions(argv);

  const options: IInterrogateOptions = {
    addBefore: argv.addBefore ?? undefined,
    models: argv.models ?? undefined,
    recursive: argv.recursive ?? false
  };

  interrogate(source, options);
};
