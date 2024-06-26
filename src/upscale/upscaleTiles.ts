import { existsSync } from 'node:fs';
import { basename } from 'node:path';

import type { IUpscaleOptions } from './types';

import { ControlNetMode, ControlNetResizes } from '../commons/extensions/controlNet';
import { extractFromFile } from '../commons/extract';
import { getFiles } from '../commons/file';
import { ExitCodes, loggerInfo } from '../commons/logger';
import { findControlnetModel, findControlnetModule } from '../commons/models';
import { prompts } from '../commons/prompts';
import { type IClassicPrompt } from '../commons/types';

export const upscaleTiles = async (
  source: string,
  { checkpoint, denoising: denoisingArray, recursive, upscaling: upscalingArray }: IUpscaleOptions
) => {
  if (!existsSync(source)) {
    loggerInfo(`Source directory ${source} does not exist`);
    process.exit(ExitCodes.UPSCALE_TILES_NO_SOURCE);
  }

  const queries: IClassicPrompt[] = [];

  const filesList = getFiles(source, recursive);

  const denoising = denoisingArray ?? [0.3];
  const upscaling = upscalingArray ?? [2];

  for await (const file of filesList) {
    const query = (await extractFromFile(file, 'json', true)) as IClassicPrompt;

    if (query) {
      query.ultimateSdUpscale = true;
      query.controlNet = [
        {
          control_mode: ControlNetMode.ControleNetImportant,
          model: findControlnetModel('tile')?.name as string,
          module: findControlnetModule('tile_resample') as string,
          resize_mode: ControlNetResizes.Resize
        }
      ];
      query.width = file.width;
      query.height = file.height;
      query.initImageOrFolder = file.filename;
      query.denoising = denoising;
      query.scaleFactor = upscaling;
      query.filename = basename(file.file).replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
      query.prompt = Array.isArray(query.prompt)
        ? query.prompt.map((prompt) => prompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, ''))
        : query.prompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, '');
      query.pattern = `[datetime]-x{scaleFactor}-cntiles-{filename}`; // Currently don't work, because Ultimate SD Upscale ignore override

      if (checkpoint) {
        query.checkpoints = checkpoint;
      }

      queries.push(query);
    }
  }

  queries.sort((a, b) => (a.checkpoints as string).localeCompare(b.checkpoints as string));

  prompts({ prompts: queries }, false);
};
