import { Config } from './config';
import { BaseAdetailerModels } from './extensions/adetailer';
import { Lora, Model, Sampler, Upscaler } from './types';

export const getModelUpscaler = (...upscaleName: string[]): Upscaler | undefined => {
  const AllModels = Config.get('upscalers');

  return AllModels.find((model) => {
    return upscaleName.find((name) => {
      if (model.name.includes(name)) {
        return model.name;
      }

      if (model.filename?.includes(name)) {
        return model.name;
      }
    });
  });
};

export const getModelCheckpoint = (...modelsName: string[]): Model | undefined => {
  const AllModels = Config.get('models');

  return AllModels.find((model) => {
    return modelsName.find((name) => {
      if (model.name.includes(name)) {
        return model.name;
      }

      if (model.hash?.includes(name)) {
        return model.name;
      }
    });
  });
};

export const getModelVAE = (...vaeName: string[]): string | undefined => {
  const AllModels = Config.get('vae');

  return AllModels.find((name) => {
    return vaeName.find((key) => {
      if (key.includes(name)) {
        return key;
      }
    });
  });
};

export const getModelSamplers = (...sampleName: string[]): Sampler | undefined => {
  const AllModels = Config.get('samplers');

  return AllModels.find((sampler) => {
    return sampleName.find((name) => {
      if (sampler.name.includes(name)) {
        return sampler.name;
      }

      if (sampler.aliases.find((alias) => alias.includes(name))) {
        return sampler.name;
      }
    });
  });
};

export const getModelAdetailers = (...adetaileName: string[]): string | undefined => {
  const AllModels = Array.from(new Set([...BaseAdetailerModels, ...Config.get('adetailersCustomModels')]));

  return AllModels.find((name) => {
    return adetaileName.find((key) => {
      if (key.includes(name)) {
        return key;
      }
    });
  });
};

export const getModelControlnet = (...modelsName: string[]): Model | undefined => {
  const AllModels = Config.get('controlnetModels');

  return AllModels.find((model) => {
    return modelsName.find((name) => {
      if (model.name.includes(name)) {
        return model.name;
      }

      if (model.hash?.includes(name)) {
        return model.name;
      }
    });
  });
};

export const getModelLoras = (...loraName: string[]): Lora | undefined => {
  const AllModels = Config.get('loras');

  return AllModels.find((model) => {
    return loraName.find((name) => {
      if (model.name.includes(name)) {
        return model;
      }

      if (model.alias.includes(name)) {
        return model;
      }
    });
  });
};
