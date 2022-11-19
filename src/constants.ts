
/* IMPORT */

import os from 'node:os';

/* MAIN */

const DEBOUNCE = 300;

const DEPTH = 20;

const LIMIT = 10_000_000;

const PLATFORM = os.platform ();

const IS_LINUX = ( PLATFORM === 'linux' );

const IS_MAC = ( PLATFORM === 'darwin' );

const IS_WINDOWS = ( PLATFORM === 'win32' );

const HAS_NATIVE_RECURSION = IS_MAC || IS_WINDOWS;

const POLLING_INTERVAL = 3000;

const POLLING_TIMEOUT = 20000;

const RENAME_TIMEOUT = 1250;

/* EXPORT */

export {DEBOUNCE, DEPTH, LIMIT, HAS_NATIVE_RECURSION, IS_LINUX, IS_MAC, IS_WINDOWS, PLATFORM, POLLING_INTERVAL, POLLING_TIMEOUT, RENAME_TIMEOUT};
