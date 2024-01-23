import Configstore from 'configstore';

import { ICache, IConfig } from './types';

const config = new Configstore('sd-tools');
const cache = new Configstore('sd-tools-cache');

const LATEST_CONFIG_VERSION = 1;

const migrations: Record<number, () => void> = {
  0: () => {
    Config.set('configVersion', 1);
    Config.set('styles', []);
    Config.set('endpoint', 'http://127.0.0.1:7860');
    Config.set('autoTiledDiffusion', false);
    Config.set('autoTiledVAE', false);
  }
};

const configMigration = () => {
  let configVersion = Config.get('configVersion') as number | undefined;

  if (configVersion === undefined) {
    configVersion = 0;
  }

  for (let i = configVersion; i < LATEST_CONFIG_VERSION; i++) {
    migrations[i]();
  }
};

export const Config = {
  get: <T extends keyof IConfig>(key: T): IConfig[T] => config.get(key),
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
