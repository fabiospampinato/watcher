
/* IMPORT */

import path from 'node:path';
import {DEBOUNCE, DEPTH, LIMIT, HAS_NATIVE_RECURSION, IS_WINDOWS} from './constants';
import {FSTargetEvent, FSWatcherEvent, TargetEvent} from './enums';
import Utils from './utils';
import type Watcher from './watcher';
import type {Event, FSWatcher, Handler, HandlerBatched, Path, WatcherOptions, WatcherConfig} from './types';

/* MAIN */

class WatcherHandler {

  /* VARIABLES */

  base?: WatcherHandler;
  watcher: Watcher;
  handler: Handler;
  handlerBatched: HandlerBatched;
  fswatcher: FSWatcher;
  options: WatcherOptions;
  folderPath: Path;
  filePath?: Path;

  /* CONSTRUCTOR */

  constructor ( watcher: Watcher, config: WatcherConfig, base?: WatcherHandler ) {

    this.base = base;
    this.watcher = watcher;
    this.handler = config.handler;
    this.fswatcher = config.watcher;
    this.options = config.options;
    this.folderPath = config.folderPath;
    this.filePath = config.filePath;

    this.handlerBatched = this.base ? this.base.onWatcherEvent.bind ( this.base ) : this._makeHandlerBatched ( this.options.debounce ); //UGLY

  }

  /* HELPERS */

  _isSubRoot ( targetPath: Path ): boolean { // Only events inside the watched root are emitted

    if ( this.filePath ) {

      return targetPath === this.filePath;

    } else {

      return targetPath === this.folderPath || Utils.fs.isSubPath ( this.folderPath, targetPath );

    }

  }

  _makeHandlerBatched ( delay: number = DEBOUNCE ) {

    return (() => {

      let lock = this.watcher._readyWait; // ~Ensuring no two flushes are active in parallel, or before the watcher is ready
      let initials: Event[] = [];
      let regulars: Set<Path> = new Set ();

      const flush = async ( initials: Event[], regulars: Set<Path> ): Promise<void> => {

        const initialEvents = this.options.ignoreInitial ? [] : initials;
        const regularEvents = await this.eventsPopulate ([ ...regulars ]);
        const events = this.eventsDeduplicate ([ ...initialEvents, ...regularEvents ]);

        this.onTargetEvents ( events );

      };

      const flushDebounced = Utils.lang.debounce ( () => {

        if ( this.watcher.isClosed () ) return;

        lock = flush ( initials, regulars );

        initials = [];
        regulars = new Set ();

      }, delay );

      return async ( event: FSTargetEvent, targetPath: Path = '', isInitial: boolean = false ): Promise<void> => {

        if ( isInitial ) { // Poll immediately

          await this.eventsPopulate ( [targetPath], initials, true );

        } else { // Poll later

          regulars.add ( targetPath );

        }

        lock.then ( flushDebounced );

      };

    })();

  }

  /* EVENT HELPERS */

  eventsDeduplicate ( events: Event[] ): Event[] {

    if ( events.length < 2 ) return events;

    const targetsEventPrev: Record<Path, TargetEvent> = {};

    return events.reduce<Event[]> ( ( acc, event ) => {

      const [targetEvent, targetPath] = event;
      const targetEventPrev = targetsEventPrev[targetPath];

      if ( targetEvent === targetEventPrev ) return acc; // Same event, ignoring

      if ( targetEvent === TargetEvent.CHANGE && targetEventPrev === TargetEvent.ADD ) return acc; // "change" after "add", ignoring

      targetsEventPrev[targetPath] = targetEvent;

      acc.push ( event );

      return acc;

    }, [] );

  }

  async eventsPopulate ( targetPaths: Path[], events: Event[] = [], isInitial: boolean = false ): Promise<Event[]> {

    await Promise.all ( targetPaths.map ( async targetPath => {

      const targetEvents = await this.watcher._poller.update ( targetPath, this.options.pollingTimeout );

      await Promise.all ( targetEvents.map ( async event => {

        events.push ([ event, targetPath ]);

        if ( event === TargetEvent.ADD_DIR ) {

          await this.eventsPopulateAddDir ( targetPaths, targetPath, events, isInitial );

        } else if ( event === TargetEvent.UNLINK_DIR ) {

          await this.eventsPopulateUnlinkDir ( targetPaths, targetPath, events, isInitial );

        }

      }));

    }));

    return events;

  };

  async eventsPopulateAddDir ( targetPaths: Path[], targetPath: Path, events: Event[] = [], isInitial: boolean = false ): Promise<Event[]> {

    if ( isInitial ) return events;

    const depth = this.options.recursive ? this.options.depth ?? DEPTH : Math.min ( 1, this.options.depth ?? DEPTH );
    const limit = this.options.limit ?? LIMIT;
    const [directories, files] = await Utils.fs.readdir ( targetPath, this.options.ignore, depth, limit, this.watcher._closeSignal );
    const targetSubPaths = [...directories, ...files];

    await Promise.all ( targetSubPaths.map ( targetSubPath => {

      if ( this.watcher.isIgnored ( targetSubPath, this.options.ignore ) ) return;

      if ( targetPaths.includes ( targetSubPath ) ) return;

      return this.eventsPopulate ( [targetSubPath], events, true );

    }));

    return events;

  }

  async eventsPopulateUnlinkDir ( targetPaths: Path[], targetPath: Path, events: Event[] = [], isInitial: boolean = false ): Promise<Event[]> {

    if ( isInitial ) return events;

    for ( const folderPathOther of this.watcher._poller.stats.keys () ) {

      if ( !Utils.fs.isSubPath ( targetPath, folderPathOther ) ) continue;

      if ( targetPaths.includes ( folderPathOther ) ) continue;

      await this.eventsPopulate ( [folderPathOther], events, true );

    }

    return events;

  }

  /* EVENT HANDLERS */

  onTargetAdd ( targetPath: Path ): void {

    if ( this._isSubRoot ( targetPath ) ) {

      if ( this.options.renameDetection ) {

        this.watcher._locker.getLockTargetAdd ( targetPath, this.options.renameTimeout );

      } else {

        this.watcher.event ( TargetEvent.ADD, targetPath );

      }

    }

  }

  onTargetAddDir ( targetPath: Path ): void {

    if ( targetPath !== this.folderPath && this.options.recursive && ( !HAS_NATIVE_RECURSION && this.options.native !== false ) ) {

      this.watcher.watchDirectory ( targetPath, this.options, this.handler, undefined, this.base || this );

    }

    if ( this._isSubRoot ( targetPath ) ) {

      if ( this.options.renameDetection ) {

        this.watcher._locker.getLockTargetAddDir ( targetPath, this.options.renameTimeout );

      } else {

        this.watcher.event ( TargetEvent.ADD_DIR, targetPath );

      }

    }

  }

  onTargetChange ( targetPath: Path ): void {

    if ( this._isSubRoot ( targetPath ) ) {

      this.watcher.event ( TargetEvent.CHANGE, targetPath );

    }

  }

  onTargetUnlink ( targetPath: Path ): void {

    this.watcher.watchersClose ( path.dirname ( targetPath ), targetPath, false );

    if ( this._isSubRoot ( targetPath ) ) {

      if ( this.options.renameDetection ) {

        this.watcher._locker.getLockTargetUnlink ( targetPath, this.options.renameTimeout );

      } else {

        this.watcher.event ( TargetEvent.UNLINK, targetPath );

      }

    }

  }

  onTargetUnlinkDir ( targetPath: Path ): void {

    this.watcher.watchersClose ( path.dirname ( targetPath ), targetPath, false );

    this.watcher.watchersClose ( targetPath );

    if ( this._isSubRoot ( targetPath ) ) {

      if ( this.options.renameDetection ) {

        this.watcher._locker.getLockTargetUnlinkDir ( targetPath, this.options.renameTimeout );

      } else {

        this.watcher.event ( TargetEvent.UNLINK_DIR, targetPath );

      }

    }

  }

  onTargetEvent ( event: Event ): void {

    const [targetEvent, targetPath] = event;

    if ( targetEvent === TargetEvent.ADD ) {

      this.onTargetAdd ( targetPath );

    } else if ( targetEvent === TargetEvent.ADD_DIR ) {

      this.onTargetAddDir ( targetPath );

    } else if ( targetEvent === TargetEvent.CHANGE ) {

      this.onTargetChange ( targetPath );

    } else if ( targetEvent === TargetEvent.UNLINK ) {

      this.onTargetUnlink ( targetPath );

    } else if ( targetEvent === TargetEvent.UNLINK_DIR ) {

      this.onTargetUnlinkDir ( targetPath );

    }

  }

  onTargetEvents ( events: Event[] ): void {

    for ( const event of events ) {

      this.onTargetEvent ( event );

    }

  }

  onWatcherEvent ( event?: FSTargetEvent, targetPath?: Path, isInitial: boolean = false ): Promise<void> {

    return this.handlerBatched ( event, targetPath, isInitial );

  }

  onWatcherChange ( event: FSTargetEvent = FSTargetEvent.CHANGE, targetName?: string | null ): void {

    if ( this.watcher.isClosed () ) return;

    const targetPath = path.resolve ( this.folderPath, targetName || '' );

    if ( this.filePath && targetPath !== this.folderPath && targetPath !== this.filePath ) return;

    if ( this.watcher.isIgnored ( targetPath, this.options.ignore ) ) return;

    this.onWatcherEvent ( event, targetPath );

  }

  onWatcherError ( error: NodeJS.ErrnoException ): void {

    if ( IS_WINDOWS && error.code === 'EPERM' ) { // This may happen when a folder is deleted

      this.onWatcherChange ( FSTargetEvent.CHANGE, '' );

    } else {

      this.watcher.error ( error );

    }

  }

  /* API */

  async init (): Promise<void> {

    await this.initWatcherEvents ();
    await this.initInitialEvents ();

  }

  async initWatcherEvents (): Promise<void> {

    const onChange = this.onWatcherChange.bind ( this );

    this.fswatcher.on ( FSWatcherEvent.CHANGE, onChange );

    const onError = this.onWatcherError.bind ( this );

    this.fswatcher.on ( FSWatcherEvent.ERROR, onError );

  }

  async initInitialEvents (): Promise<void> {

    const isInitial = !this.watcher.isReady (); // "isInitial" => is ignorable via the "ignoreInitial" option

    if ( this.filePath ) { // Single initial path

      if ( this.watcher._poller.stats.has ( this.filePath ) ) return; // Already polled

      await this.onWatcherEvent ( FSTargetEvent.CHANGE, this.filePath, isInitial );

    } else { // Multiple initial paths

      const depth = this.options.recursive && ( HAS_NATIVE_RECURSION && this.options.native !== false ) ? this.options.depth ?? DEPTH : Math.min ( 1, this.options.depth ?? DEPTH );
      const limit = this.options.limit ?? LIMIT;
      const [directories, files] = await Utils.fs.readdir ( this.folderPath, this.options.ignore, depth, limit, this.watcher._closeSignal, this.options.readdirMap );
      const targetPaths = [this.folderPath, ...directories, ...files];

      await Promise.all ( targetPaths.map ( targetPath => {

        if ( this.watcher._poller.stats.has ( targetPath ) ) return; // Already polled

        if ( this.watcher.isIgnored ( targetPath, this.options.ignore ) ) return;

        return this.onWatcherEvent ( FSTargetEvent.CHANGE, targetPath, isInitial );

      }));

    }

  }

}

/* EXPORT */

export default WatcherHandler;
