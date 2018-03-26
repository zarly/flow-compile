# flow-compile

Recursive find *.fl files and run remove-flow-types for each of them.
Useful for using flowtypes in Node.js without source maps.

```$bash
npm install -g flow-compile
flow-compile ./path
```

or

```$javascript
const flowCompile = require('flow-compile');
flowCompile.compile('./path'); // async, returns Promise
```
