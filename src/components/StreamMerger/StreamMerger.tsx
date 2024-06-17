import { FC, useRef, useState } from 'react'
import './StreamMerger.scss'
import { Socket } from 'socket.io-client'
import { LogType } from '../App/App'
import { VideoStreamMerger } from 'video-stream-merger'

interface StreamMergerProps {
  setNewLog: (val: string, type: LogType) => void
  socket: Socket
}

export const StreamMerger: FC<StreamMergerProps> = ({ setNewLog, socket }) => {
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
      .getDisplayMedia({ video: true })
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
      if (!webCam.current || !desktop.current) return
      // @ts-expect-error 1234
      const merger = new VideoStreamMerger({
        width: 1920,
        height: 1080,
        fps: 60,
        clearRect: true,
      })
      // @ts-expect-error 1234
      merger.addStream(desktop.current, {
        x: 0, // position of the topleft corner
        y: 0,
        width: merger.width,
        height: merger.height,
        mute: true, // we don't want sound from the screen (if there is any)
      })

      // @ts-expect-error 1234
      merger.addStream(webCam.current, {
        x: merger.height - 350,
        y: 15,
        width: 335,
        height: 192,
        mute: false,
      })

      merger.start()

      mixed.current = merger.result
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
      mediaRecorder.current = new MediaRecorder(mixed.current)
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
