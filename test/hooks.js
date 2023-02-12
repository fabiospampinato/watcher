
/* IMPORT */

import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import Watcher from '../dist/watcher.js';
import Tree from './tree.js';

/* HELPERS */

let TREES = [];

/* MAIN */

//TODO: Use actual hooks, once those get fixed in "fava"

const before = async () => {

  if ( fs.existsSync ( Tree.ROOT ) ) {
    fs.rmdirSync ( Tree.ROOT, { recursive: true } );
  }

  TREES = await Promise.all ( Array ( 190 ).fill ().map ( async ( _, i ) => {
    const tree = new Tree ( i );
    await tree.build ();
    return tree;
  }));

  await delay ( 5000 ); // Giving the filesystem enough time to chill

};

const beforeEach = t => {

  const isEqual = ( a, b ) => JSON.stringify ( a ) === JSON.stringify ( b );
  const prettyprint = value => JSON.stringify ( value, undefined, 2 );

  t.context.normalizePaths = paths => {
    return paths.map ( path => {
      return Array.isArray ( path ) ? t.context.normalizePaths ( path ) : t.context.tree.path ( path );
    });
  };

  t.context.hasWatchObjects = ( pollersNr, subwatchersNr, watchersNr ) => {
    t.is ( t.context.watcher._pollers.size, pollersNr, 'pollers number' );
    t.is ( t.context.watcher._subwatchers.size, subwatchersNr, 'subwatchers number' );
    t.is ( Object.keys ( t.context.watcher._watchers ).map ( key => t.context.watcher._watchers[key] ).flat ().length, watchersNr, 'watchers number' );
  };

  t.context.deepEqualUnordered = ( a, b ) => {
    t.is ( a.length, b.length );
    t.true ( a.every ( item => {
      const index = b.findIndex ( itemOther => isEqual ( item, itemOther ) );
      if ( index === -1 ) return false;
      b.splice ( index, 1 );
      return true;
    }), prettyprint ( [a, b] ) );
  };

  t.context.deepEqualUnorderedTuples = ( [a1, b1], [a2, b2] ) => {
    t.is ( a1.length, b1.length );
    t.is ( a1.length, a2.length );
    t.is ( b1.length, b2.length );
    t.true ( a1.every ( ( item, itemIndex ) => {
      for ( let i = 0, l = a2.length; i < l; i++ ) {
        if ( !isEqual ( item, a2[i] ) ) continue;
        if ( !isEqual ( b1[itemIndex], b2[i] ) ) continue;
        a1.splice ( itemIndex, 1 );
        b1.splice ( itemIndex, 1 );
        a2.splice ( i, 1 );
        b2.splice ( i, 1 );
        return true;
      }
      return false;
    }), prettyprint ( [[a1, b1], [a2, b2]] ) );
  };

  t.context.deepEqualChanges = changes => {
    t.deepEqual ( t.context.changes, t.context.normalizePaths ( changes ) );
  };

  t.context.deepEqualUnorderedChanges = changes => {
    t.context.deepEqualUnordered ( t.context.changes, t.context.normalizePaths ( changes ) );
  };

  t.context.deepEqualResults = ( events, changes ) => {
    t.deepEqual ( t.context.events, events );
    t.deepEqual ( t.context.changes, t.context.normalizePaths ( changes ) );
    t.context.watchReset ();
  };

  t.context.deepEqualUnorderedResults = ( events, changes ) => {
    t.context.deepEqualUnorderedTuples ( [t.context.events, t.context.changes], [events, t.context.normalizePaths ( changes )] );
    t.context.watchReset ();
  };

  t.context.watch = ( target, options = {}, handler = () => {}, filterer = () => true ) => {
    const targets = t.context.normalizePaths ( Array.isArray ( target ) ? target : [target] );
    t.context.events = [];
    t.context.changes = [];
    t.context.watcher = new Watcher ( targets, options, ( event, targetPath, targetPathNext ) => {
      if ( !filterer ( event, targetPath ) ) return;
      const change = targetPathNext ? [targetPath, targetPathNext] : targetPath;
      t.context.events.push ( event );
      t.context.changes.push ( change );
      handler ( event, change );
    });
  };

  t.context.watchForDirs = ( target, options, handler ) => {
    const isDirEvent = event => event.endsWith ( 'Dir' );
    t.context.watch ( target, options, handler, isDirEvent );
  };

  t.context.watchForFiles = ( target, options, handler ) => {
    const isFileEvent = event => !event.endsWith ( 'Dir' );
    t.context.watch ( target, options, handler, isFileEvent );
  };

  t.context.watchReset = () => {
    t.context.events.length = 0;
    t.context.changes.length = 0;
  };

  t.context.wait = {};

  t.context.wait.close = () => {
    return t.context.watcher._closeWait;
  };

  t.context.wait.ready = () => {
    return t.context.watcher._readyWait;
  };

  t.context.wait.time = () => delay ( 1000 );

  t.context.wait.longtime = () => delay ( 2000 );

  t.context.wait.longlongtime = () => delay ( 3000 );

  t.context.tree = TREES.pop ();

};

const afterEach = t => {

  t.context.watcher.close ();

};

const withContext = fn => {

  return async t => {

    await beforeEach ( t );

    await fn ( t );

    await afterEach ( t );

  };

};

/* EXPORT */

export {before, beforeEach, afterEach, withContext};
