import sizeOf from 'image-size';
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, relative, resolve, sep } from 'node:path';
import text from 'png-chunk-text';
import extract from 'png-chunks-extract';

import { Cache } from './config';
import { loggerInfo, loggerVerbose } from './logger';
import { type CacheMetadata, type ICivitAIInfoFile, type IMetadata, type IMetadataCheckpoint, type IMetadataLora, Version } from './types';

const CIVITAI_FILE = '.civitai.info';

export const getFileNameWithoutExtension = (filename: string): string => {
  return basename(filename, extname(filename));
};

const readFile = (path: string, noCache?: boolean): string[] | undefined => {
  let data = undefined;
  const cacheImageData = noCache ? {} : Cache.get('imageData');
  try {
    if (cacheImageData[path] !== undefined) {
      if (cacheImageData[path].timestamp === statSync(path).mtimeMs.toString()) {
        return cacheImageData[path].data;
      }

      delete cacheImageData[path];
    }

    const buffer = readFileSync(path);

    const chunks = extract(buffer as Uint8Array);

    const exif = chunks
      .filter((chunk) => {
        return chunk.name === 'tEXt';
      })
      .map((chunk) => {
        return text.decode(chunk.data);
      })
      .find((chunk) => {
        return chunk.keyword === 'parameters';
      });

    const texData = exif?.text;

    if (texData) {
      data = texData.split('\n');

      cacheImageData[path] = {
        data,
        timestamp: statSync(path).mtimeMs.toString()
      };
    }
  } catch (error) {
    loggerInfo(String(error));
  } finally {
    if (!noCache) {
      Cache.set('imageData', cacheImageData);
    }
  }
  return data;
};

export interface IFile {
  data: string[] | undefined;
  date: string;
  file: string;
  filename: string;
  fullpath: string;
  height: number;
  prefix?: string;
  width: number;
}

export const readFiles = (sourcepath: string, root: string, recursive?: boolean, noCache?: boolean): IFile[] => {
  const files = readdirSync(sourcepath);
  const result: IFile[] = [];

  files.forEach((file) => {
    if (recursive && lstatSync(resolve(sourcepath, file)).isDirectory()) {
      result.push(...readFiles(resolve(sourcepath, file), root, recursive));
    }

    const prefix = recursive ? relative(root, sourcepath).split(sep).join(', ') : undefined;

    if (file.endsWith('.png')) {
      loggerVerbose(`Read ${file}`);
      const filename = resolve(sourcepath, file);
      const data = readFile(filename, noCache);
      const sizes = sizeOf(filename);
      const date = statSync(filename).birthtime.toISOString();

      result.push({
        data,
        date,
        file,
        filename,
        fullpath: resolve(sourcepath, file),
        height: sizes.height ?? -1,
        prefix,
        width: sizes.width ?? -1
      });
    }

    if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      loggerVerbose(`Read ${file}`);
      const filename = resolve(sourcepath, file);
      const sizes = sizeOf(filename);
      const date = statSync(filename).birthtime.toISOString();

      result.push({
        data: undefined,
        date,
        file,
        filename,
        fullpath: resolve(sourcepath, file),
        height: sizes.height ?? -1,
        prefix,
        width: sizes.width ?? -1
      });
    }
  });

  loggerVerbose(`Read ${result.length} files`);

  return result;
};

export const getFiles = (source: string, recursive?: boolean, noCache?: boolean) => {
  const filesList: IFile[] = [];

  readFiles(source, source, recursive, noCache).forEach((file) => {
    filesList.push(file);
  });

  return filesList;
};

const imageCache: Record<string, { data: string; height: number; width: number }> = {};

export const getBase64Image = (url: string) => {
  if (imageCache[url] !== undefined) {
    return imageCache[url].data;
  }

  if (statSync(url).isDirectory()) {
    return;
  }

  const buffer = readFileSync(url);
  const data = buffer.toString('base64');

  const sizes = sizeOf(url);
  imageCache[url] = {
    data,
    height: sizes.height ?? -1,
    width: sizes.width ?? -1
  };

  return data;
};

export const getImageSize = (url: string) => {
  if (imageCache[url] !== undefined) {
    return { height: imageCache[url].height, width: imageCache[url].width };
  }

  if (statSync(url).isDirectory()) {
    return { height: -1, width: -1 };
  }

  const buffer = readFileSync(url);
  const data = buffer.toString('base64');

  const sizes = sizeOf(url);
  imageCache[url] = {
    data,
    height: sizes.height ?? -1,
    width: sizes.width ?? -1
  };

  return { height: sizes.height ?? -1, width: sizes.width ?? -1 };
};

export const getMetadataFromCivitAi = (metadata: ICivitAIInfoFile): IMetadata | undefined => {
  try {
    const result: IMetadata = {
      accelerator: 'none',
      keywords: metadata.trainedWords ?? [],
      sdVersion: Version.Unknown //metadata['sd version'].toLowerCase().includes('xl') ? 'sdxl' : 'sd15'
    };

    switch (metadata.baseModel) {
      case 'Pony':
        result.sdVersion = Version.SDXL;
        break;
      case 'SD 1.4':
        result.sdVersion = Version.SD14;
        break;
      case 'SD 1.5 LCM':
        result.sdVersion = Version.SD15;
        result.accelerator = 'lcm';
        break;
      case 'SD 1.5':
        result.sdVersion = Version.SD15;
        break;
      case 'SD 2.0':
        result.sdVersion = Version.SD20;
        break;
      case 'SD 2.0 768':
        result.sdVersion = Version.SD20Full;
        break;
      case 'SD 2.1':
        result.sdVersion = Version.SD21;
        break;
      case 'SD 2.1 768':
        result.sdVersion = Version.SD21Full;
        break;
      case 'SDXL 0.9':
        result.sdVersion = Version.SDXL;
        break;
      case 'SDXL 1.0 LCM':
        result.sdVersion = Version.SDXL;
        result.accelerator = 'lcm';
        break;
      case 'SDXL 1.0':
        result.sdVersion = Version.SDXL;
        break;
      case 'SDXL Distilled':
        result.sdVersion = Version.SDXL;
        result.accelerator = 'distilled';
        break;
      case 'SDXL Lightning':
        result.sdVersion = Version.SDXL;
        result.accelerator = 'lightning';
        break;
      case 'SDXL Turbo':
        result.sdVersion = Version.SDXL;
        result.accelerator = 'turbo';
        break;
      default:
        result.sdVersion = Version.Unknown;
        break;
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      loggerInfo(`Error while parsing metadata : ${error.message}`);
    } else {
      loggerInfo(`Error while parsing metadata : ${error}`);
    }
  }

  return undefined;
};

export const getMetadataCivitAiInfo = (actualCacheMetadata: CacheMetadata, url: string): [CacheMetadata, IMetadata] | undefined => {
  if (!url.endsWith(CIVITAI_FILE)) {
    loggerInfo(`Invalid metadata file : ${url}`);
  }

  if (!existsSync(url)) {
    loggerInfo(`File does not exists : ${url}`);
    return;
  }

  const cacheMetadata = { ...actualCacheMetadata };

  try {
    if (cacheMetadata[url] !== undefined) {
      if (cacheMetadata[url].timestamp === statSync(url).mtimeMs.toString()) {
        return [cacheMetadata, cacheMetadata[url]];
      }

      delete actualCacheMetadata[url];
    }

    const content = readFileSync(url, 'utf8');
    const metadata = JSON.parse(content) as ICivitAIInfoFile;

    const result = getMetadataFromCivitAi(metadata);

    if (!result) {
      return;
    }

    cacheMetadata[url] = { ...result, timestamp: statSync(url).mtimeMs.toString() };

    return [cacheMetadata, result];
  } catch (error: unknown) {
    if (error instanceof Error) {
      loggerInfo(`Error while reading metadata for ${url} from CivitAI Info File : ${error.message}`);
    } else {
      loggerInfo(`Error while reading metadata for ${url} from CivitAI Info File : ${error}`);
    }
  }

  return undefined;
};

const getMetadata = async (url: string): Promise<IMetadata | undefined> => {
  const cacheMetadata = Cache.get('metadata');

  // Try getting metadata from JSON

  // If nothing is found, try getting metadata from CivitAI Info file

  // If nothing is found, try getting metadata from CivitAI REST API

  try {
    const civitAiFile = url.replace(/(\.safetensors|\.ckpt|\.pt|\.gguf)$/, CIVITAI_FILE);
    const metadataCivitAiInfo = getMetadataCivitAiInfo(cacheMetadata, civitAiFile);

    if (metadataCivitAiInfo) {
      const [cacheMetadataNew, metadata] = metadataCivitAiInfo;

      Cache.set('metadata', cacheMetadataNew);

      return metadata;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      loggerInfo(`Error while reading metadata for ${url} : ${error.message}`);
    } else {
      loggerInfo(`Error while reading metadata for ${url} : ${error}`);
    }
  }

  return undefined;
};

export const getMetadataLora = async (url: string): Promise<IMetadataLora | undefined> => {
  return getMetadata(url) as Promise<IMetadataLora | undefined>;
};

export const getMetadataCheckpoint = async (url: string): Promise<IMetadataCheckpoint | undefined> => {
  return getMetadata(url) as Promise<IMetadataCheckpoint | undefined>;
};
