import path from 'path';
import yargs from 'yargs';

import { Config } from '../commons/config';
import { logger } from '../commons/logger';
import { queue } from './queue';

interface IQueueArgsOptions {
  scheduler?: boolean;
  source: string;
}

export const command = 'queue <source>';
export const describe = 'queue image using a json file';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('source', {
      demandOption: true,
      describe: 'source json',
      type: 'string'
    })
    .options({
      scheduler: {
        alias: 's',
        describe: 'If set, the Agent Scheduler endpoint will be used',
        type: 'boolean'
      }
    })
    .fail((msg) => {
      logger(msg);
      process.exit(1);
    });
};

export const handler = (argv: IQueueArgsOptions) => {
  const source = path.resolve(argv.source);

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(1);
  }

  queue(source, argv.scheduler ?? Config.get('scheduler'));
};
