import { basename } from 'node:path';
import { type Argv } from 'yargs';

import { ratedCheckpoints } from '../commons/checkpoints';
import { Cache, Config, type ApiType } from '../commons/config';
import { getMetadataCheckpoint, getMetadataLora } from '../commons/file';
import { ExitCodes, loggerInfo, loggerVerbose } from '../commons/logger';
import { findCheckpoint } from '../commons/models';
import {
  checkApiQuery,
  getAdModelQuery,
  getControlnetModelsQuery,
  getControlnetModulesQuery,
  getEmbeddingsQuery,
  getExtensionsQuery,
  getInterrogatorQuery,
  getLORAsQuery,
  getModelsQuery,
  getSamplersQuery,
  getSchedulerQuery,
  getStylesQuery,
  getUpscalersQuery,
  getVAEQuery,
  getVAEQueryForge
} from '../commons/query';
import { type Extensions, type ILora, type IModel, type IModelWithHash, type IStyle, Version } from '../commons/types';
import { loadWildcards } from '../commons/wildcards/loadWildcards';

export const command = 'init';
export const describe = 'initialize config value. Can be used to refresh models';

export const builder = (builder: Argv<object>) => {
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

const setModels = async (
  modelsQuery: {
    filename: string;
    model_name: string;
    title: string;
  }[]
) => {
  const modelsQueryResolved: IModelWithHash[] = [];

  for (const modelQuery of modelsQuery) {
    const item: IModelWithHash = { accelarator: 'none', name: modelQuery.title, version: Version.Unknown };
    const hash = /[a-f0-9]{8,10}/.exec(modelQuery.title);
    const metadata = await getMetadataCheckpoint(modelQuery.filename);

    if (metadata) {
      item.version = metadata.sdVersion;
      item.accelarator = metadata.accelerator;
    }

    if (hash) {
      item.hash = hash[0];
      item.name = modelQuery.title.replace(`[${hash}]`, '').trim();
    }

    modelsQueryResolved.push(item);
  }

  Config.set('models', Array.from(new Set(modelsQueryResolved)));
};

const setLoras = async (
  lorasQuery: {
    alias: string;
    name: string;
    path: string;
  }[]
) => {
  const lorasQueryResolved: ILora[] = [];

  for (const loraQuery of lorasQuery) {
    const item: ILora = { alias: loraQuery.alias, keywords: [], name: loraQuery.name, version: Version.Unknown };

    const metadata = await getMetadataLora(loraQuery.path);

    if (metadata) {
      item.version = metadata.sdVersion;
      item.keywords = metadata.keywords;
    }

    lorasQueryResolved.push(item);
  }

  Config.set('loras', Array.from(new Set(lorasQueryResolved)));
};

const setVAE = (
  vaeQuery: {
    model_name: string;
  }[]
) => {
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
};

const setSamplers = (
  samplersQuery: {
    aliases: string[];
    name: string;
  }[]
) => {
  Config.set(
    'samplers',
    Array.from(new Set(samplersQuery.map((samplerQuery) => ({ aliases: samplerQuery.aliases, name: samplerQuery.name }))))
  );
};

const setUpscalers = (
  upscalersQuery: {
    model_path: null | string;
    name: string;
  }[]
) => {
  Config.set(
    'upscalers',
    Array.from(
      new Set(
        upscalersQuery.map((upscalerQuery, index) => ({
          filename: upscalerQuery.model_path ? basename(upscalerQuery.model_path) : undefined,
          index,
          name: upscalerQuery.name
        }))
      )
    )
  );
};

const setEmbedding = (embeddingsQuery: { loaded: Record<string, unknown>; skipped: Record<string, unknown> }) => {
  Config.set('embeddings', Array.from(new Set([...Object.keys(embeddingsQuery.loaded), ...Object.keys(embeddingsQuery.skipped)])));
};

const setStyles = (
  stylesQuery: {
    name: string;
    negative_prompt: string;
    prompt: string;
  }[]
) => {
  Config.set(
    'styles',
    Array.from(
      new Set(
        stylesQuery
          .map((styleQuery) => {
            const style: IStyle = { name: styleQuery.name, negativePrompt: '', prompt: '' };

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
          .filter((style) => style !== undefined)
      )
    )
  );
};

const setExtensions = (
  extensionsQuery: {
    img2img: string[];
  },
  schedulerQuery: void | {
    tasks: string[];
  } | void,
  interrogatorQuery: string[] | void
) => {
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
      case 'forge couple':
        extensions.add('sd-forge-couple');
        break;
      case 'tiled diffusion':
        extensions.add('tiled diffusion');
        break;
      case 'tiled vae':
        extensions.add('tiled vae');
        break;
      case 'ultimate-sd-upscale':
        extensions.add('ultimate-sd-upscale');
        break;
    }
  });

  if (schedulerQuery) {
    extensions.add('scheduler');
  }

  if (interrogatorQuery) {
    extensions.add('interrogator');
    Config.set('interrogatorModels', interrogatorQuery);
  }

  Config.set('extensions', Array.from(extensions));

  return extensions;
};

const setControlnet = async (extensions: Set<Extensions>) => {
  if (extensions.has('controlnet')) {
    const controlnetModelsQueryOriginal = await getControlnetModelsQuery();
    const controlnetModelsQuery = {
      model_list: [
        'control-lora-canny-rank256 [ec2dbbe4]',
        'control-lora-depth-rank256 [9fe0fd3b]',
        'control_v11e_sd15_ip2p [c4bb465c]',
        'control_v11e_sd15_shuffle [526bfdae]',
        'control_v11f1e_sd15_tile [a371b31b]',
        'control_v11f1p_sd15_depth [cfd03158]',
        'control_v11p_sd15_canny [d14c016b]',
        'control_v11p_sd15_inpaint [ebff9138]',
        'control_v11p_sd15_lineart [43d4be0d]',
        'control_v11p_sd15_mlsd [aca30ff0]',
        'control_v11p_sd15_normalbae [316696f1]',
        'control_v11p_sd15_openpose [cab727d4]',
        'control_v11p_sd15_scribble [d4ba51ff]',
        'control_v11p_sd15_seg [e1f51eb9]',
        'control_v11p_sd15_softedge [a8575a2a]',
        'control_v11p_sd15s2_lineart_anime [3825e83e]',
        'diffusers_xl_canny_mid [112a778d]',
        'diffusers_xl_depth_full [2f51180b]',
        'diffusers_xl_depth_mid [39c49e13]',
        'illustriousXL_v10 [7c192463]',
        'ip-adapter-faceid-plusv2_sd15 [6e14fc1a]',
        'ip-adapter_sd15 [6a3f6166]',
        'ip-adapter_sd15_plus [32cd8f7f]',
        'ip-adapter_xl [4209e9f7]',
        'kohya_controllllite_xl_blur [22117d11]',
        'sai_xl_recolor_128lora [4198a181]',
        'sai_xl_sketch_128lora [b06d459a]',
        'sargezt_xl_softedge [b6f7415b]',
        'sdxlControlnet_v10eOpticalpattern [1e4e1607]',
        't2i-adapter_diffusers_xl_lineart [bae0efef]',
        'thibaud_xl_openpose_256lora [14288071]',
        'ttplanetSDXLControlnet_v10Fp16 [6c558c4d]'
      ]
    }; //await getControlnetModelsQuery() ??  [];
    const controlnetModulesQueryOriginal = await getControlnetModulesQuery();
    const controlnetModulesQuery = await getControlnetModulesQuery();

    if (!controlnetModelsQuery || !controlnetModulesQuery) {
      loggerInfo('Error: Cannot initialize config : Error in ControlNet');
      process.exit(ExitCodes.INIT_NO_CONTROLNET);
      return;
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
};

const setAdetailer = async (
  extensions: Set<Extensions>,
  adModelsQuery: void | {
    ad_model: string[];
  }
) => {
  if (extensions.has('adetailer') && adModelsQuery) {
    Config.set('adetailersModels', Array.from(adModelsQuery.ad_model));
  } else {
    Config.set('adetailersModels', []);
  }
};

interface IInitArgs {
  endpoint?: string;
  force?: boolean;
  ['purge-cache']?: boolean;
}

export const initFunction = async (argv: IInitArgs): Promise<ApiType | false> => {
  const { endpoint, force } = argv;
  const initialized = Config.get('initialized');

  if (!initialized || force || argv['purge-cache']) {
    Cache.set('metadata', {});
    Cache.set('imageData', {});
    Cache.set('interrogator', {});
  }

  if (endpoint || !initialized || force) {
    Config.set('endpoint', endpoint ?? 'http://127.0.0.1:7860');
  }

  const result = await checkApiQuery();

  if (!result) {
    loggerInfo('Error: Cannot initialize config : API is offline');
    return false;
  }

  const modelsQuery = await getModelsQuery();
  const vaeQuery = await getVAEQuery();
  const vaeQueryForge = await getVAEQueryForge();
  const samplersQuery = await getSamplersQuery();
  const upscalersQuery = await getUpscalersQuery();
  const extensionsQuery = await getExtensionsQuery();
  const interrogatorQuery = await getInterrogatorQuery();
  const schedulerQuery = await getSchedulerQuery();
  const lorasQuery = await getLORAsQuery();
  const embeddingsQuery = await getEmbeddingsQuery();
  const stylesQuery = await getStylesQuery();
  const adModelsQuery = await getAdModelQuery();

  if (
    !modelsQuery ||
    (!vaeQuery && !vaeQueryForge) ||
    !samplersQuery ||
    !upscalersQuery ||
    !extensionsQuery ||
    !lorasQuery ||
    !embeddingsQuery ||
    !stylesQuery
  ) {
    loggerInfo('Error: Cannot initialize config : Error in SD API');
    process.exit(ExitCodes.INIT_NO_SD_API);
  }

  await setModels(modelsQuery);

  if (vaeQuery) {
    setVAE(vaeQuery);
  } else if (vaeQueryForge) {
    setVAE(vaeQueryForge);
  }

  setSamplers(samplersQuery);

  setUpscalers(upscalersQuery);

  setEmbedding(embeddingsQuery);

  setStyles(stylesQuery);

  await setLoras(lorasQuery);

  const extensions = setExtensions(extensionsQuery, schedulerQuery, interrogatorQuery);

  setControlnet(extensions);

  setAdetailer(extensions, adModelsQuery);

  if (!initialized || force) {
    loggerVerbose('Refresh models');
    Config.set('initialized', true);
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
      pixel15: findCheckpoint(...ratedCheckpoints.pixel15)?.name,
      pixelxl: findCheckpoint(...ratedCheckpoints.pixelXL)?.name,
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

  if (Config.get('wildcardsFolder')) {
    await loadWildcards();
  }

  return result;
};

export const handler = async (argv: IInitArgs) => {
  initFunction(argv);
};
