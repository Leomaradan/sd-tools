/* eslint-disable sonarjs/no-duplicate-string */
/// <reference types="jest" />

import { preparePrompts } from './prompts';
import { type IPrompts } from './types';

describe('queue test', () => {
  it('should generate the query from single config', () => {
    const config: IPrompts = {
      prompts: [
        {
          cfg: 7,
          height: 512,
          negativePrompt: 'test negative prompt 1',
          prompt: 'test prompt 1',
          sampler: 'DPM++ 2M',
          steps: 20,
          width: 512
        }
      ]
    };

    const result = preparePrompts(config);

    expect(result.length).toBe(1);
    expect(result[0].prompt).toBe('test prompt 1');
  });
  it('should generate all the queries from config', () => {
    const config: IPrompts = {
      prompts: [
        {
          cfg: 7,
          checkpoints: [
            { checkpoint: 'cyberrealistic', vae: '840000' },
            { checkpoint: 'Counterfeit', vae: 'orangemix' },
            { checkpoint: 'revAnimated', vae: 'orangemix' }
          ],
          clipSkip: 2,
          denoising: [0.5, 0.3],
          filename: 'filename 1',
          height: 768,
          negativePrompt: 'test negative prompt 1',
          prompt: 'test prompt 1',
          sampler: 'DPM++ 2M',
          steps: [25, 50],
          upscaler: 'UltraSharp',
          width: 512
        },
        {
          cfg: [7, 8],
          checkpoints: [
            { checkpoint: 'cyberrealistic', vae: '840000' },
            {
              addBeforePrompt: 'before',
              checkpoint: 'Counterfeit',
              vae: 'orangemix'
            }
          ],
          filename: 'filename 1',
          height: [512, 768],
          negativePrompt: 'test negative prompt 2',
          pattern: '{filename} pattern',
          prompt: 'test prompt 2',
          sampler: 'DPM++ 2M',
          width: 512
        }
      ]
    };

    const result = preparePrompts(config);

    const filtered = result.filter((r) => r.prompt === 'before, test prompt 2' && r.height === 768 && r.cfg_scale === 8);

    expect(result.length).toBe(20);
    expect(filtered.length).toBe(1);
    expect(filtered[0]).toMatchObject({
      cfg_scale: 8,
      denoising_strength: undefined,
      enable_hr: false,
      height: 768,
      lcm: false,
      negative_prompt: 'test negative prompt 2',
      override_settings: {
        samples_filename_pattern: 'filename 1 pattern',
        sd_model_checkpoint: 'CounterfeitV30_v30.safetensors'
      },
      prompt: 'before, test prompt 2',
      restore_faces: false,
      sampler_name: 'DPM++ 2M',
      seed: undefined,
      steps: undefined,
      width: 512
    });
  });
  it('should generate all the queries from config with additional permutations', () => {
    const config: IPrompts = {
      permutations: [
        { afterFilename: ' Permut 1', beforePrompt: 'permut prompt, ' },
        {
          afterFilename: ' Permut 2',
          overwrite: {
            sampler: 'Euler a'
          }
        }
      ],
      prompts: [
        {
          cfg: 7,
          checkpoints: [
            { checkpoint: 'cyberrealistic', vae: '840000' },
            { checkpoint: 'Counterfeit', vae: 'orangemix' },
            { checkpoint: 'revAnimated', vae: 'orangemix' }
          ],
          clipSkip: 2,
          denoising: [0.5, 0.3],
          filename: 'filename 1',
          height: 768,
          negativePrompt: 'test negative prompt 1',
          prompt: 'test prompt 1',
          sampler: 'DPM++ 2M',
          steps: [25, 50],
          upscaler: 'UltraSharp',
          width: 512
        },
        {
          cfg: [7, 8],
          checkpoints: [
            { checkpoint: 'cyberrealistic', vae: '840000' },
            {
              addBeforePrompt: 'before',
              checkpoint: 'Counterfeit',
              vae: 'orangemix'
            }
          ],
          filename: 'filename 1',
          height: [512, 768],
          negativePrompt: 'test negative prompt 2',
          pattern: '{filename} pattern',
          prompt: 'test prompt 2',
          sampler: 'DPM++ 2M',
          width: 512
        }
      ]
    };

    const result = preparePrompts(config);

    const filtered = result.filter(
      (r) =>
        r.prompt === 'before, test prompt 2' &&
        r.override_settings.samples_filename_pattern === 'filename 1 Permut 2 pattern' &&
        r.height === 768 &&
        r.cfg_scale === 8
    );

    expect(result.length).toBe(60);
    expect(filtered.length).toBe(1);
    expect(filtered[0]).toMatchObject({
      cfg_scale: 8,
      denoising_strength: undefined,
      enable_hr: false,
      height: 768,
      lcm: false,
      negative_prompt: 'test negative prompt 2',
      override_settings: {
        samples_filename_pattern: 'filename 1 Permut 2 pattern',
        sd_model_checkpoint: 'CounterfeitV30_v30.safetensors'
      },
      prompt: 'before, test prompt 2',
      restore_faces: false,
      sampler_name: 'Euler a',
      seed: undefined,
      steps: undefined,
      width: 512
    });
  });
});