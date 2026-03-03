jest.mock('../commons/extract');
jest.mock<typeof import('node:fs')>('node:fs', () => {
  const originalModule = jest.requireActual('node:fs');

  return {
    ...originalModule,
    writeFileSync: jest.fn()
  };
});

import { writeFileSync } from 'node:fs';
import path from 'node:path';

import type { IFile } from '../commons/file';

import { interrogateFromFile } from '../commons/extract';
import { interrogate } from './interrogate';

describe('interrogate', () => {
  // eslint-disable-next-line jest/no-hooks
  beforeEach(() => {
    jest.mocked(interrogateFromFile).mockImplementation((file: IFile) => Promise.resolve(file.file));
  });

  // eslint-disable-next-line jest/no-hooks
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call single file', async () => {
    expect.assertions(4);

    const sourcePath = path.resolve(__dirname, '../../test/images');

    await interrogate(sourcePath, {
      addBefore: 'test',
      // deepBooru: true,
      recursive: false
    });

    expect(writeFileSync).toHaveBeenCalledTimes(1);
    expect(writeFileSync).toHaveBeenNthCalledWith(1, path.resolve(sourcePath, 'close-front.pose.txt'), 'test, close-front.pose.png', {
      encoding: 'utf-8'
    });
    expect(interrogateFromFile).toHaveBeenCalledTimes(1);
    expect(interrogateFromFile).toHaveBeenNthCalledWith(
      1,
      {
        data: undefined,
        date: '2025-08-12T11:39:37.869Z',
        file: 'close-front.pose.png',
        filename: path.resolve(sourcePath, 'close-front.pose.png'),
        fullpath: path.resolve(sourcePath, 'close-front.pose.png'),
        height: 512,
        prefix: undefined,
        width: 512
      },
      undefined
    );
  });

  it('should call recursive file with options', async () => {
    expect.assertions(4);

    const sourcePath = path.resolve(__dirname, '../../test/images');

    await interrogate(sourcePath, {
      addBefore: 'test',
      models: ['deepdanbooru'],
      recursive: true
    });

    expect(writeFileSync).toHaveBeenCalledTimes(5);
    expect(writeFileSync).toHaveBeenNthCalledWith(5, path.resolve(sourcePath, 'close-front.txt'), 'test, close-front.png', {
      encoding: 'utf-8'
    });
    expect(interrogateFromFile).toHaveBeenCalledTimes(5);
    expect(interrogateFromFile).toHaveBeenNthCalledWith(
      5,
      {
        data: undefined,
        date: '2025-08-12T11:39:37.870Z',
        file: 'close-front.png',
        filename: path.resolve(sourcePath, 'single2', 'close-front.png'),
        fullpath: path.resolve(sourcePath, 'single2', 'close-front.png'),
        height: 512,
        prefix: 'single2',
        width: 512
      },
      ['deepdanbooru']
    );
  });
});
