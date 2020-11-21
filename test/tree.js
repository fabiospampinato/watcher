
/* IMPORT */

const fs = require ( 'fs-extra' ),
      path = require ( 'path' );

/* TREE */

class Tree {

  static ROOT = path.join ( __dirname, '__TREES__' );

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
    'home/deep/1/2/3/4/5/6/7/8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/file2'
  ];

  constructor ( id ) {
    this.root = path.join ( Tree.ROOT, String ( id ) );
  }

  build () {
    return Promise.all ( Tree.BLUEPRINT.map ( path => {
      return fs.ensureFile ( this.path ( path ) );
    }));
  }

  copy ( path1, path2, delay = 0 ) {
    setTimeout ( () => {
      fs.copySync ( this.path ( path1 ), this.path ( path2 ) );
    }, delay );
  }

  modify ( path, delay = 0 ) {
    setTimeout ( () => {
      fs.appendFileSync ( this.path ( path ), 'content' );
    }, delay );
  }

  newDir ( path, delay = 0 ) {
    setTimeout ( () => {
      fs.ensureDirSync ( this.path ( path ) );
    }, delay );
  }

  newDirs ( path, count ) {
    return Array ( count ).fill ().map ( ( _, nr ) => {
      const id = 'newdir_' + nr;
      const dpath = this.path ( path, id );
      fs.ensureDirSync ( dpath );
      return dpath;
    });
  }

  newFile ( path, delay = 0 ) {
    setTimeout ( () => {
      fs.ensureFileSync ( this.path ( path ) );
    }, delay );
  }

  newFiles ( path, count ) {
    return Array ( count ).fill ().map ( ( _, nr ) => {
      const id = 'newfile_' + nr;
      const fpath = this.path ( path, id );
      fs.ensureFileSync ( fpath );
      return fpath;
    });
  }

  path ( ...paths ) {
    if ( paths[0].startsWith ( 'home' ) ) {
      return path.join ( this.root, ...paths );
    } else {
      return path.join ( ...paths );
    }
  }

  remove ( path, delay = 0 ) {
    setTimeout ( () => {
      fs.removeSync ( this.path ( path ) );
    }, delay );
  }

  rename ( path1, path2, delay = 0 ) {
    setTimeout ( () => {
      fs.renameSync ( this.path ( path1 ), this.path ( path2 ) );
    }, delay );
  }

}

/* EXPORT */

module.exports = Tree;
