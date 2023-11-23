import fs from 'fs';

type Key = [string, string] | string;
type Keys = Key[];

interface IConfig {
  folderPattern?: string;
  keys: Record<string, Keys>;
  pattern: string;
}

export const readConfig = (configFile: string) => {
  const data: Partial<IConfig> = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

  const config: IConfig = {
    keys: {},
    pattern: ''
  };

  if (typeof data.pattern === 'string') {
    config.pattern = data.pattern;
  }

  if (typeof data.folderPattern === 'string') {
    config.folderPattern = data.folderPattern;
  }

  if (data.keys && typeof data.keys === 'object') {
    Object.keys(data.keys).forEach((key) => {
      const values = (data.keys as IConfig['keys'])[key];
      const normalizedValues: Keys = [];

      if (Array.isArray(values)) {
        values.forEach((value) => {
          if (value === 'string') {
            normalizedValues.push(value as Key);
          } else if (Array.isArray(value)) {
            normalizedValues.push(value.map(String) as [string, string]);
          }
        });
      }

      config.keys[key] = normalizedValues;
    });
  }

  return config;
};

const counters: Record<string, number> = {
  all: 0
};

export const executeConfig = (config: IConfig, source: string, promptData: string[]): [string, string | undefined] => {
  counters.all += 1;

  let { folderPattern, pattern } = config;

  Object.keys(config.keys).forEach((key) => {
    const found = config.keys[key].find((element) => {
      const item = Array.isArray(element) ? element[0] : element;

      return promptData[0].includes(item);
    });

    if (!found) {
      console.log(`${key} not found in ${source}`);
      return;
    }

    const searchName = Array.isArray(found) ? found[0] : found;
    const replaceName = Array.isArray(found) ? found[1] : found;

    if (!counters[searchName]) {
      counters[searchName] = 0;
    }

    counters[searchName] += 1;

    const regexKey = new RegExp(`{${key}}`, 'gi');
    const regexCounter = new RegExp(`[counter]`, 'gi');
    const regexCounterKey = new RegExp(`[counter(${key})]`, 'gi');

    pattern = pattern
      .replace(regexKey, replaceName)
      .replace(regexCounter, String(counters.all))
      .replace(regexCounterKey, String(counters[searchName]));

    if (folderPattern) {
      folderPattern = folderPattern
        .replace(regexKey, replaceName)
        .replace(regexCounter, String(counters.all))
        .replace(regexCounterKey, String(counters[searchName]));
    }
  });

  return [pattern, folderPattern];
};
