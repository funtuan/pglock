# pglock

基於 PostgreSQL 互斥鎖
依賴於 [advisory-lock](https://github.com/binded/advisory-lock/blob/master/README.md)

[![npm package](https://nodei.co/npm/pglock.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/pglock/)

## Usage

```javascript
import PGlock from 'pglock'

const pglock = new PGlock('postgres://user:pass@localhost:3475/dbname')

const mutex = pglock.mutex('some-lock-name')

async function runSerialTaskAsync() {
  await mutex.lock()
  try {
    // Do something...
  } finally {
    mutex.unlock()
  }
}
```

使用 trylock

```javascript
import PGlock from 'pglock'

const pglock = new PGlock('postgres://user:pass@localhost:3475/dbname')

const mutex = pglock.mutex('some-lock-name')

async function runSerialTaskAsync() {
  if (!await mutex.trylock()) {
    return
  }
  try {
    // Do something...
  } finally {
    mutex.unlock()
  }
}
});
```
