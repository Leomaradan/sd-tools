import { Config } from './config';
import { findSampler } from './models';
import {
  type IBaseQuery,
  type IDefaultQueryConfig,
  type IDefaultQueryTemplate,
  type IForcedQueryConfig,
  type IModelWithHash,
  type IPromptSingleSimple,
  type MetadataAccelerator
} from './types';

const DEFAULT_SAMPLERS = ['DPM++ 2M', 'Euler a'];

export const baseParamsAll: () => { enable_hr: boolean; forcedSampler?: string } & Partial<IBaseQuery> = () => ({
  alwayson_scripts: {},
  //width: 512
  cfg_scale: 7,
  //cfg_scale: 7,
  enable_hr: false,
  height: 512,
  //height: 512,
  negative_prompt: '',
  override_settings: {},
  override_settings_restore_afterwards: true,
  prompt: '',
  restore_faces: false,
  sampler_name: findSampler('DPM++ 2M', 'Euler a')?.name as string,
  //sampler_name: findSampler('DPM++ 2M', 'Euler a')?.name as string,
  save_images: true,
  seed: -1,
  send_images: false,
  steps: 20,
  //steps: 20,
  styles: [],
  width: 512
});
export const getDefaultQueryTemplate15 = (accelerator?: MetadataAccelerator): Partial<IPromptSingleSimple> => {
  const baseParams = { height: 512, restoreFaces: false, width: 512 };

  if (accelerator === 'lcm') {
    // Other accelerator than LCM are not supported
    return {
      ...baseParams,
      cfg: 2,
      sampler: findSampler('LCM')?.name as string,
      steps: 5
    };
  }
  // Other accelerator than LCM are not supported
  return {
    ...baseParams,
    cfg: 7,
    sampler: findSampler(...DEFAULT_SAMPLERS)?.name as string,
    steps: 20
  };
};

export const getDefaultQueryTemplate20 = (sizeFull: boolean): Partial<IPromptSingleSimple> => {
  const baseParams = { cfg: 7, restoreFaces: false, sampler: findSampler(...DEFAULT_SAMPLERS)?.name as string, steps: 20 };
  if (sizeFull) {
    // Other accelerator than LCM are not supported
    return {
      ...baseParams,
      height: 768,
      width: 768
    };
  }
  // Other accelerator than LCM are not supported
  return {
    ...baseParams,
    height: 512,
    width: 512
  };
};

export const getDefaultQueryTemplateXL = (accelerator?: MetadataAccelerator): Partial<IPromptSingleSimple> => {
  const baseParams = { height: 1024, restoreFaces: false, width: 1024 };
  switch (accelerator) {
    case 'lcm':
      return {
        ...baseParams,
        cfg: 1.5,
        sampler: findSampler('LCM')?.name as string,
        steps: 4
      };
    case 'lightning':
      return {
        ...baseParams,
        cfg: 2,
        sampler: findSampler('DPM++ SDE')?.name as string,
        steps: 6
      };
    case 'turbo':
      return {
        ...baseParams,
        cfg: 2,
        sampler: findSampler('DPM++ SDE')?.name as string,
        steps: 8
      };
    case 'distilled':
    case 'none':
    default:
      return {
        ...baseParams,
        cfg: 7,
        sampler: findSampler(...DEFAULT_SAMPLERS)?.name as string,
        steps: 20
      };
  }
};

export const mergeConfigs = (modelConfig: IDefaultQueryConfig, templates: IDefaultQueryTemplate[]) => {
  const template = templates.find((t) => t.templateName === modelConfig.extends) ?? ({} as Partial<IDefaultQueryTemplate>);

  const { accelerator: _ta, templateName: _tt, versions: _v, ...templateConfig } = template;
  const { extends: _e, modelName: _m, templateName: _t, ...config } = modelConfig;

  return { ...templateConfig, ...config };
};

export const getDefaultQueryConfig = (model?: IModelWithHash): Partial<IPromptSingleSimple> => {
  if (model) {
    const { accelerator, name, version } = model;
    const templates = Config.get('defaultQueryTemplates');
    const models = Config.get('defaultQueryConfigs');

    const modelConfig = models.find((m) => m.modelName === name);

    if (modelConfig) {
      return mergeConfigs(modelConfig, templates);
    }

    const templateAccelerator = templates.find((t) => t.accelerator === accelerator && t.versions?.includes(version));

    if (templateAccelerator) {
      const { accelerator: _ta, templateName: _tt, versions: _v, ...templateConfig } = templateAccelerator;
      return { ...templateConfig };
    }

    const templateVersion = templates.find((t) => t.versions?.includes(version)) ?? ({} as Partial<IDefaultQueryTemplate>);

    const { accelerator: _ta, templateName: _tt, versions: _v, ...templateConfig } = templateVersion;

    return { ...templateConfig };
  }

  return {};
};

export const getForcedQueryConfig = (model?: IModelWithHash): Partial<IPromptSingleSimple> => {
  if (model) {
    const { name } = model;
    const models = Config.get('forcedQueryConfigs');

    const modelConfig = models.find((m) => m.modelName === name) ?? ({} as Partial<IForcedQueryConfig>);

    const { modelName: _m, templateName: _t, ...config } = modelConfig;

    return config;
  }

  return {};
};
