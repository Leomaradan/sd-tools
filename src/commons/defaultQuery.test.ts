import { describe, expect, it } from '@jest/globals';

import { getDefaultQueryConfig, getDefaultQueryTemplate15, getDefaultQueryTemplate20, getDefaultQueryTemplateXL } from './defaultQuery';

describe('get default query for version 1.5', () => {
  const base15 = {
    cfg: 7,
    height: 512,
    restoreFaces: false,
    sampler: 'DPM++ 2M',
    steps: 20,
    width: 512
  };

  const lcm15 = {
    cfg: 2,
    height: 512,
    restoreFaces: false,
    sampler: 'LCM',
    steps: 5,
    width: 512
  };

  it('should get base query for version 1.5', () => {
    expect.assertions(2);
    const resultDirect = getDefaultQueryTemplate15();
    const resultFull = getDefaultQueryConfig({ accelerator: 'none', name: 'jest', version: 'sd15' });

    expect(resultDirect).toMatchObject(base15);
    expect(resultFull).toMatchObject(base15);
  });

  it('should get base query for version 1.5 with LCM acceleration', () => {
    expect.assertions(2);
    const resultDirect = getDefaultQueryTemplate15('lcm');
    const resultFull = getDefaultQueryConfig({ accelerator: 'lcm', name: 'jest', version: 'sd15' });

    expect(resultDirect).toMatchObject(lcm15);
    expect(resultFull).toMatchObject(lcm15);
  });

  it('should get base query for version 1.5 with non-LCM acceleration', () => {
    expect.assertions(2);
    const resultDirect = getDefaultQueryTemplate15('distilled');
    const resultFull = getDefaultQueryConfig({ accelerator: 'lightning', name: 'jest', version: 'sd15' });

    expect(resultDirect).toMatchObject(base15);
    expect(resultFull).toMatchObject(base15);
  });
});

describe('get default query for version 2.x', () => {
  const base20Full = {
    cfg: 7,
    height: 768,
    restoreFaces: false,
    sampler: 'DPM++ 2M',
    steps: 20,
    width: 768
  };

  const base20 = {
    cfg: 7,
    height: 512,
    restoreFaces: false,
    sampler: 'DPM++ 2M',
    steps: 20,
    width: 512
  };

  it('should get base query for version 2.x', () => {
    expect.assertions(3);
    const resultDirect = getDefaultQueryTemplate20(false);
    const result20 = getDefaultQueryConfig({ accelerator: 'lcm', name: 'jest', version: 'sd20' });
    const result21 = getDefaultQueryConfig({ accelerator: 'lightning', name: 'jest', version: 'sd21' });

    expect(resultDirect).toMatchObject(base20);
    expect(result20).toMatchObject(base20);
    expect(result21).toMatchObject(base20);
  });

  it('should get base query for version 2.x in full size', () => {
    expect.assertions(3);
    const resultDirect = getDefaultQueryTemplate20(true);
    const result20 = getDefaultQueryConfig({ accelerator: 'none', name: 'jest', version: 'sd20-768' });
    const result21 = getDefaultQueryConfig({ accelerator: 'turbo', name: 'jest', version: 'sd21-768' });

    expect(resultDirect).toMatchObject(base20Full);
    expect(result20).toMatchObject(base20Full);
    expect(result21).toMatchObject(base20Full);
  });
});

describe('get default query for version XL', () => {
  const baseXL = {
    cfg: 7,
    height: 1024,
    restoreFaces: false,
    sampler: 'DPM++ 2M',
    steps: 20,
    width: 1024
  };

  const lcmXL = {
    cfg: 1.5,
    height: 1024,
    restoreFaces: false,
    sampler: 'LCM',
    steps: 4,
    width: 1024
  };

  const lightningXL = {
    cfg: 2,
    height: 1024,
    restoreFaces: false,
    sampler: 'DPM++ SDE',
    steps: 6,
    width: 1024
  };

  const turboXL = {
    cfg: 2,
    height: 1024,
    restoreFaces: false,
    sampler: 'DPM++ SDE',
    steps: 8,
    width: 1024
  };

  it('should get base query for version XL', () => {
    expect.assertions(2);
    const resultDirect = getDefaultQueryTemplateXL();
    const resultFull = getDefaultQueryConfig({ accelerator: 'none', name: 'jest', version: 'sdxl' });

    expect(resultDirect).toMatchObject(baseXL);
    expect(resultFull).toMatchObject(baseXL);
  });

  it('should get base query for version XL with LCM acceleration', () => {
    expect.assertions(2);
    const resultDirect = getDefaultQueryTemplateXL('lcm');
    const resultFull = getDefaultQueryConfig({ accelerator: 'lcm', name: 'jest', version: 'sdxl' });

    expect(resultDirect).toMatchObject(lcmXL);
    expect(resultFull).toMatchObject(lcmXL);
  });

  it('should get base query for version XL with Lightning acceleration', () => {
    expect.assertions(2);
    const resultDirect = getDefaultQueryTemplateXL('lightning');
    const resultFull = getDefaultQueryConfig({ accelerator: 'lightning', name: 'jest', version: 'sdxl' });

    expect(resultDirect).toMatchObject(lightningXL);
    expect(resultFull).toMatchObject(lightningXL);
  });

  it('should get base query for version XL with Turbo acceleration', () => {
    expect.assertions(2);
    const resultDirect = getDefaultQueryTemplateXL('turbo');
    const resultFull = getDefaultQueryConfig({ accelerator: 'turbo', name: 'jest', version: 'sdxl' });

    expect(resultDirect).toMatchObject(turboXL);
    expect(resultFull).toMatchObject(turboXL);
  });

  it('should get base query for version XL with Distilled acceleration', () => {
    expect.assertions(2);
    const resultDirect = getDefaultQueryTemplateXL('distilled');
    const resultFull = getDefaultQueryConfig({ accelerator: 'distilled', name: 'jest', version: 'sdxl' });

    expect(resultDirect).toMatchObject(baseXL);
    expect(resultFull).toMatchObject(baseXL);
  });
});
