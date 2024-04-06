### Version 2.3.1
- Readme: updated with new Node recursive developments (#37)
- Updated some dependencies

### Version 2.3.0
- Replaced ripstat with stubborn-fs directly, for simplicity

### Version 2.2.2
- Updated "dettle", to ensure debounce delays of 0 are handled properly

### Version 2.2.1
- Replaced "debounce" with "dettle"

### Version 2.2.0
- Added support for ignoring paths with a regex

### Version 2.1.0
- Readme: added a mention about a high renameTimeout value
- Updated dependencies
- Exposed the "limit" option from "tiny-readdir"
- Ensuring relative paths can be watched too
- CI: ignoring Node v14
- Added support for detecting case-sensitive renames in case-insensitive filesystems

### Version 2.0.0
- Added 4 more tests regarding empty directories
- Added a test using "touch" specifically
- Added a GH CI workflow
- Updated test workflow
- Fixed an issue where not all internal watchers were being disposed of on close
- Switched to ESM

### Version 1.2.0
- Added support for passing a readdir map, in order to potentially deduplicate away the potential initial scan the library needs

### Version 1.1.2
- Deleted repo-level github funding.yml
- Using "ripstat" for retrieving stats objects faster

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
