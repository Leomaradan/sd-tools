import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import sizeOf from 'image-size';
import path from 'path';
import text from 'png-chunk-text';
import extract from 'png-chunks-extract';

import { Cache } from './config';
import { logger } from './logger';
import { CacheMetadata, ICivitAIInfoFile, IMetadata, IMetadataCheckpoint, IMetadataLora, Version } from './types';

const readFile = (path: string, noCache?: boolean): string[] | undefined => {
  let data = undefined;
  const cacheImageData = noCache ? {} : Cache.get('imageData');
  try {
    if (cacheImageData[path] !== undefined) {
      if (cacheImageData[path].timestamp === fs.statSync(path).mtimeMs.toString()) {
        return cacheImageData[path].data;
      }

      delete cacheImageData[path];
    }

    const buffer = fs.readFileSync(path);

    const chunks = extract(buffer);

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
        timestamp: fs.statSync(path).mtimeMs.toString()
      };
    }
  } catch (error) {
    logger(String(error));
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
  const files = fs.readdirSync(sourcepath);
  const result: IFile[] = [];

  files.forEach((file) => {
    if (recursive && fs.lstatSync(path.resolve(sourcepath, file)).isDirectory()) {
      result.push(...readFiles(path.resolve(sourcepath, file), root, recursive));
    }

    const prefix = recursive ? path.relative(root, sourcepath).split(path.sep).join(', ') : undefined;

    if (file.endsWith('.png')) {
      logger(`Read ${file}`);
      const filename = path.resolve(sourcepath, file);
      const data = readFile(filename, noCache);
      const sizes = sizeOf(filename);
      const date = fs.statSync(filename).birthtime.toISOString();

      result.push({
        data,
        date,
        file,
        filename,
        fullpath: path.resolve(sourcepath, file),
        height: sizes.height ?? -1,
        prefix,
        width: sizes.width ?? -1
      });
    }

    if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      logger(`Read ${file}`);
      const filename = path.resolve(sourcepath, file);
      const sizes = sizeOf(filename);
      const date = fs.statSync(filename).birthtime.toISOString();

      result.push({
        data: undefined,
        date,
        file,
        filename,
        fullpath: path.resolve(sourcepath, file),
        height: sizes.height ?? -1,
        prefix,
        width: sizes.width ?? -1
      });
    }
  });

  logger(`Read ${result.length} files`);

  return result;
};

const getHash = (url: string) => {
  return new Promise((resolve, reject) => {
    const hashBuilder = crypto.createHash('sha256');
    const stream = fs.createReadStream(url);

    stream.on('end', function () {
      hashBuilder.end();
      resolve(hashBuilder.read());
    });

    stream.on('error', (error) => {
      hashBuilder.end();
      reject(error);
    });

    stream.pipe(hashBuilder);
  });
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

  const buffer = fs.readFileSync(url);
  const data = buffer.toString('base64');

  const sizes = sizeOf(url);
  imageCache[url] = {
    data,
    height: sizes.height ?? -1,
    width: sizes.width ?? -1
  };

  return data;
};

/*export const getMetadataAutomatic1111 = (actualCacheMetadata: CacheMetadata, url: string): [CacheMetadata, IMetadata] | undefined => {
  if (!url.endsWith('.json')) {
    logger(`Invalid metadata file : ${url}`);
  }

  if (!fs.existsSync(url)) {
    logger(`File does not exists : ${url}`);
    return;
  }

  const cacheMetadata = { ...actualCacheMetadata };

  try {
    if (cacheMetadata[url] !== undefined) {
      if (cacheMetadata[url].timestamp === fs.statSync(url).mtimeMs.toString()) {
        return [cacheMetadata, cacheMetadata[url]];
      }

      delete actualCacheMetadata[url];
    }

    const content = fs.readFileSync(url, 'utf8');
    const metadata = JSON.parse(content);

    const result: IMetadata = {
      // description: metadata.description,
      preferredWeight: metadata['preferred weight'],
      sdVersion: Version.Unknown //metadata['sd version'].toLowerCase().includes('xl') ? 'sdxl' : 'sd15'
    };

    if (!metadata[SD_VERSION]) {
      return undefined;
    }

    if (metadata[SD_VERSION].toLowerCase().includes('xl')) {
      result.sdVersion = Version.SDXL;
    } else if (metadata[SD_VERSION].toLowerCase().includes('1.5') || metadata[SD_VERSION].toLowerCase().includes('sd1')) {
      result.sdVersion = Version.SD15;
    }

    cacheMetadata[url] = { ...result, timestamp: fs.statSync(url).mtimeMs.toString() };

    return [cacheMetadata, result];
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger(`Error while reading metadata for ${url} : ${error.message}`);
    } else {
      logger(`Error while reading metadata for ${url} : ${error}`);
    }
  }

  return undefined;
};*/

export const getMetadataFromCivitAi = (metadata: ICivitAIInfoFile): IMetadata | undefined => {
  try {
    const result: IMetadata = {
      accelerator: 'none',
      keywords: metadata.trainedWords,
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
      logger(`Error while parsing metadata : ${error.message}`);
    } else {
      logger(`Error while parsing metadata : ${error}`);
    }
  }

  return undefined;
};

export const getMetadataCivitAiInfo = (actualCacheMetadata: CacheMetadata, url: string): [CacheMetadata, IMetadata] | undefined => {
  if (!url.endsWith('.civitai.info')) {
    logger(`Invalid metadata file : ${url}`);
  }

  if (!fs.existsSync(url)) {
    logger(`File does not exists : ${url}`);
    return;
  }

  const cacheMetadata = { ...actualCacheMetadata };

  try {
    if (cacheMetadata[url] !== undefined) {
      if (cacheMetadata[url].timestamp === fs.statSync(url).mtimeMs.toString()) {
        return [cacheMetadata, cacheMetadata[url]];
      }

      delete actualCacheMetadata[url];
    }

    const content = fs.readFileSync(url, 'utf8');
    const metadata = JSON.parse(content) as ICivitAIInfoFile;

    const result = getMetadataFromCivitAi(metadata);

    if (!result) {
      return;
    }

    cacheMetadata[url] = { ...result, timestamp: fs.statSync(url).mtimeMs.toString() };

    return [cacheMetadata, result];
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger(`Error while reading metadata for ${url} from CivitAI Info File : ${error.message}`);
    } else {
      logger(`Error while reading metadata for ${url} from CivitAI Info File : ${error}`);
    }
  }

  return undefined;
};

export const getMetadataCivitAiRest = async (
  actualCacheMetadata: CacheMetadata,
  url: string
): Promise<[CacheMetadata, IMetadata] | undefined> => {
  if (!fs.existsSync(url)) {
    logger(`File does not exists : ${url}`);
    return;
  }

  const cacheMetadata = { ...actualCacheMetadata };

  try {
    // Calculate the hash of the file
    // Calling the REST API
    logger(`Calculating hash for file ${url}`);
    const hash = await getHash(url);

    logger(`Getting metadata from CivitAI RestAPI for model with hash ${hash}`);
    const response = await axios.get<ICivitAIInfoFile>(`https://civitai.com/api/v1/model-versions/by-hash/${hash}`);

    const metadata = response.data;

    // TODO : write the metadata to a civitai.info file. Dom parsing is needed

    const result = getMetadataFromCivitAi(metadata);

    if (!result) {
      return;
    }

    cacheMetadata[url] = { ...result, timestamp: Date.now().toString() };

    return [cacheMetadata, result];
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger(`Error while reading metadata for ${url} with CivitAI Rest API : ${error.message}`);
    } else {
      logger(`Error while reading metadata for ${url} with CivitAI Rest API : ${error}`);
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
    const civitAiFile = url.replace(/(\.safetensors|\.ckpt|\.pt)$/, '.civitai.info');
    const metadataCivitAiInfo = getMetadataCivitAiInfo(cacheMetadata, civitAiFile);

    if (metadataCivitAiInfo) {
      const [cacheMetadataNew, metadata] = metadataCivitAiInfo;

      Cache.set('metadata', cacheMetadataNew);

      return metadata;
    }

    const metadataCivitAiRest = await getMetadataCivitAiRest(cacheMetadata, url);

    if (metadataCivitAiRest) {
      const [cacheMetadataNew, metadata] = metadataCivitAiRest;

      Cache.set('metadata', cacheMetadataNew);

      return metadata;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger(`Error while reading metadata for ${url} : ${error.message}`);
    } else {
      logger(`Error while reading metadata for ${url} : ${error}`);
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
