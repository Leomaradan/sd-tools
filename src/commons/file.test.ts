import type { ICivitAIInfoFile, IMetadata } from './types';

import { getMetadataFromCivitAi } from './file';

describe('file tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('should return the normalized metadata from civita-ie requests', () => {
    const baseParamsQuery = {
      trainedWords: ['test']
    };

    const baseParamsResponse: IMetadata = {
      accelerator: 'none',
      keywords: ['test'],
      sdVersion: 'unknown'
    };
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'Pony' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sdxl'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 1.4' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd14'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 1.5 LCM' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'lcm',
      sdVersion: 'sd15'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 1.5' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd15'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 2.0' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd20'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 2.0 768' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd20-768'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 2.1' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd21'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SD 2.1 768' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sd21-768'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL 0.9' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sdxl'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL 1.0 LCM' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'lcm',
      sdVersion: 'sdxl'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL 1.0' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      sdVersion: 'sdxl'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL Distilled' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'distilled',
      sdVersion: 'sdxl'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL Lightning' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'lightning',
      sdVersion: 'sdxl'
    });
    expect(getMetadataFromCivitAi({ ...baseParamsQuery, baseModel: 'SDXL Turbo' })).toStrictEqual<IMetadata>({
      ...baseParamsResponse,
      accelerator: 'turbo',
      sdVersion: 'sdxl'
    });
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
});
