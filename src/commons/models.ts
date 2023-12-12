import { AdetailerModels } from './extensions/adetailer';
import { Checkpoints, Samplers, Upscaler, VAE } from './types';

export const getModelUpscaler = (upscalerName: string) => {
  return Object.entries(Upscaler).find(([key, value]) => {
    if (key.includes(upscalerName)) {
      return value;
    }

    if (value.includes(upscalerName)) {
      return value;
    }
  });
};

export const getModelCheckpoint = (checkpointsName: string) => {
  return Object.entries(Checkpoints).find(([key, value]) => {
    if (key.includes(checkpointsName)) {
      return value;
    }

    if (value.includes(checkpointsName)) {
      return value;
    }
  });
};

export const getModelVAE = (vaeName: string) => {
  return Object.entries(VAE).find(([key, value]) => {
    if (key.includes(vaeName)) {
      return value;
    }

    if (value.includes(vaeName)) {
      return value;
    }
  });
};

export const getModelSamplers = (samplersName: string) => {
  return Object.entries(Samplers).find(([key, value]) => {
    if (key.includes(samplersName)) {
      return value;
    }

    if (value.includes(samplersName)) {
      return value;
    }
  });
};

export const getModelAdetailers = (adetaileName: string) => {
  return Object.entries(AdetailerModels).find(([key, value]) => {
    if (key.includes(adetaileName)) {
      return value;
    }

    if (value.includes(adetaileName)) {
      return value;
    }
  });
};
