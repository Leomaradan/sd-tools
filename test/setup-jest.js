/// <reference types="jest" />

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});
