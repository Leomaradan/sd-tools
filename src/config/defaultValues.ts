import { Separator, checkbox, confirm, input, select } from '@inquirer/prompts';

import type {
  IDefaultQueryConfig,
  IDefaultQueryTemplate,
  IDefaultValuesConfigPrompt,
  IForcedQueryConfig,
  IModelWithHash,
  MetadataAccelerator,
  MetadataVersionKey
} from '../commons/types';

import { Config } from '../commons/config';
import { mergeConfigs } from '../commons/defaultQuery';
import { loggerInfo } from '../commons/logger';
import { SELECT_ACTION_TYPE, displayList } from './functions';

const getDefaultMessage = (baseMessage: string, defaultValue?: boolean | number | string, add?: boolean) => {
  if (defaultValue === undefined) {
    return `${baseMessage}. Leave empty to ignore property`;
  }

  if (add) {
    return baseMessage;
  }

  return `${baseMessage}. Leave empty to keep current value (${defaultValue})`;
};

const validateFloat =
  (allowEmpty: boolean) =>
  (value: string): boolean | string => {
    if (!value) {
      if (allowEmpty) {
        return true;
      }
      return 'The value cannot be empty';
    }
    const num = Number.parseFloat(value);

    if (Number.isNaN(num)) {
      return 'The value is not a valid number';
    }

    if (num <= 0) {
      return 'The value must be greater than 0';
    }

    return true;
  };

const validateInteger =
  (allowEmpty: boolean) =>
  (value: string): boolean | string => {
    if (!value) {
      if (allowEmpty) {
        return true;
      }
      return 'The value cannot be empty';
    }
    const num = Number.parseInt(value);

    if (Number.isNaN(num)) {
      return 'The value is not a valid number';
    }

    if (num <= 0) {
      return 'The value must be greater than 0';
    }

    return true;
  };

const convertFloat = (value: string): number | undefined => {
  if (!value) {
    return;
  }
  return Number.parseFloat(value);
};

const convertInteger = (value: string): number | undefined => {
  if (!value) {
    return;
  }
  return Number.parseInt(value);
};

const promptSelectBoolean = async (defaultMessage: string, defaultValue: boolean | undefined, add?: boolean) => {
  const message = getDefaultMessage(defaultMessage, defaultValue);
  let defaultValueString = '-';

  if (!add && defaultValue !== undefined) {
    defaultValueString = defaultValue ? '1' : '0';
  }

  const result = await select({
    choices: [
      { name: 'Yes', value: '1' },
      { name: 'No', value: '0' },
      { name: defaultValue !== undefined ? `(${defaultValue})` : 'N/A', value: '-' }
    ],
    default: defaultValueString,
    message
  });

  if (result === '-') {
    return;
  }

  return result === '1';
};

const promptSelectString = async (
  options: { name?: string; value: string }[],
  defaultMessage: string,
  defaultValue: string | undefined,
  add?: boolean
) => {
  const value = await select({
    choices: [{ name: defaultValue ? `(${defaultValue})` : 'N/A', value: '-' }, ...options],
    default: add ? '-' : defaultValue,
    message: getDefaultMessage(defaultMessage, defaultValue, add)
  });

  if (!value || (value && '-')) {
    return;
  }

  return value;
};

const promptText = async (
  validate: (value: string) => boolean | string,
  defaultMessage: string,
  defaultValue: string | undefined,
  add?: boolean
) => {
  return input({
    default: add ? '' : defaultValue,
    message: getDefaultMessage(defaultMessage, defaultValue, add),
    validate
  });
};

const promptNumeric = async (type: 'float' | 'integer', defaultMessage: string, defaultValue: number | undefined, add?: boolean) => {
  const validate = type === 'float' ? validateFloat(true) : validateInteger(true);
  const converter = type === 'float' ? convertFloat : convertInteger;
  const stringify = (value: number | undefined) => {
    if (value === undefined) {
      return '';
    }
    if (type === 'float') {
      return value.toFixed(2);
    }

    return value.toString();
  };
  const value = await input({
    default: add ? '' : stringify(defaultValue),
    message: getDefaultMessage(defaultMessage, defaultValue, add),
    validate
  });

  return converter(value);
};

const validatePromptText = (value: string) => {
  if (!value) {
    return true;
  }

  if (!value.includes('{prompt}')) {
    return 'The prompt must include {prompt}';
  }

  return true;
};

const getQueryOptions = async (defaultValues?: IDefaultValuesConfigPrompt, add?: boolean): Promise<IDefaultValuesConfigPrompt> => {
  const listSamplers = Config.get('samplers');
  const listUpscaler = Config.get('upscalers');
  const listVAE = Config.get('vae');

  const basePrompt = await promptText(
    validatePromptText,
    'Base prompt. Use {prompt} to set the prompt position',
    defaultValues?.basePrompt,
    add
  );
  const baseNegativePrompt = await promptText(
    validatePromptText,
    'Base negative prompt. Use {prompt} to set the prompt position',
    defaultValues?.baseNegativePrompt,
    add
  );

  const cfg = await promptNumeric('float', 'Enter CFG', defaultValues?.cfg, add);

  const clipSkip = await promptNumeric('integer', 'Enter Clip Skip', defaultValues?.clipSkip, add);

  const denoising = await promptNumeric('float', 'Enter Denoising strength (for upscaling)', defaultValues?.denoising, add);

  const enableHighRes = await promptSelectBoolean('Enable High-Res', defaultValues?.enableHighRes, add);

  const height = await promptNumeric('integer', 'Enter Height', defaultValues?.height, add);

  const restoreFaces = await promptSelectBoolean('Enable Face Restoration', defaultValues?.restoreFaces, add);

  const sampler = await promptSelectString(
    listSamplers.map((sampler) => ({ value: sampler.name })),
    'Select the Sampler',
    defaultValues?.sampler,
    add
  );

  const scaleFactor = await promptNumeric('float', 'Enter Scale Factor (for upscaling)', defaultValues?.scaleFactor, add);

  const steps = await promptNumeric('integer', 'Enter Steps', defaultValues?.steps, add);

  const tiling = await promptSelectBoolean('Enable Tiling', defaultValues?.tiling, add);

  const upscaler = await promptSelectString(
    listUpscaler.map((upscaler) => ({ value: upscaler.name })),
    'Select the Upscaler',
    defaultValues?.upscaler,
    add
  );

  const vae = await promptSelectString(
    listVAE.map((upscaler) => ({ value: upscaler })),
    'Select the VAE',
    defaultValues?.vae,
    add
  );

  const width = await promptNumeric('integer', 'Enter Width', defaultValues?.width, add);

  return {
    baseNegativePrompt,
    basePrompt,
    cfg,
    clipSkip,
    denoising,
    enableHighRes,
    height,
    restoreFaces,
    sampler,
    scaleFactor,
    steps,
    tiling,
    upscaler,
    vae,
    width
  };
};

export const setDefaultQueryTemplates = async () => {
  const actionType = await select({
    choices: [
      { name: 'Add a template', value: 'add' },
      { name: 'Edit a template', value: 'edit' },
      { name: 'Remove a template', value: 'remove' }
    ],
    message: SELECT_ACTION_TYPE
  });

  switch (actionType) {
    case 'add':
      await setInquirerDefaultQueryTemplatesAdd();
      break;
    case 'edit':
      await setInquirerDefaultQueryTemplatesEdit();
      break;
    case 'remove':
    default:
      await setInquirerDefaultQueryTemplatesRemove();
      break;
  }
};

const TEMPLATE_NAME = 'Template name';

const setInquirerDefaultQueryTemplatesAdd = async () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');

  const templateName = await input({
    message: TEMPLATE_NAME,
    validate: (value) => {
      if (!value) {
        return `${TEMPLATE_NAME} must not be empty`;
      }

      const found = defaultQueryTemplates.find((model) => model.templateName === value);

      if (found) {
        return `${TEMPLATE_NAME} already exists`;
      }

      return true;
    }
  });

  if (!templateName) {
    return;
  }

  const autoLoad = await confirm({
    default: false,
    message: 'Auto load? Auto-load models will be used even without configs. It usefull to set the default options'
  });

  const accelerator = await select<MetadataAccelerator>({
    choices: [
      { name: 'None', value: 'none' },
      { name: 'LCM', value: 'lcm' },
      { name: 'Turbo', value: 'turbo' },
      { name: 'Lightning', value: 'lightning' },
      { name: 'Distilled', value: 'distilled' }
    ],
    default: 'none',
    message: 'Select the accelerator'
  });

  const version = await checkbox<MetadataVersionKey>({
    choices: [
      { name: 'SD 1.4', value: 'sd14' },
      { name: 'SD 1.5', value: 'sd15' },
      { name: 'SD 2.0', value: 'sd20' },
      { name: 'SD 2.0 768', value: 'sd20-768' },
      { name: 'SD 2.1', value: 'sd21' },
      { name: 'SD 2.1 768', value: 'sd21-768' },
      { name: 'SD XL', value: 'sdxl' }
    ],
    message: 'Select the versions',
    required: true
  });

  const options = await getQueryOptions(undefined, true);

  const newTemplate: IDefaultQueryTemplate = {
    ...options,
    accelerator,
    autoLoad,
    templateName,
    versions: version
  };

  Config.set('defaultQueryTemplates', Array.from(new Set([...defaultQueryTemplates, newTemplate])));
};

const setInquirerDefaultQueryTemplatesEdit = async () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');

  const templateName = await select({
    choices: defaultQueryTemplates.map((config) => ({ value: config.templateName })).sort((a, b) => a.value.localeCompare(b.value)),
    message: TEMPLATE_NAME
  });

  const selectedConfig = defaultQueryTemplates.find((model) => model.templateName === templateName) as IDefaultQueryTemplate;

  const autoLoad = await confirm({
    default: selectedConfig.autoLoad,
    message: 'Auto load? Auto-load models will be used even without configs. It usefull to set the default options'
  });

  const accelerator = await select<MetadataAccelerator>({
    choices: [
      { name: 'None', value: 'none' },
      { name: 'LCM', value: 'lcm' },
      { name: 'Turbo', value: 'turbo' },
      { name: 'Lightning', value: 'lightning' },
      { name: 'Distilled', value: 'distilled' }
    ],
    default: selectedConfig.accelerator,
    message: 'Select the accelerator'
  });

  const versionChoices = [
    { name: 'SD 1.4', value: 'sd14' },
    { name: 'SD 1.5', value: 'sd15' },
    { name: 'SD 2.0', value: 'sd20' },
    { name: 'SD 2.0 768', value: 'sd20-768' },
    { name: 'SD 2.1', value: 'sd21' },
    { name: 'SD 2.1 768', value: 'sd21-768' },
    { name: 'SD XL', value: 'sdxl' }
  ].map((option) => ({ ...option, checked: selectedConfig.versions.includes(option.value as MetadataVersionKey) }));

  const version = await checkbox({
    choices: versionChoices,
    message: 'Select the versions',
    required: true
  });

  const options = await getQueryOptions(undefined);

  const editTemplate: IDefaultQueryTemplate = {
    ...options,
    accelerator,
    autoLoad,
    templateName,
    versions: version as MetadataVersionKey[]
  };

  Config.set(
    'defaultQueryTemplates',
    Array.from(new Set([...defaultQueryTemplates.filter((template) => template.templateName !== templateName), editTemplate]))
  );
};

const setInquirerDefaultQueryTemplatesRemove = async () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');

  const template = await select({
    choices: [
      { name: '(Cancel)', value: '-' },
      new Separator(),
      ...defaultQueryTemplates.map((template) => {
        const disabled = defaultQueryConfigs.filter((config) => config.extends === template.templateName);

        return {
          description: `Version(s): "${template.versions.join(', ')}", Accelerator: ${template.accelerator ?? 'none'}`,
          disabled: disabled.length > 0,
          name: `${template.templateName} (Used in ${disabled.length} model(s))`,
          value: template.templateName
        };
      }),
      new Separator()
    ],
    message: 'Select template to remove'
  });
  if (template === '-') {
    return;
  }

  const index = defaultQueryTemplates.findIndex((model) => model.templateName === template);
  defaultQueryTemplates.splice(index, 1);
  Config.set('defaultQueryTemplates', defaultQueryTemplates);
};

export const getDefaultTemplates = () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');

  const list = defaultQueryTemplates.map((item) => {
    const { accelerator, templateName, versions: version, ...other } = item;

    let text = `${templateName} (For version "${version.join(', ')}", Accelerator: ${accelerator})`;

    Object.keys(other).forEach((key) => {
      const value = other[key as keyof typeof other];

      text += ` | ${key}: "${value}"`;
    });

    return text;
  });

  loggerInfo(`Default Templates: ${displayList(list)}`);
};

export const setDefaultQueryConfigs = async () => {
  const actionType = await select({
    choices: [
      { name: 'Add a config', value: 'add' },
      { name: 'Edit a config', value: 'edit' },
      { name: 'Remove a config', value: 'remove' }
    ],
    message: SELECT_ACTION_TYPE
  });

  switch (actionType) {
    case 'add':
      await setDefaultQueryConfigsAdd();
      break;
    case 'edit':
      await setDefaultQueryConfigsEdit();
      break;
    case 'remove':
    default:
      await setDefaultQueryConfigsRemove();
      break;
  }
};

const setDefaultQueryConfigsAdd = async () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');
  const models = Config.get('models');
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');

  const templateName = await input({
    message: TEMPLATE_NAME,
    validate: (value) => {
      if (!value) {
        return `${TEMPLATE_NAME} must not be empty`;
      }

      const found = defaultQueryConfigs.find((model) => model.templateName === value);

      if (found) {
        return `${TEMPLATE_NAME} already exists`;
      }

      return true;
    }
  });

  if (!templateName) {
    return;
  }

  const modelName = await checkbox({
    choices: models.map((model) => ({ description: `Version: ${model.version}`, value: model.name })),
    message: 'Select the model'
  });

  const selectedModel = models.find((model) => modelName.includes(model.name)) as IModelWithHash;

  const availableTemplates = defaultQueryTemplates.filter((template) =>
    template.versions.some((version) => selectedModel.version === version)
  );

  const extendsName = await select({
    choices: availableTemplates.map((template) => ({ description: `Accelerator: ${template.accelerator}`, value: template.templateName })),
    message: 'Select the template'
  });

  const selectedTemplate = availableTemplates.find((template) => template.templateName === extendsName) as IDefaultQueryTemplate;

  const options = await getQueryOptions(selectedTemplate, true);

  const newConfig: IDefaultQueryConfig = {
    ...options,
    extends: extendsName,
    modelName,
    templateName
  };

  Config.set('defaultQueryConfigs', Array.from(new Set([...defaultQueryConfigs, newConfig])));
};

const setDefaultQueryConfigsEdit = async () => {
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');
  const models = Config.get('models');
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');

  const templateName = await select({
    choices: defaultQueryConfigs.map((config) => ({ value: config.templateName })).sort((a, b) => a.value.localeCompare(b.value)),
    message: TEMPLATE_NAME
  });

  const selectedConfig = defaultQueryConfigs.find((model) => model.templateName === templateName) as IDefaultQueryConfig;

  const modelName = await checkbox({
    choices: models.map((model) => ({
      checked: selectedConfig.modelName.includes(model.name),
      description: `Version: ${model.version}`,
      value: model.name
    })),
    message: 'Select the model',
    required: true
  });

  const selectedModel = models.find((model) => modelName.includes(model.name)) as IModelWithHash;

  const availableTemplates = defaultQueryTemplates.filter((template) =>
    template.versions.some((version) => selectedModel.version === version)
  );

  const extendsName = await select({
    choices: availableTemplates.map((template) => ({ description: `Accelerator: ${template.accelerator}`, value: template.templateName })),
    default: selectedConfig.extends,
    message: 'Select the template'
  });

  const selectedTemplate = availableTemplates.find((template) => template.templateName === extendsName) as IDefaultQueryTemplate;

  const options = await getQueryOptions(selectedTemplate);

  const editConfig: IDefaultQueryConfig = {
    ...options,
    extends: extendsName,
    modelName,
    templateName
  };

  Config.set(
    'defaultQueryConfigs',
    Array.from(new Set([...defaultQueryConfigs.filter((config) => config.templateName !== templateName), editConfig]))
  );
};

const setDefaultQueryConfigsRemove = async () => {
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');

  const template = await select({
    choices: [
      { name: '(Cancel)', value: '-' },
      new Separator(),
      ...defaultQueryConfigs.map((config) => {
        return {
          description: `Template(s): "${config.extends}", Model: ${config.modelName}`,
          name: config.templateName,
          value: config.templateName
        };
      }),
      new Separator()
    ],
    message: 'Select config to remove'
  });
  if (template === '-') {
    return;
  }

  const index = defaultQueryConfigs.findIndex((model) => model.templateName === template);
  defaultQueryConfigs.splice(index, 1);
  Config.set('defaultQueryConfigs', defaultQueryConfigs);
};

export const getDefaultConfigs = () => {
  const defaultQueryConfigs = Config.get('defaultQueryConfigs');
  const defaultQueryTemplates = Config.get('defaultQueryTemplates');

  const list = defaultQueryConfigs.map((item) => {
    const { extends: extendsName, modelName, templateName, ...other } = item;

    const realConfig = mergeConfigs(item, defaultQueryTemplates);

    let text = `${templateName} (${modelName.join(', ')}, extending ${extendsName})`;

    Object.keys(realConfig).forEach((key) => {
      const value = other[key as keyof typeof realConfig];
      const fromTemplateText = other[key as keyof typeof other] === undefined ? ' (from template)' : '';

      text += ` | ${key}: "${value}"${fromTemplateText}`;
    });

    return text;
  });

  loggerInfo(`Default Configs: ${displayList(list)}`);
};

export const setForcedQueryConfigs = async () => {
  const actionType = await select({
    choices: [
      { name: 'Add a config', value: 'add' },
      { name: 'Edit a config', value: 'edit' },
      { name: 'Remove a config', value: 'remove' }
    ],
    message: SELECT_ACTION_TYPE
  });

  switch (actionType) {
    case 'add':
      await setForcedQueryConfigsAdd();
      break;
    case 'edit':
      await setForcedQueryConfigsEdit();
      break;
    case 'remove':
    default:
      await setForcedQueryConfigsRemove();
      break;
  }
};

const setForcedQueryConfigsAdd = async () => {
  const models = Config.get('models');
  const forcedQueryConfigs = Config.get('forcedQueryConfigs');

  const templateName = await input({
    message: TEMPLATE_NAME,
    validate: (value) => {
      if (!value) {
        return 'Template name must not be empty';
      }

      const found = forcedQueryConfigs.find((model) => model.templateName === value);

      if (found) {
        return 'Template name already exists';
      }

      return true;
    }
  });

  if (!templateName) {
    return;
  }

  const modelName = await checkbox({
    choices: models
      .map((model) => ({ description: `Version: ${model.version}`, value: model.name }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    message: 'Select the model',
    required: true
  });

  const options = await getQueryOptions();

  const newConfig: IForcedQueryConfig = {
    ...options,
    modelName,
    templateName
  };

  Config.set('forcedQueryConfigs', Array.from(new Set([...forcedQueryConfigs, newConfig])));
};

const setForcedQueryConfigsEdit = async () => {
  const models = Config.get('models');
  const forcedQueryConfigs = Config.get('forcedQueryConfigs');

  const templateName = await select({
    choices: forcedQueryConfigs.map((config) => ({ value: config.templateName })).sort((a, b) => a.value.localeCompare(b.value)),
    message: TEMPLATE_NAME
  });

  const selectedConfig = forcedQueryConfigs.find((model) => model.templateName === templateName) as IForcedQueryConfig;

  const modelName = await checkbox({
    choices: models
      .map((model) => ({
        checked: selectedConfig.modelName.includes(model.name),
        description: `Version: ${model.version}`,
        value: model.name
      }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    message: 'Select the model'
  });

  const options = await getQueryOptions(selectedConfig);

  const newConfig: IForcedQueryConfig = {
    ...options,
    modelName,
    templateName
  };

  Config.set(
    'forcedQueryConfigs',
    Array.from(new Set([...forcedQueryConfigs.filter((config) => config.templateName === templateName), newConfig]))
  );
};

const setForcedQueryConfigsRemove = async () => {
  const forcedQueryConfigs = Config.get('forcedQueryConfigs');

  const template = await select({
    choices: [
      { name: '(Cancel)', value: '-' },
      new Separator(),
      ...forcedQueryConfigs
        .map((config) => {
          return {
            description: `Model: ${config.modelName}`,
            name: config.templateName,
            value: config.templateName
          };
        })
        .sort((a, b) => a.value.localeCompare(b.value)),
      new Separator()
    ],
    message: 'Select config to remove'
  });
  if (template === '-') {
    return;
  }

  const index = forcedQueryConfigs.findIndex((model) => model.templateName === template);
  forcedQueryConfigs.splice(index, 1);
  Config.set('forcedQueryConfigs', forcedQueryConfigs);
};

export const getForcedConfigs = () => {
  const forcedQueryConfigs = Config.get('forcedQueryConfigs');

  const list = forcedQueryConfigs.map((item) => {
    const { modelName, templateName, ...other } = item;
    let text = `${templateName} (${modelName.join(', ')})`;

    Object.keys(other).forEach((key) => {
      const value = other[key as keyof typeof other];
      text += ` | ${key}: "${value}"`;
    });

    return text;
  });

  loggerInfo(`Forced Configs: ${displayList(list)}`);
};
