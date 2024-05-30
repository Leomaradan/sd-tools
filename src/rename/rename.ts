import { Validator } from 'jsonschema';
import { existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';

import renameSchema from '../../schema/rename.json';
import { type IFile, getFiles } from '../commons/file';
import { ExitCodes, loggerInfo, loggerVerbose } from '../commons/logger';
import { type IRenameConfig, executeConfig } from './config';

const validator = new Validator();

const executeOnFile = (file: IFile, config: IRenameConfig, target: string, test: boolean) => {
  if (file.data) {
    const param = executeConfig(config, file.filename, file.data);

    if (param && param[0] !== '') {
      const [targetFile, scene] = param;

      loggerVerbose(`Renaming ${file.filename} to "${targetFile}" with "${scene}"`);

      if (!test && scene && !existsSync(join(target, scene))) {
        mkdirSync(join(target, scene));
      }

      if (!test) {
        renameSync(file.filename, join(target, targetFile));
      }
    }
  }
};

export const renameConfig = (source: string, target: string, config: IRenameConfig, test: boolean) => {
  if (!existsSync(source)) {
    loggerInfo(`Source directory ${source} does not exist`);
    process.exit(ExitCodes.RENAME_NO_SOURCE_INTERNAL);
  }

  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }

  const validation = validator.validate(config, renameSchema);

  if (!validation.valid) {
    loggerInfo(`JSON has invalid properties : ${validation.toString()}`);
    process.exit(ExitCodes.RENAME_INVALID_JSON);
  }

  const filesList = getFiles(source);

  filesList.forEach((file) => {
    executeOnFile(file, config, target, test);
  });
};

export const renameConfigFromCFile = (source: string, target: string, config: string, test: boolean) => {
  if (!existsSync(source)) {
    loggerInfo(`Source directory ${source} does not exist`);
    process.exit(ExitCodes.RENAME_NO_CONFIG_FILE);
  }

  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }

  let jsonContent: IRenameConfig = { keys: [], pattern: '' };
  try {
    const data = readFileSync(config, 'utf8');
    jsonContent = JSON.parse(data);
  } catch (err) {
    loggerInfo(`Unable to parse JSON in ${config} (${err})`);
    process.exit(ExitCodes.RENAME_INVALID_CONFIG_JSON);
  }

  renameConfig(source, target, jsonContent, test);
};

export const renameKeyPattern = (source: string, target: string, keys: string[], pattern: string, test: boolean) => {
  const config: IRenameConfig = {
    keys: [],
    pattern
  };

  keys.forEach((keyString) => {
    const [recordKey, recordValueRaw] = keyString.split(':');
    const recordValues = recordValueRaw.split(';');

    let configIndex = config.keys.findIndex((k) => k.key === recordKey);

    if (configIndex === -1) {
      config.keys.push({
        key: recordKey,
        value: []
      });

      configIndex = config.keys.findIndex((k) => k.key === recordKey);
    }

    if (recordValues.length === 1) {
      config.keys[configIndex].value.push(recordValues[0]);
    } else {
      config.keys[configIndex].value.push([recordValues[0], recordValues[1]]);
    }
  });

  renameConfig(source, target, config, test);
};
