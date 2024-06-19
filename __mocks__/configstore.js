class Configstore {
  store = {};
  constructor(_name) {
    /** @type {import('../src/commons/types').IConfig} */
    const store = {
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
      configVersion: 4,
      controlnetModels: [
        { name: 'model1', version: 'unknown' },
        { name: 'model2', version: 'unknown' },
        { name: 'openpose', version: 'unknown' }
      ],
      controlnetModules: ['module1', 'module2'],
      cutoff: false,
      cutoffTokens: ['blue', 'red', 'green'],
      cutoffWeight: 1,
      defaultQueryConfigs: [
        {
          extends: 'SD 1.5',
          height: 768,
          modelName: 'test-sd15.safetensors',
          sampler: 'DPM++ SDE',
          steps: 30,
          templateName: 'CyberRealistic'
        }
      ],
      defaultQueryTemplates: [
        {
          accelerator: 'none',
          cfg: 7,
          height: 512,
          restoreFaces: false,
          sampler: 'DPM++ 2M',
          steps: 20,
          templateName: 'SD 1.5',
          versions: ['sd15'],
          width: 512
        },
        {
          accelerator: 'lcm',
          cfg: 2,
          height: 512,
          restoreFaces: false,
          sampler: 'LCM',
          steps: 5,
          templateName: 'SD 1.5 LCM',
          versions: ['sd15'],
          width: 512
        },
        {
          accelerator: 'none',
          cfg: 7,
          height: 512,
          restoreFaces: false,
          sampler: 'DPM++ 2M',
          steps: 20,
          templateName: 'SD 2.x',
          versions: ['sd20', 'sd21'],
          width: 512
        },
        {
          accelerator: 'none',
          cfg: 7,
          height: 768,
          restoreFaces: false,
          sampler: 'DPM++ 2M',
          steps: 20,
          templateName: 'SD 2.x Full',
          versions: ['sd20-768', 'sd21-768'],
          width: 768
        },
        {
          accelerator: 'none',
          cfg: 7,
          height: 1024,
          restoreFaces: false,
          sampler: 'DPM++ 2M',
          steps: 20,
          templateName: 'SDXL',
          versions: ['sdxl'],
          width: 1024
        },
        {
          accelerator: 'lcm',
          cfg: 1.5,
          height: 1024,
          restoreFaces: false,
          sampler: 'LCM',
          steps: 4,
          templateName: 'SDXL LCM',
          versions: ['sdxl'],
          width: 1024
        },
        {
          accelerator: 'lightning',
          cfg: 2,
          height: 1024,
          restoreFaces: false,
          sampler: 'DPM++ SDE',
          steps: 6,
          templateName: 'SDXL Lightning',
          versions: ['sdxl'],
          width: 1024
        },
        {
          accelerator: 'turbo',
          cfg: 2,
          height: 1024,
          restoreFaces: false,
          sampler: 'DPM++ SDE',
          steps: 8,
          templateName: 'SDXL Turbo',
          versions: ['sdxl'],
          width: 1024
        }
      ],
      embeddings: ['embeddings1', 'embeddings2'],
      endpoint: 'http://jest.local:8000',
      extensions: [],
      forcedQueryConfigs: [
        {
          cfg: 3,
          modelName: 'sdxl-turbo.safetensors',
          steps: 4,
          templateName: 'SDXL Turbo'
        }
      ],
      initialized: true,
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
          name: 'test-sd15.safetensors',
          version: 'sd15'
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
        },
        {
          accelerator: 'turbo',
          name: 'sdxl-turbo.safetensors',
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

    this.store = store;
  }

  get(key) {
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
  }
}

export default Configstore;
