import yargs from 'yargs';

import { Config } from '../commons/config.js';
import { logger } from '../commons/logger.js';
import {
  type Options,
  getConfigAddDetailerModels,
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

export const options: { description: string; option: Options }[] = [
  { description: 'List of Add Details models, if existing', option: 'adetailers-models' },
  { description: 'If set, the LCM models will be used', option: 'auto-lcm' },
  { description: 'LCM models to Auto LCM', option: 'lcm' },
  {
    description: 'If set and the MultiDiffusion Upscaler extension exists, the Tiled Diffusion will be enabled',
    option: 'auto-tiled-diffusion'
  },
  { description: 'If set and the MultiDiffusion Upscaler extension exists, the Tiled VAE will be enabled', option: 'auto-tiled-vae' },
  { description: 'Negative prompt to add on each queries using SD 1.5 (except queue query)', option: 'common-negative' },
  { description: 'Negative prompt to add on each queries using SD XL (except queue query)', option: 'common-negative-xl' },
  { description: 'Prompt to add on each queries using SD 1.5 (except queue query)', option: 'common-positive' },
  { description: 'Prompt to add on each queries using SD XL (except queue query)', option: 'common-positive-xl' },
  { description: 'Version of the config. Read-only option', option: 'config-version' },
  { description: 'Available models for ControlNet. Refreshed with command "init"', option: 'controlnet-models' },
  { description: 'Available modules for ControlNet. Refreshed with command "init"', option: 'controlnet-modules' },
  { description: 'If set and the CutOff extension exists, the Tiled VAE will be enabled', option: 'auto-cutoff' },
  { description: 'List of color token used in Auto Cutoff', option: 'cutoff-tokens' },
  { description: 'Weight used in Auto Cutoff', option: 'cutoff-weight' },
  { description: 'Available embeddings. Refreshed with command "init"', option: 'embeddings' },
  { description: 'Url to API', option: 'endpoint' },
  { description: 'Available extensions. Refreshed with command "init"', option: 'extensions' },
  { description: 'Available LoRA. Refreshed with command "init"', option: 'loras' },
  { description: 'Available Checkpoints. Refreshed with command "init"', option: 'models' },
  { description: 'Checkpoints for the Redraw command', option: 'redraw-models' },
  { description: 'Available Samplers. Refreshed with command "init"', option: 'samplers' },
  {
    description: 'If set and the Agent Scheduler extension exists, all queries will be sent to the Scheduler instead of resolved directly',
    option: 'scheduler'
  },
  { description: 'Available styles. Refreshed with command "init"', option: 'styles' },
  { description: 'Available upscalers. Refreshed with command "init"', option: 'upscalers' },
  { description: 'Available VAEs. Refreshed with command "init"', option: 'vae' }
];

export const command = 'config-get [config]';
export const describe = 'get config value';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('config', {
      choices: options.map((o) => o.option).sort((a, b) => a.localeCompare(b)),
      describe: 'config option to get',
      type: 'string'
    })
    .fail((msg) => {
      logger(msg);
      process.exit(1);
    });
};

export const handler = (argv: { config?: string }) => {
  const { config } = argv as { config?: Options };

  const initialized = Config.get('initialized');

  if (!initialized) {
    logger('Config must be initialized first');
    process.exit(1);
  }

  if (!config) {
    const listOptions = [...options].sort((a, b) => a.option.localeCompare(b.option)).map((o) => `  - ${o.option} : ${o.description}`);
    logger(`Available options: \n${listOptions.join('\n')}`);
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

    case 'adetailers-models':
      getConfigAddDetailerModels();
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
    case 'auto-cutoff':
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
