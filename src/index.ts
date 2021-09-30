
const { default: advisoryLock } = require('advisory-lock')

// memory lock
class AwaitLock {
  acquiredList: any
  constructor() {
    this.acquiredList = {}
  }

  lock(key: string) {
    if (!this.acquiredList[key]) {
      this.acquiredList[key] = {
        lock: true,
        resolveFunc: [],
      }
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      this.acquiredList[key].resolveFunc.push(resolve)
    })
  }

  tryLock(key: string) {
    if (!this.acquiredList[key]) {
      this.acquiredList[key] = {
        lock: true,
        resolveFunc: [],
      }
      return true
    }

    return false
  }

  unlock(key: string) {
    if (!this.acquiredList[key]) {
      return false
    }

    if (this.acquiredList[key].resolveFunc.length > 0) {
      const resolve = this.acquiredList[key].resolveFunc.shift()
      resolve()
      return true
    } else {
      delete this.acquiredList[key]
      return false
    }
  }
}

// memory lock + pg advisory lock
class AdvisoryLock {
  key: string
  mutex: any
  awaitLock: AwaitLock

  constructor(key: string, {
    mutex,
    awaitLock,
  }: {
    mutex: any,
    awaitLock: AwaitLock,
  }) {
    this.key = key
    this.mutex = mutex
    this.awaitLock = awaitLock
  }

  async tryLock() {
    const localLockStatus = await this.awaitLock.tryLock(this.key)
    if (!localLockStatus) {
      return false
    }
    return this.mutex.tryLock(this.key)
  }

  async unlock() {
    if (await this.awaitLock.unlock(this.key)) {
      return
    }

    return await this.mutex.unlock(this.key)
  }

  async lock() {
    await this.awaitLock.lock(this.key)
    return await this.mutex.lock(this.key)
  }
}


class PGLock {
  advisoryLockMain: any
  awaitLock: AwaitLock

  constructor(conString: string) {
    this.advisoryLockMain = advisoryLock(conString)
    this.awaitLock = new AwaitLock()
  }

  mutex(key: string) {
    return new AdvisoryLock(key, {
      mutex: this.advisoryLockMain(key),
      awaitLock: this.awaitLock,
    })
  }
}

module.exports = PGLock