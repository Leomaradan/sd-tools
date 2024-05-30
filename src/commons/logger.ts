import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { xdgState } from 'xdg-basedir';

export const mode = { info: true, log: true, simulate: false, verbose: false };

let session: string | undefined = undefined;

const isProd = process.env.NODE_ENV === 'production';

const devLogPath = resolve(__dirname, '..', 'logs');

const oldLogs = isProd ? new Date().getTime() - 7 * 24 * 60 * 60 * 1000 : new Date().getTime() - 30 * 24 * 60 * 60 * 1000;

export const loggerInfo = (message: string) => {
  if (mode.info) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
};

export const loggerVerbose = (message: string) => {
  if (mode.verbose) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
};

const purgePathInLog = (key: string, value: unknown) => {
  if (['init_images', 'input_image'].includes(key)) {
    if (!value) {
      return value;
    }

    if (Array.isArray(value)) {
      return (value as string[]).map((item) => item.substring(0, 100));
    }

    if (typeof value === 'string') {
      return value?.substring(0, 100) ?? value;
    }
  }

  return value;
};

const clearOldLogs = (source: string) => {
  const files = readdirSync(source);

  files.forEach((file) => {
    const date = new Date(file.replace('log-', '').replace('.json', ''));
    if (date.getTime() < oldLogs) {
      rmSync(resolve(source, file));
    }
  });
};

export const writeLog = (data: object, force = false) => {
  if (mode.log || force) {
    if (session === undefined) {
      session = new Date().toISOString();
    }

    let logPath = resolve(__dirname, '..', 'logs');

    if (isProd) {
      if (existsSync(devLogPath)) {
        clearOldLogs(devLogPath);
      }

      const rootDir = xdgState || join(tmpdir());
      logPath = resolve(rootDir, 'sd-tools');
    }

    const logFile = resolve(logPath, `log-${session}.json`);
    if (!existsSync(logPath)) {
      mkdirSync(logPath, { mode: 0o0700, recursive: true });
    }

    if (!existsSync(logFile)) {
      writeFileSync(logFile, '[]');
    }

    const dataWithDate = { timestamp: Date.now(), ...data };

    const content = JSON.parse(readFileSync(logFile, { encoding: 'utf8' }));

    content.push(dataWithDate);

    writeFileSync(logFile, JSON.stringify(content, purgePathInLog, 2));

    // Get all the files from the old folder
    clearOldLogs(logPath);
  }
};

export enum ExitCodes {
  CONFIG_GET_INVALID_OPTIONS = 3,
  CONFIG_GET_NO_OPTIONS = 5,
  CONFIG_NOT_INITIALIZED = 4,
  CONFIG_SET_CUTOFF_INVALID_TOKEN = 10,
  CONFIG_SET_CUTOFF_INVALID_WEIGHT = 11,
  CONFIG_SET_INVALID_MULTIDIFFUSION = 8,
  CONFIG_SET_INVALID_OPTIONS = 6,
  CONFIG_SET_LCM_INVALID_TOKEN = 12,
  CONFIG_SET_NO_AGENT_INSTALLED = 14,
  CONFIG_SET_NO_CUTOFF_INSTALLED = 9,
  CONFIG_SET_NO_MULTIDIFFUSION_INSTALLED = 7,
  CONFIG_SET_REDRAW_INVALID_MODELS = 13,
  EXTRACT_INVALID_PARAMS = 16,
  EXTRACT_NO_SOURCE = 15,
  INIT_NO_CONTROLNET = 2,
  INIT_NO_SD_API = 1,
  PROMPT_INVALID_ADETAILER_MODEL = 50,
  PROMPT_INVALID_CHECKPOINT = 51,
  PROMPT_INVALID_CONTROLNET_MODEL = 47,
  PROMPT_INVALID_CONTROLNET_MODULE = 46,
  PROMPT_INVALID_CONTROLNET_POSE = 54,
  PROMPT_INVALID_PATTERN_TOKEN = 52,
  PROMPT_INVALID_SAMPLER = 45,
  PROMPT_INVALID_STRING_TOKEN = 44,
  PROMPT_INVALID_STYLE = 53,
  PROMPT_INVALID_UPSCALER = 49,
  PROMPT_INVALID_VAE = 48,
  QUERY_INVALID_SAMPLER = 43,
  QUEUE_CORRUPTED_JSON = 19,
  QUEUE_INVALID_FILE = 21,
  QUEUE_INVALID_JS = 20,
  QUEUE_INVALID_JSON = 18,
  QUEUE_INVALID_PARAMS = 22,
  QUEUE_NO_RESULTING_PROMPTS = 24,
  QUEUE_NO_SOURCE = 17,
  QUEUE_NO_SOURCE_INTERNAL = 23,
  REDRAW_INVALID_PARAMS = 25,
  REDRAW_IPADAPTER_MODEL_NOT_FOUND = 27,
  REDRAW_LINEART_MODEL_NOT_FOUND = 26,
  REDRAW_NO_SOURCE = 28,
  RENAME_INVALID_CONFIG = 30,
  RENAME_INVALID_CONFIG_JSON = 34,
  RENAME_INVALID_JSON = 32,
  RENAME_INVALID_PARAMS = 29,
  RENAME_NO_CONFIG_FILE = 33,
  RENAME_NO_SOURCE = 31,
  RENAME_NO_SOURCE_INTERNAL = 35,
  STATS_INVALID_PARAMS = 36,
  UPSCALE_INVALID_PARAMS = 37,
  UPSCALE_MULTIDIFFUSION_NO_SOURCE = 41,
  UPSCALE_NO_CONTROLNET = 38,
  UPSCALE_NO_CONTROLNET_TILES = 39,
  UPSCALE_NO_TILED_DIFFUSION = 40,
  UPSCALE_TILES_NO_SOURCE = 42
}
