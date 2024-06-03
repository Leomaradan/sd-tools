/// <reference types="jest" />

import type { ICutOff } from './extensions/cutoff';
import type { IBaseQuery, ITxt2ImgQuery } from './types';

import { Config } from './config';
import { ControlNetMode, ControlNetResizes } from './extensions/controlNet';
import { TiledDiffusionMethods, defaultTiledVAEnOptions } from './extensions/multidiffusionUpscaler';
import { prepareRenderQuery } from './query';

describe('query tests', () => {
  it('should send a basic query for txt2img', () => {
    expect.assertions(1);
    const config = {
      cfg_scale: 7,
      enable_hr: false,
      height: 512,
      lcm: false,
      negative_prompt: 'test negative prompt 1',
      override_settings: {},
      prompt: 'test prompt 1',
      restore_faces: false,
      sampler_name: 'DPM++ 2M',
      steps: 20,
      // tiledVAE: {},
      tiling: false,
      width: 512
    };
    const result = prepareRenderQuery(config, 'txt2img');

    const expectedResponse: IBaseQuery = {
      alwayson_scripts: {},
      cfg_scale: 7,
      height: 512,
      negative_prompt: 'test negative prompt 1',
      override_settings: {},
      override_settings_restore_afterwards: true,
      prompt: 'test prompt 1',
      restore_faces: false,
      sampler_name: 'DPM++ 2M',
      save_images: true,
      seed: -1,
      send_images: false,
      steps: 20,
      styles: [],
      tiling: false,
      width: 512
    };

    expect(result).toStrictEqual(expectedResponse);
  });

  it('should send the correct query to the API for txt2img', () => {
    expect.assertions(2);
    const input: ITxt2ImgQuery = {
      adetailer: [{ ad_denoising_strength: 0.5, ad_model: 'ad1' }],
      cfg_scale: 5,

      controlNet: [
        { control_mode: ControlNetMode.Balanced, model: 'cn-model', module: 'cn-module', resize_mode: ControlNetResizes.Envelope }
      ],

      cutOff: {} as ICutOff,
      denoising_strength: 0.5,

      height: 768,

      hr_upscaler: 'hr upscaler',
      lcm: true,
      override_settings: {
        sd_model_checkpoint: 'cyberrealistic_v40',
        sd_vae: '840000'
      },

      prompt: 'prompt',
      restore_faces: true,

      sampler_name: 'DPM++ 2M',
      seed: 1234,

      steps: 25,
      styles: [],
      tiledDiffusion: { method: TiledDiffusionMethods.MixtureOfDiffusers },

      tiledVAE: {},
      tiling: true,
      width: 500
    };

    const result = prepareRenderQuery(input, 'txt2img');

    const expectedResponse: { hr_negative_prompt?: string; hr_prompt?: string; hr_scale?: number; hr_upscaler?: string } & IBaseQuery = {
      alwayson_scripts: {
        ADetailer: {
          args: [{ ad_denoising_strength: 0.5, ad_model: 'ad1' }]
        },
        /*Cutoff: {
          args: [true, 'blue', 1, false, false, '', 'Lerp']
        },*/
        'Tiled Diffusion': {
          args: [true, 'Mixture of Diffusers', true, false, 500, 768, 96, 96, 48, 4, '4x-UltraSharp', 2]
        },
        controlnet: {
          args: [
            {
              control_mode: ControlNetMode.Balanced,
              enabled: true,
              input_image: undefined,
              lowvram: true,
              model: 'cn-model',
              module: 'cn-module',
              pixel_perfect: true,
              resize_mode: ControlNetResizes.Envelope
            }
          ]
        }
      },
      cfg_scale: 5,
      denoising_strength: 0.5,
      height: 768,
      hr_negative_prompt: '',
      hr_prompt: '',
      hr_scale: 2,
      hr_upscaler: 'hr upscaler',
      negative_prompt: '',
      override_settings: {
        sd_model_checkpoint: 'cyberrealistic_v40',
        sd_vae: '840000'
      },
      override_settings_restore_afterwards: true,
      prompt: 'prompt',
      restore_faces: true,
      sampler_name: 'DPM++ 2M',
      save_images: true,
      seed: 1234,
      send_images: false,
      steps: 25,
      styles: [],
      tiling: true,
      width: 500
    };

    expect(result).toStrictEqual(expectedResponse);

    Config.set('cutoff', true);
    Config.set('autoTiledVAE', true);

    const result2 = prepareRenderQuery(input, 'txt2img');

    Config.set('cutoff', false);
    Config.set('autoTiledVAE', false);

    expectedResponse.alwayson_scripts['Cutoff'] = {
      args: [true, 'blue, red, green', 1, false, false, '', 'Lerp']
    };
    expectedResponse.alwayson_scripts['Tiled VAE'] = {
      args: [
        'True',
        defaultTiledVAEnOptions.encoderTileSize,
        defaultTiledVAEnOptions.decoderTileSize,
        defaultTiledVAEnOptions.vaeToGPU,
        defaultTiledVAEnOptions.fastDecoder,
        defaultTiledVAEnOptions.fastEncoder,
        defaultTiledVAEnOptions.colorFix
      ]
    };

    expect(result2).toStrictEqual(expectedResponse);
  });

  it('should send the correct query to the API for txt2img for SDXL', async () => {
    expect.assertions(1);
    const input: ITxt2ImgQuery = {
      adetailer: [{ ad_denoising_strength: 0.7, ad_model: 'ad2' }],
      cfg_scale: 5,

      controlNet: [
        { control_mode: ControlNetMode.Balanced, model: 'cn-model2', module: 'cn-module2', resize_mode: ControlNetResizes.Envelope }
      ],

      cutOff: { tokens: ['red'], weight: 0.8 },
      denoising_strength: 0.5,

      height: 256,

      hr_upscaler: 'hr upscaler2',
      lcm: true,
      override_settings: {
        sd_model_checkpoint: 'sdxl',
        sd_vae: '840000'
      },

      prompt: 'prompt 2',
      restore_faces: true,

      sampler_name: 'DPM++ 2M',
      seed: 12345,

      steps: 50,
      styles: [],
      tiledDiffusion: { method: TiledDiffusionMethods.MultiDiffusion },

      tiledVAE: {},
      tiling: true,
      width: 1024
    };

    const result = prepareRenderQuery(input, 'txt2img');

    const expectedResponse: { hr_negative_prompt?: string; hr_prompt?: string; hr_scale?: number; hr_upscaler?: string } & IBaseQuery = {
      alwayson_scripts: {
        ADetailer: {
          args: [{ ad_denoising_strength: 0.7, ad_model: 'ad2' }]
        },
        Cutoff: {
          args: [true, 'red', 0.8, false, false, '', 'Lerp']
        },
        controlnet: {
          args: [
            {
              control_mode: ControlNetMode.Balanced,
              enabled: true,
              input_image: undefined,
              lowvram: true,
              model: 'cn-model2',
              module: 'cn-module2',
              pixel_perfect: true,
              resize_mode: ControlNetResizes.Envelope
            }
          ]
        }
      },
      cfg_scale: 5,
      denoising_strength: 0.5,
      height: 256,
      hr_negative_prompt: '',
      hr_prompt: '',
      hr_scale: 2,
      hr_upscaler: 'hr upscaler2',
      negative_prompt: '',
      override_settings: {
        sd_model_checkpoint: 'sdxl',
        sd_vae: '840000'
      },
      override_settings_restore_afterwards: true,
      prompt: 'prompt 2',
      restore_faces: true,
      sampler_name: 'DPM++ 2M',
      save_images: true,
      seed: 12345,
      send_images: false,
      steps: 50,
      styles: [],
      tiling: true,
      width: 1024
    };

    expect(result).toStrictEqual(expectedResponse);
  });

  it('should send a minimal query for txt2img', () => {
    expect.assertions(1);
    const config = {
      override_settings: {},
      prompt: 'test prompt 1'
    };

    const result = prepareRenderQuery(config, 'txt2img');

    const expectedResponse: IBaseQuery = {
      alwayson_scripts: {},
      cfg_scale: 7,
      height: 512,
      negative_prompt: '',
      override_settings: {},
      override_settings_restore_afterwards: true,
      prompt: 'test prompt 1',
      restore_faces: false,
      sampler_name: 'DPM++ 2M',
      save_images: true,
      seed: -1,
      send_images: false,
      steps: 20,
      styles: [],
      width: 512
    };

    expect(result).toStrictEqual(expectedResponse);
  });
});
