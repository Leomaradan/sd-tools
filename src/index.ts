import yargs from 'yargs';

import { Config } from './commons/config';
import * as configGet from './config/configGet';
import * as configSet from './config/configSet';
import * as init from './config/init';
import * as wizard from './config/wizard';
import * as extract from './extract';
import * as queue from './queue';
import * as redraw from './redraw';
import * as rename from './rename';
import * as stats from './stats';
import * as upscale from './upscale';

const argv = process.argv.slice(2);

Config.migrate().then(() => {
  yargs(argv)
    .scriptName('sd-tools')
    .command(init)
    .command(wizard)
    .command(configSet)
    .command(configGet)
    .command(queue)
    .command(rename)
    .command(extract)
    .command(upscale)
    .command(redraw)
    .command(stats)
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .version(process.env.VERSION ?? '0.0.0')
    .strict()
    .parse();
});
