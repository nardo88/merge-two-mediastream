import { useEffect, useRef, useState } from 'react'
import { Socket, io } from 'socket.io-client'
import './App.scss'
import { Canvas } from '../Canvas/Canvas'
import { StreamMerger } from '../StreamMerger/StreamMerger'

export type LogType = 'success' | 'error' | 'info'

interface ILog {
  type: LogType
  message: string
  id: number
}

function App() {
  const socket = useRef<Socket | null>(null)
  const [logs, setLogs] = useState<ILog[]>([])
  const [active, setActive] = useState<'canvas' | 'stream-merger'>('canvas')

  function setNewLog(message: string, type: LogType) {
    setLogs((p) => [...p, { id: Date.now(), message, type }])
  }

  useEffect(() => {
    socket.current = io('http://localhost:5000')

    socket.current.on('record-finished', () =>
      setNewLog('Видео сохранено', 'success')
    )
    socket.current.on('record-error', () =>
      setNewLog('Ошибка сохранения видео', 'error')
    )
  }, [])

  return (
    <div className="container">
      <div className="tab-wrapper">
        <div
          className={`tab-item ${active === 'canvas' && 'active'}`}
          onClick={() => setActive('canvas')}>
          canvas
        </div>
        <div
          className={`tab-item ${active === 'stream-merger' && 'active'}`}
          onClick={() => setActive('stream-merger')}>
          stream-merger
        </div>
      </div>
      {socket.current && (
        <div className="content">
          {active === 'canvas' && (
            <Canvas setNewLog={setNewLog} socket={socket.current} />
          )}

          {active === 'stream-merger' && (
            <StreamMerger setNewLog={setNewLog} socket={socket.current} />
          )}
        </div>
      )}
      <div className="log-list">
        {logs.map((log) => (
          <div className={log.type} key={log.id}>
            {Date().normalize()} - {log.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
