// xdg-basedir is a ES6 module, and Jest need CJS. Instead of tweaking Jest, it's easier to just copy the xdg-basedir source here
// https://github.com/sindresorhus/xdg-basedir/blob/main/index.js
import { homedir } from 'node:os';
import { join } from 'path';

const homeDirectory = homedir();
const { env } = process;

export const xdgData = env.XDG_DATA_HOME || (homeDirectory ? join(homeDirectory, '.local', 'share') : undefined);

export const xdgConfig = env.XDG_CONFIG_HOME || (homeDirectory ? join(homeDirectory, '.config') : undefined);

export const xdgState = env.XDG_STATE_HOME || (homeDirectory ? join(homeDirectory, '.local', 'state') : undefined);

export const xdgCache = env.XDG_CACHE_HOME || (homeDirectory ? join(homeDirectory, '.cache') : undefined);

export const xdgRuntime = env.XDG_RUNTIME_DIR || undefined;

export const xdgDataDirectories = (env.XDG_DATA_DIRS || '/usr/local/share/:/usr/share/').split(':');

if (xdgData) {
  xdgDataDirectories.unshift(xdgData);
}

export const xdgConfigDirectories = (env.XDG_CONFIG_DIRS || '/etc/xdg').split(':');

if (xdgConfig) {
  xdgConfigDirectories.unshift(xdgConfig);
}
