import fs from 'fs';
import { Validator } from 'jsonschema';

import { logger } from '../commons/logger';
import { IPrompts, queue } from '../commons/queue';
import queueSchema from '../commons/schema/queue.json';

const validator = new Validator();

export const queueFromFile = async (source: string, validateOnly: boolean) => {
  if (!fs.existsSync(source)) {
    logger(`Source file ${source} does not exist`);
    process.exit(1);
  }

  let jsonContent: IPrompts = { prompts: [] };
  try {
    const data = fs.readFileSync(source, 'utf8');
    jsonContent = JSON.parse(data);
  } catch (err) {
    logger(`Unable to parse JSON in ${source}`);
    process.exit(1);
  }

  const validation = validator.validate(jsonContent, queueSchema, { nestedErrors: true });

  if (!validation.valid) {
    logger(`JSON has invalid properties : ${validation.toString()}`);
    process.exit(1);
  }

  queue(jsonContent, validateOnly);

};
