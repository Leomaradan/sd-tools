// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: Configstore } = require('configstore');

import { initFunction } from '../config/init';
import { loggerInfo, loggerVerbose, mode } from './logger';
import { checkApiQuery } from './query';
import { type ICache, type IConfig } from './types';

const config = new Configstore('sd-tools');
const cache = new Configstore('sd-tools-cache');

const LATEST_CONFIG_VERSION = 4;

export type ApiType = 'automatic1111' | 'forge' | 'proxy';

const migrations: Record<number, () => void> = {
  0: () => {
    Config.set('configVersion', 1);
    Config.set('styles', []);
    Config.set('endpoint', 'http://127.0.0.1:7860');
    Config.set('autoTiledDiffusion', false);
    Config.set('autoTiledVAE', false);
  },
  1: () => {
    config.delete('adetailersCustomModels');
    Config.set('adetailersModels', []);
  },
  2: () => {
    Config.set('autoAdetailers', []);
    Config.set('autoControlnetPose', []);
  },
  3: () => {
    Config.set('interrogatorModels', []);
  }
};

const configMigration = async (): Promise<ApiType | false> => {
  let configVersion = Config.get('configVersion') as number | undefined;

  configVersion ??= 0;

  let migrated = false;

  for (let i = configVersion; i < LATEST_CONFIG_VERSION; i++) {
    migrations[i]();
    migrated = true;
  }

  if (migrated) {
    // Manually manage the flags here
    mode.verbose = process.argv.includes('--verbose');
    mode.info = !process.argv.includes('--silent');
    mode.log = !process.argv.includes('--no-log');

    loggerVerbose('Config has changed, refreshing models...');
    const response = await initFunction({ force: true });
    Config.set('configVersion', LATEST_CONFIG_VERSION);

    mode.apiType = response;

    return response;
  }

  const result = await checkApiQuery();

  if (!result) {
    loggerInfo('Error: Cannot initialize config : API is offline');
    return false;
  }

  mode.apiType = result;

  return result;
};

export const Config = {
  get: <T extends keyof IConfig>(key: T): IConfig[T] => {
    if ((key === 'autoTiledDiffusion' || key === 'autoTiledVAE') && mode.apiType === 'forge') {
      return false as IConfig[T];
    }

    if (key === 'scheduler' && mode.apiType === 'proxy') {
      return false as IConfig[T];
    }

    return config.get(key);
  },
  migrate: configMigration,
  set: <T extends keyof IConfig>(key: T, value: IConfig[T]): void => config.set(key, value)
};

export const Cache = {
  get: <T extends keyof ICache>(key: T): ICache[T] => {
    const store = cache.get(key);
    if (store) {
      return store;
    }
    return {} as ICache[T];
  },
  set: <T extends keyof ICache>(key: T, value: ICache[T]): void => cache.set(key, value)
};

export const getParamBoolean = (param: boolean | string): boolean => {
  if (typeof param === 'boolean') {
    return param;
  }

  return !(param.toLowerCase() === 'false' || param === '0');
};
