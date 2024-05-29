import path from 'node:path';

import { getArraysControlNet, preparePrompts } from './prompts';
import { type IPrompts, type ITxt2ImgQuery } from './types';

const root = path.resolve(__dirname, '..', '..');

const imageSingle = path.resolve(root, 'test', 'images', 'close-front.pose.png');
const imageSingle2 = path.resolve(root, 'test', 'images', 'single2', 'close-front.png');
const imageMultiFolder = path.resolve(root, 'test', 'images', 'multi');
const imageInstructFolder = path.resolve(root, 'test', 'images', 'instruct');
const imageInstruct = path.resolve(imageInstructFolder, 'close-front.png');

describe('prompt test', () => {
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
            input_image: path.resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image2}`,
            input_image: path.resolve(imageMultiFolder, image2),
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
            input_image: path.resolve(imageMultiFolder, image1),
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
            input_image: path.resolve(imageMultiFolder, image2),
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
            input_image: path.resolve(imageMultiFolder, image1),
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
            input_image: path.resolve(imageMultiFolder, image2),
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
            input_image: path.resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image1}`,
            input_image: path.resolve(imageMultiFolder, image1),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image1}`,
            input_image: path.resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image2}`,
            input_image: path.resolve(imageMultiFolder, image2),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image2}`,
            input_image: path.resolve(imageMultiFolder, image2),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image1}`,
            input_image: path.resolve(imageMultiFolder, image1),
            model: 'model2',
            module: 'module2',
            resize_mode: 1
          }
        ],
        [
          {
            control_mode: 0,
            image_name: `multi-${image2}`,
            input_image: path.resolve(imageMultiFolder, image2),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image2}`,
            input_image: path.resolve(imageMultiFolder, image2),
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
            input_image: path.resolve(imageMultiFolder, image1),
            model: 'model1',
            module: 'module1',
            resize_mode: 0
          },
          {
            control_mode: 1,
            image_name: `multi-${image2}`,
            input_image: path.resolve(imageMultiFolder, image2),
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
});
