import fs from 'node:fs';

import { ExitCodes,  loggerInfo } from '../commons/logger';
import { prompts } from '../commons/prompts';
import { applyBaseConfig, mergeConfigs } from './functions';

export const queueFromFile = async (source: string, validateOnly: boolean) => {
  if (!fs.existsSync(source)) {
    loggerInfo(`Source file ${source} does not exist`);
    process.exit(ExitCodes.QUEUE_NO_SOURCE);
  }

  const config = mergeConfigs(source);
  if (config) {
    const promptsResolved = applyBaseConfig(config);
    if (promptsResolved.prompts.length === 0) {
      loggerInfo(`Merged config from ${source} has no prompts`);
      process.exit(ExitCodes.QUEUE_NO_RESULTING_PROMPTS);
    }
    prompts(promptsResolved, validateOnly);
  }
};
