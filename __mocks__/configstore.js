class Configstore {
  store = {};
  constructor(_name) {
    this.store = {
      adetailersCustomModels: [],
      autoTiledDiffusion: false,
      autoTiledVAE: false,
      cacheMetadata: {},
      commonNegative: '',
      commonNegativeXL: '',
      commonPositive: '',
      commonPositiveXL: '',
      configVersion: '1',
      controlnetModels: [],
      controlnetModules: [],
      cutoff: false,
      cutoffTokens: [],
      cutoffWeight: 1,
      embeddings: [],
      endpoint: '',
      extensions: [],
      initialized: true,
      lcm: {
        auto: false
      },
      loras: [],
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
        }
      ],
      redrawModels: {},
      samplers: [{ name: 'DPM++ 2M Karras' }, { aliases: ['Euler a'], name: 'euler test' }],
      scheduler: false,
      styles: [],
      upscalers: [
        {
          filename: '4x-UltraSharp.pth',
          index: 5,
          name: '4x-UltraSharp'
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
