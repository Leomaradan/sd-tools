import fs from 'fs';
import { Validator } from 'jsonschema';

import { logger } from '../commons/logger';
import { prompts } from '../commons/prompts';
import queueSchema from '../commons/schema/queue.json';
import { resolve } from 'path';
import { IPrompts, IPromptsResolved } from '../commons/types';

const validator = new Validator();

const getConfigs = (source: string) => {
  if (!fs.existsSync(source)) {
    logger(`Source file ${source} does not exist`);
    process.exit(1);
  }

  if (source.endsWith('.json')) {
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

    return jsonContent;
  }

  if (source.endsWith('.js') || source.endsWith('.cjs')) {
    const jsonContentFromJs: IPrompts = require(source);

    const validation = validator.validate(jsonContentFromJs, queueSchema, { nestedErrors: true });

    if (!validation.valid) {
      logger(`JS return invalid properties : ${validation.toString()}`);
      process.exit(1);
    }

    return jsonContentFromJs;
  }
};

export const mergeConfigs = (source: string): IPrompts | undefined => {
  const jsonContent = getConfigs(source);

  if (!jsonContent) {
    logger(`Invalid file : ${source}`);
    process.exit(1);
  }

  if (jsonContent.extends) {
    const extendsPath = jsonContent.extends.startsWith('.') ? resolve(source, '..', jsonContent.extends) : jsonContent.extends;
    const extendsContent = mergeConfigs(extendsPath);
    if (extendsContent) {
      return {
        basePrompt: { ...(extendsContent.basePrompt ?? {}), ...(jsonContent.basePrompt ?? {}) },
        multiValueMethod: jsonContent.multiValueMethod ?? extendsContent.multiValueMethod,
        permutations: [...(extendsContent.permutations ?? []), ...(jsonContent.permutations ?? [])],
        prompts: [...(extendsContent.prompts ?? []), ...(jsonContent.prompts ?? [])]
      };
    }
  }

  return jsonContent;
};

export const applyBaseConfig = (config: IPrompts): IPromptsResolved => {
  const resolved: IPromptsResolved = {
    multiValueMethod: config.multiValueMethod,
    permutations: config.permutations,
    prompts: []
  };

  if (config.basePrompt) {
    resolved.prompts =
      config.prompts?.map((prompt) => {
        return { ...config.basePrompt, ...prompt };
      }) ?? [];
  }

  return resolved;
};
