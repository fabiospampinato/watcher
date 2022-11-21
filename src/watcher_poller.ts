
/* IMPORT */

import {FileType, TargetEvent} from './enums';
import LazyMapSet from './lazy_map_set';
import Utils from './utils';
import WatcherStats from './watcher_stats';
import type {INO, Path} from './types';

/* MAIN */

class WatcherPoller {

  /* VARIABLES */

  inos: Partial<Record<TargetEvent, Record<Path, [INO, FileType]>>> = {};
  paths: LazyMapSet<INO, Path> = new LazyMapSet ();
  stats: Map<Path, WatcherStats> = new Map ();

  /* API */

  getIno ( targetPath: Path, event: TargetEvent, type?: FileType ): INO | undefined {

    const inos = this.inos[event];

    if ( !inos ) return;

    const ino = inos[targetPath];

    if ( !ino ) return;

    if ( type && ino[1] !== type ) return;

    return ino[0];

  }

  getStats ( targetPath: Path ): WatcherStats | undefined {

    return this.stats.get ( targetPath );

  }

  async poll ( targetPath: Path, timeout?: number ): Promise<WatcherStats | undefined> {

    const stats = await Utils.fs.poll ( targetPath, timeout );

    if ( !stats ) return;

    const isSupported = stats.isFile () || stats.isDirectory ();

    if ( !isSupported ) return;

    return new WatcherStats ( stats );

  }

  reset (): void {

    this.inos = {};
    this.paths = new LazyMapSet ();
    this.stats = new Map ();

  }

  async update ( targetPath: Path, timeout?: number ): Promise<TargetEvent[]> {

    const prev = this.getStats ( targetPath );
    const next = await this.poll ( targetPath, timeout );

    this.updateStats ( targetPath, next );

    if ( !prev && next ) {

      if ( next.isFile () ) {

        this.updateIno ( targetPath, TargetEvent.ADD, next );

        return [TargetEvent.ADD];

      }

      if ( next.isDirectory () ) {

        this.updateIno ( targetPath, TargetEvent.ADD_DIR, next );

        return [TargetEvent.ADD_DIR];

      }

    } else if ( prev && !next ) {

      if ( prev.isFile () ) {

        this.updateIno ( targetPath, TargetEvent.UNLINK, prev );

        return [TargetEvent.UNLINK];

      }

      if ( prev.isDirectory () ) {

        this.updateIno ( targetPath, TargetEvent.UNLINK_DIR, prev );

        return [TargetEvent.UNLINK_DIR];

      }

    } else if ( prev && next ) {

      if ( prev.isFile () ) {

        if ( next.isFile () ) {

          if ( prev.ino === next.ino && !prev.size && !next.size ) return []; // Same path, same content and same file, nothing actually changed

          this.updateIno ( targetPath, TargetEvent.CHANGE, next );

          return [TargetEvent.CHANGE];

        }

        if ( next.isDirectory () ) {

          this.updateIno ( targetPath, TargetEvent.UNLINK, prev );
          this.updateIno ( targetPath, TargetEvent.ADD_DIR, next );

          return [TargetEvent.UNLINK, TargetEvent.ADD_DIR];

        }

      } else if ( prev.isDirectory () ) {

        if ( next.isFile () ) {

          this.updateIno ( targetPath, TargetEvent.UNLINK_DIR, prev );
          this.updateIno ( targetPath, TargetEvent.ADD, next );

          return [TargetEvent.UNLINK_DIR, TargetEvent.ADD];

        }

        if ( next.isDirectory () ) {

          if ( prev.ino === next.ino ) return []; // Same path and same directory, nothing actually changed

          this.updateIno ( targetPath, TargetEvent.UNLINK_DIR, prev );
          this.updateIno ( targetPath, TargetEvent.ADD_DIR, next );

          return [TargetEvent.UNLINK_DIR, TargetEvent.ADD_DIR];

        }

      }

    }

    return [];

  }

  updateIno ( targetPath: Path, event: TargetEvent, stats: WatcherStats ): void {

    const inos = this.inos[event] = this.inos[event] || ( this.inos[event] = {} );
    const type = stats.isFile () ? FileType.FILE : FileType.DIR;

    inos[targetPath] = [stats.ino, type];

  }

  updateStats ( targetPath: Path, stats?: WatcherStats ): void {

    if ( stats ) {

      this.paths.set ( stats.ino, targetPath );
      this.stats.set ( targetPath, stats );

    } else {

      const ino = this.stats.get ( targetPath )?.ino || -1;

      this.paths.delete ( ino, targetPath );
      this.stats.delete ( targetPath );

    }

  }

}

/* EXPORT */

export default WatcherPoller;
