'use strict'

const tty = require('./tty')

const delay = (timeout) => new Promise(resolve => { setTimeout(resolve, timeout) })

class Device {
  constructor (opts = {}) {
    this.address = opts.address
    this.name = opts.name
    this.args = opts.args || {}
    this.connected = false
  }

  onRecieveData (buffer) {
  }

  async writeData (buffer) {
    for (let offset = 0; offset < buffer.length; offset += 16) {
      if (offset) { await delay(20) } // Wait 20ms between each 16byte burst
      this.sendData(buffer.slice(offset, offset + 16))
    }
  }

  onDisconnect () {
    this.connected = false
    if (this._requestReject) {
      this._requestReject(new Error('Device disconnected'))
    }
    console.log(`Disconnected from ${this.name} (${this.address})`)
  }

  onConnect (sendData) {
    console.log(`Connected to ${this.name} (${this.address})`)
    this.connected = true
    this.sequence = Math.floor(Math.random() * 255)
    this.requestQueue = Promise.resolve()
    this.sendData = sendData

    async function run () {
      await tty(this)
    }

    setTimeout(() => {
      run.call(this).catch(err => {
        console.error(err)
      })
    }, 1000)
  }
}

module.exports = Device
