import yargs from 'yargs';

import { Config, getParamBoolean } from '../commons/config.js';
import { TiledDiffusionMethods } from '../commons/extensions/multidiffusionUpscaler.js';
import { ExitCodes, logger } from '../commons/logger.js';
import { findCheckpoint, findLORA } from '../commons/models.js';
import {
  type EditableOptions,
  getConfigAutoLCM,
  getConfigAutoTiledDiffusion,
  getConfigAutoTiledVAE,
  getConfigCommonNegative,
  getConfigCommonNegativeXL,
  getConfigCommonPositive,
  getConfigCommonPositiveXL,
  getConfigCutoff,
  getConfigCutoffTokens,
  getConfigCutoffWeight,
  getConfigEndpoint,
  getConfigLCM,
  getConfigRedrawModels,
  getConfigScheduler
} from './functions.js';

interface ISetConfig {
  config: EditableOptions;
}

interface ISetConfigAutoLCM extends ISetConfig {
  config: 'auto-lcm';
  value: boolean;
}

interface ISetConfigAutoTiledDiffusion extends ISetConfig {
  config: 'auto-tiled-diffusion';
  value: TiledDiffusionMethods | false;
}

interface ISetConfigAutoTiledVAE extends ISetConfig {
  config: 'auto-tiled-vae';
  value: boolean;
}

interface ISetConfigCommonPrompt extends ISetConfig {
  config: 'common-negative' | 'common-negative-xl' | 'common-positive' | 'common-positive-xl';
  value: string;
}

interface ISetConfigCutoff extends ISetConfig {
  config: 'auto-cutoff';
  value: boolean;
}

interface ISetConfigCutoffTokens extends ISetConfig {
  config: 'cutoff-tokens';
  value: string[];
}

interface ISetConfigCutoffWeight extends ISetConfig {
  config: 'cutoff-weight';
  value: number;
}

interface ISetConfigEndpoint extends ISetConfig {
  config: 'endpoint';
  value: string;
}

interface ISetConfigLCMLoras extends ISetConfig {
  config: 'lcm';
  value: string[];
}

interface ISetConfigRedrawModels extends ISetConfig {
  config: 'redraw-models';
  value: string[];
}

interface ISetConfigScheduler extends ISetConfig {
  config: 'scheduler';
  value: boolean;
}

const options: EditableOptions[] = [
  'auto-lcm',
  'auto-tiled-diffusion',
  'auto-tiled-vae',
  'common-negative',
  'common-negative-xl',
  'common-positive',
  'common-positive-xl',
  'auto-cutoff',
  'cutoff-tokens',
  'cutoff-weight',
  'endpoint',
  'lcm',
  'redraw-models',
  'scheduler'
];

type ISetConfigOptions =
  | ISetConfigAutoLCM
  | ISetConfigAutoTiledDiffusion
  | ISetConfigAutoTiledVAE
  | ISetConfigCommonPrompt
  | ISetConfigCutoff
  | ISetConfigCutoffTokens
  | ISetConfigCutoffWeight
  | ISetConfigEndpoint
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
      process.exit(ExitCodes.CONFIG_SET_INVALID_OPTIONS);
    });
};

export const handler = (argv: ISetConfigArgsOptions) => {
  const { config, value } = argv as ISetConfigOptions;

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(ExitCodes.CONFIG_NOT_INITIALIZED);
  }

  switch (config) {
    case 'auto-lcm':
      {
        const lcm = Config.get('lcm');
        lcm.auto = getParamBoolean(value);
        Config.set('lcm', lcm);
        getConfigAutoLCM();
      }
      break;
    case 'auto-tiled-diffusion':
      if (!Config.get('extensions').includes('tiled diffusion')) {
        logger(`MultiDiffusion Upscaler extension must be installed. Re-Run "sd-tools init" after installing it`);
        process.exit(ExitCodes.CONFIG_SET_NO_MULTIDIFFUSION_INSTALLED);
      }

      if (!value || (value as string) === 'false') {
        Config.set('autoTiledDiffusion', false);
      } else if (![TiledDiffusionMethods.MixtureOfDiffusers, TiledDiffusionMethods.MultiDiffusion].includes(value)) {
        logger(
          `Value for ${config} must be either "${TiledDiffusionMethods.MixtureOfDiffusers}" or "${TiledDiffusionMethods.MultiDiffusion}"`
        );
        process.exit(ExitCodes.CONFIG_SET_INVALID_MULTIDIFFUSION);
      } else {
        Config.set('autoTiledDiffusion', value);
      }

      Config.set('autoTiledDiffusion', (value as string) === 'false' ? false : value);
      getConfigAutoTiledDiffusion();
      break;
    case 'auto-tiled-vae':
      if (!Config.get('extensions').includes('tiled vae')) {
        logger(`MultiDiffusion Upscaler extension must be installed. Re-Run "sd-tools init" after installing it`);
        process.exit(ExitCodes.CONFIG_SET_NO_MULTIDIFFUSION_INSTALLED);
      }

      Config.set('autoTiledVAE', getParamBoolean(value));
      getConfigAutoTiledVAE();
      break;
    case 'common-negative':
      Config.set('commonNegative', value);
      getConfigCommonNegative();
      break;
    case 'common-negative-xl':
      Config.set('commonNegativeXL', value);
      getConfigCommonNegativeXL();
      break;
    case 'common-positive':
      Config.set('commonPositive', value);
      getConfigCommonPositive();
      break;
    case 'common-positive-xl':
      Config.set('commonPositiveXL', value);
      getConfigCommonPositiveXL();
      break;
    case 'auto-cutoff':
      if (!Config.get('extensions').includes('cutoff')) {
        logger(`Cutoff extension must be installed. Re-Run "sd-tools init" after installing it`);
        process.exit(ExitCodes.CONFIG_SET_NO_CUTOFF_INSTALLED);
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
          process.exit(ExitCodes.CONFIG_SET_CUTOFF_INVALID_TOKEN);
        }

        if (!Config.get('extensions').includes('cutoff')) {
          logger(`Cutoff extension must be installed. Re-Run "sd-tools init" after installing it`);
          process.exit(ExitCodes.CONFIG_SET_NO_CUTOFF_INSTALLED);
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
          process.exit(ExitCodes.CONFIG_SET_CUTOFF_INVALID_WEIGHT);
        }

        if (!Config.get('extensions').includes('cutoff')) {
          logger(`Cutoff extension must be installed. Re-Run "sd-tools init" after installing it`);
          process.exit(ExitCodes.CONFIG_SET_NO_CUTOFF_INSTALLED);
        }

        Config.set('cutoffWeight', valueNumber);
        getConfigCutoffWeight();
      }
      break;
    case 'endpoint':
      Config.set('endpoint', value);
      getConfigEndpoint();
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

            const foundLora = findLORA(lora);

            return !foundLora;
          })
        ) {
          logger(`Value for ${config} contains invalid value. Values must start with "sd15:" or "sdxl:" followed by a valid lora name`);
          process.exit(ExitCodes.CONFIG_SET_LCM_INVALID_TOKEN);
        }

        const lcm = Config.get('lcm');

        valueArray.forEach((keyValue) => {
          const [category, model] = keyValue.split(':');

          const foundModel = findLORA(model);
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

            const foundModel = findCheckpoint(model);

            return !foundModel;
          })
        ) {
          logger(
            `Value for ${config} contains invalid value. Values must start with "realist15:", "realistXL:", "anime15:" or "animeXL:" followed by a valid model name`
          );
          process.exit(ExitCodes.CONFIG_SET_REDRAW_INVALID_MODELS);
        }

        const redrawModels = Config.get('redrawModels');

        valueArray.forEach((keyValue) => {
          const [category, model] = keyValue.split(':');

          const foundModel = findCheckpoint(model);
          if (foundModel) {
            redrawModels[category.toLowerCase() as keyof typeof redrawModels] = foundModel.name;
          }
        });

        Config.set('redrawModels', redrawModels);
        getConfigRedrawModels();
      }
      break;

    case 'scheduler':
      if (!Config.get('extensions').includes('scheduler')) {
        logger(`Agent Scheduler extension must be installed. Re-Run "sd-tools init" after installing it`);
        process.exit(ExitCodes.CONFIG_SET_NO_AGENT_INSTALLED);
      }

      Config.set('scheduler', getParamBoolean(value));
      getConfigScheduler();
      break;
    default:
      break;
  }
};
