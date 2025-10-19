
/* IMPORT */

import type {FSWatcher, BigIntStats} from 'node:fs';
import type {ResultDirectories} from 'tiny-readdir';
import type {FSTargetEvent, TargetEvent} from './enums';
import type WatcherStats from './watcher_stats';

/* MAIN */

type Callback = () => void;

type Disposer = () => void;

type Event = [TargetEvent, Path, Path?];

type FSHandler = ( event?: FSTargetEvent, targetName?: string ) => void;

type Handler = ( event: TargetEvent, targetPath: Path, targetPathNext?: Path ) => void;

type HandlerBatched = ( event?: FSTargetEvent, targetPath?: Path, isInitial?: boolean ) => Promise<void>;

type Ignore = (( targetPath: Path ) => boolean) | RegExp;

type INO = bigint | number;

type Path = string;

type ReaddirMap = ResultDirectories;

type Stats = BigIntStats;

type LocksAdd = Map<INO, () => void>;

type LocksUnlink = Map<INO, () => Path>;

type LocksPair = {
  add: LocksAdd,
  unlink: LocksUnlink
};

type LockConfig = {
  ino?: INO,
  targetPath: Path,
  locks: LocksPair,
  events: {
    add: TargetEvent.ADD | TargetEvent.ADD_DIR,
    change?: TargetEvent.CHANGE,
    rename: TargetEvent.RENAME | TargetEvent.RENAME_DIR,
    unlink: TargetEvent.UNLINK | TargetEvent.UNLINK_DIR
  }
};

type PollerConfig = {
  options: WatcherOptions,
  targetPath: Path
};

type SubwatcherConfig = {
  options: WatcherOptions,
  targetPath: Path
};

type WatcherConfig = {
  handler: Handler,
  watcher: FSWatcher,
  options: WatcherOptions,
  folderPath: Path,
  filePath?: Path
};


/**
 * Options for the watcher.
 * @see https://github.com/fabiospampinato/watcher?tab=readme-ov-file#options
 */
type WatcherOptions = {

  /**
   * Amount of milliseconds to debounce event emission for.
   *
   * The higher this is the more duplicate events will be ignored automatically.
   *
   * @default 300
   */
  debounce?: number;

  /**
   * Maximum depth to watch files at.
   *
   * This is useful for avoiding watching directories that are absurdly deep, that would probably waste resources.
   *
   * When `native` is true and the platform supports native recursive watching, this option is ignored.
   *
   * @default 20
   */
  depth?: number; // FIXME: Not respected when events are detected and native recursion is available, but setting a maximum depth is mostly relevant for the non-native implemention

  /**
   * Maximum number of paths to watch
   *
   * This is useful as a safe guard in cases where for example the user decided to watch /, perhaps by mistake.
   *
   * @default 10,000,000
   */
  limit?: number; // FIXME: Not respected for newly added directories, but hard to keep track of everything and not that important

  /**
   * Optional function (or regex) that if returns true for a path it will cause that path and all its descendants to not be watched at all.
   *
   * Setting an ignore function can be very important for performance, you should probably ignore folders like .git and temporary files like those used when writing atomically to disk.
   *
   * If you need globbing you'll just have to match the path passed to ignore against a glob with a globbing library of your choosing.
   *
   * If not provided, all paths are watched.
   */
  ignore?: Ignore;

  /**
   * Whether events for the initial scan should be ignored or not.
   * @default false // Initial events are emitted by default
   */
  ignoreInitial?: boolean;

  /**
   * Whether to use the native recursive watcher if available and needed.
   *
   * Only available under macOS, Windows and Linux only when using Node v20.13+/v22.1+. Option `depth` is ignored when this is true.
   *
   * Setting it to `false` can have a positive performance impact if you want to watch recursively a potentially very deep directory with a low `depth` value.
   *
   * @default true
   */
  native?: boolean;

  /**
   * Whether to keep the Node process running as long as the watcher is not closed.
   * @default false
   */
  persistent?: boolean;

  /**
   * Polling is used as a last resort measure when watching non-existent paths inside non-existent directories, this controls how often polling is performed, in milliseconds.
   * @default 3000
   */
  pollingInterval?: number;

  /**
   * Sometimes polling will fail, for example if there are too many file descriptors currently open, usually eventually polling will succeed after a few tries though, this controls the amount of milliseconds the library should keep retrying for.
   *
   * You can set it to a lower value to make the app detect events much more quickly, but don't set it too low if you are watching many paths that require polling as polling is expensive.
   *
   * @default 20000
   */
  pollingTimeout?: number;

  readdirMap?: ReaddirMap;

  /**
   * Whether to watch recursively or not.
   *
   * Supported under all OSes (implemented natively by Node itself under macOS and Windows, and under Linux too when using Node v20.13+/v22.1+)
   * @default false
   */
  recursive?: boolean;

  /**
   * Whether the library should attempt to detect renames and emit `rename`/`renameDir` events.
   *
   * Rename detection may cause a delayed event emission, because the library may have to wait some more time for it.
   *
   * - if disabled, the raw underlying `add`/`addDir` and `unlink`/`unlinkDir` events will be emitted instead after a rename.
   * - if enabled, the library will check if each pair of `add`/`unlink` or `addDir`/`unlinkDir` events are actually `rename` or `renameDir` events respectively, so it will wait for both of those events to be emitted.
   *
   * Rename detection is fairly reliable, but it is fundamentally dependent on how long the file system takes to emit the underlying raw events, if it takes longer than the set rename timeout the app won't detect the rename and will instead emit the underlying raw events.
   *
   * @default false
   */
  renameDetection?: boolean;

  /**
   * Amount of milliseconds to wait for a potential `rename`/`renameDir` event to be detected.
   *
   * The higher this value is the more reliably renames will be detected, but don't set this too high, or the emission of some events could be delayed by that amount. The higher this value is the longer the library will take to emit `add`/`addDir`/`unlink`/`unlinkDir` events.
   *
   * @default 1250
   */
  renameTimeout?: number; // TODO: Having a timeout for these sorts of things isn't exactly reliable, but what's the better option?
};

/* EXPORT */

export type {Callback, Disposer, Event, FSHandler, FSWatcher, Handler, HandlerBatched, Ignore, INO, Path, ReaddirMap, Stats, LocksAdd, LocksUnlink, LocksPair, LockConfig, PollerConfig, SubwatcherConfig, WatcherConfig, WatcherOptions, WatcherStats};
