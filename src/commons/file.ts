import fs from 'fs';
import sizeOf from 'image-size';
import path from 'path';
import text from 'png-chunk-text';
import extract from 'png-chunks-extract';

import { Config } from './config';
import { logger } from './logger';
import { IMetadata, Version } from './types';

const readFile = (path: string): string[] | undefined => {
  try {
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
      return texData.split('\n');
    }
  } catch (error) {
    logger(String(error));
    return undefined;
  }
};

export interface IFile {
  data: string[] | undefined;
  file: string;
  filename: string;
  fullpath: string;
  height: number;
  prefix?: string;
  width: number;
}

export const readFiles = (sourcepath: string, root: string, recursive?: boolean): IFile[] => {
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
      const data = readFile(filename);
      const sizes = sizeOf(filename);

      result.push({
        data,
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

      result.push({
        data: undefined,
        file,
        filename,
        fullpath: path.resolve(sourcepath, file),
        height: sizes.height ?? -1,
        prefix,
        width: sizes.width ?? -1
      });
    }
  });

  return result;
};

export const getFiles = (source: string, recursive?: boolean) => {
  const filesList: IFile[] = [];

  readFiles(source, source, recursive).forEach((file) => {
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

export const getMetadata = (url: string): IMetadata | undefined => {
  const cacheMetadata = Config.get('cacheMetadata');
  if (cacheMetadata[url] !== undefined) {
    return cacheMetadata[url];
  }

  try {
    if (fs.existsSync(url)) {
      const content = fs.readFileSync(url, 'utf8');
      const metadata = JSON.parse(content);

      const result: IMetadata = {
        // description: metadata.description,
        preferredWeight: metadata['preferred weight'],
        sdVersion: Version.Unknown //metadata['sd version'].toLowerCase().includes('xl') ? 'sdxl' : 'sd15'
      };

      if (metadata['sd version']) {
        if (metadata['sd version'].toLowerCase().includes('xl')) {
          result.sdVersion = Version.SDXL;
        } else if (metadata['sd version'].toLowerCase().includes('1.5') || metadata['sd version'].toLowerCase().includes('sd1')) {
          result.sdVersion = Version.SD15;
        }
      }

      cacheMetadata[url] = result;

      Config.set('cacheMetadata', cacheMetadata);

      return result;
    }
  } catch (error: any) {
    logger(`Error while reading metadata for ${url} : ${error.message}`);
  }

  return undefined;
};
