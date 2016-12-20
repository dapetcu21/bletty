'use strict'

const pty = require('pty.js')

module.exports = async function tty (device) {
  const tty = pty.open(80, 25)
  console.log(tty.pty)

  const socket = tty.master
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
