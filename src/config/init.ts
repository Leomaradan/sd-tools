/* eslint-disable  */
import { basename } from 'path';
import yargs from 'yargs';

import { ratedCheckpoints } from '../commons/checkpoints';
import { Cache, Config } from '../commons/config';
import { logger } from '../commons/logger';
import { findCheckpoint } from '../commons/models';
import {
  getControlnetModelsQuery,
  getControlnetModulesQuery,
  getEmbeddingsQuery,
  getExtensionsQuery,
  getLORAsQuery,
  getModelsQuery,
  getSamplersQuery,
  getSchedulerQuery,
  getStylesQuery,
  getUpscalersQuery,
  getVAEQuery
} from '../commons/query';
import { getMetadata } from '../commons/file';
import { Extensions, IStyle, ILora, IModel, Version, IModelWithHash } from '../commons/types';

export const command = 'init';
export const describe = 'initialize config value. Can be used to refresh models';

export const builder = (builder: yargs.Argv<object>) => {
  return builder.options({
    endpoint: {
      alias: 'e',
      describe: 'endpoint to use. Default: http://127.0.0.1:7860',
      type: 'string'
    },
    force: {
      alias: 'f',
      describe: 'force reset config',
      type: 'boolean'
    },
    ['purge-cache']: {
      alias: 'p',
      describe: 'purge the cache',
      type: 'boolean'
    }
  });
};

export const handler = async (argv: { force?: boolean; ['purge-cache']?: boolean; endpoint?: string }) => {
  const { force, endpoint } = argv;
  const initialized = Config.get('initialized');

  if (!initialized || force || argv['purge-cache']) {
    Cache.set('metadata', {});
    Cache.set('imageData', {});
    Cache.set('interrogator', {});
  }

  if (endpoint || !initialized || force) {
    Config.set('endpoint', endpoint ?? 'http://127.0.0.1:7860');
  }

  const modelsQuery = await getModelsQuery();
  const vaeQuery = await getVAEQuery();
  const samplersQuery = await getSamplersQuery();
  const upscalersQuery = await getUpscalersQuery();
  const extensionsQuery = await getExtensionsQuery();
  const schedulerQuery = await getSchedulerQuery();
  const lorasQuery = await getLORAsQuery();
  const embeddingsQuery = await getEmbeddingsQuery();
  const stylesQuery = await getStylesQuery();

  if (
    !modelsQuery ||
    !vaeQuery ||
    !samplersQuery ||
    !upscalersQuery ||
    !extensionsQuery ||
    !lorasQuery ||
    !embeddingsQuery ||
    !stylesQuery
  ) {
    logger('Error: Cannot initialize config : Error in SD API');
    process.exit(1);
  }

  Config.set(
    'models',
    Array.from(
      new Set(
        modelsQuery.map((modelQuery) => {
          const item: IModelWithHash = { name: modelQuery.title, version: Version.Unknown };
          const hash = /[a-f0-9]{8,10}/.exec(modelQuery.title);
          const metadata = getMetadata(modelQuery.filename.replace(/\.safetensors|.ckpt/, '.json'));

          if (metadata) {
            item.version = metadata.sdVersion;
          }

          if (hash) {
            item.hash = hash[0];
            item.name = modelQuery.title.replace(`[${hash}]`, '').trim();
          }

          return item;
        })
      )
    )
  );

  Config.set(
    'vae',
    Array.from(
      new Set(
        vaeQuery.map((vae) => {
          return vae.model_name;
        })
      )
    )
  );

  Config.set(
    'samplers',
    Array.from(new Set(samplersQuery.map((samplerQuery) => ({ name: samplerQuery.name, aliases: samplerQuery.aliases }))))
  );

  Config.set(
    'upscalers',
    Array.from(
      new Set(
        upscalersQuery.map((upscalerQuery, index) => ({
          filename: upscalerQuery.model_path ? basename(upscalerQuery.model_path) : undefined,
          name: upscalerQuery.name,
          index
        }))
      )
    )
  );

  Config.set('embeddings', Array.from(new Set([...Object.keys(embeddingsQuery.loaded), ...Object.keys(embeddingsQuery.skipped)])));

  Config.set(
    'styles',
    Array.from(
      new Set(
        stylesQuery
          .map((styleQuery) => {
            const style: IStyle = { name: styleQuery.name, prompt: '', negativePrompt: '' };

            if (styleQuery.prompt) {
              style.prompt = styleQuery.prompt;
            }

            if (styleQuery.negative_prompt) {
              style.negativePrompt = styleQuery.negative_prompt;
            }

            if (!styleQuery.prompt && !styleQuery.negative_prompt) {
              return;
            }

            return style;
          })
          .filter((style) => style !== undefined) as IStyle[]
      )
    )
  );

  Config.set(
    'loras',
    Array.from(
      new Set(
        lorasQuery.map((lorasQuery) => {
          const lora: ILora = { name: lorasQuery.name, version: Version.Unknown, alias: lorasQuery.alias };

          const metadata = getMetadata(lorasQuery.path.replace(/\.safetensors|.ckpt/, '.json'));

          if (metadata) {
            lora.version = metadata.sdVersion;
          }

          return lora;
        })
      )
    )
  );

  const extensions = new Set<Extensions>();

  extensionsQuery.img2img.forEach((extensionQuery) => {
    switch (extensionQuery) {
      case 'adetailer':
        extensions.add('adetailer');
        break;
      case 'controlnet':
        extensions.add('controlnet');
        break;
      case 'cutoff':
        extensions.add('cutoff');
        break;
      case 'ultimate-sd-upscale':
        extensions.add('ultimate-sd-upscale');
        break;
      case 'tiled diffusion':
        extensions.add('tiled diffusion');
        break;
      case 'tiled vae':
        extensions.add('tiled vae');
        break;
    }
  });

  if (schedulerQuery) {
    extensions.add('scheduler');
  }

  Config.set('extensions', Array.from(extensions));

  if (extensions.has('controlnet')) {
    const controlnetModelsQuery = await getControlnetModelsQuery();
    const controlnetModulesQuery = await getControlnetModulesQuery();

    if (!controlnetModelsQuery || !controlnetModulesQuery) {
      logger('Error: Cannot initialize config : Error in ControlNet');
      process.exit(1);
    }

    Config.set(
      'controlnetModels',
      Array.from(
        new Set(
          controlnetModelsQuery.model_list.map((modelQuery) => {
            const item: IModel = { name: modelQuery, version: Version.Unknown };

            if (item.name.includes('sd15')) {
              item.version = Version.SD15;
            } else if (item.name.includes('_xl')) {
              item.version = Version.SDXL;
            }

            return item;
          })
        )
      )
    );

    Config.set('controlnetModules', Array.from(new Set(controlnetModulesQuery.module_list)));
  } else {
    Config.set('controlnetModels', []);
    Config.set('controlnetModules', []);
  }

  if (!initialized || force) {
    logger('Refresh models');
    Config.set('initialized', true);
    Config.set('adetailersCustomModels', []);
    Config.set('cutoff', extensions.has('cutoff'));
    Config.set('cutoffTokens', [
      'red',
      'green',
      'blue',
      'yellow',
      'orange',
      'purple',
      'pink',
      'black',
      'white',
      'grey',
      'brown',
      'cyan',
      'magenta',
      'lime',
      'maroon',
      'navy',
      'olive',
      'teal',
      'violet',
      'turquoise',
      'silver',
      'gold',
      'copper',
      'indigo',
      'azure',
      'beige',
      'lavender',
      'plum',
      'mint',
      'apricot',
      'navajo',
      'rose',
      'peach',
      'cream',
      'charcoal',
      'coral',
      'salmon',
      'mustard'
    ]);
    Config.set('cutoffWeight', 1);
    Config.set('scheduler', extensions.has('scheduler'));
    Config.set('redrawModels', {
      anime15: findCheckpoint(...ratedCheckpoints.anime15)?.name,
      animexl: findCheckpoint(...ratedCheckpoints.animeXL)?.name,
      realist15: findCheckpoint(...ratedCheckpoints.realist15)?.name,
      realistxl: findCheckpoint(...ratedCheckpoints.realistXL)?.name
    });
    Config.set('commonPositive', '');
    Config.set(
      'commonNegative',
      '(bad-hands-5:1.0), (badhandv4:1.0), (easynegative:0.8), (bad-artist-anime:0.8), (bad-artist:0.8), (bad_prompt:0.8), (bad-picture-chill-75v:0.8), (bad_prompt_version2:0.8), (bad-image-v2-39000:0.8) (verybadimagenegative_v1.3:0.8)'
    );
    Config.set('commonPositiveXL', '');
    Config.set('commonNegativeXL', '');
    Config.set('lcm', { auto: false });
    Config.set('autoTiledDiffusion', false);
    Config.set('autoTiledVAE', true);
  }
};
