/// <reference types="jest" />

import { getDefaultQuery, getDefaultQuery15, getDefaultQuery20, getDefaultQueryXL } from './defaultQuery';

describe('get default query for version 1.5', () => {
  const base15 = {
    alwayson_scripts: {},
    cfg_scale: 7,
    enable_hr: false,
    height: 512,
    negative_prompt: '',
    override_settings: {},
    override_settings_restore_afterwards: true,
    prompt: '',
    restore_faces: false,
    sampler_name: 'DPM++ 2M',
    save_images: true,
    seed: -1,
    send_images: false,
    steps: 20,
    styles: [],
    width: 512
  };

  const lcm15 = {
    alwayson_scripts: {},
    cfg_scale: 2,
    enable_hr: false,
    forcedSampler: 'LCM',
    height: 512,
    negative_prompt: '',
    override_settings: {},
    override_settings_restore_afterwards: true,
    prompt: '',
    restore_faces: false,
    sampler_name: 'LCM',
    save_images: true,
    seed: -1,
    send_images: false,
    steps: 5,
    styles: [],
    width: 512
  };

  it('should get base query for version 1.5', () => {
    const resultDirect = getDefaultQuery15();
    const resultFull = getDefaultQuery('sd15', 'none');

    expect(resultDirect).toMatchObject(base15);
    expect(resultFull).toMatchObject(base15);
  });

  it('should get base query for version 1.5 with LCM acceleration', () => {
    const resultDirect = getDefaultQuery15('lcm');
    const resultFull = getDefaultQuery('sd15', 'lcm');

    expect(resultDirect).toMatchObject(lcm15);
    expect(resultFull).toMatchObject(lcm15);
  });

  it('should get base query for version 1.5 with non-LCM acceleration', () => {
    const resultDirect = getDefaultQuery15('distilled');
    const resultFull = getDefaultQuery('sd15', 'lightning');

    expect(resultDirect).toMatchObject(base15);
    expect(resultFull).toMatchObject(base15);
  });
});

describe('get default query for version 2.x', () => {
  const base20Full = {
    alwayson_scripts: {},
    cfg_scale: 7,
    enable_hr: false,
    height: 768,
    negative_prompt: '',
    override_settings: {},
    override_settings_restore_afterwards: true,
    prompt: '',
    restore_faces: false,
    sampler_name: 'DPM++ 2M',
    save_images: true,
    seed: -1,
    send_images: false,
    steps: 20,
    styles: [],
    width: 768
  };

  const base20 = {
    alwayson_scripts: {},
    cfg_scale: 7,
    enable_hr: false,
    height: 512,
    negative_prompt: '',
    override_settings: {},
    override_settings_restore_afterwards: true,
    prompt: '',
    restore_faces: false,
    sampler_name: 'DPM++ 2M',
    save_images: true,
    seed: -1,
    send_images: false,
    steps: 20,
    styles: [],
    width: 512
  };

  it('should get base query for version 2.x', () => {
    const resultDirect = getDefaultQuery20(false);
    const result20 = getDefaultQuery('sd20', 'lcm');
    const result21 = getDefaultQuery('sd21', 'lightning');

    expect(resultDirect).toMatchObject(base20);
    expect(result20).toMatchObject(base20);
    expect(result21).toMatchObject(base20);
  });

  it('should get base query for version 2.x in full size', () => {
    const resultDirect = getDefaultQuery20(true);
    const result20 = getDefaultQuery('sd20-768', 'none');
    const result21 = getDefaultQuery('sd21-768', 'turbo');

    expect(resultDirect).toMatchObject(base20Full);
    expect(result20).toMatchObject(base20Full);
    expect(result21).toMatchObject(base20Full);
  });
});

describe('get default query for version XL', () => {
  const baseXL = {
    alwayson_scripts: {},
    cfg_scale: 7,
    enable_hr: false,
    height: 1024,
    negative_prompt: '',
    override_settings: {},
    override_settings_restore_afterwards: true,
    prompt: '',
    restore_faces: false,
    sampler_name: 'DPM++ 2M',
    save_images: true,
    seed: -1,
    send_images: false,
    steps: 20,
    styles: [],
    width: 1024
  };

  const lcmXL = {
    alwayson_scripts: {},
    cfg_scale: 1.5,
    enable_hr: false,
    forcedSampler: 'LCM',
    height: 1024,
    negative_prompt: '',
    override_settings: {},
    override_settings_restore_afterwards: true,
    prompt: '',
    restore_faces: false,
    sampler_name: 'LCM',
    save_images: true,
    seed: -1,
    send_images: false,
    steps: 4,
    styles: [],
    width: 1024
  };

  const lightningXL = {
    alwayson_scripts: {},
    cfg_scale: 2,
    enable_hr: false,
    forcedSampler: 'DPM++ SDE',
    height: 1024,
    negative_prompt: '',
    override_settings: {},
    override_settings_restore_afterwards: true,
    prompt: '',
    restore_faces: false,
    sampler_name: 'DPM++ SDE',
    save_images: true,
    seed: -1,
    send_images: false,
    steps: 6,
    styles: [],
    width: 1024
  };

  const turboXL = {
    alwayson_scripts: {},
    cfg_scale: 2,
    enable_hr: false,
    forcedSampler: 'DPM++ SDE',
    height: 1024,
    negative_prompt: '',
    override_settings: {},
    override_settings_restore_afterwards: true,
    prompt: '',
    restore_faces: false,
    sampler_name: 'DPM++ SDE',
    save_images: true,
    seed: -1,
    send_images: false,
    steps: 8,
    styles: [],
    width: 1024
  };

  it('should get base query for version XL', () => {
    const resultDirect = getDefaultQueryXL();
    const resultFull = getDefaultQuery('sdxl', 'none');

    expect(resultDirect).toMatchObject(baseXL);
    expect(resultFull).toMatchObject(baseXL);
  });

  it('should get base query for version XL with LCM acceleration', () => {
    const resultDirect = getDefaultQueryXL('lcm');
    const resultFull = getDefaultQuery('sdxl', 'lcm');

    expect(resultDirect).toMatchObject(lcmXL);
    expect(resultFull).toMatchObject(lcmXL);
  });

  it('should get base query for version XL with Lightning acceleration', () => {
    const resultDirect = getDefaultQueryXL('lightning');
    const resultFull = getDefaultQuery('sdxl', 'lightning');

    expect(resultDirect).toMatchObject(lightningXL);
    expect(resultFull).toMatchObject(lightningXL);
  });

  it('should get base query for version XL with Turbo acceleration', () => {
    const resultDirect = getDefaultQueryXL('turbo');
    const resultFull = getDefaultQuery('sdxl', 'turbo');

    expect(resultDirect).toMatchObject(turboXL);
    expect(resultFull).toMatchObject(turboXL);
  });

  it('should get base query for version XL with Distilled acceleration', () => {
    const resultDirect = getDefaultQueryXL('distilled');
    const resultFull = getDefaultQuery('sdxl', 'distilled');

    expect(resultDirect).toMatchObject(baseXL);
    expect(resultFull).toMatchObject(baseXL);
  });
});

describe('get default query for other versions', () => {
    const baseUnknown = {
      alwayson_scripts: {},
      cfg_scale: 7,
      enable_hr: false,
      height: 512,
      negative_prompt: '',
      override_settings: {},
      override_settings_restore_afterwards: true,
      prompt: '',
      restore_faces: false,
      sampler_name: 'DPM++ 2M',
      save_images: true,
      seed: -1,
      send_images: false,
      steps: 20,
      styles: [],
      width: 512
    };
    
    it('should get base query for other versions', () => {
      const result14 = getDefaultQuery('sd14', 'lcm');
      const resultUnknown = getDefaultQuery('unknown', 'lightning');
      const resultDefaultCase = getDefaultQuery('jest' as 'sd14', 'lightning');
  
      expect(result14).toMatchObject(baseUnknown);
      expect(resultUnknown).toMatchObject(baseUnknown);
      expect(resultDefaultCase).toMatchObject(baseUnknown);
    });
  
  });
  