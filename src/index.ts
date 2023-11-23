import yargs from 'yargs';

import * as extract from './extract';
import * as redraw from './redraw';
import * as rename from './rename';
import * as upscale from './upscale';

yargs(process.argv.slice(2))
  .command(rename)
  .command(extract)
  .command(upscale)
  .command(redraw)
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .strict()
  .parse();
