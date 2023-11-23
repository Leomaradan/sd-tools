import fs from 'fs';
import sizeOf from 'image-size';
import path from 'path';
import text from 'png-chunk-text';
import extract from 'png-chunks-extract';

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
    console.log(error);
    return undefined;
  }
};

export interface IFile {
  data: string[] | undefined;
  file: string;
  filename: string;
  height: number;
  width: number;
}

export const readFiles = (sourcepath: string): IFile[] => {
  const files = fs.readdirSync(sourcepath);
  const result: IFile[] = [];

  files.forEach((file) => {
    if (file.endsWith('.png')) {
      console.log(`Read ${file}`);
      const filename = path.resolve(sourcepath, file);
      const data = readFile(filename);
      const sizes = sizeOf(filename);

      result.push({
        data,
        file,
        filename,
        height: sizes.height ?? -1,
        width: sizes.width ?? -1
      });
    }
  });

  return result;
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
