import yargs from 'yargs';

import * as configSet from './config/configSet';
import * as init from './config/init';
import * as extract from './extract';
import * as queue from './queue';
import * as redraw from './redraw';
import * as rename from './rename';
import * as upscale from './upscale';

yargs(process.argv.slice(2))
  .command(rename)
  .command(extract)
  .command(upscale)
  .command(redraw)
  .command(queue)
  .command(configSet)
  .command(init)
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .strict()
  .parse();
