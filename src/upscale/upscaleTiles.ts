import fs from 'fs';
import path, { basename } from 'path';

import { extractFromFile } from '../commons/extract';
import { getFiles } from '../commons/file';
import { logger } from '../commons/logger';
import { findControlnetModel, findControlnetModule } from '../commons/models';
import { IPrompt, queue } from '../commons/queue';
import { ControlNetMode, ControlNetResizes } from '../commons/types';

export interface IUpscaleOptions {
  checkpoint?: string;
  denoising?: number[];
  recursive?: boolean;
  upscaling?: number[];
}

export interface IUpscaleOptionsFull extends IUpscaleOptions {
  source: string;
}

export const upscaleTiles = async (
  source: string,
  { checkpoint, denoising: denoisingArray, recursive, upscaling: upscalingArray }: IUpscaleOptions
) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  const queries: IPrompt[] = [];

  const filesList = getFiles(source, recursive);

  const denoising = denoisingArray ?? [0.3];
  const upscaling = upscalingArray ?? [2];

  for await (const file of filesList) {
    const query = (await extractFromFile(file, 'json', true)) as IPrompt;

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
      query.initImage = file.filename;
      query.denoising = denoising;
      query.scaleFactor = upscaling;
      query.filename = basename(file.file).replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
      query.prompt = query.prompt.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, '');
      query.pattern = `[datetime]-x${upscaling}-{filename}`;
      query.outDir = path.resolve(source, 'upscale');

      if (checkpoint) {
        query.checkpoints = checkpoint;
      }

      queries.push(query);
    }
  }

  queries.sort((a, b) => (a.checkpoints as string).localeCompare(b.checkpoints as string));

  queue({ prompts: queries }, false);
};
