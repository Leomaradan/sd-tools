import { Config } from './config';
import { BaseAdetailerModels } from './extensions/adetailer';
import { IStyle, ILora, IModel, ISampler, IUpscaler } from './types';

export const findUpscaler = (...upscaleName: string[]): IUpscaler | undefined => {
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

export const findCheckpoint = (...modelsName: string[]): IModel | undefined => {
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

export const findVAE = (...vaeName: string[]): string | undefined => {
  const AllModels = Config.get('vae');

  return AllModels.find((name) => {
    return vaeName.find((key) => {
      if (name.includes(key)) {
        return name;
      }
    });
  });
};

export const findSampler = (...sampleName: string[]): ISampler | undefined => {
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

export const findADetailersModel = (...adetaileName: string[]): string | undefined => {
  const AllModels = Array.from(new Set([...BaseAdetailerModels, ...Config.get('adetailersCustomModels')]));

  return AllModels.find((name) => {
    return adetaileName.find((key) => {
      if (key.includes(name)) {
        return key;
      }
    });
  });
};

export const findControlnetModel = (...modelsName: string[]): IModel | undefined => {
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

export const findLORA = (...loraName: string[]): ILora | undefined => {
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

export const findStyle = (...stylesName: string[]): IStyle | undefined => {
  const AllModels = Config.get('styles');

  return AllModels.find((style) => {
    return stylesName.find((name) => {
      if (style.name.includes(name)) {
        return style;
      }
    });
  });
};
