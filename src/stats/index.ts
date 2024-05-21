import path from 'node:path';
import yargs from 'yargs';

import { ExitCodes, logger } from '../commons/logger';
import { getStats } from './stats';

export const command = 'stats <source>';
export const describe = 'Get stats of generated images';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('source', {
      demandOption: true,
      describe: 'source images directory',
      type: 'string'
    })
    .fail((msg) => {
      logger(msg);
      process.exit(ExitCodes.STATS_INVALID_PARAMS);
    });
};

export const handler = (argv: { source: string }) => {
  const source = path.resolve(argv.source);

  getStats(source);
};
