export enum ControlNetResizesLegacy {
  Envelope = 2,
  Resize = 0,
  ScaleToFit = 1
}

export enum ControlNetResizes {
  Envelope = 'Resize and Fill',
  Resize = 'Just Resize',
  ScaleToFit = 'Crop and Resize'
}

export const normalizeControlNetResizes = (input: ControlNetResizes | ControlNetResizesLegacy): ControlNetResizes => {
  switch (input) {
    case ControlNetResizes.Envelope:
    case ControlNetResizesLegacy.Envelope:
      return ControlNetResizes.Envelope;
    case ControlNetResizes.ScaleToFit:
    case ControlNetResizesLegacy.ScaleToFit:
      return ControlNetResizes.ScaleToFit;
    case ControlNetResizes.Resize:
    case ControlNetResizesLegacy.Resize:
    default:
      return ControlNetResizes.Resize;
  }
};

export enum ControlNetModeLegacy {
  Balanced = 0,
  ControleNetImportant = 2,
  PromptImportant = 1
}

export enum ControlNetMode {
  Balanced = 'Balanced',
  ControleNetImportant = 'ControlNet is more important',
  PromptImportant = 'My prompt is more important'
}

export const normalizeControlNetMode = (input: ControlNetMode | ControlNetModeLegacy): ControlNetMode => {
  switch (input) {
    case ControlNetMode.ControleNetImportant:
    case ControlNetModeLegacy.ControleNetImportant:
      return ControlNetMode.ControleNetImportant;
    case ControlNetMode.PromptImportant:
    case ControlNetModeLegacy.PromptImportant:
      return ControlNetMode.PromptImportant;
    case ControlNetMode.Balanced:
    case ControlNetModeLegacy.Balanced:
    default:
      return ControlNetMode.Balanced;
  }
};

export interface IControlNet {
  control_mode: ControlNetMode | ControlNetModeLegacy;
  image_name?: string;
  input_image?: string;
  lowvram?: boolean;
  model: string;
  module: string;
  pixel_perfect?: boolean;
  prompt?: string;
  regex?: string;
  resize_mode: ControlNetResizes | ControlNetResizesLegacy;
}

/**
 * ControlNet is changing the query format
 */
export interface IControlNetQuery {
  control_mode: ControlNetMode;
  enabled: true;
  input_image?: string;
  lowvram?: boolean;
  model: string;
  module: string;
  pixel_perfect?: boolean;
  resize_mode: ControlNetResizes;
}

export const CONTROLNET_URL = 'https://github.com/Mikubill/sd-webui-controlnet.git';
