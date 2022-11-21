
/* IMPORT */

import Utils from './utils';

/* MAIN */

//TODO: Maybe publish this as a standalone module

class LazyMapSet<K, V> {

  /* VARIABLES */

  private map: Map<K, Set<V> | V> = new Map ();

  /* API */

  clear (): void {

    this.map.clear ();

  }

  delete ( key: K, value?: V ): boolean {

    if ( Utils.lang.isUndefined ( value ) ) {

      return this.map.delete ( key );

    } else if ( this.map.has ( key ) ) {

      const values = this.map.get ( key );

      if ( Utils.lang.isSet ( values ) ) {

        const deleted = values.delete ( value );

        if ( !values.size ) {

          this.map.delete ( key );

        }

        return deleted;

      } else if ( values === value ) {

        this.map.delete ( key );

        return true;

      }

    }

    return false;

  }

  find ( key: K, iterator: ( value: V ) => boolean ): V | undefined {

    if ( this.map.has ( key ) ) {

      const values = this.map.get ( key );

      if ( Utils.lang.isSet ( values ) ) {

        return Array.from ( values ).find ( iterator );

      } else if ( iterator ( values! ) ) { //TSC

        return values;

      }

    }

    return undefined;

  }

  get ( key: K ): Set<V> | V | undefined {

    return this.map.get ( key );

  }

  has ( key: K, value?: V ): boolean {

    if ( Utils.lang.isUndefined ( value ) ) {

      return this.map.has ( key );

    } else if ( this.map.has ( key ) ) {

      const values = this.map.get ( key );

      if ( Utils.lang.isSet ( values ) ) {

        return values.has ( value );

      } else {

        return ( values === value );

      }

    }

    return false;

  }

  set ( key: K, value: V ): this {

    if ( this.map.has ( key ) ) {

      const values = this.map.get ( key );

      if ( Utils.lang.isSet ( values ) ) {

        values.add ( value );

      } else if ( values !== value ) {

        this.map.set ( key, new Set ([ values!, value ]) ); //TSC

      }

    } else {

      this.map.set ( key, value );

    }

    return this;

  }

}

/* EXPORT */

export default LazyMapSet;
