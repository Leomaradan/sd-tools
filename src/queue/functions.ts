import { Validator } from 'jsonschema';
import fs from 'node:fs';
import { resolve } from 'node:path';

import queueSchema from '../../schema/queue.json';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { type IPrompts, type IPromptsResolved } from '../commons/types';

const validator = new Validator();

export const getConfigs = (source: string): IPrompts | undefined => {
  if (!fs.existsSync(source)) {
    loggerInfo(`Source file ${source} does not exist`);
    process.exit(ExitCodes.QUEUE_NO_SOURCE_INTERNAL);
  }

  if (source.endsWith('.json')) {
    let jsonContent: IPrompts = { prompts: [] };
    try {
      const data = fs.readFileSync(source, 'utf8');
      jsonContent = JSON.parse(data);
    } catch (err) {
      loggerInfo(`Unable to parse JSON in ${source}`);
      process.exit(ExitCodes.QUEUE_CORRUPTED_JSON);
    }

    const validation = validator.validate(jsonContent, queueSchema, { nestedErrors: true });

    if (!validation.valid) {
      loggerInfo(`JSON has invalid properties : ${validation.toString()}`);
      process.exit(ExitCodes.QUEUE_INVALID_JSON);
    }

    return jsonContent;
  }

  if (source.endsWith('.js') || source.endsWith('.cjs')) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jsonContentFromJs: IPrompts = require(source);

    const validation = validator.validate(jsonContentFromJs, queueSchema, { nestedErrors: true });

    if (!validation.valid) {
      loggerInfo(`JS return invalid properties : ${validation.toString()}`);
      process.exit(ExitCodes.QUEUE_INVALID_JS);
    }

    return jsonContentFromJs;
  }
};

const resolvePath = (source: string, extendsPath: string): string => {
  if (extendsPath.startsWith('.')) {
    return resolve(source, '..', extendsPath);
  } else if (/^[a-z]:\\/i.test(extendsPath)) {
    // Windows style path. Nothing to do
  } else if (extendsPath.startsWith('/')) {
    // Unix style path. Nothing to do
  } else {
    // Relative path without leading dot. Resolve to the same folder
    return resolve(source, '..', extendsPath);
  }

  return extendsPath;
};

export const mergeConfigs = (source: string): IPrompts | undefined => {
  const jsonContent = getConfigs(source);

  if (!jsonContent || jsonContent === undefined) {
    loggerInfo(`Invalid file : ${source}`);
    process.exit(ExitCodes.QUEUE_INVALID_FILE);
  }

  if (jsonContent?.extends) {
    const extendsPath = resolvePath(source, jsonContent.extends);

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
    prompts: config.prompts ?? []
  };

  if (config.basePrompt) {
    resolved.prompts =
      config.prompts?.map((prompt) => {
        return { ...config.basePrompt, ...prompt };
      }) ?? [];
  }

  return resolved;
};
