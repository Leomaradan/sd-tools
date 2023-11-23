import path from 'path';
import yargs from 'yargs';

import { rename } from './rename';

interface IRenameOptions {
  'config-file'?: string;
  keys?: any[];
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
      'config-file': {
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
      console.log(msg);
      process.exit(1);
    });
};

export const handler = (argv: IRenameOptions) => {
  const source = path.resolve(argv.source);
  const target = path.resolve(argv.target);

  if (argv['config-file']) {
    rename(source, target, argv['config-file']);
  }
};
