import { useRef, useState } from 'react'
import './App.scss'

async function getDesktop() {
  return await navigator.mediaDevices.getDisplayMedia({ video: true })
}

interface ILog {
  type: 'success' | 'error' | 'info'
  message: string
  id: number
}

function App() {
  const [logs, setLogs] = useState<ILog[]>([])
  const webCam = useRef<MediaStream | null>(null)
  const desctop = useRef<MediaStream | null>(null)

  const webcamRef = useRef<HTMLVideoElement>(null)
  const desctopRef = useRef<HTMLVideoElement>(null)

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

  // let canvas = document.createElement('canvas')
  // let context = canvas.getContext('2d')

  // // 1024x576 - 16:9
  // canvas.width = 1024
  // canvas.height = 576
  // ;(function draw() {
  //   context.drawImage(desktop, 0, 0, canvas.width, canvas.height)

  //   // 200x150 - 4:3
  //   let w = 200
  //   let h = 150
  //   context.drawImage(webCam, canvas.width - w, canvas.height - h, w, h)

  //   requestAnimationFrame(draw)
  // })()

  // // Вот тут вы получаете тот результат который хотели
  // let resultMediaStream = canvas.captureStream()

  // // Но для примера выводим на страницу
  // let video = streamToVideo(resultMediaStream)
  // document.body.appendChild(video)

  // function streamToVideo(stream) {
  //   let video = document.createElement('video')

  //   video.srcObject = stream

  //   video.style.width = stream.width
  //   video.style.height = stream.height

  //   video.play()

  //   return video
  // }

  return (
    <div className="container">
      <div className="video-wrapper">
        <div className="video  section">
          <video ref={webcamRef} muted autoPlay />
        </div>
        <div className="video  section">
          <video ref={desctopRef} muted autoPlay />
        </div>
        <div className="video  section">
          <video ref={desctopRef} muted autoPlay />
        </div>
        <div className="control">
          <button onClick={getWebCam}>camera</button>
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
