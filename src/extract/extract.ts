import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type IExtractOptions, extractFromFile } from '../commons/extract';
import { type IFile, getFiles } from '../commons/file';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { type IPromptSingle } from '../commons/types';

const executeOnSingleFile = async (file: IFile, format: 'json' | 'textbox', addBefore?: string) => {
  const addBeforePrompts = addBefore ? addBefore.split('|') : [''];

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

const executeOnFiles = async (filesList: IFile[], format: 'json' | 'textbox', addBefore?: string) => {
  const prompts: (IPromptSingle | string)[] = [];
  for await (const file of filesList) {
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

  const filesList = getFiles(source, recursive);

  const prompts = await executeOnFiles(filesList, format, addBefore);

  const result = format === 'json' ? JSON.stringify({ prompts }) : prompts.join('\n');

  const outputFile = output ?? resolve(source, `prompts.${format === 'json' ? 'json' : 'txt'}`);

  loggerInfo(`Extracted prompts to ${outputFile}`);
  writeFileSync(outputFile, result);
};
