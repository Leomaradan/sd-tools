import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { extractFromFile, type IExtractOptions } from '../commons/extract';
import { getFiles, type IFile } from '../commons/file';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { type IPrompt, type IPrompts, type IPromptSingle } from '../commons/types';

const executeOnSingleFile = async (file: IFile, format: 'json' | 'textbox', addBefore?: string) => {
  const addBeforePrompts = addBefore ? addBefore.split('|') : [];

  if (file.data) {
    const prompt = await extractFromFile(file, format);

    if (prompt) {
      if (addBeforePrompts.length === 0) {
        return prompt;
      } else {
        addBeforePrompts.forEach((addBeforePrompt) => {
          if (typeof prompt === 'string') {
            return prompt.replace('--prompt "', `--prompt "${addBeforePrompt}, `);
          } else {
            return { ...prompt, prompt: `${addBeforePrompt}, ${prompt.prompt}` };
          }
        });
      }
    }
  }
};

const extractBasePrompt = (prompts: IPromptSingle[] = []): IPrompts => {
  const basePrompt: Record<string, string> = {};

  const firstElementKeys = Object.keys(prompts[0]);
  const identicalKeys: string[] = [];

  firstElementKeys.forEach((firstElementKey) => {
    const baseValue = prompts[0][firstElementKey as keyof IPromptSingle];
    const allIdentical = prompts.every((prompt) => prompt[firstElementKey as keyof IPromptSingle] === baseValue);
    if (allIdentical) {
      identicalKeys.push(firstElementKey);
      basePrompt[firstElementKey] = baseValue as string;
    }
  });

  const newPrompts = prompts.map((prompt) => {
    const newPrompt: IPromptSingle = { ...prompt };
    identicalKeys.forEach((key) => {
      delete newPrompt[key as keyof IPromptSingle];
    });
    return newPrompt as unknown as IPrompt;
  });

  return { basePrompt, prompts: newPrompts };
};

const executeOnFiles = async (filesList: IFile[], format: 'json' | 'textbox', addBefore?: string) => {
  const prompts: (IPromptSingle | string)[] = [];
  for (const file of filesList) {
    const prompt = await executeOnSingleFile(file, format, addBefore);

    if (prompt) {
      prompts.push(prompt);
    }
  }

  return prompts;
};

export const extract = async (source: string, { addBefore, format, output, recursive }: IExtractOptions) => {
  if (!existsSync(source)) {
    loggerInfo(`Source directory ${source} does not exist`);
    process.exit(ExitCodes.EXTRACT_NO_SOURCE);
  }

  const filesList = await getFiles(source, recursive);

  const prompts = await executeOnFiles(filesList, format, addBefore);

  let result = '';

  if (format === 'json') {
    result = JSON.stringify({
      $schema: 'https://raw.githubusercontent.com/Leomaradan/sd-tools/refs/heads/master/schema/queue.json',
      ...extractBasePrompt(prompts as IPromptSingle[])
    });
  } else {
    result = (prompts as string[]).join('\n');
  }

  const outputFile = output ?? resolve(source, `prompts.${format === 'json' ? 'json' : 'txt'}`);

  loggerInfo(`Extracted prompts to ${outputFile}`);
  writeFileSync(outputFile, result);
};
