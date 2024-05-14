import path from 'node:path';
import yargs from 'yargs';

import { Config } from '../commons/config';
import { logger } from '../commons/logger';
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
    builder
      .positional('source', {
        demandOption: true,
        describe: 'source directory',
        type: 'string'
      })
      .positional('target', {
        demandOption: true,
        describe: 'source directory',
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
        logger(msg);
        process.exit(1);
      })
  );
};

export const handler = (argv: IRenameOptions) => {
  const source = path.resolve(argv.source);
  const target = path.resolve(argv.target);

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(1);
  }

  if (argv.config) {
    renameConfigFromCFile(source, target, argv.config, argv.test ?? false);
  } else if (argv.keys && argv.pattern) {
    renameKeyPattern(source, target, argv.keys, argv.pattern, argv.test ?? false);
  } else {
    logger('Either config or keys and pattern must be provided');
    process.exit(1);
  }
};
