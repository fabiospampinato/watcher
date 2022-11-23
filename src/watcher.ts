
/* IMPORT */

import {EventEmitter} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import {DEPTH, LIMIT, HAS_NATIVE_RECURSION, POLLING_INTERVAL} from './constants';
import {TargetEvent, WatcherEvent} from './enums';
import Utils from './utils';
import WatcherHandler from './watcher_handler';
import WatcherLocker from './watcher_locker';
import WatcherPoller from './watcher_poller';
import type {Callback, Disposer, Handler, Ignore, Path, PollerConfig, SubwatcherConfig, WatcherOptions, WatcherConfig} from './types';

/* MAIN */

class Watcher extends EventEmitter {

  /* VARIABLES */

  _closed: boolean;
  _ready: boolean;
  _closeAborter: AbortController;
  _closeSignal: { aborted: boolean };
  _closeWait: Promise<void>;
  _readyWait: Promise<void>;
  _locker: WatcherLocker;
  _roots: Set<Path>;
  _poller: WatcherPoller;
  _pollers: Set<PollerConfig>;
  _subwatchers: Set<SubwatcherConfig>;
  _watchers: Record<Path, WatcherConfig[]>;
  _watchersLock: Promise<void>;
  _watchersRestorable: Record<Path, WatcherConfig>;
  _watchersRestoreTimeout?: NodeJS.Timeout;

  /* CONSTRUCTOR */

  constructor ( target?: Path[] | Path | Handler, options?: WatcherOptions | Handler, handler?: Handler ) {

    super ();

    this._closed = false;
    this._ready = false;
    this._closeAborter = new AbortController ();
    this._closeSignal = this._closeAborter.signal;
    this.on ( WatcherEvent.CLOSE, () => this._closeAborter.abort () );
    this._closeWait = new Promise ( resolve => this.on ( WatcherEvent.CLOSE, resolve ) );
    this._readyWait = new Promise ( resolve => this.on ( WatcherEvent.READY, resolve ) );
    this._locker = new WatcherLocker ( this );
    this._roots = new Set ();
    this._poller = new WatcherPoller ();
    this._pollers = new Set ();
    this._subwatchers = new Set ();
    this._watchers = {};
    this._watchersLock = Promise.resolve ();
    this._watchersRestorable = {};

    this.watch ( target, options, handler );

  }

  /* API */

  isClosed (): boolean {

    return this._closed;

  }

  isIgnored ( targetPath: Path, ignore?: Ignore ): boolean {

    return !!ignore && ( Utils.lang.isFunction ( ignore ) ? !!ignore ( targetPath ) : ignore.test ( targetPath ) );

  }

  isReady (): boolean {

    return this._ready;

  }

  close (): boolean {

    this._locker.reset ();
    this._poller.reset ();
    this._roots.clear ();

    this.watchersClose ();

    if ( this.isClosed () ) return false;

    this._closed = true;

    return this.emit ( WatcherEvent.CLOSE );

  }

  error ( exception: unknown ): boolean {

    if ( this.isClosed () ) return false;

    const error = Utils.lang.castError ( exception );

    return this.emit ( WatcherEvent.ERROR, error );

  }

  event ( event: TargetEvent, targetPath: Path, targetPathNext?: Path ): boolean {

    if ( this.isClosed () ) return false;

    this.emit ( WatcherEvent.ALL, event, targetPath, targetPathNext );

    return this.emit ( event, targetPath, targetPathNext );

  }

  ready (): boolean {

    if ( this.isClosed () || this.isReady () ) return false;

    this._ready = true;

    return this.emit ( WatcherEvent.READY );

  }

  pollerExists ( targetPath: Path, options: WatcherOptions ): boolean { //FIXME: This doesn't actually allow for multiple pollers to the same paths, but potentially in the future the same path could be polled with different callbacks to be called, which this doesn't currently allow for

    for ( const poller of this._pollers ) {

      if ( poller.targetPath !== targetPath ) continue;

      if ( !Utils.lang.isShallowEqual ( poller.options, options ) ) continue;

      return true;

    }

    return false;

  }

  subwatcherExists ( targetPath: Path, options: WatcherOptions ): boolean { //FIXME: This doesn't actually allow for multiple subwatchers to the same paths, but potentially in the future the same path could be subwatched with different callbacks to be called, which this doesn't currently allow for

    for ( const subwatcher of this._subwatchers ) {

      if ( subwatcher.targetPath !== targetPath ) continue;

      if ( !Utils.lang.isShallowEqual ( subwatcher.options, options ) ) continue;

      return true;

    }

    return false;

  }

  watchersClose ( folderPath?: Path, filePath?: Path, recursive: boolean = true ): void {

    if ( !folderPath ) {

      for ( const folderPath in this._watchers ) {

        this.watchersClose ( folderPath, filePath, false );

      }

    } else {

      const configs = this._watchers[folderPath];

      if ( configs ) {

        for ( const config of [...configs] ) { // It's important to clone the array, as items will be deleted from it also

          if ( filePath && config.filePath !== filePath ) continue;

          this.watcherClose ( config );

        }

      }

      if ( recursive ) {

        for ( const folderPathOther in this._watchers ) {

          if ( !Utils.fs.isSubPath ( folderPath, folderPathOther ) ) continue;

          this.watchersClose ( folderPathOther, filePath, false );

        }

      }

    }

  }

  watchersLock ( callback: Callback ): Promise<void> {

    return this._watchersLock.then ( () => {

      return this._watchersLock = new Promise ( async resolve => {

        await callback ();

        resolve ();

      });

    });

  }

  watchersRestore (): void {

    delete this._watchersRestoreTimeout;

    const watchers = Object.entries ( this._watchersRestorable );

    this._watchersRestorable = {};

    for ( const [targetPath, config] of watchers ) {

      this.watchPath ( targetPath, config.options, config.handler );

    }

  }

  async watcherAdd ( config: WatcherConfig, baseWatcherHandler?: WatcherHandler ): Promise<WatcherHandler> {

    const {folderPath} = config;

    const configs = this._watchers[folderPath] = ( this._watchers[folderPath] || [] );

    configs.push ( config );

    const watcherHandler = new WatcherHandler ( this, config, baseWatcherHandler );

    await watcherHandler.init ();

    return watcherHandler;

  }

  watcherClose ( config: WatcherConfig ): void {

    config.watcher.close ();

    const configs = this._watchers[config.folderPath];

    if ( configs ) {

      const index = configs.indexOf ( config );

      configs.splice ( index, 1 );

      if ( !configs.length ) {

        delete this._watchers[config.folderPath];

      }

    }

    const rootPath = config.filePath || config.folderPath;
    const isRoot = this._roots.has ( rootPath );

    if ( isRoot ) {

      this._watchersRestorable[rootPath] = config;

      if ( !this._watchersRestoreTimeout ) {

        this._watchersRestoreTimeout = Utils.lang.defer ( () => this.watchersRestore () );

      }

    }

  }

  watcherExists ( folderPath: Path, options: WatcherOptions, handler: Handler, filePath?: Path ): boolean {

    const configsSibling = this._watchers[folderPath];

    if ( !!configsSibling?.find ( config => config.handler === handler && ( !config.filePath || config.filePath === filePath ) && config.options.ignore === options.ignore && !!config.options.native === !!options.native && ( !options.recursive || config.options.recursive ) ) ) return true;

    let folderAncestorPath = path.dirname ( folderPath );

    for ( let depth = 1; depth < Infinity; depth++ ) {

      const configsAncestor = this._watchers[folderAncestorPath];

      if ( !!configsAncestor?.find ( config => ( depth === 1 || ( config.options.recursive && depth <= ( config.options.depth ?? DEPTH ) ) ) && config.handler === handler && ( !config.filePath || config.filePath === filePath ) && config.options.ignore === options.ignore && !!config.options.native === !!options.native && ( !options.recursive || ( config.options.recursive && ( HAS_NATIVE_RECURSION && config.options.native !== false ) ) ) ) ) return true;

      if ( !HAS_NATIVE_RECURSION ) break; // No other ancestor will possibly be found

      const folderAncestorPathNext = path.dirname ( folderPath );

      if ( folderAncestorPath === folderAncestorPathNext ) break;

      folderAncestorPath = folderAncestorPathNext;

    }

    return false;

  }

  async watchDirectories ( foldersPaths: Path[], options: WatcherOptions, handler: Handler, filePath?: Path, baseWatcherHandler?: WatcherHandler ): Promise<WatcherHandler | undefined> {

    if ( this.isClosed () ) return;

    foldersPaths = Utils.lang.uniq ( foldersPaths ).sort ();

    let watcherHandlerLast: WatcherHandler | undefined;

    for ( const folderPath of foldersPaths ) {

      if ( this.isIgnored ( folderPath, options.ignore ) ) continue;

      if ( this.watcherExists ( folderPath, options, handler, filePath ) ) continue;

      try {

        const watcherOptions = ( !options.recursive || ( HAS_NATIVE_RECURSION && options.native !== false ) ) ? options : { ...options, recursive: false }; // Ensuring recursion is explicitly disabled if not available
        const watcher = fs.watch ( folderPath, watcherOptions );
        const watcherConfig: WatcherConfig = { watcher, handler, options, folderPath, filePath };
        const watcherHandler = watcherHandlerLast = await this.watcherAdd ( watcherConfig, baseWatcherHandler );

        const isRoot = this._roots.has ( filePath || folderPath );

        if ( isRoot ) {

          const parentOptions: WatcherOptions = { ...options, ignoreInitial: true, recursive: false }; // Ensuring only the parent folder is being watched
          const parentFolderPath = path.dirname ( folderPath );
          const parentFilePath = folderPath;

          await this.watchDirectories ( [parentFolderPath], parentOptions, handler, parentFilePath, watcherHandler );

          //TODO: Watch parents recursively with the following code, which requires other things to be changed too though

          // while ( true ) {

          //   await this.watchDirectories ( [parentFolderPath], parentOptions, handler, parentFilePath, watcherHandler );

          //   const parentFolderPathNext = path.dirname ( parentFolderPath );

          //   if ( parentFolderPath === parentFolderPathNext ) break;

          //   parentFilePath = parentFolderPath;
          //   parentFolderPath = parentFolderPathNext;

          // }

        }

      } catch ( error: unknown ) {

        this.error ( error );

      }

    }

    return watcherHandlerLast;

  }

  async watchDirectory ( folderPath: Path, options: WatcherOptions, handler: Handler, filePath?: Path, baseWatcherHandler?: WatcherHandler ): Promise<void> {

    if ( this.isClosed () ) return;

    if ( this.isIgnored ( folderPath, options.ignore ) ) return;

    if ( !options.recursive || ( HAS_NATIVE_RECURSION && options.native !== false ) ) {

      return this.watchersLock ( () => {

        return this.watchDirectories ( [folderPath], options, handler, filePath, baseWatcherHandler );

      });

    } else {

      options = { ...options, recursive: true }; // Ensuring recursion is explicitly enabled

      const depth = options.depth ?? DEPTH;
      const limit = options.limit ?? LIMIT;
      const [folderSubPaths] = await Utils.fs.readdir ( folderPath, options.ignore, depth, limit, this._closeSignal, options.readdirMap );

      return this.watchersLock ( async () => {

        const watcherHandler = await this.watchDirectories ( [folderPath], options, handler, filePath, baseWatcherHandler );

        if ( folderSubPaths.length ) {

          const folderPathDepth = Utils.fs.getDepth ( folderPath );

          for ( const folderSubPath of folderSubPaths ) {

            const folderSubPathDepth = Utils.fs.getDepth ( folderSubPath );
            const subDepth = Math.max ( 0, depth - ( folderSubPathDepth - folderPathDepth ) );
            const subOptions = { ...options, depth: subDepth }; // Updating the maximum depth to account for depth of the sub path

            await this.watchDirectories ( [folderSubPath], subOptions, handler, filePath, baseWatcherHandler || watcherHandler );

          }

        }

      });

    }

  }

  async watchFileOnce ( filePath: Path, options: WatcherOptions, callback: Callback ): Promise<void> {

    if ( this.isClosed () ) return;

    options = { ...options, ignoreInitial: false }; // Ensuring initial events are detected too

    if ( this.subwatcherExists ( filePath, options ) ) return;

    const config: SubwatcherConfig = { targetPath: filePath, options };

    const handler = ( event: TargetEvent, targetPath: Path ) => {
      if ( targetPath !== filePath ) return;
      stop ();
      callback ();
    };

    const watcher = new Watcher ( handler );

    const start = (): void => {
      this._subwatchers.add ( config );
      this.on ( WatcherEvent.CLOSE, stop ); // Ensuring the subwatcher is stopped on close
      watcher.watchFile ( filePath, options, handler );
    };

    const stop = (): void => {
      this._subwatchers.delete ( config );
      this.removeListener ( WatcherEvent.CLOSE, stop ); // Ensuring there are no leftover listeners
      watcher.close ();
    };

    return start ();

  }

  async watchFile ( filePath: Path, options: WatcherOptions, handler: Handler ): Promise<void> {

    if ( this.isClosed () ) return;

    if ( this.isIgnored ( filePath, options.ignore ) ) return;

    options = { ...options, recursive: false }; // Ensuring recursion is explicitly disabled

    const folderPath = path.dirname ( filePath );

    return this.watchDirectory ( folderPath, options, handler, filePath );

  }

  async watchPollingOnce ( targetPath: Path, options: WatcherOptions, callback: Callback ): Promise<void> {

    if ( this.isClosed () ) return;

    let isDone = false;

    const poller = new WatcherPoller ();

    const disposer = await this.watchPolling ( targetPath, options, async () => {

      if ( isDone ) return;

      const events = await poller.update ( targetPath, options.pollingTimeout );

      if ( !events.length ) return; // Nothing actually changed, skipping

      if ( isDone ) return; // Another async callback has done the work already, skipping

      isDone = true;

      disposer ();

      callback ();

    });

  }

  async watchPolling ( targetPath: Path, options: WatcherOptions, callback: Callback ): Promise<Disposer> {

    if ( this.isClosed () ) return Utils.lang.noop;

    if ( this.pollerExists ( targetPath, options ) ) return Utils.lang.noop;

    const watcherOptions = { ...options, interval: options.pollingInterval ?? POLLING_INTERVAL }; // Ensuring a default interval is set

    const config: PollerConfig = { targetPath, options };

    const start = (): void => {
      this._pollers.add ( config );
      this.on ( WatcherEvent.CLOSE, stop ); // Ensuring polling is stopped on close
      fs.watchFile ( targetPath, watcherOptions, callback );
    };

    const stop = (): void => {
      this._pollers.delete ( config );
      this.removeListener ( WatcherEvent.CLOSE, stop ); // Ensuring there are no leftover listeners
      fs.unwatchFile ( targetPath, callback );
    };

    Utils.lang.attempt ( start );

    return () => Utils.lang.attempt ( stop );

  }

  async watchUnknownChild ( targetPath: Path, options: WatcherOptions, handler: Handler ): Promise<void> {

    if ( this.isClosed () ) return;

    const watch = () => this.watchPath ( targetPath, options, handler );

    return this.watchFileOnce ( targetPath, options, watch );

  }

  async watchUnknownTarget ( targetPath: Path, options: WatcherOptions, handler: Handler ): Promise<void> {

    if ( this.isClosed () ) return;

    const watch = () => this.watchPath ( targetPath, options, handler );

    return this.watchPollingOnce ( targetPath, options, watch );

  }

  async watchPaths ( targetPaths: Path[], options: WatcherOptions, handler: Handler ): Promise<void> {

    if ( this.isClosed () ) return;

    targetPaths = Utils.lang.uniq ( targetPaths ).sort ();

    const isParallelizable = targetPaths.every ( ( targetPath, index ) => targetPaths.every ( ( t, i ) => i === index || !Utils.fs.isSubPath ( targetPath, t ) ) ); // All paths are about separate subtrees, so we can start watching in parallel safely //TODO: Find parallelizable chunks rather than using an all or nothing approach

    if ( isParallelizable ) { // Watching in parallel

      await Promise.all ( targetPaths.map ( targetPath => {

        return this.watchPath ( targetPath, options, handler );

      }));

    } else { // Watching serially

      for ( const targetPath of targetPaths ) {

        await this.watchPath ( targetPath, options, handler );

      }

    }

  }

  async watchPath ( targetPath: Path, options: WatcherOptions, handler: Handler ): Promise<void> {

    if ( this.isClosed () ) return;

    targetPath = path.resolve ( targetPath );

    if ( this.isIgnored ( targetPath, options.ignore ) ) return;

    const stats = await Utils.fs.poll ( targetPath, options.pollingTimeout );

    if ( !stats ) {

      const parentPath = path.dirname ( targetPath );
      const parentStats = await Utils.fs.poll ( parentPath, options.pollingTimeout );

      if ( parentStats?.isDirectory () ) {

        return this.watchUnknownChild ( targetPath, options, handler );

      } else {

        return this.watchUnknownTarget ( targetPath, options, handler );

      }

    } else if ( stats.isFile () ) {

      return this.watchFile ( targetPath, options, handler );

    } else if ( stats.isDirectory () ) {

      return this.watchDirectory ( targetPath, options, handler );

    } else {

      this.error ( `"${targetPath}" is not supported` );

    }

  }

  async watch ( target?: Path[] | Path | Handler, options?: WatcherOptions | Handler, handler: Handler = Utils.lang.noop ): Promise<void> {

    if ( Utils.lang.isFunction ( target ) ) return this.watch ( [], {}, target );

    if ( Utils.lang.isUndefined ( target ) ) return this.watch ( [], options, handler );

    if ( Utils.lang.isFunction ( options ) ) return this.watch ( target, {}, options );

    if ( Utils.lang.isUndefined ( options ) ) return this.watch ( target, {}, handler );

    if ( this.isClosed () ) return;

    if ( this.isReady () ) options.readdirMap = undefined; // Only usable before initialization

    const targetPaths = Utils.lang.castArray ( target );

    targetPaths.forEach ( targetPath => this._roots.add ( targetPath ) );

    await this.watchPaths ( targetPaths, options, handler );

    if ( this.isClosed () ) return;

    if ( handler !== Utils.lang.noop ) {

      this.on ( WatcherEvent.ALL, handler );

    }

    options.readdirMap = undefined; // Only usable before initialization

    this.ready ();

  }

}

/* EXPORT */

export default Watcher;
