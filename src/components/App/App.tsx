import { useRef, useState } from 'react'
import './App.scss'

interface ILog {
  type: 'success' | 'error' | 'info'
  message: string
  id: number
}

function App() {
  const [logs, setLogs] = useState<ILog[]>([])
  const webCam = useRef<MediaStream | null>(null)
  const desktop = useRef<MediaStream | null>(null)
  const mixed = useRef<MediaStream | null>(null)

  const webcamRef = useRef<HTMLVideoElement>(null)
  const desktopRef = useRef<HTMLVideoElement>(null)
  const mixedRef = useRef<HTMLVideoElement>(null)

  function getWebCam() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: 1920,
        },
      })
      .then((stream) => {
        webcamRef.current!.srcObject = stream
        webCam.current = stream
        setLogs((p) => [
          ...p,
          {
            id: Date.now(),
            type: 'info',
            message: 'Получен видеопоток с веб камеры',
          },
        ])
      })
      .catch(() =>
        setLogs((p) => [
          ...p,
          {
            id: Date.now(),
            type: 'error',
            message: 'Ошибка получения доступа к веб камере',
          },
        ])
      )
  }

  function getDesktop() {
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((stream) => {
        desktop.current = stream
        desktopRef.current!.srcObject = stream
        setLogs((p) => [
          ...p,
          {
            id: Date.now(),
            type: 'info',
            message: 'Получен видеопоток рабочего стола',
          },
        ])
      })
      .catch(() =>
        setLogs((p) => [
          ...p,
          {
            id: Date.now(),
            type: 'error',
            message: 'Ошибка получения видео потока рабочего стола',
          },
        ])
      )
  }

  const merge = () => {
    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      // 1024x576 - 16:9
      canvas.width = 1024
      canvas.height = 576
      if (!desktop.current || !desktopRef.current) {
        return setLogs((p) => [
          ...p,
          {
            id: Date.now(),
            type: 'error',
            message: 'Видео поток демонстрации рабочего стола не найден',
          },
        ])
      }

      ;(function draw() {
        if (context) {
          context.drawImage(
            desktopRef.current as CanvasImageSource,
            0,
            0,
            canvas.width,
            canvas.height
          )

          // 200x150 - 4:3
          const w = 250
          const h = 150
          context.drawImage(
            webcamRef.current as CanvasImageSource,
            canvas.width - w,
            canvas.height - h,
            w,
            h
          )

          requestAnimationFrame(draw)
        }
      })()

      mixed.current = canvas.captureStream()
      mixedRef.current!.srcObject = mixed.current
      setLogs((p) => [
        ...p,
        {
          id: Date.now(),
          type: 'success',
          message: 'Слияние поток выполнено успешно',
        },
      ])
    } catch (e: any) {
      setLogs((p) => [
        ...p,
        {
          id: Date.now(),
          type: 'error',
          message: `ошибка слияния потоков - ${e.message}`,
        },
      ])
    }
  }

  return (
    <div className="container">
      <div className="video-wrapper">
        <div className="video  section">
          <video ref={webcamRef} muted autoPlay />
        </div>
        <div className="video section">
          <video ref={desktopRef} muted autoPlay />
        </div>
        <div className="video section">
          <video ref={mixedRef} muted autoPlay />
        </div>
        <div className="control">
          <button onClick={getWebCam}>camera</button>
          <button onClick={getDesktop}>desctop</button>
          <button onClick={merge}>merge</button>
        </div>
      </div>
      <div className="log-list">
        {logs.map((log) => (
          <div className={log.type}>
            {Date().normalize()} - {log.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
