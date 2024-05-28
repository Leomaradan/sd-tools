/// <reference types="jest" />

import type { ILora, IModel, IModelWithHash, ISampler, IStyle, IUpscaler } from './types';

import {
  findADetailersModel,
  findCheckpoint,
  findControlnetModel,
  findControlnetModule,
  findExactStringProperties,
  findLORA,
  findModel,
  findPartialStringProperties,
  findSampler,
  findStyle,
  findUpscaler,
  findUpscalerUltimateSDUpscaler,
  findVAE
} from './models';

describe('models search', () => {
  const dataString = [
    'threshold',
    'depth_zoe',
    'normal_bae',
    'oneformer_coco',
    'oneformer_ade20k',
    'lineart',
    'lineart_coarse',
    'lineart_anime',
    'lineart_standard',
    'shuffle',
    'tile_resample',
    'invert'
  ];

  const dataObject = [
    { hash: '1', name: 'threshold' },
    { hash: '3', name: 'normal_bae' },
    { hash: '4', name: 'oneformer_coco' },
    { hash: '5', name: 'oneformer_ade30k' },
    { hash: '6', name: 'lineart' },
    { hash: '7', name: 'lineart_coarse' },
    { hash: '8', name: 'lineart_anime' },
    { hash: '9', name: 'lineart_standard' },
    { hash: '10', name: 'shuffle' },
    { hash: '11', name: 'tile_resample' },
    { hash: '12', name: 'invert' }
  ];

  it('should find the correct exact models in a string array', () => {
    const modelNames = ['lineart_realistic', 'lineart_coarse', 'lineart'];

    expect(findModel(modelNames, dataString)).toBe('lineart_coarse');
  });

  it('should find the correct partial models in a string array', () => {
    const modelNames = ['realistic', 'coarse', 'lineart'];

    expect(findModel(modelNames, dataString)).toBe('lineart_coarse');
  });

  it('should not find model in a string array', () => {
    const modelNames = ['openpose', 'depths'];

    expect(findModel(modelNames, dataString)).toBeUndefined();
  });

  it('should find the correct exact models in a object array', () => {
    const modelNames = ['lineart_realistic', 'lineart_coarse', 'lineart'];

    expect(
      findModel(modelNames, dataObject, {
        findExact: findExactStringProperties(['name', 'hash']),
        findPartial: findPartialStringProperties(['name', 'hash'])
      })
    ).toStrictEqual({ hash: '7', name: 'lineart_coarse' });
    expect(
      findModel(['7'], dataObject, {
        findExact: findExactStringProperties(['name', 'hash']),
        findPartial: findPartialStringProperties(['name', 'hash'])
      })
    ).toStrictEqual({ hash: '7', name: 'lineart_coarse' });
  });

  it('should find the correct partial models in a object array', () => {
    const modelNames = ['realistic', 'coarse', 'lineart'];

    expect(
      findModel(modelNames, dataObject, {
        findExact: findExactStringProperties(['name', 'hash']),
        findPartial: findPartialStringProperties(['name', 'hash'])
      })
    ).toStrictEqual({ hash: '7', name: 'lineart_coarse' });
    expect(
      findModel(['2'], dataObject, {
        findExact: findExactStringProperties(['name', 'hash']),
        findPartial: findPartialStringProperties(['name', 'hash'])
      })
    ).toStrictEqual({ hash: '12', name: 'invert' });
    //
  });

  it('should not find model in a object array', () => {
    const modelNames = ['openpose', 'depths'];

    expect(
      findModel(modelNames, dataObject, {
        findExact: findExactStringProperties(['name']),
        findPartial: findPartialStringProperties(['name'])
      })
    ).toBeUndefined();
  });

  it('should not fail if a property does not exists in a object array', () => {
    const modelNames = ['openpose', 'depths'];

    expect(
      findModel(modelNames, dataObject, {
        findExact: findExactStringProperties(['name', 'filename']),
        findPartial: findPartialStringProperties(['name', 'filename'])
      })
    ).toBeUndefined();
  });
});

describe('models specific resources', () => {
  it('should find the upscaler', () => {
    const foundFirst = findUpscaler('UltraSharp', 'model3');
    const foundSecond = findUpscaler('model3', 'UltraSharp');
    const foundBase = findUpscaler('model3', 'Latent (nearest)');
    const notFound = findUpscaler('model3', 'model4');

    expect(foundFirst).toStrictEqual<IUpscaler>({ filename: '4x-UltraSharp.pth', index: 5, name: '4x-UltraSharp' });
    expect(foundSecond).toStrictEqual<IUpscaler>({ filename: '4x-UltraSharp.pth', index: 5, name: '4x-UltraSharp' });
    expect(foundBase).toStrictEqual<IUpscaler>({ name: 'Latent (nearest)' });
    expect(notFound).toBeUndefined();
  });

  it('should find the upscaler for Ultimate SD Upscaler', () => {
    const foundFirst = findUpscalerUltimateSDUpscaler('UltraSharp', 'model3');
    const foundSecond = findUpscalerUltimateSDUpscaler('model3', 'UltraSharp');
    const foundBase = findUpscalerUltimateSDUpscaler('model3', 'Latent (nearest)');
    const notFound = findUpscalerUltimateSDUpscaler('model3', 'model4');

    expect(foundFirst).toStrictEqual<IUpscaler>({ filename: '4x-UltraSharp.pth', index: 5, name: '4x-UltraSharp' });
    expect(foundSecond).toStrictEqual<IUpscaler>({ filename: '4x-UltraSharp.pth', index: 5, name: '4x-UltraSharp' });
    expect(foundBase).toBeUndefined();
    expect(notFound).toBeUndefined();
  });

  it('should find the checkpoint', () => {
    const foundFirst = findCheckpoint('cyberrealistic_v40', 'CounterfeitV30_v30');
    const foundSecond = findCheckpoint('model3', 'cyberrealistic');
    const foundHash = findCheckpoint('model3', '481d75ae9d');
    const notFound = findCheckpoint('model3', 'model4');

    expect(foundFirst).toStrictEqual<IModelWithHash>({ hash: '481d75ae9d', name: 'cyberrealistic_v40.safetensors', version: 'unknown' });
    expect(foundSecond).toStrictEqual<IModelWithHash>({ hash: '481d75ae9d', name: 'cyberrealistic_v40.safetensors', version: 'unknown' });
    expect(foundHash).toStrictEqual<IModelWithHash>({ hash: '481d75ae9d', name: 'cyberrealistic_v40.safetensors', version: 'unknown' });
    expect(notFound).toBeUndefined();
  });

  it('should find the vae', () => {
    const foundFirst = findVAE('orangemix.vae', 'vae3');
    const foundSecond = findVAE('vae3', '840000');
    const notFound = findVAE('vae3', 'vae4');

    expect(foundFirst).toBe('orangemix.vae');
    expect(foundSecond).toBe('vae-ft-mse-840000-ema-pruned');
    expect(notFound).toBeUndefined();
  });

  it('should find the sampler', () => {
    const foundFirst = findSampler('DPM++ 2M', 'DDIM');
    const foundSecond = findSampler('DDIM', 'DPM');
    const foundAlias = findSampler('model3', 'Euler a');
    const foundAliasPartial = findSampler('model3', 'uler a');
    const notFound = findSampler('model3', 'model4');

    expect(foundFirst).toStrictEqual<ISampler>({ aliases: [], name: 'DPM++ 2M' });
    expect(foundSecond).toStrictEqual<ISampler>({ aliases: [], name: 'DPM++ 2M' });
    expect(foundAlias).toStrictEqual<ISampler>({ aliases: ['Euler a'], name: 'euler test' });
    expect(foundAliasPartial).toStrictEqual<ISampler>({ aliases: ['Euler a'], name: 'euler test' });
    expect(notFound).toBeUndefined();
  });

  it('should find the Adetailer model', () => {
    const foundFirst = findADetailersModel('adetailers1', 'adetailers3');
    const foundSecond = findADetailersModel('adetailers3', 'adetailers1');
    const notFound = findADetailersModel('adetailers3', 'adetailers4');

    expect(foundFirst).toBe('adetailers1');
    expect(foundSecond).toBe('adetailers1');
    expect(notFound).toBeUndefined();
  });

  it('should find the ControlNet model', () => {
    const foundFirst = findControlnetModel('model1', 'model3');
    const foundSecond = findControlnetModel('module3', 'model1');
    const notFound = findControlnetModel('model3', 'model4');

    expect(foundFirst).toStrictEqual<IModel>({ name: 'model1', version: 'unknown' });
    expect(foundSecond).toStrictEqual<IModel>({ name: 'model1', version: 'unknown' });
    expect(notFound).toBeUndefined();
  });

  it('should find the ControlNet module', () => {
    const foundFirst = findControlnetModule('module1', 'module3');
    const foundSecond = findControlnetModule('module3', 'module1');
    const notFound = findControlnetModule('module3', 'module4');

    expect(foundFirst).toBe('module1');
    expect(foundSecond).toBe('module1');
    expect(notFound).toBeUndefined();
  });

  it('should find the lora', () => {
    const foundFirst = findLORA('loras1', 'loras3');
    const foundSecond = findLORA('loras3', 'loras1');
    const foundAlias = findLORA('loras3', 'alias2');
    const notFound = findLORA('loras3', 'loras4');

    expect(foundFirst).toStrictEqual<ILora>({ keywords: ['trigger1'], name: 'loras1', version: 'sd15' });
    expect(foundSecond).toStrictEqual<ILora>({ keywords: ['trigger1'], name: 'loras1', version: 'sd15' });
    expect(foundAlias).toStrictEqual<ILora>({ alias: 'alias2', keywords: ['trigger2'], name: 'loras2', version: 'sdxl' });
    expect(notFound).toBeUndefined();
  });

  it('should find the style', () => {
    const foundFirst = findStyle('style1', 'style3');
    const foundSecond = findStyle('style3', 'style1');
    const notFound = findStyle('style3', 'style4');

    expect(foundFirst).toStrictEqual<IStyle>({ name: 'style1', negativePrompt: 'negativePrompt1', prompt: 'prompt1' });
    expect(foundSecond).toStrictEqual<IStyle>({ name: 'style1', negativePrompt: 'negativePrompt1', prompt: 'prompt1' });
    expect(notFound).toBeUndefined();
  });
});
