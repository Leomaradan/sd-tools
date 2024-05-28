/// <reference types="jest" />

import type { IAdetailerPrompt, IPromptSingle } from './types';

import { type IBaseParams, getAdetailerParams, getBaseParams, getPromptJSON, getPromptTextBox, getPrompts } from './extract';

const promptNoNegative = [
  "In Casey Baugh's evocative style, art of a beautiful young girl cyborg with long brown hair, futuristic, scifi, intricate, elegant, highly detailed, majestic, Baugh's brushwork infuses the painting with a unique combination of realism and abstraction, greg rutkowski, surreal gold filigree, broken glass, (masterpiece, sidelighting, finely detailed beautiful eyes: 1.2), hdr, realistic painting, natural skin, textured skin, closed mouth, crystal eyes, butterfly filigree, chest armor, eye makeup, robot joints, long hair moved by the wind, window facing to another world, Baugh's distinctive style captures the essence of the girl's enigmatic nature, inviting viewers to explore the depths of her soul, award winning art",
  'Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7.0, Seed: 726196108, Size: 512x912, Model hash: ec41bd2a82, Model: photon_v1, VAE hash: 63aeecb90f, VAE: vae-ft-mse-840000-ema-pruned.ckpt, Denoising strength: 0.5, Clip skip: 2, Hires upscale: 2.0, Hires upscaler: 4x-UltraSharp, Version: v1.7.0-5-g750e9a6b'
];

const promptFull = [
  'two person cheering for new year evening, with champagne',
  'Negative prompt: nsfw, childish, verybadimagenegative_v1.3, ng_deepnegative_v1_75t, bad_prompt_version2-neg, By bad artist -neg, easynegative, FastNegativeEmbedding, BadDream, UnrealisticDream',
  'Steps: 20, Sampler: DPM++ 2M SDE Karras, CFG scale: 7, Seed: 743577308, Size: 768x512, Model hash: 4199bcdd14, Model: revAnimated_v122, VAE hash: 63aeecb90f, VAE: Anything-V3.0.pt, Denoising strength: 0.4, Clip skip: 2, Tiled Diffusion: {"Method": "MultiDiffusion", "Tile tile width": 128, "Tile tile height": 96, "Tile Overlap": 48, "Tile batch size": 4, "Region control": {"Region 1": {"enable": true, "x": 0.1556, "y": 0.1292, "w": 0.3444, "h": 0.8708, "prompt": "1girl, solo, standing, <lora:zelda-tp:0.8> princess zelda, twpr, nintendo, the legend of zelda", "neg_prompt": "", "blend_mode": "Foreground", "feather_ratio": 0.2, "seed": -1}, "Region 2": {"enable": true, "x": 0.5, "y": 0.0417, "w": 0.35, "h": 0.9583, "prompt": "1boy, solo, standing, <lora:link:0.9> link, the legend of zelda, tunic, hat", "neg_prompt": "", "blend_mode": "Foreground", "feather_ratio": 0.2, "seed": -1}, "Region 3": {"enable": true, "x": 0, "y": 0, "w": 1, "h": 1, "prompt": "Hyrule castle", "neg_prompt": "", "blend_mode": "Background", "feather_ratio": 0.2, "seed": -1}}}, ControlNet 0: "Module: none, Model: control_v11p_sd15_openpose [cab727d4], Weight: 1, Resize Mode: Crop and Resize, Low Vram: False, Guidance Start: 0, Guidance End: 1, Pixel Perfect: False, Control Mode: Balanced, Save Detected Map: True", Hires upscale: 2, Hires upscaler: 4x-UltraSharp, TI hashes: "verybadimagenegative_v1.3: d70463f87042, ng_deepnegative_v1_75t: 54e7e4826d53, bad_prompt_version2: 6f35e7dd816a, By bad artist -neg: 2d356134903e, EasyNegative: c74b4e810b03, FastNegativeEmbedding: 687b669d8234, BadDream: 758aac443515, UnrealisticDream: a77451e7ea07, verybadimagenegative_v1.3: d70463f87042, ng_deepnegative_v1_75t: 54e7e4826d53, bad_prompt_version2: 6f35e7dd816a, By bad artist -neg: 2d356134903e, EasyNegative: c74b4e810b03, FastNegativeEmbedding: 687b669d8234, BadDream: 758aac443515, UnrealisticDream: a77451e7ea07", Lora hashes: "link: b5e39981325d", Version: v1.7.0-5-g750e9a6b'
];

const promptNoExtra = [
  'two person cheering for new year evening, with champagne',
  'Negative prompt: nsfw, childish, verybadimagenegative_v1.3, ng_deepnegative_v1_75t, bad_prompt_version2-neg, By bad artist -neg, easynegative, FastNegativeEmbedding, BadDream, UnrealisticDream'
];

describe('extract prompts', () => {
  it('should return a textbox prompt', () => {
    const basicPrompt = getPromptTextBox({
      basePrompt: 'a prompt',
      cfg: 1,
      negativePrompt: 'a negative prompt',
      sampler: 'a sampler',
      seed: 2,
      sizes: { height: '3', width: '4' },
      steps: 5
    });

    const basicPromptWithoutSize = getPromptTextBox({
      basePrompt: 'another prompt',
      cfg: 6,
      negativePrompt: 'another negative prompt',
      sampler: 'another sampler',
      seed: 7,
      sizes: null,
      steps: 8
    });

    const almostEmptyPrompt = getPromptTextBox({
      basePrompt: 'an empty prompt',
      cfg: NaN,
      negativePrompt: '',
      sampler: '',
      seed: -1,
      sizes: null,
      steps: NaN
    });

    expect(basicPrompt).toBe(
      '--prompt "a prompt" --negative_prompt "a negative prompt" --steps 5 --sampler_name "a sampler" --cfg_scale 1 --seed 2 --height 3 --width 4'
    );
    expect(basicPromptWithoutSize).toBe(
      '--prompt "another prompt" --negative_prompt "another negative prompt" --steps 8 --sampler_name "another sampler" --cfg_scale 6 --seed 7'
    );

    expect(almostEmptyPrompt).toBe('--prompt "an empty prompt"');
  });

  it('should return a json prompt', () => {
    const basicPrompt = getPromptJSON({
      adetailer: [{ model: 'a adetailer model', prompt: 'a adetailer prompt' }],
      basePrompt: 'a prompt',
      cfg: 1,
      clip: 6,
      denoise: 7,
      hiresUpscalerName: 'a hires upscaler',
      model: 'a model',
      negativePrompt: 'a negative prompt',
      sampler: 'a sampler',
      seed: 2,
      sizes: { height: '3', width: '4' },
      steps: 5,
      vae: 'a vae'
    });

    const almostEmptyPrompt = getPromptJSON({
      adetailer: [],
      basePrompt: 'an empty prompt',
      cfg: NaN,
      clip: NaN,
      denoise: NaN,
      hiresUpscalerName: '',
      model: '',
      negativePrompt: '',
      sampler: '',
      seed: -1,
      sizes: null,
      steps: NaN,
      vae: ''
    });

    expect(basicPrompt).toStrictEqual<IPromptSingle>({
      adetailer: [{ model: 'a adetailer model', prompt: 'a adetailer prompt' }],
      cfg: 1,
      checkpoints: 'a model',
      clipSkip: 6,
      denoising: 7,
      enableHighRes: true,
      height: 3,
      negativePrompt: 'a negative prompt',
      prompt: 'a prompt',
      sampler: 'a sampler',
      seed: 2,
      steps: 5,
      upscaler: 'a hires upscaler',
      vae: 'a vae',
      width: 4
    });

    expect(almostEmptyPrompt).toStrictEqual<IPromptSingle>({
      enableHighRes: false,
      prompt: 'an empty prompt'
    });
  });

  describe('extract adetailer params', () => {
    it('should return an empty adetailer array if nothing is found', () => {
      const resultNoAdetailer = getAdetailerParams('a prompt');

      expect(resultNoAdetailer).toStrictEqual([]);
    });

    it('should return an adetailer config if one parameter is found', () => {
      const resultAdetailer = getAdetailerParams(
        'Steps: 20, Sampler: DPM++ 2M SDE, Schedule type: Exponential, CFG scale: 7.0, Seed: 3427271302, Size: 1024x1536, Model hash: 7ca4bba71f, Model: revAnimated_v2RebirthVAE, Denoising strength: 0.3, Clip skip: 2, ADetailer model: mediapipe_face_full, ADetailer prompt: "perfect face", ADetailer confidence: 0.3, ADetailer dilate erode: 4, ADetailer mask blur: 4, ADetailer denoising strength: 0.4, ADetailer inpaint only masked: True, ADetailer inpaint padding: 32, ADetailer version: 24.5.1, ControlNet 0: "Module: none, Model: control_v11p_sd15_openpose [cab727d4], Weight: 1.0, Resize Mode: Crop and Resize, Processor Res: 512, Threshold A: 0.5, Threshold B: 0.5, Guidance Start: 0.0, Guidance End: 1.0, Pixel Perfect: True, Control Mode: Balanced", Hires upscale: 2.0, Hires upscaler: 4x-UltraSharp'
      );

      expect(resultAdetailer).toStrictEqual<IAdetailerPrompt[]>([
        {
          height: undefined,
          model: 'mediapipe_face_full',
          negative: undefined,
          prompt: 'perfect face',
          strength: 0.4,
          width: undefined
        }
      ]);
    });

    it('should return a list of adetailer configs if multiple parameters are found', () => {
      const resultList = getAdetailerParams(
        'ADetailer model: mediapipe_face_full, ADetailer prompt: "complexe prompt, multiple tokens", ADetailer confidence: 0.3, ADetailer dilate erode: 4, ADetailer mask blur: 4, ADetailer inpaint only masked: True, ADetailer inpaint padding: 32, ADetailer model 2nd: hand_yolov8n.pt, ADetailer negative prompt 2nd: bad hands, ADetailer confidence 2nd: 0.3, ADetailer dilate erode 2nd: 4, ADetailer mask blur 2nd: 4, ADetailer denoising strength 2nd: 0.4, ADetailer inpaint only masked 2nd: True, ADetailer inpaint padding 2nd: 32, ADetailer model 3rd: Eyes.pt, ADetailer confidence 3rd: 0.3, ADetailer dilate erode 3rd: 4, ADetailer mask blur 3rd: 4, ADetailer denoising strength 3rd: 0.4, ADetailer inpaint only masked 3rd: True, ADetailer inpaint padding 3rd: 32, ADetailer inpaint width 3rd: 256, ADetailer inpaint height 3rd: 128, ADetailer version: 24.5.1'
      );

      expect(resultList).toStrictEqual<IAdetailerPrompt[]>([
        {
          height: undefined,
          model: 'mediapipe_face_full',
          negative: undefined,
          prompt: 'complexe prompt, multiple tokens',
          strength: undefined,
          width: undefined
        },
        {
          height: undefined,
          model: 'hand_yolov8n.pt',
          negative: 'bad hands',
          prompt: undefined,
          strength: 0.4,
          width: undefined
        },
        {
          height: 128,
          model: 'Eyes.pt',
          negative: undefined,
          prompt: undefined,
          strength: 0.4,
          width: 256
        }
      ]);
    });
  });

  describe('extract base params', () => {
    it('should not fail is the prompt is empty', () => {
      const resultEmptyArray = getBaseParams([]);
      const resultOnlyString = getBaseParams(['test']);

      expect(resultEmptyArray).toStrictEqual<
        IBaseParams & {
          otherParams: string;
        }
      >({
        basePrompt: '',
        cfg: NaN,
        negativePrompt: '',
        otherParams: '',
        sampler: '',
        seed: -1,
        sizes: null,
        steps: NaN
      });

      expect(resultOnlyString).toStrictEqual<
        IBaseParams & {
          otherParams: string;
        }
      >({
        basePrompt: 'test',
        cfg: NaN,
        negativePrompt: '',
        otherParams: '',
        sampler: '',
        seed: -1,
        sizes: null,
        steps: NaN
      });
    });
    it('should return the prompt and base params', () => {
      const result = getBaseParams(promptNoNegative);

      expect(result).toStrictEqual<
        IBaseParams & {
          otherParams: string;
        }
      >({
        basePrompt: promptNoNegative[0],
        cfg: 7,
        negativePrompt: '',
        otherParams: promptNoNegative[1],
        sampler: 'DPM++ 2M Karras',
        seed: 726196108,
        sizes: { height: '912', width: '512' },
        steps: 20
      });
    });
    it('should return the prompt and base params with negative prompt', () => {
      const result = getBaseParams(promptFull);

      expect(result).toStrictEqual<
        IBaseParams & {
          otherParams: string;
        }
      >({
        basePrompt: promptFull[0],
        cfg: 7,
        negativePrompt: promptFull[1].replace('Negative prompt: ', ''),
        otherParams: promptFull[2],
        sampler: 'DPM++ 2M SDE Karras',
        seed: 743577308,
        sizes: { height: '512', width: '768' },
        steps: 20
      });
    });
    it('should return the prompt with negative prompt only', () => {
      const result = getBaseParams(promptNoExtra);

      expect(result).toStrictEqual<
        IBaseParams & {
          otherParams: string;
        }
      >({
        basePrompt: promptNoExtra[0],
        cfg: NaN,
        negativePrompt: promptNoExtra[1].replace('Negative prompt: ', ''),
        otherParams: '',
        sampler: '',
        seed: -1,
        sizes: null,
        steps: NaN
      });
    });
  });

  describe('extract full prompt', () => {
    it('should return a JSON prompt result', () => {
      const result = getPrompts(promptFull, 'json');

      expect(result).toStrictEqual<IPromptSingle>({
        cfg: 7,
        checkpoints: 'revAnimated_v122',
        clipSkip: 2,
        denoising: 0.4,
        enableHighRes: true,
        height: 512,
        negativePrompt: promptFull[1].replace('Negative prompt: ', ''),
        prompt: promptFull[0],
        sampler: 'DPM++ 2M SDE Karras',
        seed: 743577308,
        steps: 20,
        upscaler: '4x-UltraSharp',
        vae: 'Anything-V3.0.pt',
        width: 768
      });
    });

    it('should return a textbox prompt result', () => {
      const result = getPrompts(promptFull, 'textbox');

      expect(result).toBe(
        '--prompt "two person cheering for new year evening, with champagne" --negative_prompt "nsfw, childish, verybadimagenegative_v1.3, ng_deepnegative_v1_75t, bad_prompt_version2-neg, By bad artist -neg, easynegative, FastNegativeEmbedding, BadDream, UnrealisticDream" --steps 20 --sampler_name "DPM++ 2M SDE Karras" --cfg_scale 7 --seed 743577308 --height 512 --width 768'
      );
    });
  });
});
