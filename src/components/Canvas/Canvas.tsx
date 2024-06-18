import { FC, useRef, useState } from 'react'
import { LogType } from '../App/App'
import { Socket } from 'socket.io-client'
import './Canvas.scss'

interface CanvasProps {
  setNewLog: (val: string, type: LogType) => void
  socket: Socket
}

export const Canvas: FC<CanvasProps> = ({ setNewLog, socket }) => {
  const [isRecord, setIsRecord] = useState(false)

  const webCam = useRef<MediaStream | null>(null)
  const desktop = useRef<MediaStream | null>(null)
  const mixed = useRef<MediaStream | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  const webcamRef = useRef<HTMLVideoElement>(null)
  const desktopRef = useRef<HTMLVideoElement>(null)
  const mixedRef = useRef<HTMLVideoElement>(null)

  function getWebCam() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: 1920,
          height: 1080,
        },
      })
      .then((stream) => {
        webcamRef.current!.srcObject = stream
        webCam.current = stream
        setNewLog('Получен видеопоток с веб камеры', 'info')
      })
      .catch(() => setNewLog('Ошибка получения доступа к веб камере', 'error'))
  }

  function getDesktop() {
    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          width: 1920,
          height: 1080,
        },
      })
      .then((stream) => {
        desktop.current = stream
        desktopRef.current!.srcObject = stream
        setNewLog('Получен видеопоток рабочего стола', 'info')
      })
      .catch(() =>
        setNewLog('Ошибка получения видео потока рабочего стола', 'error')
      )
  }

  const merge = () => {
    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = 1920
      canvas.height = 1080
      if (!desktop.current || !desktopRef.current) {
        setNewLog('Видео поток демонстрации рабочего стола не найден', 'error')
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
      setNewLog('Слияние поток выполнено успешно', 'success')
    } catch (e: any) {
      setNewLog(`ошибка слияния потоков - ${e.message}`, 'error')
    }
  }

  const startRecord = () => {
    if (!mixed.current) {
      return setNewLog('Основной поток для записи не найден', 'error')
    }

    try {
      setIsRecord(true)
      mediaRecorder.current = new MediaRecorder(mixed.current, {
        mimeType: 'video/webm',
        videoBitsPerSecond: 8000000,
      })

      mediaRecorder.current.ondataavailable = ({ data }) => {
        socket.emit('start-record', {
          data,
        })
      }

      // mediaRecorder.current.onstop = stopRecord
      mediaRecorder.current.start(250)
      setNewLog('Включена запись видео', 'info')
    } catch (e: any) {
      setIsRecord(false)
      setNewLog(`Ошибка записи - ${e.message}`, 'error')
    }
  }
  const stopRecord = () => {
    setIsRecord(false)
    socket.emit('stop-record')
    mediaRecorder.current!.ondataavailable = null
    mediaRecorder.current = null
    setNewLog('Запись видео остановлена', 'info')
  }
  return (
    <div>
      <div className="video-wrapper">
        <div className="video  section">
          <video ref={webcamRef} muted autoPlay />
        </div>
        <div className="video section">
          <video ref={desktopRef} muted autoPlay />
        </div>
        <div className="video section mix">
          {isRecord && <span className="recording">Rec</span>}
          <video ref={mixedRef} muted autoPlay />
        </div>
        <div className="control">
          <button onClick={getWebCam}>camera</button>
          <button onClick={getDesktop}>desctop</button>
          <button onClick={merge}>merge</button>
          <button onClick={startRecord}>start record</button>
          <button onClick={stopRecord}>stop record</button>
        </div>
      </div>
    </div>
  )
}
