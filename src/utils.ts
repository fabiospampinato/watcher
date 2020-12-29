
/* IMPORT */

import areShallowEqual from 'are-shallow-equal';
import afs from 'atomically/dist/utils/fs';
import debounce from 'debounce';
import path from 'path';
import readdir from 'tiny-readdir';
import {POLLING_TIMEOUT} from './constants';
import {Callback, Ignore, Stats} from './types';

/* UTILS */

const Utils = {

  lang: { //TODO: Import all these utilities from "nanodash" instead

    areShallowEqual,

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

    castError ( exception: unknown ): Error {

      if ( Utils.lang.isError ( exception ) ) return exception;

      if ( Utils.lang.isString ( exception ) ) return new Error ( exception );

      return new Error ( 'Unknown error' );

    },

    defer: ( callback: Callback ): NodeJS.Timeout => {

      return setTimeout ( callback, 0 );

    },

    isArray: ( x: any ): x is any[] => {

      return Array.isArray ( x );

    },

    isError ( x: any ): x is Error {

      return x instanceof Error;

    },

    isFunction: ( x: any ): x is Function => {

      return typeof x === 'function';

    },

    isNumber: ( x: any ): x is number => {

      return typeof x === 'number';

    },

    isString: ( x: any ): x is string => {

      return typeof x === 'string';

    },

    isUndefined: ( x: any ): x is undefined => {

      return x === undefined;

    },

    noop: (): undefined => {

      return;

    },

    uniq: <T> ( arr: T[] ): T[] => {

      if ( arr.length < 2 ) return arr;

      return Array.from ( new Set ( arr ) );

    }

  },

  fs: {

    isSubPath: ( targetPath: string, subPath: string ): boolean => {

      return ( subPath.startsWith ( targetPath ) && subPath[targetPath.length] === path.sep && ( subPath.length - targetPath.length ) > path.sep.length );

    },

    poll: ( targetPath: string, timeout: number = POLLING_TIMEOUT ): Promise<Stats | undefined> => {

      return afs.statRetry ( timeout )( targetPath, { bigint: true } ).catch ( Utils.lang.noop ); // Under Windows we need stats objects using bigints https://github.com/nodejs/node/issues/12115

    },

    readdir: async ( rootPath: string, ignore?: Ignore, depth: number = Infinity, signal?: { aborted: boolean } ): Promise<[string[], string[]]> => {

      const result = await readdir ( rootPath, { depth, ignore, signal } );

      return [result.directories, result.files];

    }

  }

};

/* EXPORT */

export default Utils;
