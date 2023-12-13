import fs from 'fs';
import { Validator } from 'jsonschema';
import path from 'path';

import { getFiles } from '../commons/file';
import { logger } from '../commons/logger';
import renameSchema from '../commons/schema/rename.json';
import { IRenameConfig, executeConfig } from './config';

const validator = new Validator();

export const renameConfig = (source: string, target: string, config: IRenameConfig) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const validation = validator.validate(config, renameSchema);

  if (!validation.valid) {
    logger(`JSON has invalid properties : ${validation.toString()}`);
    process.exit(1);
  }

  const filesList = getFiles(source);

  filesList.forEach((file) => {
    if (file.data) {
      const param = executeConfig(config, file.filename, file.data);

      if (param && param[0] !== '') {
        const [targetFile, scene] = param;

        logger(`Renaming ${file.filename} to "${targetFile}" with "${scene}"`);

        if (scene && !fs.existsSync(path.join(target, scene))) {
          fs.mkdirSync(path.join(target, scene));
        }

        fs.renameSync(file.filename, path.join(target, targetFile));
      }
    }
  });
};

export const renameKeyPattern = (source: string, target: string, keys: string[], pattern: string) => {
  const config: IRenameConfig = {
    keys: {},
    pattern
  };

  keys.forEach((keyString) => {
    const [recordKey, recordValueRaw] = keyString.split(':');
    const recordValues = recordValueRaw.split(';');

    if (!config.keys[recordKey]) {
      config.keys[recordKey] = [];
    }

    if (recordValues.length === 1) {
      config.keys[recordKey].push(recordValues[0]);
    } else {
      config.keys[recordKey].push([recordValues[0], recordValues[1]]);
    }
  });

  renameConfig(source, target, config);
};
