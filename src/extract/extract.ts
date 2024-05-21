import fs from 'node:fs';
import path from 'node:path';

import { type IExtractOptions, extractFromFile } from '../commons/extract';
import { getFiles } from '../commons/file';
import { ExitCodes, logger } from '../commons/logger';
import { type IPromptSingle } from '../commons/types';

export const extract = async (source: string, { addBefore, format, output, recursive }: IExtractOptions) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(ExitCodes.EXTRACT_NO_SOURCE);
  }

  const prompts: (IPromptSingle | string)[] = [];

  const filesList = getFiles(source, recursive);

  for await (const file of filesList) {
    const addBeforePrompts = addBefore ? addBefore.split('|') : [''];

    if (file.data) {
      const prompt = await extractFromFile(file, format);

      if (prompt) {
        if (addBeforePrompts.length === 0) {
          prompts.push(prompt);
        } else {
          addBeforePrompts.forEach((addBeforePrompt) => {
            if (typeof prompt === 'string') {
              prompts.push(prompt.replace('--prompt "', `--prompt "${addBeforePrompt}, `));
            } else {
              prompts.push({ ...prompt, prompt: `${addBeforePrompt}, ${prompt.prompt}` });
            }
          });
        }
      }
    }
  }

  const result = format === 'json' ? JSON.stringify({ prompts }) : prompts.join('\n');

  const outputFile = output ?? path.resolve(source, `prompts.${format === 'json' ? 'json' : 'txt'}`);

  logger(`Extracted prompts to ${outputFile}`);
  fs.writeFileSync(outputFile, result);
};
