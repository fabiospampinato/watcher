
/* IMPORT */

import {RENAME_TIMEOUT} from './constants';
import {FileType, TargetEvent} from './enums';
import Utils from './utils';
import WatcherLocksResolver from './watcher_locks_resolver';
import type Watcher from './watcher';
import type {Path, LocksAdd, LocksUnlink, LocksPair, LockConfig} from './types';

/* MAIN */

//TODO: Use a better name for this thing, maybe "RenameDetector"

class WatcherLocker {

  /* VARIABLES */

  _locksAdd!: LocksAdd;
  _locksAddDir!: LocksAdd;
  _locksUnlink!: LocksUnlink;
  _locksUnlinkDir!: LocksUnlink;
  _locksDir!: LocksPair;
  _locksFile!: LocksPair;
  _watcher: Watcher;

  static DIR_EVENTS = <const> {
    add: TargetEvent.ADD_DIR,
    rename: TargetEvent.RENAME_DIR,
    unlink: TargetEvent.UNLINK_DIR
  };

  static FILE_EVENTS = <const> {
    add: TargetEvent.ADD,
    change: TargetEvent.CHANGE,
    rename: TargetEvent.RENAME,
    unlink: TargetEvent.UNLINK
  };

  /* CONSTRUCTOR */

  constructor ( watcher: Watcher ) {

    this._watcher = watcher;

    this.reset ();

  }

  /* API */

  getLockAdd ( config: LockConfig, timeout: number = RENAME_TIMEOUT ): void {

    const {ino, targetPath, events, locks} = config;

    const emit = (): void => {
      const otherPath = this._watcher._poller.paths.find ( ino || -1, path => path !== targetPath ); // Maybe this is actually a rename in a case-insensitive filesystem
      if ( otherPath && otherPath !== targetPath ) {
        if ( Utils.fs.getRealPath ( targetPath, true ) === otherPath ) return; //TODO: This seems a little too special-casey
        this._watcher.event ( events.rename, otherPath, targetPath );
      } else {
        this._watcher.event ( events.add, targetPath );
      }
    };

    if ( !ino ) return emit ();

    const cleanup = (): void => {
      locks.add.delete ( ino );
      WatcherLocksResolver.remove ( free );
    };

    const free = (): void => {
      cleanup ();
      emit ();
    };

    WatcherLocksResolver.add ( free, timeout );

    const resolve = (): void => {
      const unlink = locks.unlink.get ( ino );
      if ( !unlink ) return; // No matching "unlink" lock found, skipping
      cleanup ();
      const targetPathPrev = unlink ();
      if ( targetPath === targetPathPrev ) {
        if ( events.change ) {
          if ( this._watcher._poller.stats.has ( targetPath ) ) {
            this._watcher.event ( events.change, targetPath );
          }
        }
      } else {
        this._watcher.event ( events.rename, targetPathPrev, targetPath );
      }
    };

    locks.add.set ( ino, resolve );

    resolve ();

  }

  getLockUnlink ( config: LockConfig, timeout: number = RENAME_TIMEOUT ): void {

    const {ino, targetPath, events, locks} = config;

    const emit = (): void => {
      this._watcher.event ( events.unlink, targetPath );
    };

    if ( !ino ) return emit ();

    const cleanup = (): void => {
      locks.unlink.delete ( ino );
      WatcherLocksResolver.remove ( free );
    };

    const free = (): void => {
      cleanup ();
      emit ();
    };

    WatcherLocksResolver.add ( free, timeout );

    const overridden = (): Path => {
      cleanup ();
      return targetPath;
    };

    locks.unlink.set ( ino, overridden );

    locks.add.get ( ino )?.();

  }

  getLockTargetAdd ( targetPath: Path, timeout?: number ): void {

    const ino = this._watcher._poller.getIno ( targetPath, TargetEvent.ADD, FileType.FILE );

    return this.getLockAdd ({
      ino,
      targetPath,
      events: WatcherLocker.FILE_EVENTS,
      locks: this._locksFile
    }, timeout );

  }

  getLockTargetAddDir ( targetPath: Path, timeout?: number ): void {

    const ino = this._watcher._poller.getIno ( targetPath, TargetEvent.ADD_DIR, FileType.DIR );

    return this.getLockAdd ({
      ino,
      targetPath,
      events: WatcherLocker.DIR_EVENTS,
      locks: this._locksDir
    }, timeout );

  }

  getLockTargetUnlink ( targetPath: Path, timeout?: number ): void {

    const ino = this._watcher._poller.getIno ( targetPath, TargetEvent.UNLINK, FileType.FILE );

    return this.getLockUnlink ({
      ino,
      targetPath,
      events: WatcherLocker.FILE_EVENTS,
      locks: this._locksFile
    }, timeout );

  }

  getLockTargetUnlinkDir ( targetPath: Path, timeout?: number ): void {

    const ino = this._watcher._poller.getIno ( targetPath, TargetEvent.UNLINK_DIR, FileType.DIR );

    return this.getLockUnlink ({
      ino,
      targetPath,
      events: WatcherLocker.DIR_EVENTS,
      locks: this._locksDir
    }, timeout );

  }

  reset (): void {

    this._locksAdd = new Map ();
    this._locksAddDir = new Map ();
    this._locksUnlink = new Map ();
    this._locksUnlinkDir = new Map ();
    this._locksDir = { add: this._locksAddDir, unlink: this._locksUnlinkDir };
    this._locksFile = { add: this._locksAdd, unlink: this._locksUnlink };

  }

}

/* EXPORT */

export default WatcherLocker;
