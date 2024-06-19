import yargs from 'yargs';

import { Config } from '../commons/config';
import { TiledDiffusionMethods } from '../commons/extensions/multidiffusionUpscaler';
import { ExitCodes, loggerInfo } from '../commons/logger';
import {
  type EditableOptions,
  setConfigAutoCutoff,
  setConfigAutoTiledDiffusion,
  setConfigAutoTiledVAE,
  setConfigCommonNegative,
  setConfigCommonNegativeXL,
  setConfigCommonPositive,
  setConfigCommonPositiveXL,
  setConfigCutoffTokens,
  setConfigCutoffWeight,
  setConfigEndpoint,
  setConfigRedrawModelsCommandLine,
  setConfigScheduler
} from './functions';

interface ISetConfig {
  config: EditableOptions;
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

interface ISetConfigRedrawModels extends ISetConfig {
  config: 'redraw-models';
  value: string[];
}

interface ISetConfigScheduler extends ISetConfig {
  config: 'scheduler';
  value: boolean;
}

const options: EditableOptions[] = [
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
  'redraw-models',
  'scheduler'
];

type ISetConfigOptions =
  | ISetConfigAutoTiledDiffusion
  | ISetConfigAutoTiledVAE
  | ISetConfigCommonPrompt
  | ISetConfigCutoff
  | ISetConfigCutoffTokens
  | ISetConfigCutoffWeight
  | ISetConfigEndpoint
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
      loggerInfo(msg);
      process.exit(ExitCodes.CONFIG_SET_INVALID_OPTIONS);
    });
};

export const handler = (argv: ISetConfigArgsOptions) => {
  const { config, value } = argv as ISetConfigOptions;

  const initialized = Config.get('initialized');

  if (!initialized) {
    loggerInfo('Config must be initialized first');
    process.exit(ExitCodes.CONFIG_NOT_INITIALIZED);
  }

  switch (config) {
    case 'auto-tiled-diffusion':
      setConfigAutoTiledDiffusion(value);
      break;
    case 'auto-tiled-vae':
      setConfigAutoTiledVAE(value);
      break;
    case 'common-negative':
      setConfigCommonNegative(value);
      break;
    case 'common-negative-xl':
      setConfigCommonNegativeXL(value);
      break;
    case 'common-positive':
      setConfigCommonPositive(value);
      break;
    case 'common-positive-xl':
      setConfigCommonPositiveXL(value);
      break;
    case 'auto-cutoff':
      setConfigAutoCutoff(value);
      break;

    case 'cutoff-tokens':
      setConfigCutoffTokens(value);
      break;
    case 'cutoff-weight':
      setConfigCutoffWeight(value);
      break;
    case 'endpoint':
      setConfigEndpoint(value);
      break;

    case 'redraw-models':
      setConfigRedrawModelsCommandLine(value);
      break;

    case 'scheduler':
      setConfigScheduler(value);
      break;
    default:
      break;
  }
};
