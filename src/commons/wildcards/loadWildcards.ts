import { readdirSync, readFileSync, statSync } from 'fs';
import { parse, stringify } from 'yaml';
import { Cache, Config } from '../config';
import { relative, resolve } from 'path';

/*const readFiles = (sourcepath: string, root: string, recursive?: boolean, noCache?: boolean): IFile[] => {
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
};*/

const getFiles = (source: string) => {
  const filesList: [file: string, lastModified: number][] = [];

  const files = readdirSync(source);

  files.forEach((file) => {
    const newFile = resolve(source, file);
    const isDirectory = statSync(newFile).isDirectory();

    if (isDirectory) {
      filesList.push(...getFiles(newFile));
      return;
    }
    const filename = newFile;
    const stats = statSync(filename);
    filesList.push([filename, stats.mtimeMs]);
  });

  return filesList;
};

export const loadWildcards = async (): Promise<void> => {
  const wildcardsFolder = Config.get('wildcardsFolder');
  if (!wildcardsFolder) {
    return;
  }

  const wildcardsFilesFull = getFiles(wildcardsFolder);

  const wildcardsFiles = wildcardsFilesFull.map((file) => {
    return [relative(wildcardsFolder, file[0]), file[1]] as [file: string, lastModified: number];
  });

  const cachedWildcards = Cache.get('wildcards');
  const notFound = Object.keys(cachedWildcards || {});
  const wildcardsToRead: [file: string, lastModified: number][] = [];

  wildcardsFiles.forEach((element) => {
    const [filename, lastModified] = element;

    if (cachedWildcards?.[filename] === undefined) {
      wildcardsToRead.push(element);
    } else {
      notFound.splice(notFound.indexOf(filename), 1);

      if (cachedWildcards[filename].update !== lastModified) {
        wildcardsToRead.push(element);
      }
    }
  });

  let cacheUpdate = false;

  console.log(`Found ${wildcardsFiles.length} wildcard files, ${wildcardsToRead.length} to read, ${notFound.length} not found`);

  // artists/Japanese Art/yoga/yoga.txt
  //__artists/Japanese Art/yoga/yoga__

  wildcardsToRead.forEach((wildcardToRead) => {
    if (wildcardToRead[0].endsWith('.txt')) {
      /*const lines = readFileSync(resolve(wildcardsFolder, wildcardToRead[0]))
        .toString()
        .split('\n')
        .map((line) => line.trim());
      */
      const nameWithoutExtension = wildcardToRead[0].slice(0, -4);

      cachedWildcards[wildcardToRead[0]] = {
        content: 'flat',
        name: nameWithoutExtension,
        update: wildcardToRead[1]
      };
      cacheUpdate = true;
    }

    if (wildcardToRead[0].endsWith('.yaml')) {
      const content = readFileSync(resolve(wildcardsFolder, wildcardToRead[0])).toString();
      try {
        const json = parse(content);

        const key = Object.keys(json);

        if (key.length === 1) {
          cachedWildcards[wildcardToRead[0]] = {
            content: json,
            name: key[0],
            update: wildcardToRead[1]
          };
          cacheUpdate = true;
        } else {
          console.log(`yaml ${wildcardToRead[0]} has invalid entry points ${key.join(',')}`);
        }
      } catch (error) {
        console.log(`Unable to parse yaml ${wildcardToRead[0]}`);
      }
    }
  });

  notFound.forEach((notFoundWildcard) => {
    delete cachedWildcards[notFoundWildcard];
    cacheUpdate = true;
  });

  if (cacheUpdate) {
    Cache.set('wildcards', cachedWildcards);
  }
};
