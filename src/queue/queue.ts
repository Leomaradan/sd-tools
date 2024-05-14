import fs from 'fs';

import { logger } from '../commons/logger';
import { prompts } from '../commons/prompts';
import { applyBaseConfig, mergeConfigs } from './functions';

export const queueFromFile = async (source: string, validateOnly: boolean) => {
  if (!fs.existsSync(source)) {
    logger(`Source file ${source} does not exist`);
    process.exit(1);
  }

  const config = mergeConfigs(source);
  if (config) {
    const promptsResolved = applyBaseConfig(config);
    if (promptsResolved.prompts.length === 0) {
      logger(`Merged config from ${source} has no prompts`);
      process.exit(1);
    }
    prompts(promptsResolved, validateOnly);
  }
};
