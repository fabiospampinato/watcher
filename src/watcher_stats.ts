
/* IMPORT */

import type {INO, Stats} from './types';

/* MAIN */

// An more memory-efficient representation of the useful subset of stats objects

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

    this.ino = ( stats.ino <= Number.MAX_SAFE_INTEGER ) ? Number ( stats.ino ) : stats.ino;
    this.size = Number ( stats.size );
    this.atimeMs = Number ( stats.atimeMs );
    this.mtimeMs = Number ( stats.mtimeMs );
    this.ctimeMs = Number ( stats.ctimeMs );
    this.birthtimeMs = Number ( stats.birthtimeMs );
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
