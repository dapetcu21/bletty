'use strict'

const pty = require('pty.js/build/Release/pty.node')
const fs = require('fs')

module.exports = async function tty (device) {
  const tty = pty.open(80, 25)
  console.log(tty.pty)

  const socket = fs.createReadStream(null, { fd: tty.master, highWaterMark: 16 })
  // const socket = tty.master
  socket.on('error', err => {
    console.error(err)
    process.exit(1)
  })

  socket.on('data', data => {
    socket.pause()
    device.writeData(Buffer.from(data))
      .then(() => socket.resume())
      .catch(err => {
        console.error(err)
        process.exit(1)
      })
  })
  socket.resume()

  device.onRecieveData = data => {
    socket.write(data)
  }
}
