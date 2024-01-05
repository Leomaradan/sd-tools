 
/// <reference types="jest" />

import { findExactStringProperties, findModel, findPartialStringProperties } from './models';

describe('models tests', () => {
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
