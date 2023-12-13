/* eslint-disable  */
import { basename } from 'path';
import yargs from 'yargs';

import { ratedCheckpoints } from '../commons/checkpoints';
import { Config, Extensions, IConfig } from '../commons/config';
import { logger } from '../commons/logger';
import { getModelCheckpoint } from '../commons/models';
import { miscQuery } from '../commons/query';

export const command = 'config-init';
export const describe = 'initialize config value. Can be used to refresh models';

export const builder = (builder: yargs.Argv<object>) => {
  return builder.options({
    force: {
      alias: 'f',
      describe: 'force reset config',
      type: 'boolean'
    }
  });
};

export const handler = async (argv: { force?: boolean }) => {
  const { force } = argv;
  const initialized = Config.get('initialized');

  const modelsQuery = await miscQuery<{ model_name: string; title: string }[]>('sdapi/v1/sd-models');
  const vaeQuery = await miscQuery<{ model_name: string }[]>('sdapi/v1/sd-vae');
  const samplersQuery = await miscQuery<{ aliases: string[]; name: string }[]>('sdapi/v1/samplers');
  const upscalersQuery = await miscQuery<{ model_path: null | string; name: string }[]>('sdapi/v1/upscalers');
  const extensionsQuery = await miscQuery<{ img2img: string[] }>('sdapi/v1/scripts');
  const schedulerQuery = await miscQuery<{ tasks: string[] }>('agent-scheduler/v1/history?limit=1');
  const lorasQuery = await miscQuery<{ name: string; metadata?: { ss_sd_model_name?: string } }[]>('sdapi/v1/loras');
  const embeddingsQueryQuery = await miscQuery<{ loaded: Record<string, any> }>('sdapi/v1/embeddings');

  if (!modelsQuery || !vaeQuery || !samplersQuery || !upscalersQuery || !extensionsQuery || !lorasQuery || !embeddingsQueryQuery) {
    logger('Error: Cannot initialize config : Error in SD API');
    process.exit(1);
  }

  Config.set(
    'models',
    modelsQuery.map((modelQuery) => {
      const hash = /[a-f0-9]{10}/.exec(modelQuery.title);

      if (hash) {
        return { hash: hash[0], name: modelQuery.title.replace(`[${hash}]`, '').trim() };
      }

      return { name: modelQuery.title };
    })
  );

  Config.set(
    'vae',
    vaeQuery.map((vae) => {
      return vae.model_name;
    })
  );

  Config.set('samplers', samplersQuery);

  Config.set(
    'upscalers',
    upscalersQuery.map((upscalerQuery, index) => ({
      filename: upscalerQuery.model_path ? basename(upscalerQuery.model_path) : undefined,
      name: upscalerQuery.name,
      index
    }))
  );

  Config.set(
    'embeddings',
    Object.keys(embeddingsQueryQuery.loaded).map((embedding) => ({ name: embeddingsQueryQuery.loaded[embedding].name, sdxl: false }))
  );
  Config.set(
    'loras',
    lorasQuery.map((lorasQuery) => {
      const lora: IConfig['loras'][0] = { name: lorasQuery.name };

      if (lorasQuery.metadata?.ss_sd_model_name) {
        lora.sdxl = lorasQuery.metadata.ss_sd_model_name.includes('sd_xl');
      }

      return lora;
    })
  );

  const extensions: Extensions[] = [];

  extensionsQuery.img2img.forEach((extensionQuery) => {
    switch (extensionQuery) {
      case 'adetailer':
        extensions.push('adetailer');
        break;
      case 'controlnet':
        extensions.push('controlnet');
        break;
      case 'cutoff':
        extensions.push('cutoff');
        break;
      case 'ultimate-sd-upscale':
        extensions.push('ultimate-sd-upscale');
        break;
    }
  });

  if (schedulerQuery) {
    extensions.push('scheduler');
  }

  Config.set('extensions', extensions);

  if (extensions.includes('controlnet')) {
    const controlnetModelsQuery = await miscQuery<{ model_list: string[] }>('controlnet/model_list');
    const controlnetModulesQuery = await miscQuery<{ module_list: string[] }>('controlnet/module_list');

    if (!controlnetModelsQuery || !controlnetModulesQuery) {
      logger('Error: Cannot initialize config : Error in ControlNet');
      process.exit(1);
    }

    Config.set(
      'controlnetModels',
      controlnetModelsQuery.model_list.map((modelQuery) => {
        const hash = /[a-f0-9]{8}/.exec(modelQuery);

        if (hash) {
          return { hash: hash[0], name: modelQuery.replace(`[${hash[0]}]`, '').trim() };
        }

        return { name: modelQuery };
      })
    );

    Config.set('controlnetModules', controlnetModulesQuery.module_list);
  } else {
    Config.set('controlnetModels', []);
    Config.set('controlnetModules', []);
  }

  if (!initialized || force) {
    logger('Refresh models');
    Config.set('initialized', true);
    Config.set('adetailersCustomModels', []);
    Config.set('cutoff', extensions.includes('cutoff'));
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
    Config.set('scheduler', extensions.includes('scheduler'));
    Config.set('redrawModels', {
      anime15: getModelCheckpoint(...ratedCheckpoints.anime15),
      animeXL: getModelCheckpoint(...ratedCheckpoints.animeXL),
      realist15: getModelCheckpoint(...ratedCheckpoints.realist15),
      realistXL: getModelCheckpoint(...ratedCheckpoints.realistXL)
    });
    Config.set('commonPositive', '');
    Config.set(
      'commonNegative',
      '(bad-hands-5:1.0), (badhandv4:1.0), (easynegative:0.8), (bad-artist-anime:0.8), (bad-artist:0.8), (bad_prompt:0.8), (bad-picture-chill-75v:0.8), (bad_prompt_version2:0.8), (bad-image-v2-39000:0.8) (verybadimagenegative_v1.3:0.8)'
    );
    Config.set('commonPositiveXL', '');
    Config.set('commonNegativeXL', '');
  }
};
