import yargs from 'yargs';

import { Config } from '../commons/config.js';
import { logger } from '../commons/logger.js';
import { getModelCheckpoint } from '../commons/models.js';

interface ISetConfigScheduler {
  config: 'scheduler';
  value: boolean;
}

interface ISetConfigCutoff {
  config: 'cutoff';
  value: boolean;
}

interface ISetConfigCutoffTokens {
  config: 'cutoff-tokens';
  value: string[];
}

interface ISetConfigCutoffWeight {
  config: 'cutoff-weight';
  value: number;
}

interface ISetConfigAdetailerCustomModels {
  config: 'adetailers-custom-models';
  value: string[];
}

interface ISetConfigRedrawModels {
  config: 'redraw-models';
  value: string[];
}

type ISetConfigOptions =
  | ISetConfigAdetailerCustomModels
  | ISetConfigCutoff
  | ISetConfigCutoffTokens
  | ISetConfigCutoffWeight
  | ISetConfigRedrawModels
  | ISetConfigScheduler;

interface ISetConfigArgsOptions {
  config: string;
  value: unknown;
}

export const command = 'config-set <config> <value>';
export const describe = 'set config value';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('config', {
      choices: ['scheduler', 'cutoff', 'cutoff-tokens', 'cutoff-weight'],
      demandOption: true,
      describe: 'config option to set',
      type: 'string'
    })
    .positional('value', {
      demandOption: true,
      describe: 'config value to set'
      // type: 'string',
    })
    .fail((msg) => {
      logger(msg);
      process.exit(1);
    });
};

export const handler = (argv: ISetConfigArgsOptions) => {
  const { config, value } = argv as ISetConfigOptions;

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(1);
  }

  switch (config) {
    case 'scheduler':
      if (typeof value !== 'boolean') {
        logger(`Value for ${config} must be a boolean`);
        process.exit(1);
      }

      if (!Config.get('extensions').includes('scheduler')) {
        logger(`Agent Scheduler extension must be installed. Re-Run "sd-tools config-init" after installing it`);
        process.exit(1);
      }

      Config.set('scheduler', value);
      break;
    case 'cutoff':
      if (typeof value !== 'boolean') {
        logger(`Value for ${config} must be a boolean`);
        process.exit(1);
      }

      if (!Config.get('extensions').includes('cutoff')) {
        logger(`Cutoff extension must be installed. Re-Run "sd-tools config-init" after installing it`);
        process.exit(1);
      }

      Config.set('cutoff', value);
      break;

    case 'cutoff-tokens':
      if (!Array.isArray(value) || value.some((val) => typeof val !== 'string')) {
        logger(`Value for ${config} must be a array of string`);
        process.exit(1);
      }

      if (!Config.get('extensions').includes('cutoff')) {
        logger(`Cutoff extension must be installed. Re-Run "sd-tools config-init" after installing it`);
        process.exit(1);
      }

      Config.set('cutoffTokens', value);
      break;
    case 'cutoff-weight':
      if (typeof value !== 'number') {
        logger(`Value for ${config} must be a boolean`);
        process.exit(1);
      }

      if (!Config.get('extensions').includes('cutoff')) {
        logger(`Cutoff extension must be installed. Re-Run "sd-tools config-init" after installing it`);
        process.exit(1);
      }

      Config.set('cutoffWeight', value);
      break;
    case 'adetailers-custom-models':
      if (!Array.isArray(value) || value.some((val) => typeof val !== 'string')) {
        logger(`Value for ${config} must be a array of string`);
        process.exit(1);
      }

      if (!Config.get('extensions').includes('adetailer')) {
        logger(`Add Details extension must be installed. Re-Run "sd-tools config-init" after installing it`);
        process.exit(1);
      }

      Config.set('adetailersCustomModels', value);
      break;

    case 'redraw-models':
      {
        if (!Array.isArray(value) || value.some((val) => typeof val !== 'string')) {
          logger(`Value for ${config} must be a array of string`);
          process.exit(1);
        }

        if (
          value.some((val) => {
            if (val.indexOf(':') === -1) {
              return true;
            }

            const [category, model] = val.split(':');

            if (!['anime15', 'animeXL', 'realist15', 'realistXL'].includes(category)) {
              logger(`Category for ${config} is invalid`);
              return true;
            }

            const foundModel = getModelCheckpoint(model);

            return !foundModel;
          })
        ) {
          logger(
            `Value for ${config} contains invalid value. Values must start with "realist15:", "realistXL:", "anime15:" or "animeXL:" followed by a valid model name`
          );
          process.exit(1);
        }

        const redrawModels = Config.get('redrawModels');

        value.forEach((keyValue) => {
          const [category, model] = keyValue.split(':');

          redrawModels[category as keyof typeof redrawModels] = model;
        });

        Config.set('redrawModels', redrawModels);
      }
      break;
    default:
      break;
  }
};
