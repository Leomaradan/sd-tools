import { logger } from '../commons/logger';

type Key = [string, string] | string;

interface IKeysList {
  key: string;
  value: Key[];
}
export interface IRenameConfig {
  $schema?: string;
  folderPattern?: string;
  keys: IKeysList[];
  pattern: string;
}

const counters: Record<string, number> = {
  all: 0
};

export const executeConfig = (config: IRenameConfig, source: string, promptData: string[]): [string, string | undefined] => {
  counters.all += 1;

  let { folderPattern, pattern } = config;

  if (!pattern || pattern === '') {
    return ['', undefined];
  }

  config.keys.forEach(({key}) => {
    logger(`Searching for ${key} in "${source}"`);

    const found = config.keys
      .find((k) => k.key === key)
      ?.value?.find((element) => {
        const item = Array.isArray(element) ? element[0] : element;

        logger(`Searching for ${key} value "${item}" in "${source}"`);

        return promptData[0].includes(item);
      });

    if (!found) {
      logger(`${key} not found in ${source}`);
      return;
    }

    const searchName = Array.isArray(found) ? found[0] : found;
    const replaceName = Array.isArray(found) ? found[1] : found;

    if (!counters[searchName]) {
      counters[searchName] = 0;
    }

    counters[searchName] += 1;

    pattern = pattern
      .replace(`{${key}}`, replaceName)
      .replace('[counter]', String(counters.all))
      .replace(`[counter(${key})]`, String(counters[searchName]));

    if (folderPattern) {
      folderPattern = folderPattern
        .replace(`{${key}}`, replaceName)
        .replace('[counter]', String(counters.all))
        .replace(`[counter(${key})]`, String(counters[searchName]));
    }
  });

  return [pattern, folderPattern];
};
