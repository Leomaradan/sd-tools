import { findSampler } from './models';
import {type  IBaseQuery, type MetadataAccelerator, type  MetadataVersionKey } from './types';

const DEFAULT_SAMPLERS = ['DPM++ 2M', 'Euler a']

const baseParamsAll: Partial<IBaseQuery> & { enable_hr: boolean; forcedSampler?: string } = {
  alwayson_scripts: {},
  //cfg_scale: 7,
  enable_hr: false,
  //height: 512,
  negative_prompt: '',
  override_settings: {},
  override_settings_restore_afterwards: true,
  prompt: '',
  restore_faces: false,
  //sampler_name: findSampler('DPM++ 2M', 'Euler a')?.name as string,
  save_images: true,
  seed: -1,
  send_images: false,
  //steps: 20,
  styles: []
  //width: 512
};

export const getDefaultQuery15 = (
  accelarator?: MetadataAccelerator
): Partial<IBaseQuery> & { enable_hr: boolean; forcedSampler?: string } => {
  const baseParams = { ...baseParamsAll, height: 512, width: 512 };

  if (accelarator === 'lcm') {
    // Other accelerator than LCM are not supported
    return {
      ...baseParams,
      cfg_scale: 2,
      forcedSampler: 'LCM',
      sampler_name: findSampler('LCM')?.name as string,
      steps: 5
    };
  }
  // Other accelerator than LCM are not supported
  return {
    ...baseParams,
    cfg_scale: 7,
    sampler_name: findSampler(...DEFAULT_SAMPLERS)?.name as string,
    steps: 20
  };
};

export const getDefaultQuery20 = (sizeFull: boolean): Partial<IBaseQuery> & { enable_hr: boolean; forcedSampler?: string } => {
  const baseParams = { ...baseParamsAll, 
    cfg_scale: 7,
    sampler_name: findSampler(...DEFAULT_SAMPLERS)?.name as string,
    steps: 20 
  };
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

export const getDefaultQueryXL = (
  accelarator?: MetadataAccelerator
): Partial<IBaseQuery> & { enable_hr: boolean; forcedSampler?: string } => {
  const baseParams = { ...baseParamsAll, height: 1024, width: 1024 };
  switch (accelarator) {
    case 'lcm':
      return {
        ...baseParams,
        cfg_scale: 1.5,
        forcedSampler: 'LCM',
        sampler_name: findSampler('LCM')?.name as string,
        steps: 4
      };
    case 'lightning':
      return {
        ...baseParams,
        cfg_scale: 2,
        forcedSampler: 'DPM++ SDE',
        sampler_name: findSampler('DPM++ SDE')?.name as string,
        steps: 6
      };
    case 'turbo':
      return {
        ...baseParams,
        cfg_scale: 2,
        forcedSampler: 'DPM++ SDE',
        sampler_name: findSampler('DPM++ SDE')?.name as string,
        steps: 8
      };
    case 'distilled':
    case 'none':
    default:
      return {
        ...baseParams,
        cfg_scale: 7,
        sampler_name: findSampler(...DEFAULT_SAMPLERS)?.name as string,
        steps: 20
      };
  }
};

export const getDefaultQuery = (
  version: MetadataVersionKey,
  accelarator?: MetadataAccelerator
): Partial<IBaseQuery> & { enable_hr: boolean; forcedSampler?: string } => {
  switch (version) {
    case 'sd20':
    case 'sd21':
      return getDefaultQuery20(false);
    case 'sd20-768':
    case 'sd21-768':
      return getDefaultQuery20(true);
    case 'sd15':
      return getDefaultQuery15(accelarator);

    case 'sdxl':
      return getDefaultQueryXL(accelarator);
    case 'sd14':
    case 'unknown':
    default:
      // No accelarators for these
      return {
        ...baseParamsAll,
        cfg_scale: 7,
        height: 512,
        sampler_name: findSampler('DPM++ 2M', 'Euler a')?.name as string,
        steps: 20,
        width: 512
      };
  }
};
