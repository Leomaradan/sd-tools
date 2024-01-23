import { Config } from './config';
import { BaseAdetailerModels } from './extensions/adetailer';
import { ILora, IModel, ISampler, IStyle, IUpscaler } from './types';

export const findModel = <TType = object | string>(
  modelNames: string[],
  data: TType[],
  functions?: {
    findExact: (item: TType, modelName: string) => string | undefined;
    findPartial: (item: TType, modelName: string) => string | undefined;
  }
): TType | undefined => {
  for (const modelName of modelNames) {
    const exactMatch = data.find((item) => {
      /*if (properties) {
        const filterProperties = properties.filter((property) => item[property as keyof TType] !== undefined);

        return filterProperties.find((property) => {
          return item[property as keyof TType] === modelName;
        });
      }*/

      if (functions?.findExact) {
        return functions.findExact(item, modelName);
      }

      return item === modelName;
    });
    if (exactMatch !== undefined) {
      return exactMatch;
    }

    const partialMatch = data.find((item) => {
      /*if (properties) {
        const filterProperties = properties.filter((property) => item[property as keyof TType] !== undefined);
        return filterProperties.find((property) => {
          return (item[property as keyof TType] as string).includes(modelName);

          return false;
        });
      }*/

      if (functions?.findPartial) {
        return functions.findPartial(item, modelName);
      }

      return (item as string).includes(modelName);
    });
    if (partialMatch !== undefined) {
      return partialMatch;
    }
  }

  return undefined;
};

export const findExactStringProperties =
  (properties: string[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (item: any, modelName: string): string | undefined => {
    const filterProperties = properties.filter((property) => item[property] !== undefined);

    return filterProperties.find((property) => {
      return item[property] === modelName;
    });
  };

export const findPartialStringProperties =
  (properties: string[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (item: any, modelName: string): string | undefined => {
    const filterProperties = properties.filter((property) => item[property] !== undefined);
    return filterProperties.find((property) => {
      return (item[property] as string).includes(modelName);
    });
  };

export const findUpscaler = (...upscaleName: string[]): IUpscaler | undefined => {
  const AllModels = Config.get('upscalers');

  return findModel<IUpscaler>(upscaleName, AllModels, {
    findExact: findExactStringProperties(['name', 'filename']),
    findPartial: findPartialStringProperties(['name', 'filename'])
  });
};

export const findCheckpoint = (...modelsName: string[]): IModel | undefined => {
  const AllModels = Config.get('models');

  return findModel<IModel>(modelsName, AllModels, {
    findExact: findExactStringProperties(['name', 'hash']),
    findPartial: findPartialStringProperties(['name', 'hash'])
  });
};

export const findVAE = (...vaeName: string[]): string | undefined => {
  const AllModels = [...Config.get('vae'), 'None'];

  return findModel<string>(vaeName, AllModels);
};

export const findSampler = (...sampleName: string[]): ISampler | undefined => {
  const AllModels = Config.get('samplers');

  return findModel<ISampler>(sampleName, AllModels, {
    findExact: (item, modelName) => {
      if (item.name === modelName) {
        return item.name;
      }

      if (item.aliases.find((alias) => alias === modelName)) {
        return item.name;
      }
    },
    findPartial: (item, modelName) => {
      if (item.name.includes(modelName)) {
        return item.name;
      }

      if (item.aliases.find((alias) => alias.includes(modelName))) {
        return item.name;
      }
    }
  });
};

export const findADetailersModel = (...adetaileName: string[]): string | undefined => {
  const AllModels = Array.from(new Set([...BaseAdetailerModels, ...Config.get('adetailersCustomModels')]));

  return findModel<string>(adetaileName, AllModels);
};

export const findControlnetModel = (...modelsName: string[]): IModel | undefined => {
  const AllModels = Config.get('controlnetModels');

  return findModel<IModel>(modelsName, AllModels, {
    findExact: findExactStringProperties(['name']),
    findPartial: findPartialStringProperties(['name'])
  });
};

export const findControlnetModule = (...modelsName: string[]): string | undefined => {
  const AllModels = Config.get('controlnetModules');

  return findModel<string>(modelsName, AllModels);
};

export const findLORA = (...loraName: string[]): ILora | undefined => {
  const AllModels = Config.get('loras');

  return findModel<ILora>(loraName, AllModels, {
    findExact: findExactStringProperties(['name', 'alias']),
    findPartial: findPartialStringProperties(['name', 'alias'])
  });
};

export const findStyle = (...stylesName: string[]): IStyle | undefined => {
  const AllModels = Config.get('styles');

  return findModel<IStyle>(stylesName, AllModels, {
    findExact: findExactStringProperties(['name']),
    findPartial: findPartialStringProperties(['name'])
  });
};
