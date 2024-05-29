import fs from 'node:fs';
import { basename } from 'node:path';

import type { IClassicPrompt } from '../commons/types';
import type { IUpscaleOptions } from './types';

import { TiledDiffusionMethods } from '../commons/extensions/multidiffusionUpscaler';
import { extractFromFile } from '../commons/extract';
import { getFiles } from '../commons/file';
import { ExitCodes,  loggerInfo } from '../commons/logger';
import { prompts } from '../commons/prompts';

export const upscaleTiledDiffusion = async (
  source: string,
  { checkpoint, denoising: denoisingArray, recursive, upscaling: upscalingArray }: IUpscaleOptions
) => {
  if (!fs.existsSync(source)) {
    loggerInfo(`Source directory ${source} does not exist`);
    process.exit(ExitCodes.UPSCALE_MULTIDIFFUSION_NO_SOURCE);
  }

  const queries: IClassicPrompt[] = [];

  const filesList = getFiles(source, recursive);

  const denoising = denoisingArray ?? [0.4];
  const upscaling = upscalingArray ?? [2];

  for await (const file of filesList) {
    const query = (await extractFromFile(file, 'json', true)) as IClassicPrompt;

    if (query) {
      query.tiledDiffusion = {
        method: TiledDiffusionMethods.MultiDiffusion
      };
      query.width = file.width;
      query.height = file.height;
      query.initImageOrFolder = file.filename;
      query.denoising = denoising;
      query.scaleFactor = upscaling;
      query.filename = basename(file.file).replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
      query.prompt = Array.isArray(query.prompt)
        ? query.prompt.map((prompt) => prompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, ''))
        : query.prompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, '');
      query.pattern = `[datetime]-x{scaleFactor}-multidiffusion-{filename}`;

      if (checkpoint) {
        query.checkpoints = checkpoint;
      }

      queries.push(query);
    }
  }

  queries.sort((a, b) => (a.checkpoints as string).localeCompare(b.checkpoints as string));

  prompts({ prompts: queries }, false);
};
