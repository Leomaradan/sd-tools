/// <reference types="jest" />

import { argv } from 'process';

beforeEach(() => {
  if (!argv.includes('--verbose')) {
    jest.spyOn(console, 'log').mockImplementation();
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});
