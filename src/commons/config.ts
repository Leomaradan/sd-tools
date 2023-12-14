import Configstore from 'configstore';

import { IConfig } from './types';

const config = new Configstore('sd-tools');

export const Config = {
  get: <T extends keyof IConfig>(key: T): IConfig[T] => config.get(key),
  set: <T extends keyof IConfig>(key: T, value: IConfig[T]): void => config.set(key, value)
};

export const getParamBoolean = (param: boolean | string): boolean => {
  if (typeof param === 'boolean') {
    return param;
  }

  return !(param.toLowerCase() === 'false' || param === '0');
};
