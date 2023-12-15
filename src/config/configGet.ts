import yargs from 'yargs';

import { Config } from '../commons/config.js';
import { logger } from '../commons/logger.js';
import {
  Options,
  getConfigAddDetailerCustomModels,
  getConfigAutoLCM,
  getConfigAutoTiledDiffusion,
  getConfigAutoTiledVAE,
  getConfigCommonNegative,
  getConfigCommonNegativeXL,
  getConfigCommonPositive,
  getConfigControlnetModels,
  getConfigControlnetModules,
  getConfigCutoff,
  getConfigCutoffTokens,
  getConfigCutoffWeight,
  getConfigEmbeddings,
  getConfigEndpoint,
  getConfigExtensions,
  getConfigLCM,
  getConfigLoras,
  getConfigModels,
  getConfigRedrawModels,
  getConfigSamplers,
  getConfigScheduler,
  getConfigStyles,
  getConfigUpscalers,
  getConfigVAE,
  getConfigVersion
} from './functions.js';

const options: Options[] = [
  'adetailers-custom-models',
  'auto-lcm',
  'auto-tiled-diffusion',
  'auto-tiled-vae',
  'common-negative',
  'common-negative-xl',
  'common-positive',
  'common-positive-xl',
  'config-version',
  'controlnet-models',
  'controlnet-modules',
  'cutoff',
  'cutoff-tokens',
  'cutoff-weight',
  'embeddings',
  'endpoint',
  'extensions',
  'lcm',
  'loras',
  'models',
  'redraw-models',
  'samplers',
  'scheduler',
  'scheduler',
  'styles',
  'upscalers',
  'vae'
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
    case 'config-version':
      getConfigVersion();
      break;
    case 'controlnet-models':
      getConfigControlnetModels();
      break;
    case 'controlnet-modules':
      getConfigControlnetModules();
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
    case 'samplers':
      getConfigSamplers();
      break;
    case 'styles':
      getConfigStyles();
      break;
    case 'upscalers':
      getConfigUpscalers();
      break;
    case 'vae':
      getConfigVAE();
      break;

    case 'adetailers-custom-models':
      getConfigAddDetailerCustomModels();
      break;
    case 'auto-lcm':
      getConfigAutoLCM();
      break;
    case 'auto-tiled-diffusion':
      getConfigAutoTiledDiffusion();
      break;
    case 'auto-tiled-vae':
      getConfigAutoTiledVAE();
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
    case 'cutoff':
      getConfigCutoff();
      break;
    case 'cutoff-tokens':
      getConfigCutoffTokens();
      break;
    case 'cutoff-weight':
      getConfigCutoffWeight();
      break;

    case 'endpoint':
      getConfigEndpoint();
      break;
    case 'lcm':
      getConfigLCM();
      break;
    case 'redraw-models':
      getConfigRedrawModels();
      break;
    case 'scheduler':
      getConfigScheduler();
      break;

    default:
      break;
  }
};
