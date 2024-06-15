import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import cors from 'cors'

import { path } from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
import { saveData } from './saveData.js'

ffmpeg.setFfmpegPath(path)

const app = express()
const server = createServer(app)
app.use(cors())

const io = new Server(server, {
  cors: {
    origin: '*',
  },
  serveClient: false,
})

const dataChunks = []

io.on('connection', (socket) => {
  socket.on('start-record', ({ data }) => {
    dataChunks.push(data)
  })
  socket.on('stop-record', async () => {
    try {
      await saveData(dataChunks)
      io.to(socket.id).emit('record-finished')
      dataChunks.length = 0
    } catch (e) {
      io.to(socket.id).emit('record-error', { message: e.message })
      dataChunks.length = 0
    }
  })
})

server.listen('5000', () => console.log('Server started on port 5000'))
