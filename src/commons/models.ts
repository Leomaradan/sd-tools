import { Config } from './config';
import { BaseAdetailerModels } from './extensions/adetailer';

export const getModelUpscaler = (...upscaleName: string[]): string | undefined => {
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
  })?.name;
};

export const getIndexUpscaler = (...upscaleName: string[]): number | undefined => {
  const AllModels = Config.get('upscalers');

  return AllModels.find((model) => {
    return upscaleName.find((name) => {
      if (model.name.includes(name)) {
        return model.index;
      }

      if (model.filename?.includes(name)) {
        return model.index;
      }
    });
  })?.index;
};

export const getModelCheckpoint = (...modelsName: string[]): string | undefined => {
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
  })?.name;
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

export const getModelSamplers = (...sampleName: string[]): string | undefined => {
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
  })?.name;
};

export const getModelAdetailers = (...adetaileName: string[]): string | undefined => {
  const AllModels = [...BaseAdetailerModels, ...Config.get('adetailersCustomModels')];

  return AllModels.find((name) => {
    return adetaileName.find((key) => {
      if (key.includes(name)) {
        return key;
      }
    });
  });
};

export const getModelControlnet = (...modelsName: string[]): string | undefined => {
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
  })?.name;
};
