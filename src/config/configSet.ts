import yargs from 'yargs';

import { Config, getParamBoolean } from '../commons/config.js';
import { logger } from '../commons/logger.js';
import { getModelCheckpoint, getModelLoras } from '../commons/models.js';
import {
  getConfigAddDetailerCustomModels,
  getConfigAutoLCM,
  getConfigCutoff,
  getConfigCutoffTokens,
  getConfigCutoffWeight,
  getConfigLCM,
  getConfigRedrawModels,
  getConfigScheduler
} from './functions.js';

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

interface ISetConfigLCMLoras {
  config: 'lcm';
  value: string[];
}

interface ISetConfigAutoLCM {
  config: 'auto-lcm';
  value: boolean;
}

const options = ['scheduler', 'cutoff', 'cutoff-tokens', 'cutoff-weight', 'adetailers-custom-models', 'redraw-models', 'lcm', 'auto-lcm'];

type ISetConfigOptions =
  | ISetConfigAdetailerCustomModels
  | ISetConfigAutoLCM
  | ISetConfigCutoff
  | ISetConfigCutoffTokens
  | ISetConfigCutoffWeight
  | ISetConfigLCMLoras
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
      choices: options,
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
      if (!Config.get('extensions').includes('scheduler')) {
        logger(`Agent Scheduler extension must be installed. Re-Run "sd-tools config-init" after installing it`);
        process.exit(1);
      }

      Config.set('scheduler', getParamBoolean(value));
      getConfigScheduler();
      break;
    case 'cutoff':
      if (!Config.get('extensions').includes('cutoff')) {
        logger(`Cutoff extension must be installed. Re-Run "sd-tools config-init" after installing it`);
        process.exit(1);
      }

      Config.set('cutoff', getParamBoolean(value));
      getConfigCutoff();
      break;

    case 'cutoff-tokens':
      {
        let valueArray = value;
        if (!Array.isArray(value)) {
          valueArray = (value as string).split(',');
        }

        if (valueArray.some((val) => typeof val !== 'string')) {
          logger(`Value for ${config} must be a array of string`);
          process.exit(1);
        }

        if (!Config.get('extensions').includes('cutoff')) {
          logger(`Cutoff extension must be installed. Re-Run "sd-tools config-init" after installing it`);
          process.exit(1);
        }

        Config.set('cutoffTokens', Array.from(new Set(valueArray)));
        getConfigCutoffTokens();
      }
      break;
    case 'cutoff-weight':
      {
        const valueNumber = Number(value);
        if (typeof valueNumber !== 'number' || isNaN(valueNumber)) {
          logger(`Value for ${config} must be a number`);
          process.exit(1);
        }

        if (!Config.get('extensions').includes('cutoff')) {
          logger(`Cutoff extension must be installed. Re-Run "sd-tools config-init" after installing it`);
          process.exit(1);
        }

        Config.set('cutoffWeight', valueNumber);
        getConfigCutoffWeight();
      }
      break;
    case 'adetailers-custom-models':
      {
        let valueArray = value;
        if (!Array.isArray(value)) {
          valueArray = (value as string).split(',');
        }

        if (!Config.get('extensions').includes('adetailer')) {
          logger(`Add Details extension must be installed. Re-Run "sd-tools config-init" after installing it`);
          process.exit(1);
        }

        Config.set('adetailersCustomModels', Array.from(new Set(valueArray)));
        getConfigAddDetailerCustomModels();
      }
      break;

    case 'lcm':
      {
        let valueArray = value;
        if (!Array.isArray(value)) {
          valueArray = (value as string).split(',');
        }

        if (
          valueArray.some((val) => {
            if (val.indexOf(':') === -1) {
              return true;
            }

            const [category, lora] = val.split(':');

            if (!['sd15', 'sdxl'].includes(category.toLowerCase())) {
              logger(`Category for ${config} is invalid`);
              return true;
            }

            const foundLora = getModelLoras(lora);

            return !foundLora;
          })
        ) {
          logger(`Value for ${config} contains invalid value. Values must start with "sd15:" or "sdxl:" followed by a valid lora name`);
          process.exit(1);
        }

        const lcm = Config.get('lcm');

        valueArray.forEach((keyValue) => {
          const [category, model] = keyValue.split(':');

          const foundModel = getModelLoras(model);
          if (category.toLowerCase() === 'sdxl') {
            lcm.sdxl = foundModel?.name;
          } else {
            lcm.sd15 = foundModel?.name;
          }
        });

        Config.set('lcm', lcm);
        getConfigLCM();
      }
      break;

    case 'auto-lcm':
      {
        const lcm = Config.get('lcm');
        lcm.auto = getParamBoolean(value);
        Config.set('lcm', lcm);
        getConfigAutoLCM();
      }
      break;

    case 'redraw-models':
      {
        let valueArray = value;
        if (!Array.isArray(value)) {
          valueArray = (value as string).split(',');
        }
        if (
          valueArray.some((val) => {
            if (val.indexOf(':') === -1) {
              return true;
            }

            const [category, model] = val.split(':');

            if (!['anime15', 'animexl', 'realist15', 'realistxl'].includes(category.toLocaleLowerCase())) {
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

        valueArray.forEach((keyValue) => {
          const [category, model] = keyValue.split(':');

          const foundModel = getModelCheckpoint(model);
          if (foundModel) {
            redrawModels[category.toLowerCase() as keyof typeof redrawModels] = foundModel.name;
          }
        });

        Config.set('redrawModels', redrawModels);
        getConfigRedrawModels();
      }
      break;
    default:
      break;
  }
};
