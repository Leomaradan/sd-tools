// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: Configstore } = require('configstore');

import { handler as init } from '../config/init';
import { getDefaultQueryTemplate15, getDefaultQueryTemplate20, getDefaultQueryTemplateXL } from './defaultQuery';
import { loggerVerbose, mode } from './logger';
import { type ICache, type IConfig, type IDefaultQueryTemplate, type IModelWithHash, type MetadataAccelerator } from './types';

const config = new Configstore('sd-tools');
const cache = new Configstore('sd-tools-cache');

const LATEST_CONFIG_VERSION = 4;

type OldModel = { accelarator: MetadataAccelerator } & Omit<IModelWithHash, 'accelerator'>;

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
    const modelsOld = Config.get('models') as OldModel[];

    const models: IModelWithHash[] = modelsOld.map((model) => ({
      accelerator: model.accelarator,
      hash: model.hash,
      name: model.name,
      version: model.version
    }));

    Config.set('models', models);

    const templates: IDefaultQueryTemplate[] = [
      { accelerator: 'none', templateName: 'SD 1.5', versions: ['sd15'], ...getDefaultQueryTemplate15('none') },
      { accelerator: 'lcm', templateName: 'SD 1.5 LCM', versions: ['sd15'], ...getDefaultQueryTemplate15('lcm') },
      { accelerator: 'none', templateName: 'SD 2.x', versions: ['sd20', 'sd21'], ...getDefaultQueryTemplate20(false) },
      { accelerator: 'none', templateName: 'SD 2.x Full', versions: ['sd20-768', 'sd21-768'], ...getDefaultQueryTemplate20(true) },
      { accelerator: 'none', templateName: 'SDXL', versions: ['sdxl'], ...getDefaultQueryTemplateXL('none') },
      { accelerator: 'lcm', templateName: 'SDXL LCM', versions: ['sdxl'], ...getDefaultQueryTemplateXL('lcm') },
      { accelerator: 'lightning', templateName: 'SDXL Lightning', versions: ['sdxl'], ...getDefaultQueryTemplateXL('lightning') },
      { accelerator: 'turbo', templateName: 'SDXL Turbo', versions: ['sdxl'], ...getDefaultQueryTemplateXL('turbo') }
    ];

    Config.set('defaultQueryTemplates', templates);
    Config.set('defaultQueryConfigs', []);
    Config.set('forcedQueryConfigs', []);
  }
};

const configMigration = async () => {
  let configVersion = Config.get('configVersion') as number | undefined;

  if (configVersion === undefined) {
    configVersion = 0;
  }

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
    await init({ force: true });
    Config.set('configVersion', LATEST_CONFIG_VERSION);
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
