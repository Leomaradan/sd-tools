import path from 'node:path';
import yargs from 'yargs';

import { Config } from '../commons/config';
import { ExitCodes, logger } from '../commons/logger';
import { queueFromFile } from './queue';

interface IQueueArgsOptions {
  source: string;
  validate?: boolean;
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
      validate: {
        alias: 'v',
        default: false,
        describe: 'If set, the configuration will be validated, but no requests will be sent',
        type: 'boolean'
      }
    })
    .fail((msg) => {
      logger(msg);
      process.exit(ExitCodes.QUEUE_INVALID_PARAMS);
    });
};

export const handler = (argv: IQueueArgsOptions) => {
  const source = path.resolve(argv.source);

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(ExitCodes.CONFIG_NOT_INITIALIZED);
  }

  queueFromFile(source, argv.validate ?? false);
};
