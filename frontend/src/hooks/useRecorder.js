import { useRef, useState } from "react"

function useRecorder() {

  const mediaRecorderRef = useRef(null)

  const streamRef = useRef(null)

  const chunksRef = useRef([])

  const [isRecording, setIsRecording] =
    useState(false)

  // ===== START RECORDING =====

  const startRecording = async () => {

    try {

      // ===== GET MICROPHONE =====

      const stream =
        await navigator.mediaDevices.getUserMedia({

          audio: true
        })

      streamRef.current = stream

      // ===== MEDIA RECORDER =====

      const mediaRecorder =
        new MediaRecorder(
          stream,
          {
            mimeType: "audio/webm"
          }
        )

      mediaRecorderRef.current =
        mediaRecorder

      chunksRef.current = []

      // ===== STORE AUDIO CHUNKS =====

      mediaRecorder.ondataavailable =
        (event) => {

          if (event.data.size > 0) {

            chunksRef.current.push(
              event.data
            )
          }
        }

      // ===== START =====

      mediaRecorder.start()

      setIsRecording(true)

    } catch (error) {

      console.error(
        "Audio recording error:",
        error
      )
    }
  }

  // ===== STOP RECORDING =====

  const stopRecording = () => {

    return new Promise((resolve) => {

      const mediaRecorder =
        mediaRecorderRef.current

      if (!mediaRecorder) {

        resolve(null)

        return
      }

      // ===== WHEN STOPPED =====

      mediaRecorder.onstop = () => {

        const audioBlob = new Blob(

          chunksRef.current,

          {
            type: "audio/webm"
          }
        )

        // ===== STOP MIC TRACKS =====

        if (streamRef.current) {

          streamRef.current
            .getTracks()
            .forEach(track => track.stop())
        }

        setIsRecording(false)

        resolve(audioBlob)
      }

      // ===== STOP =====

      mediaRecorder.stop()
    })
  }

  return {

    startRecording,

    stopRecording,

    isRecording
  }
}

export default useRecorder