### Version 1.1.1
- Aborting directories scans immediately when closing the watcher
- Ensuring the thread doesn’t get clogged during recursive directory scanning

### Version 1.1.0
- Node v12 is the minimum version supported
- Storing stripped-down stats objects in 50+% less memory
- Handling change events more reliably
- Ensuring the "depth" option is handled properly when native recursion is unavailable
- New option: "native", it allows for disabling the native recursive watcher

### Version 1.0.0
- Initial commit
