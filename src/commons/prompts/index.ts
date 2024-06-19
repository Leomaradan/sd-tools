import { loggerInfo, writeLog } from '../logger';
import { renderQuery } from '../query';
import { type IImg2ImgQuery, type IPromptsResolved, type ITxt2ImgQuery } from '../types';
import { preparePrompts } from './preparePrompts';

export const prompts = async (config: IPromptsResolved, validateOnly: boolean) => {
  const queries = preparePrompts(config);

  loggerInfo(`Your configuration seems valid. ${queries.length} queries has been generated.`);
  if (validateOnly) {
    writeLog({ queries }, true);
    process.exit(0);
  }

  for await (const queryParams of queries) {
    if ((queryParams as IImg2ImgQuery).init_images) {
      await renderQuery(queryParams as IImg2ImgQuery, 'img2img');
    } else {
      await renderQuery(queryParams as ITxt2ImgQuery, 'txt2img');
    }
  }
};
