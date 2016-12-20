#!/usr/bin/env node --harmony-async-await

'use strict'

const minimist = require('minimist')
const noble = require('noble')

const help = require('./src/help')
const Device = require('./src/device')

const args = minimist(process.argv.slice(2))

if (args.h || args.help) {
  help()
  process.exit(1)
}

const serviceUUID = args.service || args.s || 'ffe0'
const characteristicUUID = args.characteristic || args.c || 'ffe1'
const deviceAddress = (args.device || args.d || '').toString().toLowerCase()

noble.on('discover', peripheral => {
  const address = peripheral.address
  let name = peripheral.advertisement.localName
  if (deviceAddress && address.toLowerCase().indexOf(deviceAddress) === -1) {
    return
  }

  console.log(`Found ${name} (${address})`)

  peripheral.connect(error => {
    if (error) { console.error(error); return }

    peripheral.discoverServices([], (error, services) => {
      if (error) { console.error(error); peripheral.disconnect(); return }
      const service = services.find(s => s.uuid === serviceUUID)
      if (!service) { return }

      service.discoverCharacteristics([], (error, characteristics) => {
        if (error) { console.error(error); peripheral.disconnect(); return }
        const characteristic = characteristics.find(c => c.uuid === characteristicUUID)
        if (!characteristic) { return }

        noble.stopScanning()

        let device = new Device({ address, name, args })

        device.onConnect((buf) => {
          device && characteristic.write(buf, true)
        })

        peripheral.once('disconnect', () => {
          peripheral.disconnect()
          device.onDisconnect()
          device = null
        })

        characteristic.on('data', (buffer) => {
          device && device.onRecieveData(buffer)
        })
        characteristic.subscribe()
      })
    })
  })
})

const onStateChange = state => {
  switch (state) {
    case 'poweredOn':
      noble.startScanning([serviceUUID])
      return
    case 'unsupported':
    case 'unauthorized':
      throw new Error(`BLE state "${state}"`)
    default:
      noble.once('stateChange', onStateChange)
  }
}
noble.once('stateChange', onStateChange)

