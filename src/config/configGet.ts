import yargs from 'yargs';

import { Config } from '../commons/config.js';
import { logger } from '../commons/logger.js';
import {
  getConfigAddDetailerCustomModels,
  getConfigCommonNegative,
  getConfigCommonNegativeXL,
  getConfigCommonPositive,
  getConfigControlnetModels,
  getConfigControlnetModules,
  getConfigCutoff,
  getConfigCutoffTokens,
  getConfigCutoffWeight,
  getConfigEmbeddings,
  getConfigExtensions,
  getConfigLoras,
  getConfigModels,
  getConfigRedrawModels,
  getConfigSamplers,
  getConfigScheduler,
  getConfigUpscalers,
  getConfigVAE
} from './functions.js';

type Options =
  | 'adetailers-custom-models'
  | 'common-negative'
  | 'common-negative-xl'
  | 'common-positive'
  | 'common-positive-xl'
  | 'controlnet-models'
  | 'controlnet-modules'
  | 'cutoff'
  | 'cutoff-tokens'
  | 'cutoff-weight'
  | 'embeddings'
  | 'extensions'
  | 'loras'
  | 'models'
  | 'redraw-models'
  | 'samplers'
  | 'scheduler'
  | 'upscalers'
  | 'vae';

const options = [
  'adetailers-custom-models',
  'common-negative',
  'common-negative-xl',
  'common-positive',
  'common-positive-xl',
  'controlnet-models',
  'controlnet-modules',
  'cutoff',
  'cutoff-tokens',
  'cutoff-weight',
  'embeddings',
  'extensions',
  'loras',
  'models',
  'samplers',
  'scheduler',
  'upscalers',
  'vae',
  'redraw-models'
];

export const command = 'config-get <config>';
export const describe = 'get config value';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('config', {
      choices: options,
      demandOption: true,
      describe: 'config option to set',
      type: 'string'
    })
    .fail((msg) => {
      logger(msg);
      process.exit(1);
    });
};

export const handler = (argv: { config: string }) => {
  const { config } = argv as { config: Options };

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(1);
  }

  switch (config) {
    case 'adetailers-custom-models':
      getConfigAddDetailerCustomModels();
      break;
    case 'common-negative':
      getConfigCommonNegative();
      break;
    case 'common-negative-xl':
      getConfigCommonNegativeXL();
      break;
    case 'common-positive':
      getConfigCommonPositive();
      break;
    case 'common-positive-xl':
      getConfigCommonNegativeXL();
      break;
    case 'controlnet-models':
      getConfigControlnetModels();
      break;
    case 'controlnet-modules':
      getConfigControlnetModules();
      break;
    case 'cutoff':
      getConfigCutoff();
      break;
    case 'cutoff-tokens':
      getConfigCutoffTokens();
      break;
    case 'cutoff-weight':
      getConfigCutoffWeight();
      break;
    case 'embeddings':
      getConfigEmbeddings();
      break;
    case 'extensions':
      getConfigExtensions();
      break;
    case 'loras':
      getConfigLoras();
      break;
    case 'models':
      getConfigModels();
      break;
    case 'redraw-models':
      getConfigRedrawModels();
      break;
    case 'samplers':
      getConfigSamplers();
      break;
    case 'scheduler':
      getConfigScheduler();
      break;
    case 'upscalers':
      getConfigUpscalers();
      break;
    case 'vae':
      getConfigVAE();
      break;
    default:
      break;
  }
};
