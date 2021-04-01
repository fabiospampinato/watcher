
/* IMPORT */

import {INO, Stats} from './types';

/* WATCHER STATS */

// An even more memory-efficient representation of the useful subset of stats objects

class WatcherStats {

  /* VARIABLES */

  ino: INO;
  size: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  _isFile: boolean;
  _isDirectory: boolean;
  _isSymbolicLink: boolean;

  /* CONSTRUCTOR */

  constructor ( stats: Stats ) {

    this.ino = stats.ino;
    this.size = stats.size;
    this.atimeMs = stats.atimeMs;
    this.mtimeMs = stats.mtimeMs;
    this.ctimeMs = stats.ctimeMs;
    this.birthtimeMs = stats.birthtimeMs;
    this._isFile = stats.isFile ();
    this._isDirectory = stats.isDirectory ();
    this._isSymbolicLink = stats.isSymbolicLink ();

  }

  /* API */

  isFile (): boolean {

    return this._isFile;

  }

  isDirectory (): boolean {

    return this._isDirectory;

  }

  isSymbolicLink (): boolean {

    return this._isSymbolicLink;

  }

}

/* EXPORT */

export default WatcherStats;
