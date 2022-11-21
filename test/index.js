
/* IMPORT */

import {describe} from 'fava';
import {execSync} from 'node:child_process';
import {HAS_NATIVE_RECURSION} from '../dist/constants.js';
import {before, withContext} from './hooks.js';

/* MAIN */

describe ( 'Watcher', () => {

  describe.before ( before );

  describe ( 'watching files', it => {

    it ( 'should watch a single non-existent file inside a directory', withContext ( async t => {
      const file = 'home/a/file_missing' + Math.random ();
      t.context.watch ( file, { debounce: 0 } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 1, 0 );
      t.context.deepEqualResults ( [], [] );
      t.context.tree.newFile ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.deepEqualResults ( ['add'], [file] );
      t.context.tree.remove ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlink'], [file] );
      t.context.tree.newFile ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.deepEqualResults ( ['add'], [file] );
      t.context.tree.modify ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should watch a single non-existent file inside a non-existent directory', withContext ( async t => {
      const dir = 'home/a/dir_missing' + Math.random ();
      const file = dir + '/file_missing' + Math.random ();
      t.context.watch ( file, { debounce: 0, pollingInterval: 100 } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 1, 0, 0 );
      t.context.deepEqualResults ( [], [] );
      t.context.tree.newFile ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.deepEqualResults ( ['add'], [file] );
      t.context.tree.remove ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 1, 0, 0 );
      t.context.deepEqualResults ( ['unlink'], [file] );
      t.context.tree.newFile ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.deepEqualResults ( ['add'], [file] );
      t.context.tree.modify ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should watch a single file', withContext ( async t => {
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watch ( file1, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.tree.modify ( file1 );
      t.context.tree.modify ( file2 );
      t.context.tree.modify ( file1, 100 );
      t.context.tree.modify ( file2, 100 );
      t.context.tree.modify ( file1, 200 );
      t.context.tree.modify ( file2, 200 );
      await t.context.wait.time ();
      t.context.deepEqualChanges ( [file1, file1, file1] );
    }));

    it ( 'should watch multiple files', withContext ( async t => {
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watch ( [file1, file2], { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.modify ( 'home/a/file1' );
      t.context.tree.modify ( 'home/a/file2', 100 );
      await t.context.wait.time ();
      t.context.deepEqualChanges ( [file1, file2] );
    }));

    it ( 'should watch all files inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.modify ( 'home/a/file1' );
      t.context.tree.modify ( 'home/a/file2', 100 );
      await t.context.wait.time ();
      t.context.deepEqualChanges ( [file1, file2] );
    }));

    it ( 'should watch new files inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const newfile1 = 'home/a/newfile' + Math.random ();
      const newfile2 = 'home/a/newfile' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.newFile ( newfile1 );
      t.context.tree.newFile ( newfile2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newfile1, newfile2] );
    }));

    it ( 'should watch new files inside an initially empty directory', withContext ( async t => {
      const dir = 'home/empty';
      const newfile1 = 'home/empty/newfile' + Math.random ();
      const newfile2 = 'home/empty/newfile' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.newFile ( newfile1 );
      t.context.tree.newFile ( newfile2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newfile1, newfile2] );
    }));

    it ( 'should watch new files inside a new directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir = 'home/a/newdir' + Math.random ();
      const newfile1 = newdir + '/newfile' + Math.random ();
      const newfile2 = newdir + '/newfile' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile1 );
      t.context.tree.newFile ( newfile2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newdir, newfile1, newfile2] );
    }));

    it ( 'should watch all files inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( 'home/a/file1' );
      t.context.tree.modify ( 'home/a/file2', 100 );
      await t.context.wait.time ();
      t.context.deepEqualChanges ( [file1, file2] );
    }));

    it ( 'should watch new files inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const newfile1 = 'home/a/newfile' + Math.random ();
      const newfile2 = 'home/a/newfile' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile1 );
      t.context.tree.newFile ( newfile2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newfile1, newfile2] );
    }));

    it ( 'should watch new files inside an initially empty deep directory', withContext ( async t => {
      const dir = 'home';
      const newfile1 = 'home/empty/newfile' + Math.random ();
      const newfile2 = 'home/empty/newfile' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.newFile ( newfile1 );
      t.context.tree.newFile ( newfile2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newfile1, newfile2] );
    }));

    it ( 'should watch (touched) new files inside an initially empty deep directory', withContext ( async t => {
      const dir = 'home';
      const newfile1 = 'home/empty/newfile' + Math.random ();
      const newfile2 = 'home/empty/newfile' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      execSync ( `touch "${t.context.tree.path ( newfile1 )}"` );
      execSync ( `touch "${t.context.tree.path ( newfile2 )}"` );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newfile1, newfile2] );
    }));

    it ( 'should watch new files inside a new deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir = 'home/a/newdir' + Math.random ();
      const newfile1 = newdir + '/newfile' + Math.random ();
      const newfile2 = newdir + '/newfile' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile1 );
      t.context.tree.newFile ( newfile2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newdir, newfile1, newfile2] );
    }));

    it ( 'should deduplicate events', withContext ( async t => {
      const file = 'home/a/file2';
      t.context.watch ( file, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      t.context.tree.modify ( file, 50 );
      t.context.tree.modify ( file, 100 );
      await t.context.wait.time ();
      t.context.deepEqualChanges ( [file] );
    }));

    it ( 'should deduplicate events inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watch ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      t.context.tree.modify ( file, 50 );
      t.context.tree.modify ( file, 100 );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should deduplicate events inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a/file1';
      t.context.watch ( dir, { debounce: 300, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      t.context.tree.modify ( file, 50 );
      t.context.tree.modify ( file, 100 );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

  });

  describe ( 'watching directories', it => {

    it ( 'should watch a single non-existent directory inside a directory', withContext ( async t => {
      const dir = 'home/a/dir_missing' + Math.random ();
      t.context.watch ( dir, { debounce: 0 } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 1, 0 );
      t.context.deepEqualResults ( [], [] );
      t.context.tree.newDir ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualResults ( ['addDir'], [dir] );
      t.context.tree.remove ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir] );
      t.context.tree.newDir ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualResults ( ['addDir'], [dir] );
    }));

    it ( 'should watch a single non-existent directory inside a non-existent directory', withContext ( async t => {
      const pdir = 'home/a/dir_missing' + Math.random ();
      const dir = pdir + '/dir_missing' + Math.random ();
      t.context.watch ( dir, { debounce: 0, pollingInterval: 100 } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 1, 0, 0 );
      t.context.deepEqualResults ( [], [] );
      t.context.tree.newDir ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualResults ( ['addDir'], [dir] );
      t.context.tree.remove ( pdir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 1, 0, 0 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir] );
      t.context.tree.newDir ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualResults ( ['addDir'], [dir] );
    }));

    it ( 'should watch new directories inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir1 = 'home/a/dir1' + Math.random ();
      const newdir2 = 'home/a/dir2' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.newDir ( newdir1 );
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualUnorderedChanges ( [newdir1, newdir2] );
    }));

    it ( 'should watch new directories inside an initially empty directory', withContext ( async t => {
      const dir = 'home/empty';
      const newdir1 = 'home/empty/dir1' + Math.random ();
      const newdir2 = 'home/empty/dir2' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.newDir ( newdir1 );
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualUnorderedChanges ( [newdir1, newdir2] );
    }));

    it ( 'should watch new directories inside a new directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir0 = 'home/a/newdir' + Math.random ();
      const newdir1 = newdir0 + '/newdir' + Math.random ();
      const newdir2 = newdir0 + '/newdir' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir1 );
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newdir0, newdir1, newdir2] );
    }));

    it ( 'should watch new directories inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir1 = 'home/a/dir1' + Math.random ();
      const newdir2 = 'home/a/dir2' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir1 );
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newdir1, newdir2] );
    }));

    it ( 'should watch new directories inside an initially empty deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir1 = 'home/empty/dir1' + Math.random ();
      const newdir2 = 'home/empty/dir2' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir1 );
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newdir1, newdir2] );
    }));

    it ( 'should watch new directories inside a new deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir0 = 'home/a/newdir' + Math.random ();
      const newdir1 = newdir0 + '/newdir' + Math.random ();
      const newdir2 = newdir0 + '/newdir' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir1 );
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedChanges ( [newdir0, newdir1, newdir2] );
    }));

    it ( 'should deduplicate events inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir1 = 'home/a/newdir1' + Math.random ();
      const newdir2 = 'home/a/newdir2' + Math.random ();
      t.context.watch ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir1 );
      t.context.tree.newDir ( newdir2 );
      t.context.tree.remove ( newdir1, 50 );
      t.context.tree.remove ( newdir2, 50 );
      t.context.tree.newDir ( newdir1, 100 );
      t.context.tree.newDir ( newdir2, 100 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [newdir1, newdir2] );
    }));

    it ( 'should deduplicate events inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir1 = 'home/a/newdir1' + Math.random ();
      const newdir2 = 'home/a/newdir2' + Math.random ();
      t.context.watch ( dir, { debounce: 300, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir1 );
      t.context.tree.newDir ( newdir2 );
      t.context.tree.remove ( newdir1, 50 );
      t.context.tree.remove ( newdir2, 50 );
      t.context.tree.newDir ( newdir1, 100 );
      t.context.tree.newDir ( newdir2, 100 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [newdir1, newdir2] );
    }));

    it ( 'should keep watching after removal of sub directory', withContext ( async t => {
      const home = 'home';
      const dir = t.context.tree.path ( 'home/e/sub' );
      const file1 = t.context.tree.path ( 'home/e/file1' );
      const file2 = t.context.tree.path ( 'home/e/file2' );
      const subfile = t.context.tree.path ( 'home/e/sub/file1' );
      const changes = [];
      t.context.watch ( home, { debounce: 0, ignoreInitial: true, recursive: true } );
      t.context.watcher.on ( 'all', ( event, name ) => {
        if ( name === dir || name === file1 || name === file2 ) {
          changes.push ( name );
        }
      });
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/e/sub', 50 );
      t.context.tree.modify ( 'home/e/file1', 100 );
      t.context.tree.modify ( 'home/e/file2', 150 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlink', 'unlinkDir', 'change', 'change'], [subfile, dir, file1, file2] );
    }));

    it ( 'should close all eventual additional watchers added for recursiong when no longer needed', withContext ( async t => {
      const home = 'home/a';
      const dir1 = 'home/a/sub1';
      const dir2 = dir1 + '/sub2';
      t.context.watch ( home, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualResults ( [], [] );
      t.context.tree.newDir ( dir2 );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, HAS_NATIVE_RECURSION ? 3 : 5 );
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [dir1, dir2] );
      t.context.tree.remove ( dir2 );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, HAS_NATIVE_RECURSION ? 3 : 4 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir2] );
      t.context.tree.remove ( dir1);
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir1] );
    }));

  });

  describe.todo ( 'watching symlinks' );

  describe ( 'file events', it => {

    it ( 'should detect initial "add" for a single file', withContext ( async t => {
      const file = 'home/a/file1';
      t.context.watchForFiles ( file, { debounce: 0 } );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [file] );
    }));

    it ( 'should detect initial "add" for multiple files', withContext ( async t => {
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watchForFiles ( [file1, file2], { debounce: 0 } );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['add', 'add'], [file1, file2] );
    }));

    it ( 'should detect initial "add" for all files inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watchForFiles ( dir, { debounce: 0 } );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['add', 'add'], [file1, file2] );
    }));

    it ( 'should detect initial "add" for all files inside a deep directory', withContext ( async t => {
      const dir = 'home/e';
      const file1 = 'home/e/file1';
      const file2 = 'home/e/file2';
      const filesub1 =  'home/e/sub/file1';
      t.context.watchForFiles ( dir, { debounce: 0, recursive: true } );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['add', 'add', 'add'], [file1, file2, filesub1] );
    }));

    it ( 'should detect "add" when creating a new file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const newfile = 'home/a/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [newfile] );
    }));

    it ( 'should detect "add" when creating a new file inside a new directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir = 'home/a/newdir' + Math.random ();
      const newfile = newdir + '/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [newfile] );
    }));

    it ( 'should detect "add" when creating a new file inside a new deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir = 'home/a/newdir' + Math.random ();
      const newfile = newdir + '/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [newfile] );
    }));

    it ( 'should detect "add" when copying a file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      const copyfile = file + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( file, copyfile );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [copyfile] );
    }));

    it ( 'should detect "add" when copying a file inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a/file1';
      const copyfile = file + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( file, copyfile );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [copyfile] );
    }));

    it ( 'should detect "add" when copying a parent directory', withContext ( async t => {
      const home = 'home/e';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      const copyfile = copydir + '/file1';
      t.context.watchForFiles ( home, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [copyfile] );
    }));

    it ( 'should detect "add" when copying a deep parent directory', withContext ( async t => {
      const home = 'home';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      const copyfile = copydir + '/file1';
      t.context.watchForFiles ( home, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [copyfile] );
    }));

    it ( 'should detect "change" when modifying a file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should detect "change" when modifying a file inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should detect "change" when renaming a non-empty file and rerenaming it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      const filealt = 'home/a/file1_alt';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      t.context.tree.rename ( file, filealt );
      t.context.tree.rename ( filealt, file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should detect "unlink" when removing a single file', withContext ( async t => {
      const file = 'home/a/file1';
      t.context.watchForFiles ( file, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.tree.remove ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "unlink" and "add" when removing a single file and much later recreating it', withContext ( async t => {
      const file = 'home/a/file1';
      t.context.watchForFiles ( file, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.tree.remove ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlink'], [file] );
      t.context.tree.newFile ( file );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.deepEqualResults ( ['add'], [file] );
    }));

    it ( 'should detect "unlink" when removing a file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "unlink" when removing a file inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "unlink" when removing a parent directory', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/a' );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlink', 'unlink'], [file1, file2] );
    }));

    it ( 'should detect "unlink" when removing a parent directory of the watcher', withContext ( async t => {
      const dir = 'home/e/sub';
      const file = 'home/e/sub/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 )
      t.context.tree.remove ( 'home/e' );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 1, 0, 0 );
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "unlink" and "add" when renaming a file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file1 = 'home/a/file1';
      const file1alt = 'home/a/file1_alt';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file1, file1alt );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlink', 'add'], [file1, file1alt] );
    }));

    it ( 'should detect "unlink" and "add" when renaming a file inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const file1alt = 'home/a/file1_alt';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file1, file1alt );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlink', 'add'], [file1, file1alt] );
    }));

    it ( 'should detect "unlink" and "add" when renaming a parent directory', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const file1alt = 'home/a_alt/file1';
      const file2 = 'home/a/file2';
      const file2alt = 'home/a_alt/file2';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( 'home/a', 'home/a_alt' );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlink', 'add', 'unlink', 'add'], [file1, file1alt, file2, file2alt] );
    }));

    it ( 'should detect a single "add" when creating a new file and modifying it', withContext ( async t => {
      const dir = 'home/a';
      const newfile = 'home/a/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      t.context.tree.modify ( newfile );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [newfile] );
    }));

    it ( 'should detect a single "change" when removing a file and creating it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newFile ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should detect a single "unlink" when modifying a file and removing it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      t.context.tree.remove ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect nothing when creating a new file and removing it', withContext ( async t => {
      const dir = 'home/a';
      const newfile = 'home/a/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      t.context.tree.remove ( newfile );
      await t.context.wait.time ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when renaming an empty file and rerenaming it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      const filealt = 'home/a/file1_alt';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file, filealt );
      t.context.tree.rename ( filealt, file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when renaming a parent directory and rerenaming it', withContext ( async t => {
      const dir = 'home/a';
      const diralt = 'home/a_alt';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir, diralt );
      t.context.tree.rename ( diralt, dir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect "unlink" when removing a file and creating a directory of the same name', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newDir ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "add" when removing a directory and creating a file of the same name', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newFile ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['add'], [file] );
    }));

    it ( 'should detect "change" when replacing a parent directory with another one of the same name', withContext ( async t => {
      const dir = 'home';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/a' );
      t.context.tree.copy ( 'home/b', 'home/a' );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['change', 'change'], ['home/a/file1', 'home/a/file2'] );
    }));

    it ( 'should be able to handle many "unlink" events', withContext ( async t => {
      const dir = 'home/a';
      const files = t.context.tree.newFiles ( dir, 100 );
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ()
      files.forEach ( file => t.context.tree.remove ( file ) );
      await t.context.wait.longtime ()
      t.is ( t.context.events.length, 100 );
    }));

  });

  describe ( 'file events (with renames)', it => {

    it ( 'should detect initial "add" for a single file', withContext ( async t => {
      const file = 'home/a/file1';
      t.context.watchForFiles ( file, { debounce: 0, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [file] );
    }));

    it ( 'should detect initial "add" for multiple files', withContext ( async t => {
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watchForFiles ( [file1, file2], { debounce: 0, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['add', 'add'], [file1, file2] );
    }));

    it ( 'should detect initial "add" for all files inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watchForFiles ( dir, { debounce: 0, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['add', 'add'], [file1, file2] );
    }));

    it ( 'should detect initial "add" for all files inside a deep directory', withContext ( async t => {
      const dir = 'home/e';
      const file1 = 'home/e/file1';
      const file2 = 'home/e/file2';
      const filesub1 =  'home/e/sub/file1';
      t.context.watchForFiles ( dir, { debounce: 0, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['add', 'add', 'add'], [file1, file2, filesub1] );
    }));

    it ( 'should detect "add" when creating a new file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const newfile = 'home/a/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [newfile] );
    }));

    it ( 'should detect "add" when creating a new file inside a new directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir = 'home/a/newdir' + Math.random ();
      const newfile = newdir + '/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [newfile] );
    }));

    it ( 'should detect "add" when creating a new file inside a new deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir = 'home/a/newdir' + Math.random ();
      const newfile = newdir + '/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [newfile] );
    }));

    it ( 'should detect "add" when copying a file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      const copyfile = file + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( file, copyfile );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [copyfile] );
    }));

    it ( 'should detect "add" when copying a file inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a/file1';
      const copyfile = file + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( file, copyfile );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [copyfile] );
    }));

    it ( 'should detect "add" when copying a parent directory', withContext ( async t => {
      const home = 'home/e';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      const copyfile = copydir + '/file1';
      t.context.watchForFiles ( home, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [copyfile] );
    }));

    it ( 'should detect "add" when copying a deep parent directory', withContext ( async t => {
      const home = 'home';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      const copyfile = copydir + '/file1';
      t.context.watchForFiles ( home, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [copyfile] );
    }));

    it ( 'should detect "change" when modifying a file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should detect "change" when modifying a file inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should detect "change" when renaming a non-empty file and rerenaming it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      const filealt = 'home/a/file1_alt';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      t.context.tree.rename ( file, filealt );
      t.context.tree.rename ( filealt, file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should detect "unlink" when removing a single file', withContext ( async t => {
      const file = 'home/a/file1';
      t.context.watchForFiles ( file, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.tree.remove ( file );
      await t.context.wait.longtime ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "unlink" and "add" when removing a single file and much later recreating it', withContext ( async t => {
      const file = 'home/a/file1';
      t.context.watchForFiles ( file, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.tree.remove ( file );
      await t.context.wait.longtime ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlink'], [file] );
      t.context.tree.newFile ( file );
      await t.context.wait.longlongtime ();
      t.context.hasWatchObjects ( 0, 0, 2 );
      t.context.deepEqualResults ( ['add'], [file] );
    }));

    it ( 'should detect "unlink" when removing a file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "unlink" when removing a file inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "unlink" when removing a parent directory', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const file2 = 'home/a/file2';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/a' );
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['unlink', 'unlink'], [file1, file2] );
    }));

    it ( 'should detect "unlink" when removing a parent directory of the watcher', withContext ( async t => {
      const dir = 'home/e/sub';
      const file = 'home/e/sub/file1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 )
      t.context.tree.remove ( 'home/e' );
      await t.context.wait.longtime ();
      t.context.hasWatchObjects ( 1, 0, 0 );
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "rename" when renaming a file inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const file1 = 'home/a/file1';
      const file1alt = 'home/a/file1_alt';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file1, file1alt );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['rename'], [[file1, file1alt]] );
    }));

    it ( 'should detect "rename" when renaming a file inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const file1alt = 'home/a/file1_alt';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file1, file1alt );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['rename'], [[file1, file1alt]] );
    }));

    it ( 'should detect "rename" when renaming a parent directory', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const file1alt = 'home/a_alt/file1';
      const file2 = 'home/a/file2';
      const file2alt = 'home/a_alt/file2';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( 'home/a', 'home/a_alt' );
      await t.context.wait.longlongtime ();
      t.context.deepEqualUnorderedResults ( ['rename', 'rename'], [[file1, file1alt], [file2, file2alt]] );
    }));

    it ( 'should detect "rename" when renaming a file inside a directory case-sensitively', withContext ( async t => {
      const dir = 'home/a';
      const file1 = 'home/a/file1';
      const File1 = 'home/a/File1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file1, File1 );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['rename'], [[file1, File1]] );
    }));

    it ( 'should detect "rename" when renaming a file inside a deep directory case-sensitively', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const File1 = 'home/a/File1';
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file1, File1 );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['rename'], [[file1, File1]] );
    }));

    it ( 'should detect "rename" when renaming a parent directory case-sensitively', withContext ( async t => {
      const dir = 'home';
      const file1 = 'home/a/file1';
      const File1 = 'home/A/file1';
      const file2 = 'home/a/file2';
      const File2 = 'home/A/file2';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( 'home/a', 'home/A' );
      await t.context.wait.longlongtime ();
      t.context.deepEqualUnorderedResults ( ['rename', 'rename'], [[file1, File1], [file2, File2]] );
    }));

    it ( 'should detect a single "add" when creating a new file and modifying it', withContext ( async t => {
      const dir = 'home/a';
      const newfile = 'home/a/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      t.context.tree.modify ( newfile );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [newfile] );
    }));

    it ( 'should detect a single "change" when removing a file and creating it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newFile ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should detect a single "unlink" when modifying a file and removing it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      t.context.tree.remove ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect nothing when renaming an empty file and rerenaming it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      const filealt = 'home/a/file1_alt';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file, filealt );
      t.context.tree.rename ( filealt, file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when renaming an empty file case-sensitively and rerenaming it', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      const File = 'home/a/File1';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( file, File );
      t.context.tree.rename ( File, file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when creating a new file and removing it', withContext ( async t => {
      const dir = 'home/a';
      const newfile = 'home/a/file1' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      t.context.tree.remove ( newfile );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when creating a new file and removing it after a delay', withContext ( async t => {
      const dir = 'home/a';
      const newfile = 'home/a/file' + Math.random ();
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newFile ( newfile );
      await t.context.wait.time ();
      t.context.tree.remove ( newfile );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when renaming a parent directory and rerenaming it', withContext ( async t => {
      const dir = 'home/a';
      const diralt = 'home/a_alt';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir, diralt );
      t.context.tree.rename ( diralt, dir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when renaming a parent directory case-sensitively and rerenaming it', withContext ( async t => {
      const dir = 'home/a';
      const Dir = 'home/A';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir, Dir );
      t.context.tree.rename ( Dir, dir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect "unlink" when removing a file and creating a directory of the same name', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newDir ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['unlink'], [file] );
    }));

    it ( 'should detect "add" when removing a directory and creating a file of the same name', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newFile ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['add'], [file] );
    }));

    it ( 'should detect "change" when replacing a parent directory with another one of the same name', withContext ( async t => {
      const dir = 'home';
      t.context.watchForFiles ( dir, { debounce: 300, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/a' );
      t.context.tree.copy ( 'home/b', 'home/a' );
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['change', 'change'], ['home/a/file1', 'home/a/file2'] );
    }));

    it ( 'should be able to handle many "unlink" events', withContext ( async t => {
      const dir = 'home/a';
      const files = t.context.tree.newFiles ( dir, 100 );
      t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ()
      files.forEach ( file => t.context.tree.remove ( file ) );
      await t.context.wait.longtime ()
      t.is ( t.context.events.length, 100 );
    }));

  });

  describe ( 'directory events', it => {

    it ( 'should detect initial "addDir" for a single directory', withContext ( async t => {
      const dir = 'home/a';
      t.context.watchForDirs ( dir, { debounce: 0 } );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['addDir'], [dir] );
    }));

    it ( 'should detect initial "addDir" for multiple directories', withContext ( async t => {
      const dir1 = 'home/a';
      const dir2 = 'home/b';
      t.context.watchForDirs ( [dir1, dir2], { debounce: 0 } );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [dir1, dir2] );
    }));

    it ( 'should detect initial "addDir" for directories inside a directory', withContext ( async t => {
      const dir = 'home/e';
      t.context.watchForDirs ( dir, { debounce: 0 } );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [dir, 'home/e/sub'] );
    }));

    it ( 'should detect initial "addDir" for directories inside a deep directory', withContext ( async t => {
      const dir = 'home/shallow';
      t.context.watchForDirs ( dir, { debounce: 0, recursive: true } );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir', 'addDir'], [dir, 'home/shallow/1', 'home/shallow/1/2'] );
    }));

    it ( 'should detect "addDir" when creating a new directory inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir = 'home/a/dir' + Math.random ();
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['addDir'], [newdir] );
    }));

    it ( 'should detect "addDir" when creating a new directory inside a new directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir1 = 'home/a/dir' + Math.random ();
      const newdir2 = newdir1 + '/dir' + Math.random ();
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [newdir1, newdir2] );
    }));

    it ( 'should detect "addDir" when creating a new directory inside a new deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir1 = 'home/a/dir' + Math.random ();
      const newdir2 = newdir1 + '/dir' + Math.random ();
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [newdir1, newdir2] );
    }));

    it ( 'should detect "addDir" when copying a directory inside a directory', withContext ( async t => {
      const home = 'home/e';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      t.context.watchForDirs ( home, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['addDir'], [copydir] );
    }));

    it ( 'should detect "addDir" when copying a directory inside a deep directory', withContext ( async t => {
      const home = 'home';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      t.context.watchForDirs ( home, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['addDir'], [copydir] );
    }));

    it ( 'should detect "addDir" when copying a parent directory', withContext ( async t => {
      const home = 'home/e';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      t.context.watchForDirs ( home, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['addDir'], [copydir] );
    }));

    it ( 'should detect "addDir" when copying a deep parent directory', withContext ( async t => {
      const home = 'home';
      const dir = 'home/e';
      const copydir = dir + Math.random ();
      const copysubdir = copydir + '/sub';
      t.context.watchForDirs ( home, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [copydir, copysubdir] );
    }));

    it ( 'should detect "unlinkDir" when removing a single directory', withContext ( async t => {
      const dir = 'home/a';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.remove ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir] );
    }));

    it ( 'should detect "unlinkDir" and "addDir" when removing a single directory and much later recreating it', withContext ( async t => {
      const dir = 'home/a';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, pollingInterval: 100 } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.remove ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir] );
      t.context.tree.newDir ( dir );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualResults ( ['addDir'], [dir] );
    }));

    it ( 'should detect "unlinkDir" when removing a directory inside a directory', withContext ( async t => {
      const dir = 'home/e';
      const subdir = 'home/e/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( subdir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['unlinkDir'], [subdir] );
    }));

    it ( 'should detect "unlinkDir" when removing a directory inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const subdir = 'home/e/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( subdir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['unlinkDir'], [subdir] );
    }));

    it ( 'should detect "unlinkDir" when removing a parent directory', withContext ( async t => {
      const dir = 'home';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/e' );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlinkDir', 'unlinkDir'], ['home/e/sub', 'home/e'] );
    }));

    it ( 'should detect "unlinkDir" when removing a parent directory of the watcher', withContext ( async t => {
      const dir = 'home/e/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.remove ( 'home/e' );
      await t.context.wait.time ();
      t.context.hasWatchObjects ( 1, 0, 0 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir] );
    }));

    it ( 'should detect "unlinkDir" and "addDir" when renaming a directory inside a directory', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/a';
      const dir1alt = 'home/a_alt';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, dir1alt );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlinkDir', 'addDir'], [dir1, dir1alt] );
    }));

    it ( 'should detect "unlinkDir" and "addDir" when renaming a directory inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/e/sub';
      const dir1alt = 'home/e/sub_alt';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, dir1alt );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlinkDir', 'addDir'], [dir1, dir1alt] );
    }));

    it ( 'should detect "unlinkDir" and "addDir" when renaming a parent directory', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/e';
      const dir1alt = 'home/e_alt';
      const subdir1 = 'home/e/sub';
      const subdir1alt = 'home/e_alt/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, dir1alt );
      await t.context.wait.time ();
      t.context.deepEqualUnorderedResults ( ['unlinkDir', 'addDir', 'unlinkDir', 'addDir'], [dir1, dir1alt, subdir1, subdir1alt] );
    }));

    it ( 'should detect nothing when creating a new directory and removing it', withContext ( async t => {
      const dir = 'home/a';
      const newdir = 'home/a/dir' + Math.random ();
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir );
      t.context.tree.remove ( newdir );
      await t.context.wait.time ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when renaming a parent directory and rerenaming it', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/a';
      const dir1alt = 'home/a_alt';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, dir1alt );
      t.context.tree.rename ( dir1alt, dir1 );
      await t.context.wait.time ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect "addDir" when removing a file and creating a directory of the same name', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newDir ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['addDir'], [file] );
    }));

    it ( 'should detect "unlinkDir" when removing a directory and creating a file of the same name', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newFile ( file );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['unlinkDir'], [file] );
    }));

    it ( 'should detect "unlinkDir" and "addDir" when replacing a parent directory with another one of the same name', withContext ( async t => {
      const dir = 'home';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, recursive: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/a' );
      t.context.tree.copy ( 'home/b', 'home/a' );
      await t.context.wait.time ();
      t.context.deepEqualResults ( ['unlinkDir', 'addDir'], ['home/a', 'home/a'] );
    }));

    it ( 'should be able to handle many "unlinkDir" events', withContext ( async t => {
      const dir = 'home/a';
      const dirs = t.context.tree.newDirs ( dir, 100 );
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ()
      dirs.forEach ( dir => t.context.tree.remove ( dir ) );
      await t.context.wait.longtime ()
      t.is ( t.context.events.length, 100 );
    }));

  });

  describe ( 'directory events (with renames)', it => {

    it ( 'should detect initial "addDir" for a single directory', withContext ( async t => {
      const dir = 'home/a';
      t.context.watchForDirs ( dir, { debounce: 0, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['addDir'], [dir] );
    }));

    it ( 'should detect initial "addDir" for multiple directories', withContext ( async t => {
      const dir1 = 'home/a';
      const dir2 = 'home/b';
      t.context.watchForDirs ( [dir1, dir2], { debounce: 0, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [dir1, dir2] );
    }));

    it ( 'should detect initial "addDir" for directories inside a directory', withContext ( async t => {
      const dir = 'home/e';
      t.context.watchForDirs ( dir, { debounce: 0, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [dir, 'home/e/sub'] );
    }));

    it ( 'should detect initial "addDir" for directories inside a deep directory', withContext ( async t => {
      const dir = 'home/shallow';
      t.context.watchForDirs ( dir, { debounce: 0, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir', 'addDir'], [dir, 'home/shallow/1', 'home/shallow/1/2'] );
    }));

    it ( 'should detect "addDir" when creating a new directory inside a directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir = 'home/a/dir' + Math.random ();
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['addDir'], [newdir] );
    }));

    it ( 'should detect "addDir" when creating a new directory inside a new directory', withContext ( async t => {
      const dir = 'home/a';
      const newdir1 = 'home/a/dir' + Math.random ();
      const newdir2 = newdir1 + '/dir' + Math.random ();
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [newdir1, newdir2] );
    }));

    it ( 'should detect "addDir" when creating a new directory inside a new deep directory', withContext ( async t => {
      const dir = 'home';
      const newdir1 = 'home/a/dir' + Math.random ();
      const newdir2 = newdir1 + '/dir' + Math.random ();
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir2 );
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [newdir1, newdir2] );
    }));

    it ( 'should detect "addDir" when copying a directory inside a directory', withContext ( async t => {
      const home = 'home/e';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      t.context.watchForDirs ( home, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['addDir'], [copydir] );
    }));

    it ( 'should detect "addDir" when copying a directory inside a deep directory', withContext ( async t => {
      const home = 'home';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      t.context.watchForDirs ( home, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['addDir'], [copydir] );
    }));

    it ( 'should detect "addDir" when copying a parent directory', withContext ( async t => {
      const home = 'home/e';
      const dir = 'home/e/sub';
      const copydir = dir + Math.random ();
      t.context.watchForDirs ( home, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['addDir'], [copydir] );
    }));

    it ( 'should detect "addDir" when copying a deep parent directory', withContext ( async t => {
      const home = 'home';
      const dir = 'home/e';
      const copydir = dir + Math.random ();
      const copysubdir = copydir + '/sub';
      t.context.watchForDirs ( home, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.copy ( dir, copydir );
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [copydir, copysubdir] );
    }));

    it ( 'should detect "unlinkDir" when removing a single directory', withContext ( async t => {
      const dir = 'home/a';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.remove ( dir );
      await t.context.wait.longtime ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir] );
    }));

    it ( 'should detect "unlinkDir" and "addDir" when removing a single directory and much later recreating it', withContext ( async t => {
      const dir = 'home/a';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, pollingInterval: 100, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.remove ( dir );
      await t.context.wait.longtime ();
      t.context.hasWatchObjects ( 0, 1, 1 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir] );
      t.context.tree.newDir ( dir );
      await t.context.wait.longlongtime ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.deepEqualResults ( ['addDir'], [dir] );
    }));

    it ( 'should detect "unlinkDir" when removing a directory inside a directory', withContext ( async t => {
      const dir = 'home/e';
      const subdir = 'home/e/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( subdir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['unlinkDir'], [subdir] );
    }));

    it ( 'should detect "unlinkDir" when removing a directory inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const subdir = 'home/e/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( subdir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['unlinkDir'], [subdir] );
    }));

    it ( 'should detect "unlinkDir" when removing a parent directory', withContext ( async t => {
      const dir = 'home';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/e' );
      await t.context.wait.longtime ();
      t.context.deepEqualUnorderedResults ( ['unlinkDir', 'unlinkDir'], ['home/e/sub', 'home/e'] );
    }));

    it ( 'should detect "unlinkDir" when removing a parent directory of the watcher', withContext ( async t => {
      const dir = 'home/e/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.hasWatchObjects ( 0, 0, 3 );
      t.context.tree.remove ( 'home/e' );
      await t.context.wait.longtime ();
      t.context.hasWatchObjects ( 1, 0, 0 );
      t.context.deepEqualResults ( ['unlinkDir'], [dir] );
    }));

    it ( 'should detect "renameDir" when renaming a directory inside a directory', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/a';
      const dir1alt = 'home/a_alt';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, dir1alt );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['renameDir'], [[dir1, dir1alt]] );
    }));

    it ( 'should detect "renameDir" when renaming a directory inside a deep directory', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/e/sub';
      const dir1alt = 'home/e/sub_alt';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, dir1alt );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['renameDir'], [[dir1, dir1alt]] );
    }));

    it ( 'should detect "renameDir" when renaming a parent directory', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/e';
      const dir1alt = 'home/e_alt';
      const subdir1 = 'home/e/sub';
      const subdir1alt = 'home/e_alt/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, dir1alt );
      await t.context.wait.longlongtime ();
      t.context.deepEqualUnorderedResults ( ['renameDir', 'renameDir'], [[dir1, dir1alt], [subdir1, subdir1alt]] );
    }));

    it ( 'should detect "renameDir" when renaming a directory inside a directory case-sensitively', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/a';
      const Dir1 = 'home/A';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, Dir1 );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['renameDir'], [[dir1, Dir1]] );
    }));

    it ( 'should detect "renameDir" when renaming a directory inside a deep directory case-sensitively', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/e/sub';
      const Dir1 = 'home/e/Sub';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, Dir1 );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['renameDir'], [[dir1, Dir1]] );
    }));

    it ( 'should detect "renameDir" when renaming a parent directory case-sensitively', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/e';
      const Dir1 = 'home/E';
      const subdir1 = 'home/e/sub';
      const Subdir1 = 'home/E/sub';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, Dir1 );
      await t.context.wait.longlongtime ();
      t.context.deepEqualUnorderedResults ( ['renameDir', 'renameDir'], [[dir1, Dir1], [subdir1, Subdir1]] );
    }));

    it ( 'should detect nothing when creating a new directory and removing it', withContext ( async t => {
      const dir = 'home/a';
      const newdir = 'home/a/dir' + Math.random ();
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.newDir ( newdir );
      t.context.tree.remove ( newdir );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when renaming a parent directory and rerenaming it', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/a';
      const dir1alt = 'home/a_alt';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, dir1alt );
      t.context.tree.rename ( dir1alt, dir1 );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect nothing when renaming a parent directory case-sensitively and rerenaming it', withContext ( async t => {
      const dir = 'home';
      const dir1 = 'home/a';
      const Dir1 = 'home/A';
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.rename ( dir1, Dir1 );
      t.context.tree.rename ( Dir1, dir1 );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( [], [] );
    }));

    it ( 'should detect "addDir" when removing a file and creating a directory of the same name', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newDir ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['addDir'], [file] );
    }));

    it ( 'should detect "unlinkDir" when removing a directory and creating a file of the same name', withContext ( async t => {
      const dir = 'home';
      const file = 'home/a';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( file );
      t.context.tree.newFile ( file );
      await t.context.wait.longtime ();
      t.context.deepEqualResults ( ['unlinkDir'], [file] );
    }));

    it ( 'should detect "unlinkDir" and "addDir" when replacing a parent directory with another one of the same name', withContext ( async t => {
      const dir = 'home';
      t.context.watchForDirs ( dir, { debounce: 300, ignoreInitial: true, recursive: true, renameDetection: true } );
      await t.context.wait.ready ();
      t.context.tree.remove ( 'home/a' );
      t.context.tree.copy ( 'home/b', 'home/a' );
      await t.context.wait.longlongtime ();
      t.context.deepEqualResults ( ['unlinkDir', 'addDir'], ['home/a', 'home/a'] );
    }));

    it ( 'should be able to handle many "unlinkDir" events', withContext ( async t => {
      const dir = 'home/a';
      const dirs = t.context.tree.newDirs ( dir, 100 );
      t.context.watchForDirs ( dir, { debounce: 0, ignoreInitial: true, renameDetection: true } );
      await t.context.wait.ready ();
      await t.context.wait.longtime ()
      dirs.forEach ( dir => t.context.tree.remove ( dir ) );
      await t.context.wait.longtime ()
      t.is ( t.context.events.length, 100 );
    }));

  });

  describe ( 'watcher events', it => {

    it ( 'should emit "all" alongside specific target events', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      const newdir = 'home/a/newdir' + Math.random ();
      const newfile = newdir + '/newfile' + Math.random ();
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      const adds = [];
      t.context.watcher.on ( 'add', targetPath => adds.push ( targetPath ) );
      const addDirs = [];
      t.context.watcher.on ( 'addDir', targetPath => addDirs.push ( targetPath ) );
      const changes = [];
      t.context.watcher.on ( 'change', targetPath => changes.push ( targetPath ) );
      const unlinks = [];
      t.context.watcher.on ( 'unlink', targetPath => unlinks.push ( targetPath ) );
      const unlinkDirs = [];
      t.context.watcher.on ( 'unlinkDir', targetPath => unlinkDirs.push ( targetPath ) );
      await t.context.wait.ready ();
      t.context.tree.modify ( file );
      t.context.tree.newFile ( newfile );
      await t.context.wait.time ();
      await t.context.deepEqualUnorderedResults ( ['change', 'addDir', 'add'], [file, newdir, newfile] );
      t.deepEqual ( adds, t.context.normalizePaths ( [newfile] ) );
      t.deepEqual ( addDirs, t.context.normalizePaths ( [newdir] ) );
      t.deepEqual ( changes, t.context.normalizePaths ( [file] ) );
      t.deepEqual ( unlinks, t.context.normalizePaths ( [] ) );
      t.deepEqual ( unlinkDirs, t.context.normalizePaths ( [] ) );
      t.context.tree.remove ( file );
      t.context.tree.remove ( newdir );
      await t.context.wait.time ();
      await t.context.deepEqualUnorderedResults ( ['unlink', 'unlinkDir', 'unlink'], [file, newdir, newfile] );
      t.deepEqual ( adds, t.context.normalizePaths ( [newfile] ) );
      t.deepEqual ( addDirs, t.context.normalizePaths ( [newdir] ) );
      t.deepEqual ( changes, t.context.normalizePaths ( [file] ) );
      t.context.deepEqualUnordered ( unlinks, t.context.normalizePaths ( [file, newfile] ) );
      t.deepEqual ( unlinkDirs, t.context.normalizePaths ( [newdir] ) );
    }));

    it ( 'should emit "change" only after "ready"', withContext ( async t => {
      const dir = 'home/a';
      const file = 'home/a/file1';
      t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
      const _ready = t.context.watcher.ready.bind ( t.context.watcher );
      t.context.watcher.ready = () => {
        t.context.tree.modify ( file );
        setTimeout ( _ready, 300 );
      };
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.true ( t.context.watcher.isReady () );
      t.context.deepEqualResults ( ['change'], [file] );
    }));

    it ( 'should emit "close" when closing', withContext ( async t => {
      const file = 'home/a/file1';
      t.context.watch ( file );
      t.context.watcher.close ();
      await t.context.wait.close ();
      t.pass ();
    }));

    it ( 'should emit "ready" when watching nothing', withContext ( async t => {
      t.context.watch ( [] );
      await t.context.wait.ready ();
      t.pass ();
    }));

    it ( 'should emit "ready" when watching a file', withContext ( async t => {
      const file = 'home/a/file1';
      t.context.watch ( file );
      await t.context.wait.ready ();
      t.pass ();
    }));

    it ( 'should emit "ready" when watching a directory', withContext ( async t => {
      const dir = 'home';
      t.context.watch ( dir );
      await t.context.wait.ready ();
      t.pass ();
    }));

    it ( 'should emit "ready" when watching a directory recursively', withContext ( async t => {
      const dir = 'home';
      t.context.watch ( dir, { recursive: true } );
      await t.context.wait.ready ();
      t.pass ();
    }));

    it ( 'should emit "ready" when watching multiple paths recursively', withContext ( async t => {
      const file = 'home/b/file1';
      const dir1 = 'home/a';
      const dir2 = 'home/b';
      const dir3 = 'home';
      t.context.watch ( [file, dir1, dir2, dir3], { recursive: true } );
      await t.context.wait.ready ();
      t.pass ();
    }));

    it ( 'should not emit "error" when watching a non-existent file', withContext ( async t => {
      const file = 'home/missing/file1';
      t.context.watch ( file );
      t.context.watcher.on ( 'error', t.fail );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.pass ();
    }));

    it ( 'should not emit "error" when watching a non-existent directory', withContext ( async t => {
      const dir = 'home/missing';
      t.context.watch ( dir );
      t.context.watcher.on ( 'error', t.fail );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.pass ();
    }));

    it ( 'should not emit "error" when watching at least one non-existent path', withContext ( async t => {
      const file1 = 'home/b/file1';
      const file2 = 'home/missing/file1';
      const dir = 'home';
      t.context.watch ( [file1, file2, dir], { recursive: true } );
      t.context.watcher.on ( 'error', t.fail );
      await t.context.wait.ready ();
      await t.context.wait.time ();
      t.pass ();
    }));

  });

  describe ( 'watcher instance', it => {

    describe ( 'close', it => {

      it ( 'should close all watchers and stop emissions', withContext ( async t => {
        const dir = 'home/a';
        const file = 'home/a/file1';
        t.context.watch ( dir, { debounce: 0 } );
        t.context.watcher.on ( 'all', t.fail );
        await t.context.wait.ready ();
        t.context.hasWatchObjects ( 0, 0, 3 );
        t.context.watcher.close ();
        t.context.tree.modify ( file );
        t.context.tree.modify ( file, 50 );
        t.context.tree.modify ( file, 100 );
        await t.context.wait.time ();
        t.true ( t.context.watcher.isClosed () );
        t.context.hasWatchObjects ( 0, 0, 0 );
      }));

    });

  });

  describe ( 'watcher options', it => {

    describe ( 'debounce', it => {

      it ( 'should cause delayed emissions when set to >= 0, when "ignoreInitial" is not used', withContext ( async t => {
        const dir = 'home/a';
        const file = 'home/a/file1';
        const start = Date.now ();
        t.context.watch ( dir, { debounce: 300 }, it => {
          if ( ( Date.now () - start ) < 300 ) {
            t.fail ();
          }
        });
        await t.context.wait.ready ();
        t.context.tree.modify ( file );
        await t.context.wait.time ();
        t.pass ();
      }));

      it ( 'should cause delayed emissions when set to >= 0, when "ignoreInitial" is used', withContext ( async t => {
        const dir = 'home/a';
        const file = 'home/a/file1';
        const start = Date.now ();
        t.context.watch ( dir, { debounce: 300, ignoreInitial: true }, it => {
          if ( ( Date.now () - start ) < 300 ) {
            t.fail ();
          }
        });
        await t.context.wait.ready ();
        t.context.tree.modify ( file );
        await t.context.wait.time ();
        t.pass ();
      }));

    });

    describe ( 'depth', it => {

      it ( 'should not find any children when set to 0', withContext ( async t => {
        const dir = 'home/deep';
        t.context.watch ( dir, { debounce: 0, depth: 0, recursive: true } );
        await t.context.wait.ready ();
        await t.context.wait.time ();
        t.context.deepEqualChanges ( [dir] );
      }));

      if ( HAS_NATIVE_RECURSION ) { //FIXME: These should work also when native recursion is unavailable

        it ( 'should only find immediate children when set to 1', withContext ( async t => {
          const dir = 'home/deep';
          const file = 'home/deep/1';
          t.context.watch ( dir, { debounce: 0, depth: 1, recursive: true } );
          await t.context.wait.ready ();
          await t.context.wait.time ();
          t.context.deepEqualUnorderedChanges ( [dir, file] );
        }));

        it ( 'should only find up-to-depth-20 children when not set', withContext ( async t => {
          const dir = 'home/deep';
          t.context.watch ( dir, { debounce: 0, recursive: true } );
          await t.context.wait.ready ();
          await t.context.wait.time ();
          t.is ( t.context.events.length, 21 );
        }));

      }

    });

    describe ( 'ignore', it => {

      it ( 'should ignore files', withContext ( async t => {
        const dir = 'home';
        const file1 = 'home/a/file1';
        const file2 = 'home/a/file2';;
        t.context.watch ( dir, {
          debounce: 0,
          ignoreInitial: true,
          recursive: true,
          ignore: name => /file1/.test ( name )
        });
        await t.context.wait.ready ();
        t.context.tree.modify ( file1 );
        t.context.tree.modify ( file2, 50 );
        await t.context.wait.time ();
        t.context.deepEqualResults ( ['change'], [file2] );
      }));

      it ( 'should ignore directories', withContext ( async t => {
        const dir = 'home';
        const file1 = 'home/e/file1';
        const file2 = 'home/e/sub/file1';
        t.context.watch ( dir, {
          debounce: 0,
          ignoreInitial: true,
          recursive: true,
          ignore: name => /sub/.test ( name )
        });
        await t.context.wait.ready ();
        t.context.tree.modify ( file1 );
        t.context.tree.modify ( file2 );
        await t.context.wait.time ();
        t.context.deepEqualResults ( ['change'], [file1] );
      }));

      it ( 'should ignore initial events from ignored files', withContext ( async t => {
        const dir = 'home/shallow';
        t.context.watch ( dir, {
          debounce: 0,
          recursive: true,
          ignore: name => /1\/2|1\\2/.test ( name )
        });
        await t.context.wait.ready ();
        await t.context.wait.time ();
        t.context.deepEqualUnorderedResults ( ['addDir', 'addDir'], [dir, 'home/shallow/1'] );
      }));

    });

    describe ( 'ignoreInitial', it => {

      it ( 'should not emit "add" and "addDir" events when set to "true"', withContext ( async t => {
        const dir = 'home/a';
        const file = 'home/b/file1';
        t.context.watch ( [dir, file], { debounce: 0, ignoreInitial: true } );
        await t.context.wait.ready ();
        await t.context.wait.time ();
        t.context.deepEqualResults ( [], [] );
      }));

      it ( 'should emit "add" and "addDir" events when set to "false"', withContext ( async t => {
        const dir = 'home/a';
        const file = 'home/b/file1';
        t.context.watch ( [dir, file], { debounce: 0, ignoreInitial: false } );
        await t.context.wait.ready ();
        await t.context.wait.time ();
        t.context.deepEqualUnorderedResults ( ['addDir', 'add', 'add', 'add'], [dir, 'home/a/file1', 'home/a/file2', file] );
      }));

      it ( 'should emit "add" and "addDir" events when not set', withContext ( async t => {
        const dir = 'home/a';
        const file = 'home/b/file1';
        t.context.watch ( [dir, file], { debounce: 0 } );
        await t.context.wait.ready ();
        await t.context.wait.time ();
        t.context.deepEqualUnorderedResults ( ['addDir', 'add', 'add', 'add'], [dir, 'home/a/file1', 'home/a/file2', file] );
      }));

    });

    describe ( 'native', it => {

      it ( 'should only find immediate children with "depth" set to 1, when set to "false"', withContext ( async t => {
        const dir = 'home/deep';
        const file = 'home/deep/1';
        t.context.watch ( dir, { debounce: 0, depth: 1, native: false, recursive: true } );
        await t.context.wait.ready ();
        await t.context.wait.time ();
        t.context.deepEqualUnorderedChanges ( [dir, file] );
      }));

      it ( 'should only find up-to-depth-20 children with "depth" not set, when set to "false"', withContext ( async t => {
        const dir = 'home/deep';
        t.context.watch ( dir, { debounce: 0, native: false, recursive: true } );
        await t.context.wait.ready ();
        await t.context.wait.time ();
        t.is ( t.context.events.length, 21 );
      }));

    });

    describe ( 'recursive', it => {

      it ( 'should not watch recursively when not set', withContext ( async t => {
        const dir = 'home';
        t.context.watch ( dir, { debounce: 0, ignoreInitial: true }, t.fail );
        await t.context.wait.ready ();
        t.context.tree.modify ( 'home/a/file1' );
        await t.context.wait.time ();
        t.pass ();
      }));

      it ( 'should not watch recursively when set to "false"', withContext ( async t => {
        const dir = 'home';
        t.context.watch ( dir, { debounce: 0, ignoreInitial: true, recursive: false }, t.fail );
        await t.context.wait.ready ();
        t.context.tree.modify ( 'home/a/file1' );
        await t.context.wait.time ();
        t.pass ();
      }));

      it ( 'should watch recursively when set to "true"', withContext ( async t => {
        const dir = 'home';
        const file = 'home/a/file1';
        t.context.watchForFiles ( dir, { debounce: 0, ignoreInitial: true, recursive: true } );
        await t.context.wait.ready ();
        t.context.tree.modify ( 'home/a/file1' );
        await t.context.wait.time ();
        t.context.deepEqualResults ( ['change'], [file] );
      }));

    });

  });

});
