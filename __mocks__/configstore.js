class Configstore {
  store = {};
  constructor(_name) {
    this.store = {
      adetailersModels: ['adetailers1', 'adetailers2'],
      autoAdetailers: [],
      autoControlnetPose: [],
      autoTiledDiffusion: false,
      autoTiledVAE: false,
      cacheMetadata: {},
      commonNegative: '',
      commonNegativeXL: '',
      commonPositive: '',
      commonPositiveXL: '',
      configVersion: 3,
      controlnetModels: [
        { name: 'model1', version: 'unknown' },
        { name: 'model2', version: 'unknown' },
        { name: 'openpose', version: 'unknown' }
      ],
      controlnetModules: ['module1', 'module2'],
      cutoff: false,
      cutoffTokens: ['blue', 'red', 'green'],
      cutoffWeight: 1,
      embeddings: ['embeddings1', 'embeddings2'],
      endpoint: 'http://jest.local:8000',
      extensions: [],
      initialized: true,
      lcm: {
        auto: false
      },
      loras: [
        {
          keywords: ['trigger1'],
          name: 'loras1',
          version: 'sd15'
        },
        {
          alias: 'alias2',
          keywords: ['trigger2'],
          name: 'loras2',
          version: 'sdxl'
        }
      ],
      models: [
        {
          hash: '481d75ae9d',
          name: 'cyberrealistic_v40.safetensors',
          version: 'unknown'
        },
        {
          name: 'CounterfeitV30_v30.safetensors',
          version: 'unknown'
        },
        {
          hash: '4199bcdd14',
          name: 'revAnimated_v122.safetensors',
          version: 'unknown'
        },
        {
          name: 'sdxl.safetensors',
          version: 'sdxl'
        }
      ],
      redrawModels: {},
      samplers: [
        { aliases: [], name: 'DPM++ 2M' },
        { aliases: ['Euler a'], name: 'euler test' },
        { aliases: [], name: 'LCM' },
        { aliases: [], name: 'DPM++ SDE' }
      ],
      scheduler: false,
      styles: [
        { name: 'style1', negativePrompt: 'negativePrompt1', prompt: 'prompt1' },
        { name: 'style2', negativePrompt: '', prompt: 'prompt2' }
      ],
      upscalers: [
        {
          filename: '4x-UltraSharp.pth',
          index: 5,
          name: '4x-UltraSharp'
        },
        {
          filename: 'other.pth',
          name: '4x-Other'
        }
      ],
      vae: ['vae-ft-mse-840000-ema-pruned', 'orangemix.vae']
    };
  }

  get(key) {
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
  }
}

export default Configstore;
