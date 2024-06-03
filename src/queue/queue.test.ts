jest.mock('../commons/prompts');

import { resolve } from 'node:path';

import { ExitCodes } from '../commons/logger';
import { prompts } from '../commons/prompts';
import { queueFromFile } from './queue';

describe('queue loader test', () => {
  describe('simple config', () => {
    it('should load simple config from json', () => {
      expect.assertions(2);
      queueFromFile(resolve(__dirname, '../../test/configs/simple.json'), true);

      const expectedConfig = {
        prompts: [
          {
            cfg: 11.5,
            checkpoints: 'fake-checkpoint',
            count: 4,
            height: 640,
            pattern: '[styles]-[seed]-[datetime]',
            prompt: 'image prompt',
            stylesSets: [['Digital Art'], ['Isometric Style']],
            width: 1024
          }
        ]
      };

      const called = (prompts as jest.Mock).mock.calls[0][0];

      expect(prompts).toHaveBeenCalledTimes(1);
      expect(called).toMatchObject(expectedConfig);
    });

    it('should load simple config from js', () => {
      expect.assertions(2);
      queueFromFile(resolve(__dirname, '../../test/configs/simple.js'), true);

      const expectedConfig = {
        prompts: [
          {
            cfg: 7,
            checkpoints: ['check1', 'check2'],
            count: 4,
            height: 640,
            pattern: '[seed]-[datetime]',
            prompt: 'dynamic prompt',
            width: 1024
          }
        ]
      };

      const called = (prompts as jest.Mock).mock.calls[0][0];

      expect(prompts).toHaveBeenCalledTimes(1);
      expect(called).toMatchObject(expectedConfig);
    });

    it('should load simple config from cjs', () => {
      expect.assertions(2);
      queueFromFile(resolve(__dirname, '../../test/configs/simple.cjs'), true);

      const expectedConfig = {
        prompts: [
          {
            cfg: 7,
            checkpoints: ['check1', 'check2'],
            count: 4,
            height: 640,
            pattern: '[seed]-[datetime]',
            prompt: 'dynamic prompt CJS',
            width: 1024
          }
        ]
      };

      const called = (prompts as jest.Mock).mock.calls[0][0];

      expect(prompts).toHaveBeenCalledTimes(1);
      expect(called).toMatchObject(expectedConfig);
    });

    it('should load simple config from json with basePrompts', () => {
      expect.assertions(2);
      queueFromFile(resolve(__dirname, '../../test/configs/basePrompts.json'), true);

      const expectedConfig = {
        prompts: [
          {
            cfg: 11.5,
            checkpoints: 'fake-checkpoint',
            count: 4,
            height: 640,
            pattern: '[styles]-[seed]-[datetime]',
            prompt: 'image prompt 1',
            stylesSets: [['Digital Art'], ['Isometric Style']],
            width: 1024
          },
          {
            cfg: 11.5,
            checkpoints: 'fake-checkpoint 2',
            clipSkip: 2,
            count: 4,
            height: 640,
            pattern: '[styles]-[datetime]',
            prompt: 'image prompt 2',
            stylesSets: [['Digital Art'], ['Isometric Style']],
            width: 1024
          },
          {
            cfg: 7,
            checkpoints: 'fake-checkpoint',
            count: 4,
            height: 512,
            pattern: '[seed]-[datetime]',
            prompt: 'image prompt 3',
            stylesSets: [],
            width: 512
          }
        ]
      };

      const called = (prompts as jest.Mock).mock.calls[0][0];

      expect(prompts).toHaveBeenCalledTimes(1);
      expect(called).toMatchObject(expectedConfig);
    });
  });

  describe('extended config', () => {
    it('should load cascading config from json', () => {
      expect.assertions(2);
      queueFromFile(resolve(__dirname, '../../test/configs/cascadeA.json'), true);

      const expectedConfig = {
        permutations: [
          {
            afterFilename: 'image afterFilename B',
            afterPrompt: 'image afterPrompt B'
          }
        ],
        prompts: [
          {
            checkpoints: 'fake-checkpoint C',
            height: 640,
            pattern: 'test-[seed]-[datetime]',
            prompt: 'image prompt B',
            width: 640
          },
          {
            cfg: 11.5,
            checkpoints: 'fake-checkpoint',
            count: 4,
            height: 640,
            pattern: '[styles]-[seed]-[datetime]',
            prompt: 'image prompt',
            stylesSets: [['Digital Art'], ['Isometric Style']],
            width: 1024
          }
        ]
      };

      const called = (prompts as jest.Mock).mock.calls[0][0];

      expect(prompts).toHaveBeenCalledTimes(1);
      expect(called).toMatchObject(expectedConfig);
    });

    it('should load cascading config from json with absolute path marker', () => {
      expect.assertions(2);
      queueFromFile(resolve(__dirname, '../../test/configs/cascadeAPath.json'), true);

      const expectedConfig = {
        permutations: [
          {
            afterFilename: 'image afterFilename B',
            afterPrompt: 'image afterPrompt B'
          }
        ],
        prompts: [
          {
            checkpoints: 'fake-checkpoint C',
            height: 640,
            pattern: 'test-[seed]-[datetime]',
            prompt: 'image prompt B',
            width: 640
          },
          {
            cfg: 11.5,
            checkpoints: 'fake-checkpoint',
            count: 4,
            height: 640,
            pattern: '[styles]-[seed]-[datetime]',
            prompt: 'image prompt',
            stylesSets: [['Digital Art'], ['Isometric Style']],
            width: 1024
          }
        ]
      };

      const called = (prompts as jest.Mock).mock.calls[0][0];

      expect(prompts).toHaveBeenCalledTimes(1);
      expect(called).toMatchObject(expectedConfig);
    });
  });

  describe('invalid config', () => {
    it('should exit if no prompts is found', () => {
      expect.assertions(1);
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      queueFromFile(resolve(__dirname, '../../test/configs/cascadeC.json'), true);

      expect(mockExit).toHaveBeenCalledWith(ExitCodes.QUEUE_NO_RESULTING_PROMPTS);
    });

    it('should exit if corrupted file is provided', () => {
      expect.assertions(1);
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      queueFromFile(resolve(__dirname, '../../test/configs/corrupted.json'), true);

      expect(mockExit).toHaveBeenCalledWith(ExitCodes.QUEUE_CORRUPTED_JSON);
    });

    it('should exit if the file is not found', () => {
      expect.assertions(1);
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      queueFromFile(resolve(__dirname, '../../test/configs/not-found.json'), true);

      expect(mockExit).toHaveBeenCalledWith(ExitCodes.QUEUE_NO_SOURCE_INTERNAL);
    });

    it('should exit if invalid JSON file is provided', () => {
      expect.assertions(1);
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      queueFromFile(resolve(__dirname, '../../test/configs/invalid.json'), true);

      expect(mockExit).toHaveBeenCalledWith(ExitCodes.QUEUE_INVALID_JSON);
    });

    it('should exit if invalid JS file is provided', () => {
      expect.assertions(1);
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      queueFromFile(resolve(__dirname, '../../test/configs/invalid.js'), true);

      expect(mockExit).toHaveBeenCalledWith(ExitCodes.QUEUE_INVALID_JS);
    });

    it('should exit if invalid file type is provided', () => {
      expect.assertions(1);
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      queueFromFile(resolve(__dirname, '../../test/images/instruct/close-front.txt'), true);

      expect(mockExit).toHaveBeenCalledWith(ExitCodes.QUEUE_INVALID_FILE);
    });
  });
});
