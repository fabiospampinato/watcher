
/* MAIN */

const enum FileType {
  DIR = 1,
  FILE = 2
}

const enum FSTargetEvent {
  CHANGE = 'change',
  RENAME = 'rename'
}

const enum FSWatcherEvent {
  CHANGE = 'change',
  ERROR = 'error'
}

const enum TargetEvent {
  ADD = 'add',
  ADD_DIR = 'addDir',
  CHANGE = 'change',
  RENAME = 'rename',
  RENAME_DIR = 'renameDir',
  UNLINK = 'unlink',
  UNLINK_DIR = 'unlinkDir'
}

const enum WatcherEvent {
  ALL = 'all',
  CLOSE = 'close',
  ERROR = 'error',
  READY = 'ready'
}

/* EXPORT */

export {FileType, FSTargetEvent, FSWatcherEvent, TargetEvent, WatcherEvent};
