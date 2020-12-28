
/* IMPORT */

import {BigIntStats, FSWatcher} from 'fs';
import {FSTargetEvent, TargetEvent} from './enums';
import WatcherStats from './watcher_stats';

/* TYPES */

type Callback = () => any;

type Disposer = () => void;

type Event = [TargetEvent, Path, Path?];

type FSHandler = ( event?: FSTargetEvent, targetName?: string ) => void;

type Handler = ( event: TargetEvent, targetPath: Path, targetPathNext?: Path ) => any;

type Ignore = ( targetPath: Path ) => boolean;

type INO = bigint | number;

type Path = string;

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
  ignore?: Ignore,
  ignoreInitial?: boolean,
  native?: boolean,
  persistent?: boolean,
  pollingInterval?: number,
  pollingTimeout?: number,
  recursive?: boolean,
  renameDetection?: boolean,
  renameTimeout?: number //TODO: Having a timeout for these sorts of things isn't exactly reliable, but what's the better option?
};

/* EXPORT */

export {Callback, Disposer, Event, FSHandler, FSWatcher, Handler, Ignore, INO, Path, Stats, LocksAdd, LocksUnlink, LocksPair, LockConfig, PollerConfig, SubwatcherConfig, WatcherConfig, WatcherOptions, WatcherStats};
