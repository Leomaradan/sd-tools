import fs from 'fs';
import path from 'path';

import { executeConfig, readConfig } from '../commons/config';
import { getFiles } from '../commons/file';
import { logger } from '../commons/logger';
import renameSchema from '../commons/schema/rename.json';

export const rename = (source: string, target: string, configPath: string) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  if (!fs.existsSync(configPath)) {
    logger(`Config ${configPath} does not exist`);
    process.exit(1);
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const config = readConfig(configPath, renameSchema);

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
