
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

type WatcherOptions = {
  debounce?: number,
  depth?: number, //FIXME: Not respected when events are detected and native recursion is available, but setting a maximum depth is mostly relevant for the non-native implemention
  limit?: number, //FIXME: Not respected for newly added directories, but hard to keep track of everything and not has important
  ignore?: Ignore,
  ignoreInitial?: boolean,
  native?: boolean,
  persistent?: boolean,
  pollingInterval?: number,
  pollingTimeout?: number,
  readdirMap?: ReaddirMap,
  recursive?: boolean,
  renameDetection?: boolean,
  renameTimeout?: number //TODO: Having a timeout for these sorts of things isn't exactly reliable, but what's the better option?
};

/* EXPORT */

export type {Callback, Disposer, Event, FSHandler, FSWatcher, Handler, HandlerBatched, Ignore, INO, Path, ReaddirMap, Stats, LocksAdd, LocksUnlink, LocksPair, LockConfig, PollerConfig, SubwatcherConfig, WatcherConfig, WatcherOptions, WatcherStats};
