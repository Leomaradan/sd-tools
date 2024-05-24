import type yargs from 'yargs';

import { mode } from './logger';

export const addBaseCommandOptions = (builder: yargs.Argv<object>) => {
  return builder
    .options({
      silent: {
        describe: 'If set, nothing will be displayed in the command line',
        type: 'boolean'
      }
    })
    .options({
      noLog: {
        default: false,
        describe: 'If set, nothing will be logged',
        type: 'boolean'
      }
    })
    .options({
      verbose: {
        describe: 'If set, more informations will be displayed in the console',
        type: 'boolean'
      }
    })
    .conflicts('silent', 'verbose');
};

export const resolveBaseOptions = (argv: unknown) => {
  const options = argv as { noLog: boolean; silent?: boolean; verbose?: boolean };

  const silent = options.silent ?? false;
  const verbose = options.verbose ?? false;

  mode.info = !silent;
  mode.verbose = verbose;
  mode.log = !options.noLog;
};
