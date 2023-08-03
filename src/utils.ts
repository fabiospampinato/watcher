
/* IMPORT */

import {debounce} from 'dettle';
import fs from 'node:fs';
import path from 'node:path';
import sfs from 'stubborn-fs';
import readdir from 'tiny-readdir';
import {POLLING_TIMEOUT} from './constants';
import type {Callback, Ignore, ReaddirMap, Stats} from './types';

/* MAIN */

const Utils = {

  /* LANG API */

  lang: { //TODO: Import all these utilities from "nanodash" instead

    debounce,

    attempt: <T> ( fn: () => T ): T | Error => {

      try {

        return fn ();

      } catch ( error: unknown ) {

        return Utils.lang.castError ( error );

      }

    },

    castArray: <T> ( x: T | T[] ): T[] => {

      return Utils.lang.isArray ( x ) ? x : [x];

    },

    castError: ( exception: unknown ): Error => {

      if ( Utils.lang.isError ( exception ) ) return exception;

      if ( Utils.lang.isString ( exception ) ) return new Error ( exception );

      return new Error ( 'Unknown error' );

    },

    defer: ( callback: Callback ): NodeJS.Timeout => {

      return setTimeout ( callback, 0 );

    },

    isArray: ( value: unknown ): value is unknown[] => {

      return Array.isArray ( value );

    },

    isError: ( value: unknown ): value is Error => {

      return value instanceof Error;

    },

    isFunction: ( value: unknown ): value is Function => {

      return typeof value === 'function';

    },

    isNaN: ( value: unknown ): value is number => {

      return Number.isNaN ( value );

    },

    isNumber: ( value: unknown ): value is number => {

      return typeof value === 'number';

    },

    isPrimitive: ( value: unknown ): value is bigint | symbol | string | number | boolean | null | undefined => {

      if ( value === null ) return true;

      const type = typeof value;

      return type !== 'object' && type !== 'function';

    },

    isShallowEqual: ( x: any, y: any ): boolean => {

      if ( x === y ) return true;

      if ( Utils.lang.isNaN ( x ) ) return Utils.lang.isNaN ( y );

      if ( Utils.lang.isPrimitive ( x ) || Utils.lang.isPrimitive ( y ) ) return x === y;

      for ( const i in x ) if ( !( i in y ) ) return false;

      for ( const i in y ) if ( x[i] !== y[i] ) return false;

      return true;

    },

    isSet: ( value: unknown ): value is Set<unknown> => {

      return value instanceof Set;

    },

    isString: ( value: unknown ): value is string => {

      return typeof value === 'string';

    },

    isUndefined: ( value: unknown ): value is undefined => {

      return value === undefined;

    },

    noop: (): undefined => {

      return;

    },

    uniq: <T> ( arr: T[] ): T[] => {

      if ( arr.length < 2 ) return arr;

      return Array.from ( new Set ( arr ) );

    }

  },

  /* FS API */

  fs: {

    getDepth: ( targetPath: string ): number => {

      return Math.max ( 0, targetPath.split ( path.sep ).length - 1 );

    },

    getRealPath: ( targetPath: string, native?: boolean ): string | undefined => {

      try {

        return native ? fs.realpathSync.native ( targetPath ) : fs.realpathSync ( targetPath );

      } catch {

        return;

      }

    },

    isSubPath: ( targetPath: string, subPath: string ): boolean => {

      return ( subPath.startsWith ( targetPath ) && subPath[targetPath.length] === path.sep && ( subPath.length - targetPath.length ) > path.sep.length );

    },

    poll: ( targetPath: string, timeout: number = POLLING_TIMEOUT ): Promise<Stats | undefined> => {

      return sfs.retry.stat ( timeout )( targetPath, { bigint: true } ).catch ( Utils.lang.noop );

    },

    readdir: async ( rootPath: string, ignore?: Ignore, depth: number = Infinity, limit: number = Infinity, signal?: { aborted: boolean }, readdirMap?: ReaddirMap ): Promise<[string[], string[]]> => {

      if ( readdirMap && depth === 1 && rootPath in readdirMap ) { // Reusing cached data

        const result = readdirMap[rootPath];

        return [result.directories, result.files];

      } else { // Retrieving fresh data

        const result = await readdir ( rootPath, { depth, limit, ignore, signal } );

        return [result.directories, result.files];

      }

    }

  }

};

/* EXPORT */

export default Utils;
