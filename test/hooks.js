
/* IMPORT */

const _ = require ( 'lodash' ),
      assert = require ( 'assert' ),
      delay = require ( 'promise-resolve-timeout' ),
      fs = require ( 'fs-extra' ),
      Watcher = require ( '../dist/watcher' ).default,
      Tree = require ( './tree' );

/* HOOKS */

const Hooks = {

  before: async t => {

    fs.removeSync ( Tree.ROOT );

    t.context.trees = await Promise.all ( Array ( 175 ).fill ().map ( async ( _, i ) => {
      const tree = new Tree ( i );
      await tree.build ();
      return tree;
    }));

    await delay ( 5000 ); // Giving the filesystem enough time to chill

  },

  beforeEach: t => {

    const prettyprint = x => JSON.stringify ( x, undefined, 2 );

    t.context.normalizePaths = paths => paths.map ( path => Array.isArray ( path ) ? t.context.normalizePaths ( path ) : t.context.tree.path ( path ) );

    t.context.hasWatchObjects = ( pollersNr, subwatchersNr, watchersNr ) => {
      assert.strictEqual ( t.context.watcher._pollers.size, pollersNr, 'pollers number' );
      assert.strictEqual ( t.context.watcher._subwatchers.size, subwatchersNr, 'subwatchers number' );
      assert.strictEqual ( Object.keys ( t.context.watcher._watchers ).map ( key => t.context.watcher._watchers[key] ).flat ().length, watchersNr, 'watchers number' );
    };

    t.context.deepEqualUnordered = ( a, b ) => {
      assert.strictEqual ( a.length, b.length );
      assert.ok ( a.every ( item => {
        const index = b.findIndex ( itemOther => _.isEqual ( item, itemOther ) );
        if ( index === -1 ) return false;
        b.splice ( index, 1 );
        return true;
      }), prettyprint ( [a, b] ) );
    };

    t.context.deepEqualUnorderedTuples = ( [a1, b1], [a2, b2] ) => {
      assert.strictEqual ( a1.length, b1.length );
      assert.strictEqual ( a1.length, a2.length );
      assert.strictEqual ( b1.length, b2.length );
      assert.ok ( a1.every ( ( item, itemIndex ) => {
        for ( let i = 0, l = a2.length; i < l; i++ ) {
          if ( !_.isEqual ( item, a2[i] ) ) continue;
          if ( !_.isEqual ( b1[itemIndex], b2[i] ) ) continue;
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
      assert.deepStrictEqual ( t.context.changes, t.context.normalizePaths ( changes ) );
    };

    t.context.deepEqualUnorderedChanges = changes => {
      t.context.deepEqualUnordered ( t.context.changes, t.context.normalizePaths ( changes ) );
    };

    t.context.deepEqualResults = ( events, changes ) => {
      assert.deepStrictEqual ( t.context.events, events );
      assert.deepStrictEqual ( t.context.changes, t.context.normalizePaths ( changes ) );
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

    t.context.tree = t.context.trees.pop ();

  },

  afterEach: t => {

    t.context.watcher.close ();

  },

  after: t => {

    fs.removeSync ( Tree.ROOT );

  }

};

/* EXPORT */

module.exports = Hooks;
