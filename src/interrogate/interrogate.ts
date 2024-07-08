import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type IInterrogateOptions, interrogateFromFile } from '../commons/extract';
import { type IFile, getFileNameWithoutExtension, getFiles } from '../commons/file';
import { ExitCodes, loggerInfo } from '../commons/logger';

const executeOnSingleFile = async (file: IFile, deepBooru: boolean, addBefore?: string) => {
  loggerInfo(`Analyzing file ${file.fullpath}`);
  const prompt = await interrogateFromFile(file, deepBooru);

  if (prompt) {
    if (addBefore) {
      return `${addBefore.replace('{filename}', getFileNameWithoutExtension(file.file))}, ${prompt}`;
    }
    return prompt;
  }
};

const executeOnFiles = async (filesList: IFile[], deepBooru: boolean, addBefore?: string) => {
  const prompts: Record<string, string> = {};
  for await (const file of filesList) {
    const prompt = await executeOnSingleFile(file, deepBooru, addBefore);

    if (prompt) {
      prompts[file.fullpath] = prompt;
    }
  }

  return prompts;
};

const writePrompts = (prompts: Record<string, string>, output: string) => {
  Object.keys(prompts).forEach((filename) => {
    const promptFileName = resolve(output, `${getFileNameWithoutExtension(filename)}.txt`);
    writeFileSync(promptFileName, prompts[filename], { encoding: 'utf-8' });
  });
};

export const interrogate = async (source: string, { addBefore, deepBooru, recursive }: IInterrogateOptions) => {
  if (!existsSync(source)) {
    loggerInfo(`Source directory ${source} does not exist`);
    process.exit(ExitCodes.EXTRACT_NO_SOURCE);
  }

  const filesList = getFiles(source, recursive);

  const prompts = await executeOnFiles(filesList, deepBooru ?? false, addBefore);

  writePrompts(prompts, source);
  loggerInfo(`Done!`);
};
