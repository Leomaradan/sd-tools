/* eslint-disable  */
import { basename } from 'path';
import yargs from 'yargs';

import { ratedCheckpoints } from '../commons/checkpoints';
import { Config } from '../commons/config';
import { logger } from '../commons/logger';
import { getModelCheckpoint } from '../commons/models';
import { miscQuery } from '../commons/query';
import { getMetadata } from '../commons/file';
import { Extensions, Lora, Model } from '../commons/types';

export const command = 'config-init';
export const describe = 'initialize config value. Can be used to refresh models';

export const builder = (builder: yargs.Argv<object>) => {
  return builder.options({
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

export const handler = async (argv: { force?: boolean; ['purge-cache']?: boolean }) => {
  const { force } = argv;
  const initialized = Config.get('initialized');

  if (!initialized || force || argv['purge-cache']) {
    Config.set('cacheMetadata', {});
  }

  const modelsQuery = await miscQuery<{ model_name: string; title: string; filename: string }[]>('sdapi/v1/sd-models');
  const vaeQuery = await miscQuery<{ model_name: string }[]>('sdapi/v1/sd-vae');
  const samplersQuery = await miscQuery<{ aliases: string[]; name: string }[]>('sdapi/v1/samplers');
  const upscalersQuery = await miscQuery<{ model_path: null | string; name: string }[]>('sdapi/v1/upscalers');
  const extensionsQuery = await miscQuery<{ img2img: string[] }>('sdapi/v1/scripts');
  const schedulerQuery = await miscQuery<{ tasks: string[] }>('agent-scheduler/v1/history?limit=1');
  const lorasQuery = await miscQuery<{ name: string; alias: string; path: string }[]>('sdapi/v1/loras');
  const embeddingsQueryQuery = await miscQuery<{ loaded: Record<string, any>; skipped: Record<string, any> }>('sdapi/v1/embeddings');

  if (!modelsQuery || !vaeQuery || !samplersQuery || !upscalersQuery || !extensionsQuery || !lorasQuery || !embeddingsQueryQuery) {
    logger('Error: Cannot initialize config : Error in SD API');
    process.exit(1);
  }

  Config.set(
    'models',
    Array.from(
      new Set(
        modelsQuery.map((modelQuery) => {
          const item: Model = { name: modelQuery.title, version: 'unknown' };
          const hash = /[a-f0-9]{8,10}/.exec(modelQuery.title);
          const metadata = getMetadata(modelQuery.filename.replace(/\.safetensors|.ckpt/, '.json'));

          if (metadata) {
            item.version = metadata.sdVersion;
          }

          if (hash) {
            item.hash = hash[0];
            item.name = modelQuery.title.replace(`[${hash}]`, '').trim();
          }

          console.log(item);

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

  Config.set(
    'embeddings',
    Array.from(new Set([...Object.keys(embeddingsQueryQuery.loaded), ...Object.keys(embeddingsQueryQuery.skipped)]))
  );

  Config.set(
    'loras',
    Array.from(
      new Set(
        lorasQuery.map((lorasQuery) => {
          const lora: Lora = { name: lorasQuery.name, version: 'unknown', alias: lorasQuery.alias };

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
    }
  });

  if (schedulerQuery) {
    extensions.add('scheduler');
  }

  Config.set('extensions', Array.from(extensions));

  if (extensions.has('controlnet')) {
    const controlnetModelsQuery = await miscQuery<{ model_list: string[] }>('controlnet/model_list');
    const controlnetModulesQuery = await miscQuery<{ module_list: string[] }>('controlnet/module_list');

    if (!controlnetModelsQuery || !controlnetModulesQuery) {
      logger('Error: Cannot initialize config : Error in ControlNet');
      process.exit(1);
    }

    Config.set(
      'controlnetModels',
      Array.from(
        new Set(
          controlnetModelsQuery.model_list.map((modelQuery) => {
            const item: Model = { name: modelQuery, version: 'unknown' };
            const hash = /[a-f0-9]{8,10}/.exec(modelQuery);

            if (item.name.includes('sd15')) {
              item.version = 'sd15';
            } else if (item.name.includes('_xl')) {
              item.version = 'sdxl';
            }

            if (hash) {
              item.hash = hash[0];
              item.name = modelQuery.replace(`[${hash}]`, '').trim();
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
      anime15: getModelCheckpoint(...ratedCheckpoints.anime15)?.name,
      animexl: getModelCheckpoint(...ratedCheckpoints.animeXL)?.name,
      realist15: getModelCheckpoint(...ratedCheckpoints.realist15)?.name,
      realistxl: getModelCheckpoint(...ratedCheckpoints.realistXL)?.name
    });
    Config.set('commonPositive', '');
    Config.set(
      'commonNegative',
      '(bad-hands-5:1.0), (badhandv4:1.0), (easynegative:0.8), (bad-artist-anime:0.8), (bad-artist:0.8), (bad_prompt:0.8), (bad-picture-chill-75v:0.8), (bad_prompt_version2:0.8), (bad-image-v2-39000:0.8) (verybadimagenegative_v1.3:0.8)'
    );
    Config.set('commonPositiveXL', '');
    Config.set('commonNegativeXL', '');
    Config.set('lcm', { auto: false });
  }
};
