import path from 'path';
import yargs from 'yargs';

import { logger } from '../commons/logger';
import { rename } from './rename';

interface IRenameOptions {
  config?: string;
  keys?: unknown[];
  pattern?: string;
  source: string;
  target: string;
}

export const command = 'rename <source> <target>';
export const describe = 'rename files from directory';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
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
    .options({
      config: {
        alias: 'c',
        describe: 'config file',
        type: 'string'
      },
      keys: {
        alias: 'k',
        describe: 'keys to search for',
        type: 'array'
      },
      pattern: {
        alias: 'p',
        describe: 'replace pattern',
        type: 'string'
      }
    })
    .fail((msg) => {
      logger(msg);
      process.exit(1);
    });
};

export const handler = (argv: IRenameOptions) => {
  const source = path.resolve(argv.source);
  const target = path.resolve(argv.target);

  if (argv.config) {
    rename(source, target, argv.config);
  } else if (argv.keys && argv.pattern) {
    //rename(source, target, argv.keys, argv.pattern);
  } else {
    logger('Either config or keys and pattern must be provided');
    process.exit(1);
  }
};
