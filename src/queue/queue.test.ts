/// <reference types="jest" />

jest.mock('../commons/queue');

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
  });
});
