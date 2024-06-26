import { resolve } from 'node:path';
import yargs from 'yargs';

import { addBaseCommandOptions, resolveBaseOptions } from '../commons/command';
import { Config } from '../commons/config';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { renameConfigFromCFile, renameKeyPattern } from './rename';

interface IRenameOptions {
  config?: string;
  keys?: string[];
  pattern?: string;
  source: string;
  target: string;
  test?: boolean;
}

export const command = 'rename <source> <target>';
export const describe = 'rename files from directory';
export const builder = (builder: yargs.Argv<object>) => {
  return (
    addBaseCommandOptions(builder)
      .positional('source', {
        demandOption: true,
        describe: 'source directory',
        type: 'string'
      })
      .positional('target', {
        demandOption: true,
        describe: 'target directory',
        type: 'string'
      })
      //.config()
      .options({
        config: {
          alias: 'c',
          describe: 'config',
          type: 'string'
        },
        keys: {
          alias: 'k',
          coerce: (arg?: string[]) => {
            if (!arg) {
              return [];
            }

            arg.forEach((val) => {
              if (val.split(':').length !== 2) {
                throw new Error(`You must provide a key and a value split by ":"`);
              }

              if (val.split(';').length > 2) {
                throw new Error(`You must provide only one or two values split by ";"`);
              }
            });

            return arg;
          },
          describe: 'keys to search for. Allowed formats: "key:value" or "key:value1;value2"',
          type: 'array'
        },
        pattern: {
          alias: 'p',
          describe: 'replace pattern',
          type: 'string'
        },
        test: {
          alias: 't',
          describe: 'test only',
          type: 'boolean'
        }
      })
      .fail((msg) => {
        loggerInfo(msg);
        process.exit(ExitCodes.RENAME_INVALID_PARAMS);
      })
  );
};

export const handler = (argv: IRenameOptions) => {
  const source = resolve(argv.source);
  const target = resolve(argv.target);

  resolveBaseOptions(argv);

  const initialized = Config.get('initialized');

  if (!initialized) {
    loggerInfo('Config must be initialized first');
    process.exit(ExitCodes.CONFIG_NOT_INITIALIZED);
  }

  if (argv.config) {
    renameConfigFromCFile(source, target, argv.config, argv.test ?? false);
  } else if (argv.keys && argv.pattern) {
    renameKeyPattern(source, target, argv.keys, argv.pattern, argv.test ?? false);
  } else {
    loggerInfo('Either config or keys and pattern must be provided');
    process.exit(ExitCodes.RENAME_INVALID_CONFIG);
  }
};
