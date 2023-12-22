import { Config } from './config';
import { BaseAdetailerModels } from './extensions/adetailer';
import { ILora, IModel, ISampler, IStyle, IUpscaler } from './types';

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
    return sampleName.find((requestName) => {
      if (sampler.name.includes(requestName)) {
        return sampler.name;
      }

      if (sampler.aliases.find((alias) => alias.includes(requestName))) {
        return sampler.name;
      }
    });
  });
};

export const findADetailersModel = (...adetaileName: string[]): string | undefined => {
  const AllModels = Array.from(new Set([...BaseAdetailerModels, ...Config.get('adetailersCustomModels')]));

  return AllModels.find((name) => {
    return adetaileName.find((requestName) => {
      if (name.includes(requestName)) {
        return requestName;
      }
    });
  });
};

export const findControlnetModel = (...modelsName: string[]): IModel | undefined => {
  const AllModels = Config.get('controlnetModels');

  console.log({ modelsName });

  const foundExact = AllModels.find((model) => {
    return modelsName.find((requestName) => {
      console.log({ model: model.name, requestName });
      if (model.name === requestName) {
        console.log('FOUND 1');
        return model.name;
      }

      if (model.hash === requestName) {
        console.log('FOUND 2');
        return model.name;
      }
    });
  });

  if (foundExact) {
    console.log('foundExact', foundExact, modelsName);
    return foundExact;
  }

  return AllModels.find((model) => {
    return modelsName.find((requestName) => {
      if (model.name.includes(requestName)) {
        return model.name;
      }

      if (model.hash?.includes(requestName)) {
        return model.name;
      }
    });
  });
};

export const findControlnetModule = (...modelsName: string[]): string | undefined => {
  const AllModels = Config.get('controlnetModules');

  const foundExact = AllModels.find((model) => {
    return modelsName.find((requestName) => {
      if (model === requestName) {
        return model;
      }
    });
  });

  if (foundExact) {
    return foundExact;
  }

  return AllModels.find((model) => {
    return modelsName.find((requestName) => {
      if (model.includes(requestName)) {
        return model;
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
