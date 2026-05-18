import { useRef, useState } from "react"

function useRecorder() {

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const [isRecording, setIsRecording] = useState(false)

  const startRecording = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    const mediaRecorder = new MediaRecorder(stream)

    mediaRecorderRef.current = mediaRecorder

    chunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      chunksRef.current.push(event.data)
    }

    mediaRecorder.start()

    setIsRecording(true)
  }

  const stopRecording = () => {

    return new Promise((resolve) => {

      const mediaRecorder = mediaRecorderRef.current

      mediaRecorder.onstop = () => {

        const audioBlob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm"
          }
        )

        resolve(audioBlob)
      }

      mediaRecorder.stop()

      setIsRecording(false)
    })
  }

  return {
    startRecording,
    stopRecording,
    isRecording
  }
}

export default useRecorder