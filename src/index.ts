import yargs from 'yargs';

import { Config } from './commons/config';
import * as configGet from './config/configGet';
import * as configSet from './config/configSet';
import * as init from './config/init';
import * as extract from './extract';
import * as queue from './queue';
import * as redraw from './redraw';
import * as rename from './rename';
import * as upscale from './upscale';

Config.migrate().then(() => {
  yargs(process.argv.slice(2))
    .command(init)
    .command(configSet)
    .command(configGet)
    .command(queue)
    .command(rename)
    .command(extract)
    .command(upscale)
    .command(redraw)
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .strict()
    .parse();
});
