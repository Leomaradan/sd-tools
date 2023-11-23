import path from 'path';
import yargs from 'yargs';

import { extract } from './extract';

interface IExtractOptions {
  addBefore?: string;
  output?: string;
  source: string;
}

export const command = 'extract <source>';
export const describe = 'extract prompts from directory';
export const builder = (builder: yargs.Argv<object>) => {
  return builder
    .positional('source', {
      demandOption: true,
      describe: 'source directory',
      type: 'string'
    })
    .options({
      'add-before': {
        alias: 'a',
        describe: 'add before prompt. Use | to separate (will generate multiple prompts)',
        type: 'string'
      },
      output: {
        alias: 'o',
        describe: 'Optional output. If omitted, will print to stdout',
        type: 'string'
      }
    })
    .fail((msg) => {
      console.log(msg);
      process.exit(1);
    });
};

export const handler = (argv: IExtractOptions) => {
  const source = path.resolve(argv.source);

  extract(source, argv.addBefore, argv.output);
};
