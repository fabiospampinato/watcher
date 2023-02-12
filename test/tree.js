
/* IMPORT */

import fs from 'node:fs';
import path, { dirname } from 'node:path';
import process from 'node:process';

/* MAIN */

class Tree {

  static ROOT = path.join ( process.cwd (), 'test', '__TREES__' );

  static BLUEPRINT = [
    'home/a/file1',
    'home/a/file2',
    'home/b/file1',
    'home/b/file2',
    'home/e/sub/file1',
    'home/e/file1',
    'home/e/file2',
    'home/shallow/1/2/file1',
    'home/shallow/1/2/file2',
    'home/deep/1/2/3/4/5/6/7/8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/file1',
    'home/deep/1/2/3/4/5/6/7/8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/file2',
    'home/empty/'
  ];

  constructor ( id ) {
    this.root = path.join ( Tree.ROOT, String ( id ) );
  }

  build () {
    Tree.BLUEPRINT.forEach ( path => {
      if ( path.endsWith ( '/' ) ) {
        fs.mkdirSync ( this.path ( path ), { recursive: true } );
      } else {
        fs.mkdirSync ( dirname ( this.path ( path ) ), { recursive: true } );
        fs.writeFileSync ( this.path ( path ), '' );
      }
    });
  }

  copy ( path1, path2, delay = 0 ) {
    setTimeout ( () => {
      fs.cpSync ( this.path ( path1 ), this.path ( path2 ), { recursive: true } );
    }, delay );
  }

  modify ( path, delay = 0 ) {
    setTimeout ( () => {
      fs.appendFileSync ( this.path ( path ), 'content' );
    }, delay );
  }

  newDir ( path, delay = 0 ) {
    setTimeout ( () => {
      fs.mkdirSync ( this.path ( path ), { recursive: true } );
    }, delay );
  }

  newDirs ( path, count ) {
    return Array ( count ).fill ().map ( ( _, nr ) => {
      const id = 'newdir_' + nr;
      const dpath = this.path ( path, id );
      fs.mkdirSync ( dpath, { recursive: true } );
      return dpath;
    });
  }

  newFile ( path, delay = 0 ) {
    setTimeout ( () => {
      fs.mkdirSync ( dirname ( this.path ( path ) ), { recursive: true } );
      fs.writeFileSync ( this.path ( path ), '' );
    }, delay );
  }

  newFiles ( path, count ) {
    return Array ( count ).fill ().map ( ( _, nr ) => {
      const id = 'newfile_' + nr;
      const fpath = this.path ( path, id );
      fs.mkdirSync ( dirname ( fpath ), { recursive: true } );
      fs.writeFileSync ( fpath, '' );
      return fpath;
    });
  }

  path ( ...paths ) {
    if ( paths[0].startsWith ( 'home' ) ) {
      return path.join ( this.root, ...paths ).replace ( /\/$/, '' );
    } else {
      return path.join ( ...paths ).replace ( /\/$/, '' );
    }
  }

  remove ( path, delay = 0 ) {
    setTimeout ( () => {
      fs.rmSync ( this.path ( path ), { recursive: true } );
    }, delay );
  }

  rename ( path1, path2, delay = 0 ) {
    setTimeout ( () => {
      fs.renameSync ( this.path ( path1 ), this.path ( path2 ) );
    }, delay );
  }

}

/* EXPORT */

export default Tree;
