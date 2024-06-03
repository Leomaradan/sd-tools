import { resolve } from 'node:path';

import { TiledDiffusionMethods } from './extensions/multidiffusionUpscaler';
import { getArraysControlNet, preparePrompts } from './prompts';
import { type IPrompts, type ITxt2ImgQuery } from './types';

const root = resolve(__dirname, '..', '..');

const imageSingle = resolve(root, 'test', 'images', 'close-front.pose.png');
const imageSingle2 = resolve(root, 'test', 'images', 'single2', 'close-front.png');
const imageMultiFolder = resolve(root, 'test', 'images', 'multi');
const imageInstructFolder = resolve(root, 'test', 'images', 'instruct');
const imageInstruct = resolve(imageInstructFolder, 'close-front.png');

describe('prompt test', () => {
  describe('generate queries', () => {
    it('should generate the query from single config', () => {
      expect.assertions(2);
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

      expect(result).toHaveLength(1);
      expect(result[0].prompt).toBe('test prompt 1');
    });

    it('should manage adetailers params', () => {
      expect.assertions(4);
      const config: IPrompts = {
        prompts: [
          {
            adetailer: [
              {
                model: 'adetailers1'
              },
              {
                confidence: 0.8,
                height: 155,
                model: 'adetailers2',
                negative: 'ad negative prompt',
                prompt: 'ad prompt',
                strength: 0.7,
                width: 515
              }
            ],
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

      expect(result).toHaveLength(1);
      expect(result[0].prompt).toBe('test prompt 1');
      expect(result[0].adetailer?.[0]).toStrictEqual({
        ad_confidence: undefined,
        ad_denoising_strength: undefined,
        ad_model: 'adetailers1',
        ad_negative_prompt: undefined,
        ad_prompt: undefined
      });
      expect(result[0].adetailer?.[1]).toStrictEqual({
        ad_confidence: 0.8,
        ad_denoising_strength: 0.7,
        ad_inpaint_height: 155,
        ad_inpaint_width: 515,
        ad_model: 'adetailers2',
        ad_negative_prompt: 'ad negative prompt',
        ad_prompt: 'ad prompt',
        ad_use_inpaint_width_height: true
      });
    });

    it('should generate all the queries from config', () => {
      expect.assertions(3);
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

      expect(result).toHaveLength(20);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toMatchObject({
        cfg_scale: 8,
        denoising_strength: undefined,
        //enable_hr: false,
        height: 768,
        lcm: false,
        negative_prompt: 'test negative prompt 2',
        override_settings: {
          samples_filename_pattern: 'filename 1 pattern',
          sd_model_checkpoint: 'CounterfeitV30_v30.safetensors'
        },
        prompt: 'before, test prompt 2',
        //restore_faces: false,
        sampler_name: 'DPM++ 2M',
        seed: undefined,
        steps: undefined,
        width: 512
      });
    });

    it('should generate all the queries from config with additional permutations', () => {
      expect.assertions(3);
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

      expect(result).toHaveLength(60);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toMatchObject({
        cfg_scale: 8,
        denoising_strength: undefined,
        //enable_hr: false,
        height: 768,
        lcm: false,
        negative_prompt: 'test negative prompt 2',
        override_settings: {
          samples_filename_pattern: 'filename 1 Permut 2 pattern',
          sd_model_checkpoint: 'CounterfeitV30_v30.safetensors'
        },
        prompt: 'before, test prompt 2',
        //restore_faces: false,
        sampler_name: 'euler test',
        seed: undefined,
        steps: undefined,
        width: 512
      });
    });
  });

  describe('controlNet resolver', () => {
    it('should return one permutation with no images', () => {
      expect.assertions(4);
      //getArraysControlNet
      const resultUndefined = getArraysControlNet(undefined);
      const resultEmpty = getArraysControlNet([]);
      const resultNoImage = getArraysControlNet({ control_mode: 0, model: '', module: '', resize_mode: 0 });
      const resultNoImages = getArraysControlNet([{ control_mode: 0, model: '', module: '', resize_mode: 0 }]);

      expect(resultUndefined).toStrictEqual([undefined]);
      expect(resultEmpty).toStrictEqual([[]]);
      expect(resultNoImage).toStrictEqual([[{ control_mode: 0, model: '', module: '', resize_mode: 0 }]]);
      expect(resultNoImages).toStrictEqual([[{ control_mode: 0, model: '', module: '', resize_mode: 0 }]]);
    });

    it('should return one permutation with simple images', () => {
      expect.assertions(3);
      const resultOneImage = getArraysControlNet({
        control_mode: 0,
        input_image: imageSingle,
        model: 'model1',
        module: 'module1',
        resize_mode: 0
      });

      const resultOneImageArray = getArraysControlNet([
        { control_mode: 0, input_image: imageSingle, model: 'model1', module: 'module1', resize_mode: 0 },
        { control_mode: 1, model: 'model2', module: 'module2', resize_mode: 1 }
      ]);

      const resultTwoImages = getArraysControlNet([
        { control_mode: 0, input_image: imageSingle, model: 'model1', module: 'module1', resize_mode: 0 },
        { control_mode: 1, input_image: imageSingle2, model: 'model2', module: 'module2', resize_mode: 1 }
      ]);

      expect(resultOneImage).toMatchObject([
        [{ control_mode: 0, image_name: 'close-front.pose.png', model: 'model1', module: 'module1', resize_mode: 0 }]
      ]);

      expect(resultOneImageArray).toMatchObject([
        [
          { control_mode: 0, image_name: 'close-front.pose.png', model: 'model1', module: 'module1', resize_mode: 0 },
          { control_mode: 1, model: 'model2', module: 'module2', resize_mode: 1 }
        ]
      ]);

      expect(resultTwoImages).toMatchObject([
        [
          { control_mode: 0, image_name: 'close-front.pose.png', model: 'model1', module: 'module1', resize_mode: 0 },
          { control_mode: 1, image_name: 'close-front.png', model: 'model2', module: 'module2', resize_mode: 1 }
        ]
      ]);
    });

    it('should return multiple permutations', () => {
      expect.assertions(4);
      const image1 = 'pose-heroic-full-018-ar2x3.depth.png';
      const image2 = 'pose-heroic-full-018-ar2x3.pose.png';

      const resultOneImage = getArraysControlNet({
        control_mode: 0,
        input_image: imageMultiFolder,
        model: 'model1',
        module: 'module1',
        resize_mode: 0
      });

      const resultOneImageArray = getArraysControlNet([
        { control_mode: 0, input_image: imageMultiFolder, model: 'model1', module: 'module1', resize_mode: 0 },
        { control_mode: 1, model: 'model2', module: 'module2', resize_mode: 1 }
      ]);

      const resultTwoImages = getArraysControlNet([
        { control_mode: 0, input_image: imageSingle, model: 'model1', module: 'module1', resize_mode: 0 },
        { control_mode: 1, input_image: imageMultiFolder, model: 'model2', module: 'module2', resize_mode: 1 }
      ]);

      const resultFourImages = getArraysControlNet([
        { control_mode: 0, input_image: imageMultiFolder, model: 'model1', module: 'module1', resize_mode: 0 },
        { control_mode: 1, input_image: imageMultiFolder, model: 'model2', module: 'module2', resize_mode: 1 }
      ]);

      expect(resultOneImage).toMatchObject([
        [
          {
            control_mode: 0,
            image_name: `multi-${image1}`,
            input_image: resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image2}`,
            input_image: resolve(imageMultiFolder, image2),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          }
        ]
      ]);

      expect(resultOneImageArray).toMatchObject([
        [
          {
            control_mode: 0,
            image_name: `multi-${image1}`,
            input_image: resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          { control_mode: 1, image_name: undefined, input_image: undefined, model: 'model2', module: 'module2', resize_mode: 1 }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image2}`,
            input_image: resolve(imageMultiFolder, image2),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          { control_mode: 1, image_name: undefined, input_image: undefined, model: 'model2', module: 'module2', resize_mode: 1 }
        ]
      ]);

      expect(resultTwoImages).toMatchObject([
        [
          {
            control_mode: 0,
            image_name: 'close-front.pose.png',
            input_image: imageSingle,
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image1}`,
            input_image: resolve(imageMultiFolder, image1),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ],
        [
          {
            control_mode: 0,
            image_name: 'close-front.pose.png',
            input_image: imageSingle,
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image2}`,
            input_image: resolve(imageMultiFolder, image2),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ]
      ]);

      expect(resultFourImages).toMatchObject([
        [
          {
            control_mode: 0,
            image_name: `multi-${image1}`,
            input_image: resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image1}`,
            input_image: resolve(imageMultiFolder, image1),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image1}`,
            input_image: resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image2}`,
            input_image: resolve(imageMultiFolder, image2),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image2}`,
            input_image: resolve(imageMultiFolder, image2),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image1}`,
            input_image: resolve(imageMultiFolder, image1),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image2}`,
            input_image: resolve(imageMultiFolder, image2),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image2}`,
            input_image: resolve(imageMultiFolder, image2),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ]
      ]);
    });

    it('should return one permutation with regex pattern', () => {
      expect.assertions(1);
      const image1 = 'pose-heroic-full-018-ar2x3.depth.png';
      const image2 = 'pose-heroic-full-018-ar2x3.pose.png';

      const result = getArraysControlNet([
        { control_mode: 0, input_image: imageMultiFolder, model: 'model1', module: 'module1', regex: 'depth', resize_mode: 0 },
        { control_mode: 1, input_image: imageMultiFolder, model: 'model2', module: 'module2', regex: '.pose', resize_mode: 1 }
      ]);

      expect(result).toMatchObject([
        [
          {
            control_mode: 0,
            image_name: `multi-${image1}`,
            input_image: resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image2}`,
            input_image: resolve(imageMultiFolder, image2),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ]
      ]);
    });

    it('should add the optional prompts', () => {
      expect.assertions(3);
      const resultImage = getArraysControlNet({
        control_mode: 0,
        input_image: imageInstruct,
        model: 'model1',
        module: 'module1',
        resize_mode: 0
      });

      const resultFolder = getArraysControlNet({
        control_mode: 0,
        input_image: imageInstructFolder,
        model: 'model1',
        module: 'module1',
        resize_mode: 0
      });

      const resultFullRequest = preparePrompts({
        prompts: [
          {
            controlNet: {
              control_mode: 0,
              input_image: imageInstruct,
              model: 'model1',
              module: 'module1',
              resize_mode: 0
            },
            prompt: 'base prompt'
          }
        ]
      });

      expect(resultImage).toMatchObject([
        [
          {
            control_mode: 0,
            image_name: 'close-front.png',
            input_image: imageInstruct,
            model: 'model1',
            module: 'module1',
            prompt: 'test prompt instruct, {prompt}',
            resize_mode: 0
          }
        ]
      ]);

      expect(resultFolder).toMatchObject([
        [
          {
            control_mode: 0,
            image_name: 'instruct-close-front.png',
            input_image: imageInstruct,
            model: 'model1',
            module: 'module1',
            prompt: 'test prompt instruct, {prompt}',
            resize_mode: 0
          }
        ]
      ]);

      expect(resultFullRequest).toMatchObject([
        {
          prompt: 'test prompt instruct, base prompt'
        }
      ]);
    });

    it('should generate multiple queries using the seed string template', () => {
      expect.assertions(5);

      const resultFullRequest = preparePrompts({
        prompts: [
          {
            prompt: 'base prompt',
            seed: '10-19'
          }
        ]
      });

      const resultInvalidSeed = preparePrompts({
        prompts: [
          {
            prompt: 'base prompt',
            seed: '10-' as `${number}-${number}`
          }
        ]
      });

      expect(resultFullRequest).toHaveLength(10);

      expect(resultFullRequest[0]).toMatchObject({
        prompt: 'base prompt',
        seed: 10
      });

      expect(resultFullRequest[9]).toMatchObject({
        prompt: 'base prompt',
        seed: 19
      });

      expect(resultInvalidSeed).toHaveLength(1);

      expect(resultInvalidSeed[0]).toMatchObject({
        prompt: 'base prompt',
        seed: undefined
      });
    });
  });

  describe('prompts for Style and Subject', () => {
    it('should override the classic prompt if we use style ans subject prompt', () => {
      expect.assertions(5);
      const config1: IPrompts = {
        prompts: [
          {
            cfg: 1,
            height: 512,
            prompt: 'test prompt 1',
            promptStyle: 'style prompt 1',
            promptSubject: 'subject prompt 1',
            sampler: 'DPM++ 2M',
            steps: 20,
            width: 512
          },
          {
            cfg: 2,
            height: 1024,
            negativePrompt: 'test negative prompt 2',
            negativePromptStyle: 'negative style prompt 2',
            negativePromptSubject: 'negative subject prompt 2',
            prompt: 'test prompt 2',
            promptStyle: 'style prompt 2',
            promptSubject: 'subject prompt 2',
            sampler: 'Euler a',
            steps: 30,
            width: 1024
          },
          {
            cfg: 3,
            height: 768,
            negativePrompt: 'test negative prompt 3',
            prompt: 'test prompt 3',
            promptStyle: 'style prompt 3',
            promptSubject: 'subject prompt 3',
            sampler: 'Euler a',
            steps: 25,
            width: 768
          }
        ]
      };

      const result = preparePrompts(config1);

      expect(result).toHaveLength(3);

      const index1 = result.findIndex((r) => r.cfg_scale === 1);
      const index2 = result.findIndex((r) => r.cfg_scale === 2);

      expect(result[index1].prompt).toBe('subject prompt 1 BREAK style prompt 1');
      expect(result[index1].negative_prompt).toBeUndefined();
      expect(result[index2].prompt).toBe('subject prompt 2 BREAK style prompt 2');
      expect(result[index2].negative_prompt).toBe('negative subject prompt 2 BREAK negative style prompt 2');
    });

    it('should remove the negativePrompt of the classic prompt if we use style and subject prompt', () => {
      expect.assertions(3);
      const config1: IPrompts = {
        prompts: [
          {
            cfg: 1,
            height: 512,
            prompt: 'test prompt 1',
            promptStyle: 'style prompt 1',
            promptSubject: 'subject prompt 1',
            sampler: 'DPM++ 2M',
            steps: 20,
            width: 512
          },
          {
            cfg: 2,
            height: 1024,
            negativePrompt: 'test negative prompt 2',
            negativePromptStyle: 'negative style prompt 2',
            negativePromptSubject: 'negative subject prompt 2',
            prompt: 'test prompt 2',
            promptStyle: 'style prompt 2',
            promptSubject: 'subject prompt 2',
            sampler: 'Euler a',
            steps: 30,
            width: 1024
          },
          {
            cfg: 3,
            height: 768,
            negativePrompt: 'test negative prompt 3',
            prompt: 'test prompt 3',
            promptStyle: 'style prompt 3',
            promptSubject: 'subject prompt 3',
            sampler: 'Euler a',
            steps: 25,
            width: 768
          }
        ]
      };

      const result = preparePrompts(config1);

      expect(result).toHaveLength(3);

      const index3 = result.findIndex((r) => r.cfg_scale === 3);

      expect(result[index3].prompt).toBe('subject prompt 3 BREAK style prompt 3');
      expect(result[index3].negative_prompt).toBeUndefined();
    });

    it('should generate correct prompts with promptStyle and promptSubject without hiRes prompt', () => {
      expect.assertions(5);
      const config1: IPrompts = {
        prompts: [
          {
            cfg: 4,
            height: 512,
            negativePromptStyle: 'negative style prompt 1 {prompt}',
            negativePromptSubject: 'negative subject prompt 1',
            promptStyle: 'style prompt 1 {prompt}',
            promptSubject: 'subject prompt 1',
            sampler: 'DPM++ 2M',
            steps: 20,
            width: 512
          },
          {
            cfg: 5,
            height: 1024,
            negativePromptStyle: 'negative style prompt 2',
            negativePromptSubject: 'negative subject prompt 2 {prompt}',
            promptStyle: 'style prompt 2',
            promptSubject: 'subject prompt 2 {prompt}',
            sampler: 'Euler a',
            steps: 30,
            width: 1024
          },
          {
            cfg: 6,
            height: 768,
            negativePromptStyle: 'negative style prompt 3 {prompt}',
            negativePromptSubject: 'negative subject prompt 3 {prompt}',
            promptStyle: 'style prompt 3 {prompt}',
            promptSubject: 'subject prompt 3 {prompt}',
            sampler: 'Euler a',
            steps: 25,
            width: 768
          }
        ]
      };

      const result = preparePrompts(config1) as ITxt2ImgQuery[];

      expect(result).toHaveLength(3);

      const index1 = result.findIndex((r) => r.cfg_scale === 4);
      const index2 = result.findIndex((r) => r.cfg_scale === 5);
      const index3 = result.findIndex((r) => r.cfg_scale === 6);

      expect(result[index1]).toMatchObject({
        negative_prompt: 'negative style prompt 1 negative subject prompt 1',
        prompt: 'style prompt 1 subject prompt 1'
      });
      expect(result[index1].hr_prompt).toBeUndefined();

      expect(result[index2]).toMatchObject({
        negative_prompt: 'negative subject prompt 2 negative style prompt 2',
        prompt: 'subject prompt 2 style prompt 2'
      });

      expect(result[index3]).toMatchObject({
        negative_prompt: 'negative style prompt 3 negative subject prompt 3',
        prompt: 'style prompt 3 subject prompt 3'
      });
    });

    it('should generate correct prompts with promptStyle and promptSubject with hiRes prompt', () => {
      expect.assertions(4);
      const config1: IPrompts = {
        prompts: [
          {
            cfg: 7,
            enableHighRes: true,
            height: 512,
            negativePromptStyle: 'negative style prompt 1 {prompt}',
            negativePromptSubject: 'negative subject prompt 1',
            promptStyle: 'style prompt 1 {prompt}',
            promptSubject: 'subject prompt 1',
            sampler: 'DPM++ 2M',
            steps: 20,
            width: 512
          },
          {
            cfg: 8,
            enableHighRes: true,
            height: 1024,
            negativePromptStyle: 'negative style prompt 2',
            negativePromptSubject: 'negative subject prompt 2 {prompt}',
            promptStyle: 'style prompt 2',
            promptSubject: 'subject prompt 2 {prompt}',
            sampler: 'Euler a',
            steps: 30,
            width: 1024
          },
          {
            cfg: 9,
            enableHighRes: true,
            height: 768,
            negativePromptStyle: 'negative style prompt 3 {prompt}',
            negativePromptSubject: 'negative subject prompt 3 {prompt}',
            promptStyle: 'style prompt 3 {prompt}',
            promptSubject: 'subject prompt 3 {prompt}',
            sampler: 'Euler a',
            steps: 25,
            width: 768
          }
        ]
      };

      const result = preparePrompts(config1) as ITxt2ImgQuery[];

      expect(result).toHaveLength(3);

      const index1 = result.findIndex((r) => r.cfg_scale === 7);
      const index2 = result.findIndex((r) => r.cfg_scale === 8);
      const index3 = result.findIndex((r) => r.cfg_scale === 9);

      expect(result[index1]).toMatchObject({
        hr_prompt: 'subject prompt 1',
        negative_prompt: 'negative style prompt 1 negative subject prompt 1',
        prompt: 'style prompt 1 subject prompt 1'
      });

      expect(result[index2]).toMatchObject({
        hr_prompt: 'subject prompt 2',
        negative_prompt: 'negative subject prompt 2 negative style prompt 2',
        prompt: 'subject prompt 2 style prompt 2'
      });

      expect(result[index3]).toMatchObject({
        hr_prompt: 'subject prompt 3',
        negative_prompt: 'negative style prompt 3 negative subject prompt 3',
        prompt: 'style prompt 3 subject prompt 3'
      });
    });

    it('should correctly manage permutations for promptStyle and promptSubject', () => {
      expect.assertions(2);
      const config1: IPrompts = {
        prompts: [
          {
            cfg: 10,
            height: 512,
            prompt: 'test prompt 1',
            promptStyle: ['style prompt 1', 'style prompt 2', 'style prompt 3'],
            promptSubject: ['subject prompt 1', 'subject prompt 2'],
            sampler: 'DPM++ 2M',
            steps: 20,
            width: 512
          }
        ]
      };

      const result = preparePrompts(config1);

      expect(result).toHaveLength(6);

      expect(result).toMatchObject([
        { prompt: 'subject prompt 1 BREAK style prompt 1' },
        { prompt: 'subject prompt 1 BREAK style prompt 2' },
        { prompt: 'subject prompt 1 BREAK style prompt 3' },
        { prompt: 'subject prompt 2 BREAK style prompt 1' },
        { prompt: 'subject prompt 2 BREAK style prompt 2' },
        { prompt: 'subject prompt 2 BREAK style prompt 3' }
      ]);
    });
  });

  describe('prompts pattern token replacement', () => {
    it('should replace the {scaleFactor} tokens', () => {
      expect.assertions(3);
      const result1 = preparePrompts({
        prompts: [
          {
            pattern: '{scaleFactor} pattern',
            prompt: 'base prompt 1',
            scaleFactor: 5,
            tiledDiffusion: { method: TiledDiffusionMethods.MixtureOfDiffusers }
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{scaleFactor} pattern',
            prompt: 'base prompt 2',
            scaleFactor: 5,
            ultimateSdUpscale: true
          }
        ]
      });

      const result3 = preparePrompts({
        prompts: [
          {
            pattern: '{scaleFactor} pattern',
            prompt: 'base prompt 3'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          height: 512 * 5,
          override_settings: {
            samples_filename_pattern: '5 pattern'
          },
          prompt: 'base prompt 1',
          width: 512 * 5
        }
      ]);

      expect(result2).toMatchObject([
        {
          height: undefined,
          override_settings: {
            samples_filename_pattern: '5 pattern'
          },
          prompt: 'base prompt 2',
          ultimateSdUpscale: {
            height: 512 * 5,
            scale: 5,
            width: 512 * 5
          },
          width: undefined
        }
      ]);

      expect(result3).toMatchObject([
        {
          height: undefined,
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 3',
          width: undefined
        }
      ]);
    });

    it('should replace the {filename} tokens', () => {
      expect.assertions(4);
      const result1 = preparePrompts({
        prompts: [
          {
            filename: 'test',
            pattern: '{filename} pattern',
            prompt: 'base prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{filename} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      const result3 = preparePrompts({
        prompts: [
          {
            filename: 'test',
            prompt: 'base prompt 3'
          }
        ]
      });

      const result4 = preparePrompts({
        prompts: [
          {
            filename: 'test',
            pattern: 'pattern',
            prompt: 'base prompt 4'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'test pattern'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);

      expect(result3).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'test-[datetime]'
          },
          prompt: 'base prompt 3'
        }
      ]);

      expect(result4).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'test-pattern'
          },
          prompt: 'base prompt 4'
        }
      ]);
    });

    it('should replace the {cfg} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            cfg: 2,
            pattern: '{cfg} pattern',
            prompt: 'base prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{cfg} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          cfg_scale: 2,
          override_settings: {
            samples_filename_pattern: '[cfg] pattern'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          cfg_scale: undefined,
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);
    });

    it('should replace the {checkpoint} and {vae} tokens', () => {
      expect.assertions(4);
      const result1 = preparePrompts({
        prompts: [
          {
            checkpoints: [
              { checkpoint: 'sdxl', vae: '840000' },
              { checkpoint: 'revAnimated_v122', vae: 'orangemix' }
            ],
            pattern: '{checkpoint} {vae} pattern',
            prompt: 'base prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{checkpoint} {vae} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: '[model_name] orangemix.vae pattern',
            sd_model_checkpoint: 'revAnimated_v122.safetensors',
            sd_vae: 'orangemix.vae'
          },
          prompt: 'base prompt 1'
        },
        {
          override_settings: {
            samples_filename_pattern: '[model_name] vae-ft-mse-840000-ema-pruned pattern',
            sd_model_checkpoint: 'sdxl.safetensors',
            sd_vae: 'vae-ft-mse-840000-ema-pruned'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);

      expect(result2[0].override_settings.sd_model_checkpoint).toBeUndefined();
      expect(result2[0].override_settings.sd_vae).toBeUndefined();
    });

    it('should replace the {clipSkip} tokens', () => {
      expect.assertions(3);
      const result1 = preparePrompts({
        prompts: [
          {
            clipSkip: 2,
            pattern: '{clipSkip} pattern',
            prompt: 'base prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{clipSkip} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            CLIP_stop_at_last_layers: 2,
            samples_filename_pattern: '[clip_skip] pattern'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);

      expect(result2[0].override_settings.CLIP_stop_at_last_layers).toBeUndefined();
    });

    it('should replace the {cutOff} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            autoCutOff: true,
            pattern: '{cutOff} pattern',
            prompt: 'base prompt 1, red prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{cutOff} pattern',
            prompt: 'base prompt 2, red prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          cutOff: { tokens: ['red prompt 1'] },
          override_settings: {
            samples_filename_pattern: 'true pattern'
          },
          prompt: 'base prompt 1, red prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2, red prompt 2'
        }
      ]);
    });

    it('should replace the {denoising} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            denoising: 0.8,
            pattern: '{denoising} pattern',
            prompt: 'base prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{denoising} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          denoising_strength: 0.8,
          override_settings: {
            samples_filename_pattern: '0.80 pattern'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          denoising_strength: undefined,
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);
    });

    it('should replace the {enableHighRes} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            enableHighRes: 'both',
            pattern: '{enableHighRes} pattern',
            prompt: 'base prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{enableHighRes} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          enable_hr: false,
          override_settings: {
            samples_filename_pattern: 'false pattern'
          },
          prompt: 'base prompt 1'
        },
        {
          enable_hr: true,
          override_settings: {
            samples_filename_pattern: 'true pattern'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          enable_hr: undefined,
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);
    });

    it('should replace the {width} and {height} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            height: 30,
            pattern: '{width}x{height} pattern',
            prompt: 'base prompt 1',
            width: 20
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{width}x{height} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          height: 30,
          override_settings: {
            samples_filename_pattern: '[width]x[height] pattern'
          },
          prompt: 'base prompt 1',
          width: 20
        }
      ]);

      expect(result2).toMatchObject([
        {
          height: undefined,
          override_settings: {
            samples_filename_pattern: 'x pattern'
          },
          prompt: 'base prompt 2',
          width: undefined
        }
      ]);
    });

    it('should replace the {restoreFaces} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            pattern: '{restoreFaces} pattern',
            prompt: 'base prompt 1',
            restoreFaces: 'both'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{restoreFaces} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'false pattern'
          },
          prompt: 'base prompt 1',
          restore_faces: false
        },
        {
          override_settings: {
            samples_filename_pattern: 'true pattern'
          },
          prompt: 'base prompt 1',
          restore_faces: true
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);
    });

    it('should replace the {sampler} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            pattern: '{sampler} pattern',
            prompt: 'base prompt 1',
            sampler: 'test'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{sampler} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'euler test pattern'
          },
          prompt: 'base prompt 1',
          sampler_name: 'euler test'
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2',
          sampler_name: undefined
        }
      ]);
    });

    it('should replace the {seed} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            pattern: '{seed} pattern',
            prompt: 'base prompt 1',
            seed: 12345
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{seed} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: '[seed] pattern'
          },
          prompt: 'base prompt 1',
          seed: 12345
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2',
          seed: undefined
        }
      ]);
    });

    it('should replace the {steps} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            pattern: '{steps} pattern',
            prompt: 'base prompt 1',
            steps: 12
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{steps} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: '[steps] pattern'
          },
          prompt: 'base prompt 1',
          steps: 12
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2',
          steps: undefined
        }
      ]);
    });

    it('should replace the {tiling} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            pattern: '{tiling} pattern',
            prompt: 'base prompt 1',
            tiling: 'both'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{tiling} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'false pattern'
          },
          prompt: 'base prompt 1',
          tiling: false
        },
        {
          override_settings: {
            samples_filename_pattern: 'true pattern'
          },
          prompt: 'base prompt 1',
          tiling: true
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2',
          tiling: undefined
        }
      ]);
    });

    it('should replace the {upscaler} tokens', () => {
      expect.assertions(3);
      const result1 = preparePrompts({
        prompts: [
          {
            pattern: '{upscaler} pattern',
            prompt: 'base prompt 1',
            upscaler: 'UltraSharp'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{upscaler} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          hr_upscaler: '4x-UltraSharp',
          override_settings: {
            samples_filename_pattern: '4x-UltraSharp pattern'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);

      expect((result2[0] as ITxt2ImgQuery).hr_upscaler).toBeUndefined();
    });

    it('should replace the {pose} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            controlNet: [
              {
                control_mode: 0,
                input_image: 'test/images/close-front.pose.png',
                model: 'openpose',
                module: 'module1',
                resize_mode: 0
              }
            ],
            pattern: '{pose} pattern',
            prompt: 'base prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{pose} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'close-front.pose.png pattern'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: 'pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);
    });

    it('should replace the {count} tokens', () => {
      expect.assertions(2);
      const result1 = preparePrompts({
        prompts: [
          {
            count: 2,
            pattern: '{count} pattern',
            prompt: 'base prompt 1'
          }
        ]
      });

      const result2 = preparePrompts({
        prompts: [
          {
            pattern: '{count} pattern',
            prompt: 'base prompt 2'
          }
        ]
      });

      expect(result1).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: '1 pattern'
          },
          prompt: 'base prompt 1'
        },
        {
          override_settings: {
            samples_filename_pattern: '2 pattern'
          },
          prompt: 'base prompt 1'
        }
      ]);

      expect(result2).toMatchObject([
        {
          override_settings: {
            samples_filename_pattern: '1 pattern'
          },
          prompt: 'base prompt 2'
        }
      ]);
    });
  });

  describe('checkpoints resolution', () => {
    it('should resolve single checkpoint', () => {
      expect.assertions(1);
      const result = preparePrompts({
        prompts: [
          {
            checkpoints: 'sdxl',
            prompt: 'base prompt'
          }
        ]
      });

      expect(result).toMatchObject([
        {
          override_settings: {
            sd_model_checkpoint: 'sdxl.safetensors'
          },
          prompt: 'base prompt'
        }
      ]);
    });

    it('should resolve array of string checkpoints', () => {
      expect.assertions(1);
      const result = preparePrompts({
        prompts: [
          {
            checkpoints: ['sdxl', 'revAnimated_v122'],
            prompt: 'base prompt'
          }
        ]
      });

      expect(result).toMatchObject([
        {
          override_settings: {
            sd_model_checkpoint: 'revAnimated_v122.safetensors'
          },
          prompt: 'base prompt'
        },
        {
          override_settings: {
            sd_model_checkpoint: 'sdxl.safetensors'
          },
          prompt: 'base prompt'
        }
      ]);
    });

    it('should resolve array of checkpoints', () => {
      expect.assertions(1);
      const result = preparePrompts({
        prompts: [
          {
            checkpoints: [{ checkpoint: 'sdxl', vae: '840000' }, { checkpoint: 'revAnimated_v122' }],
            prompt: 'base prompt',
            vae: 'orangemix'
          }
        ]
      });

      expect(result).toMatchObject([
        {
          override_settings: {
            sd_model_checkpoint: 'revAnimated_v122.safetensors',
            sd_vae: 'orangemix.vae'
          },
          prompt: 'base prompt'
        },
        {
          override_settings: {
            sd_model_checkpoint: 'sdxl.safetensors',
            sd_vae: 'vae-ft-mse-840000-ema-pruned'
          },
          prompt: 'base prompt'
        }
      ]);
    });

    it('should manage addBefore* and addAfter* in checkpoint', () => {
      expect.assertions(1);
      const result = preparePrompts({
        prompts: [
          {
            checkpoints: [
              {
                addAfterFilename: ' - after filename',
                addAfterNegativePrompt: 'after negative prompt',
                addAfterPrompt: 'after prompt',
                addBeforeFilename: 'before filename - ',
                addBeforeNegativePrompt: 'before negative prompt',
                addBeforePrompt: 'before prompt',
                checkpoint: 'sdxl'
              }
            ],
            filename: 'filename',
            negativePrompt: 'negative prompt',
            pattern: '{filename}',
            prompt: 'base prompt 1'
          },
          {
            checkpoints: [
              {
                addAfterFilename: ' - after filename',
                addAfterNegativePrompt: 'after negative prompt',
                addAfterPrompt: 'after prompt',
                addBeforeFilename: 'before filename - ',
                addBeforeNegativePrompt: 'before negative prompt',
                addBeforePrompt: 'before prompt',
                checkpoint: 'sdxl'
              }
            ],
            pattern: '{filename}',
            prompt: 'base prompt 2'
          },
          {
            checkpoints: [
              {
                addAfterNegativePrompt: 'after negative prompt',
                addAfterPrompt: 'after prompt',
                addBeforeFilename: 'before filename - ',
                addBeforeNegativePrompt: 'before negative prompt',
                addBeforePrompt: 'before prompt',
                checkpoint: 'sdxl'
              }
            ],
            pattern: '{filename}',
            prompt: 'base prompt 3'
          }
        ]
      });

      expect(result).toMatchObject([
        {
          negative_prompt: 'before negative prompt, negative prompt, after negative prompt',
          override_settings: {
            samples_filename_pattern: 'before filename - filename - after filename',
            sd_model_checkpoint: 'sdxl.safetensors'
          },
          prompt: 'before prompt, base prompt 1, after prompt'
        },
        {
          negative_prompt: 'before negative prompt, , after negative prompt',
          override_settings: {
            samples_filename_pattern: 'before filename -  - after filename',
            sd_model_checkpoint: 'sdxl.safetensors'
          },
          prompt: 'before prompt, base prompt 2, after prompt'
        },

        {
          negative_prompt: 'before negative prompt, , after negative prompt',
          override_settings: {
            samples_filename_pattern: 'before filename -',
            sd_model_checkpoint: 'sdxl.safetensors'
          },
          prompt: 'before prompt, base prompt 3, after prompt'
        }
      ]);
    });
  });
});
