import fs from 'fs';
import path from 'path';

import { readFiles } from '../commons/file';
import { executeConfig, readConfig } from '../config';

export const rename = (source: string, target: string, configPath: string) => {
  if (!fs.existsSync(source)) {
    console.log(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  if (!fs.existsSync(target)) {
    console.log(`Target directory ${target} does not exist`);
    process.exit(1);
  }

  if (!fs.existsSync(configPath)) {
    console.log(`Config ${configPath} does not exist`);
    process.exit(1);
  }

  const config = readConfig(configPath);

  readFiles(source).forEach((file) => {
    if (file.data) {
      const param = executeConfig(config, file.filename, file.data);

      if (param) {
        const [targetFile, scene] = param;

        if (scene && !fs.existsSync(path.join(target, scene))) {
          fs.mkdirSync(path.join(target, scene));
        }

        fs.renameSync(file.filename, path.join(target, targetFile));
      }
    }
  });
};
