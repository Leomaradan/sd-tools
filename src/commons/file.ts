import axios from 'axios';
import crypto from 'crypto';
import DOMPurify from 'dompurify';
import * as htmlparser2 from 'htmlparser2';
import sizeOf from 'image-size';
import { createReadStream, existsSync, lstatSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import text from 'png-chunk-text';
import extract from 'png-chunks-extract';

import { Cache } from './config';
import { loggerInfo, loggerVerbose } from './logger';
import {
  type CacheMetadata,
  type ICivitAIInfoFile,
  type IMetadata,
  type IMetadataCheckpoint,
  type IMetadataLora,
  Version,
  type VersionKey
} from './types';

const CIVITAI_FILE = '.civitai.info';

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

const getHash = (url: string) => {
  return new Promise((resolve, reject) => {
    const hashBuilder = crypto.createHash('sha256');
    hashBuilder.setEncoding('hex');
    const stream = createReadStream(url);

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

/*export const getStats = (source: string) => {
  const files = getFiles(source, true, true);

  const stats: Record<string, Record<string, number>> = {};

  files.forEach((file) => {
    if (file.filename.endsWith('.png')) {
      const date = new Date(file.date);
      const dateStr = `${date.getFullYear()}-${date.getMonth()}`;
      const { data } = file;
      if (data) {
        data.forEach((line) => {
          if (line.includes('Model: ')) {
            const model = line.split('Model: ')[1].split(', ')[0];
            if (stats[model] === undefined) {
              stats[model] = {};
            }

            stats[model].total = (stats[model].total ?? 0) + 1;

            stats[model][dateStr] = (stats[model][dateStr] ?? 0) + 1;
          }
        });
      }
    }
  });

  const dataTable: Array<number | string>[] = [['Model']];

  const columnMapping: Record<string, number> = {};
  Object.keys(stats).forEach((model, index) => {
    if (index === 0) {
      Object.keys(stats[model])
        .sort((a, b) => a.localeCompare(b))
        .forEach((date, index) => {
          columnMapping[date] = index + 1;
          dataTable[0].push(date);
        });
    }

    const row: Array<number | string> = [model];
    Object.keys(stats[model]).forEach((date) => {
      const mappedIndex = columnMapping[date];
      row[mappedIndex] = stats[model][date];
    });

    dataTable.push(row);
  });

  // eslint-disable-next-line no-console
  console.log(table(dataTable));
};*/

const parseDescriptions = (source: string) => {
  let data = source;

  data = data.replace(/<\/p>/g, '\n');
  data = data.replace(/<p>/g, '\n'); //<br />
  data = data.replace(/<br \/>/g, '\n');

  const dom = htmlparser2.parseDocument('<div>' + data + '</div>');

  return '<!--' + htmlparser2.DomUtils.textContent(dom) + '-->';
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

/*export const getMetadataAutomatic1111 = (actualCacheMetadata: CacheMetadata, url: string): [CacheMetadata, IMetadata] | undefined => {
  if (!url.endsWith('.json')) {
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

    cacheMetadata[url] = { ...result, timestamp: statSync(url).mtimeMs.toString() };

    return [cacheMetadata, result];
  } catch (error: unknown) {
    if (error instanceof Error) {
      loggerInfo(`Error while reading metadata for ${url} : ${error.message}`);
    } else {
      loggerInfo(`Error while reading metadata for ${url} : ${error}`);
    }
  }

  return undefined;
};*/

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

export const getMetadataCivitAiRest = async (
  actualCacheMetadata: CacheMetadata,
  url: string
): Promise<[CacheMetadata, IMetadata] | false | undefined> => {
  if (!existsSync(url)) {
    loggerInfo(`File does not exists : ${url}`);
    return;
  }

  const cacheMetadata = { ...actualCacheMetadata };

  try {
    // Calculate the hash of the file
    // Calling the REST API
    loggerVerbose(`Calculating hash for file ${url}`);
    const hash = await getHash(url);

    loggerVerbose(`Getting metadata from CivitAI RestAPI for model with hash ${hash}`);
    const response = await axios.get<ICivitAIInfoFile>(`https://civitai.com/api/v1/model-versions/by-hash/${hash}`);

    const metadata = response.data;

    if (metadata.description) {
      metadata.description = parseDescriptions(metadata.description);
    }

    if (metadata.model?.description) {
      metadata.model.description = parseDescriptions(metadata.model.description);
    }

    const civitAiFile = url.replace(/(\.safetensors|\.ckpt|\.pt)$/, CIVITAI_FILE);

    const purgedMetadata: ICivitAIInfoFile = {
      // Use forced
      baseModel: 'SD 1.5', //metadata.baseModel,
      description: '', //metadata.description,
      model: {
        description: '' //metadata.model?.description,
      },
      trainedWords: [] //metadata.trainedWords
    };

    purgedMetadata.baseModel = DOMPurify.sanitize(metadata.baseModel) as VersionKey;
    purgedMetadata.description = DOMPurify.sanitize(metadata.description);
    if (metadata.model?.description) {
      (purgedMetadata as Required<ICivitAIInfoFile>).model.description = DOMPurify.sanitize(metadata.model?.description);
    }

    if (metadata.trainedWords) {
      (purgedMetadata as Required<ICivitAIInfoFile>).trainedWords = metadata.trainedWords.map((word) => DOMPurify.sanitize(word));
    }

    writeFileSync(civitAiFile, JSON.stringify(purgedMetadata, null, 2));

    const result = getMetadataFromCivitAi(purgedMetadata);

    if (!result) {
      return;
    }

    cacheMetadata[url] = { ...result, timestamp: Date.now().toString() };

    return [cacheMetadata, result];
  } catch (error: unknown) {
    if (error instanceof Error) {
      loggerInfo(`Error while reading metadata for ${url} with CivitAI Rest API : ${error.message}`);
      if (error.message.includes('404')) {
        return false;
      }
    } else {
      loggerInfo(`Error while reading metadata for ${url} with CivitAI Rest API : ${error}`);
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
    const civitAiFile = url.replace(/(\.safetensors|\.ckpt|\.pt)$/, CIVITAI_FILE);
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
    } else if (metadataCivitAiRest === false) {
      // Store fake metadata to ensure we don't try to get it again
      const fakeMetadata: IMetadata = {
        accelerator: 'none',
        keywords: [],
        sdVersion: 'unknown'
      };
      cacheMetadata[url] = { ...fakeMetadata, timestamp: Date.now().toString() };
      Cache.set('metadata', cacheMetadata);
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
