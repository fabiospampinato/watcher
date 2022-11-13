
/* MAIN */

// Registering a single interval scales much better than registering N timeouts
// Timeouts are respected within the interval margin

const WatcherLocksResolver = {

  /* VARIABLES */

  interval: 100,
  intervalId: undefined as NodeJS.Timeout | undefined,
  fns: new Map<Function, number> (),

  /* LIFECYCLE API */

  init: (): void => {

    if ( WatcherLocksResolver.intervalId ) return;

    WatcherLocksResolver.intervalId = setInterval ( WatcherLocksResolver.resolve, WatcherLocksResolver.interval );

  },

  reset: (): void => {

    if ( !WatcherLocksResolver.intervalId ) return;

    clearInterval ( WatcherLocksResolver.intervalId );

    delete WatcherLocksResolver.intervalId;

  },

  /* API */

  add: ( fn: Function, timeout: number ): void => {

    WatcherLocksResolver.fns.set ( fn, Date.now () + timeout );

    WatcherLocksResolver.init ();

  },

  remove: ( fn: Function ): void => {

    WatcherLocksResolver.fns.delete ( fn );

  },

  resolve: (): void => {

    if ( !WatcherLocksResolver.fns.size ) return WatcherLocksResolver.reset ();

    const now = Date.now ();

    for ( const [fn, timestamp] of WatcherLocksResolver.fns ) {

      if ( timestamp >= now ) continue; // We should still wait some more for this

      WatcherLocksResolver.remove ( fn );

      fn ();

    }

  }

};

/* EXPORT */

export default WatcherLocksResolver;
