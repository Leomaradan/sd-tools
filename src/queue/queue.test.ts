/// <reference types="jest" />

jest.mock('../commons/prompts');

import path from 'path';

import { prompts } from '../commons/prompts';
import { queueFromFile } from './queue';

describe('queue loader test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('simple config', () => {
    it('should load simple config from json', () => {
      queueFromFile(path.resolve(__dirname, '../../test/configs/simple.json'), true);

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
      queueFromFile(path.resolve(__dirname, '../../test/configs/simple.js'), true);

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

    it('should load simple config from json with basePrompts', () => {
      queueFromFile(path.resolve(__dirname, '../../test/configs/basePrompts.json'), true);

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
      queueFromFile(path.resolve(__dirname, '../../test/configs/cascadeA.json'), true);

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
    it('should load exit if no prompts is found', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      queueFromFile(path.resolve(__dirname, '../../test/configs/cascadeC.json'), true);

      expect(prompts).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
