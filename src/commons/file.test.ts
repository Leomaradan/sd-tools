import type { ICivitAIInfoFile, IMetadata } from './types';

import { getMetadataFromCivitAi } from './file';

describe('file tests', () => {
  const baseParamsQuery = {
    trainedWords: ['test']
  };

  const baseParamsResponse: IMetadata = {
    accelerator: 'none',
    keywords: ['test'],
    sdVersion: 'unknown'
  };

  it('should return the normalized metadata for edge cases from CivitAI requests', () => {
    expect.assertions(3);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'Other' } as unknown as ICivitAIInfoFile)).toStrictEqual<IMetadata>(
      baseParamsResponse
    );
    expect(getMetadataFromCivitAi({ baseModel: undefined } as unknown as ICivitAIInfoFile)).toStrictEqual<IMetadata>({
      accelerator: 'none',
      keywords: [],
      sdVersion: 'unknown'
    });

    expect(getMetadataFromCivitAi(undefined as unknown as ICivitAIInfoFile)).toBeUndefined();
  });

  it('should return the normalized Pony metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'Pony' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sdxl'
    });
  });
  it('should return the normalized SD 1.4 metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 1.4' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd14'
    });
  });
  it('should return the normalized SD 1.5 LCM metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 1.5 LCM' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'lcm',
      sdVersion: 'sd15'
    });
  });
  it('should return the normalized SD 1.5 metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 1.5' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd15'
    });
  });
  it('should return the normalized SD 2.0 metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 2.0' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd20'
    });
  });
  it('should return the normalized SD 2.0 768 metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 2.0 768' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd20-768'
    });
  });
  it('should return the normalized SD 2.1 metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 2.1' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd21'
    });
  });
  it('should return the normalized SD 2.1 768 metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 2.1 768' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd21-768'
    });
  });
  it('should return the normalized SDXL 0.9 metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL 0.9' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sdxl'
    });
  });
  it('should return the normalized SDXL 1.0 metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL 1.0' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sdxl'
    });
  });
  it('should return the normalized SDXL 1.0 LCM metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL 1.0 LCM' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'lcm',
      sdVersion: 'sdxl'
    });
  });
  it('should return the normalized SDXL Distilled metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL Distilled' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'distilled',
      sdVersion: 'sdxl'
    });
  });
  it('should return the normalized SDXL Turbo metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL Turbo' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'turbo',
      sdVersion: 'sdxl'
    });
  });
  it('should return the normalized SDXL Lightning metadata from CivitAI requests', () => {
    expect.assertions(1);

    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL Lightning' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'lightning',
      sdVersion: 'sdxl'
    });
  });

});
