import { useEffect, useRef, useState } from "react"

import axios from "axios"

import {
  Mic,
  Square,
  Upload,
  Download,
  Brain,
  Trophy,
  MessageSquare
} from "lucide-react"

import { motion } from "framer-motion"

import {
  CircularProgressbar,
  buildStyles
} from "react-circular-progressbar"

import "react-circular-progressbar/dist/styles.css"

import useRecorder from "../hooks/useRecorder"

import generateReportPdf from "../utils/generateReportPdf"

const API = import.meta.env.VITE_API_URL

const MAX_DURATION = 60

const MAX_QUESTIONS = 10

function InterviewScreen() {

  // =====================================================
  // STATE
  // =====================================================

  const [syllabusText, setSyllabusText] =
    useState("")

  const [threadId, setThreadId] =
    useState("")

  const [question, setQuestion] =
    useState("")

  const [answer, setAnswer] =
    useState("")

  const [history, setHistory] =
    useState([])

  const [questionNumber, setQuestionNumber] =
    useState(0)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [interviewComplete, setInterviewComplete] =
    useState(false)

  const [report, setReport] =
    useState(null)

  const [timeLeft, setTimeLeft] =
    useState(MAX_DURATION)

  const [isThinking, setIsThinking] =
    useState(false)

  const [audioMetrics, setAudioMetrics] =
    useState({})

  const [visionMetrics, setVisionMetrics] =
    useState({})

  // =====================================================
  // REFS
  // =====================================================

  const videoRef = useRef(null)

  const mediaRecorderRef = useRef(null)

  const streamRef = useRef(null)

  const timerRef = useRef(null)

  const hasSubmittedRef = useRef(false)

  const audioPlayerRef = useRef(null)

  // =====================================================
  // RECORDER
  // =====================================================

  const {
    startRecording,
    stopRecording,
    isRecording
  } = useRecorder()

  const handlePdfUpload = async (event) => {

  const file = event.target.files[0]

  if (!file) return

  const formData = new FormData()

  formData.append("file", file)

  try {

    setIsThinking(true)

    const response =
      await axios.post(
        `${API}/interview/upload-syllabus`,
        formData
      )

    setSyllabusText(
      response.data.syllabus_text
    )

    alert("Syllabus uploaded successfully!")

  } catch (error) {

    console.error(error)

    alert("PDF upload failed")

  } finally {

    setIsThinking(false)
  }
}

  // =====================================================
  // TIMER
  // =====================================================

  useEffect(() => {

    if (!threadId) return

    if (interviewComplete) return

    setTimeLeft(MAX_DURATION)

    hasSubmittedRef.current = false

    if (timerRef.current) {

      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {

      setTimeLeft(prev => {

        if (prev <= 1) {

          clearInterval(timerRef.current)

          handleTimeUp()

          return 0
        }

        return prev - 1
      })

    }, 1000)

    return () => {

      if (timerRef.current) {

        clearInterval(timerRef.current)
      }
    }

  }, [question])

  // =====================================================
  // AUDIO
  // =====================================================

  const playAudio = (audioUrl) => {

    if (!audioUrl) return

    if (audioPlayerRef.current) {

      audioPlayerRef.current.pause()
    }

    const audio = new Audio(audioUrl)

    audioPlayerRef.current = audio

    audio.play()
  }

  // =====================================================
  // VIDEO RECORDING
  // =====================================================

  const startVideoRecording = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })

      streamRef.current = stream

      if (videoRef.current) {

        videoRef.current.srcObject =
          stream
      }

      const recorder =
        new MediaRecorder(stream, {
          mimeType: "video/webm"
        })

      const chunks = []

      recorder.ondataavailable =
        (event) => {

          if (event.data.size > 0) {

            chunks.push(event.data)
          }
        }

      recorder.videoChunks = chunks

      recorder.start()

      mediaRecorderRef.current =
        recorder

    } catch (error) {

      console.error(error)
    }
  }

  const stopVideoRecording = () => {

    return new Promise((resolve) => {

      const recorder =
        mediaRecorderRef.current

      if (!recorder) {

        resolve(null)

        return
      }

      recorder.onstop = () => {

        const blob = new Blob(
          recorder.videoChunks,
          {
            type: "video/webm"
          }
        )

        if (streamRef.current) {

          streamRef.current
            .getTracks()
            .forEach(track => track.stop())
        }

        resolve(blob)
      }

      recorder.stop()
    })
  }

  // =====================================================
  // START INTERVIEW
  // =====================================================

  const startInterview = async () => {

  if (!syllabusText.trim()) {

    alert("Please upload syllabus PDF first")

    return
  }

  try {

    setIsThinking(true)

    const response =
      await axios.post(
        `${API}/interview/start`,
        {
          syllabus_text:
            syllabusText,

          strictness: 5
        }
      )

    const data = response.data

    setThreadId(data.thread_id)

    setQuestion(data.question)

    setQuestionNumber(1)

    playAudio(data.audio_url)

  } catch (error) {

    console.error(error)

    alert("Failed to start interview")

  } finally {

    setIsThinking(false)
  }
}

  // =====================================================
  // SUBMIT ANSWER
  // =====================================================

  const resetInterview = () => {

  setThreadId("")

  setQuestion("")

  setAnswer("")

  setHistory([])

  setQuestionNumber(0)

  setInterviewComplete(false)

  setReport(null)

  setTimeLeft(MAX_DURATION)

  setAudioMetrics({})

  setVisionMetrics({})

  hasSubmittedRef.current = false

  // stop timer

  if (timerRef.current) {

    clearInterval(timerRef.current)
  }

  // stop audio

  if (audioPlayerRef.current) {

    audioPlayerRef.current.pause()
  }

  // stop webcam

  if (streamRef.current) {

    streamRef.current
      .getTracks()
      .forEach(track => track.stop())
  }

  // clear webcam preview

  if (videoRef.current) {

    videoRef.current.srcObject = null
  }
}

  const submitAnswer = async (
    customAnswer = null,
    audioData = {},
    visionData = {}
  ) => {

    if (hasSubmittedRef.current) return

    hasSubmittedRef.current = true

    if (isSubmitting) return

    setIsSubmitting(true)

    setIsThinking(true)

    const finalAnswer =
      customAnswer ||
      (
        answer.trim()
          ? answer
          : "[No Answer]"
      )

    try {

      const response =
        await axios.post(
          `${API}/interview/answer`,
          {
            thread_id: threadId,
            answer: finalAnswer,
            audio_metrics: audioData,
            vision_metrics: visionData
          }
        )

      const data = response.data

      setAnswer("")

      if (data.interview_complete) {

        setInterviewComplete(true)

        setReport(data.report)

        generateReportPdf(data.report)

        setTimeout(() => {

    resetInterview()

  }, 2000)

        return
      }

      setQuestion(
        data.next_question
      )

      setHistory(
        data.conversation || []
      )

      setQuestionNumber(
        prev => prev + 1
      )

      playAudio(data.audio_url)

    } catch (error) {

      console.error(error)

    } finally {

      setIsSubmitting(false)

      setIsThinking(false)
    }
  }

  // =====================================================
  // TIME UP
  // =====================================================

  const handleTimeUp = async () => {

    if (isRecording) {

      await handleRecording()

    } else {

      await submitAnswer()
    }
  }

  // =====================================================
  // RECORDING
  // =====================================================

  const handleRecording = async () => {

    if (!isRecording) {

      await startRecording()

      await startVideoRecording()

      return
    }

    try {

      const audioBlob =
        await stopRecording()

      const videoBlob =
        await stopVideoRecording()

      const audioFormData =
        new FormData()

      audioFormData.append(
        "audio",
        audioBlob,
        "recording.webm"
      )

      const audioResponse =
        await axios.post(
          `${API}/interview/upload-audio`,
          audioFormData
        )

      let vision = {}

      if (videoBlob) {

        const videoFormData =
          new FormData()

        videoFormData.append(
          "video",
          videoBlob,
          "recording.webm"
        )

        const videoResponse =
          await axios.post(
            `${API}/interview/upload-video`,
            videoFormData
          )

        vision =
          videoResponse.data
            .vision_metrics
      }

      const transcript =
        audioResponse.data.transcript

      const audio =
        audioResponse.data
          .audio_metrics

      setAudioMetrics(audio)

      setVisionMetrics(vision)

      setAnswer(transcript)

      await submitAnswer(
        transcript,
        audio,
        vision
      )

    } catch (error) {

      console.error(error)
    }
  }

  return (

    <div className="min-h-screen w-full bg-black text-white p-4 md:p-6 overflow-x-hidden">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">

        {/* LEFT */}

        <div className="space-y-6">

          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">

            <div className="flex items-center gap-4">

              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">

                <Brain size={30} />

              </div>

              <div>

                <h2 className="text-2xl font-bold">
                  AI Interviewer
                </h2>

                <p className="text-zinc-400">

                  {isThinking
                    ? "Thinking..."
                    : "Ready"}

                </p>

              </div>

            </div>

          </div>

          {/* TIMER */}

          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">

            <div className="w-40 h-40 mx-auto">

              <CircularProgressbar
                value={timeLeft}
                maxValue={MAX_DURATION}
                text={`${timeLeft}s`}
                styles={buildStyles({
                  textColor: "#fff",
                  pathColor: "#22c55e",
                  trailColor: "#27272a"
                })}
              />

            </div>

          </div>

          {/* VIDEO */}

          <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">

            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-[300px] object-cover"
            />

          </div>

        </div>

        {/* RIGHT */}

        <div className="lg:col-span-2 space-y-6">

          {/* HEADER */}

          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h1 className="text-4xl font-bold">
                AI Mock Interview
              </h1>

              <p className="text-zinc-400 mt-2">
                Question {questionNumber}/{MAX_QUESTIONS}
              </p>

            </div>

            <label className="bg-white text-black px-5 py-3 rounded-2xl cursor-pointer font-semibold flex items-center gap-3 hover:scale-105 transition-all">

              <Upload />

              Upload PDF

                <input
    type="file"
    accept=".pdf"
    hidden
    onChange={handlePdfUpload}
  />

            </label>

          </div>

          {/* START */}

          {!threadId && (

            <button
              onClick={startInterview}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 py-5 rounded-3xl text-xl font-bold hover:scale-[1.02]"
            >
              Start Interview
            </button>

          )}

          {/* QUESTION */}

          {threadId && (

            <motion.div
              key={question}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800"
            >

              <div className="flex items-center gap-3 mb-4">

                <MessageSquare />

                <h2 className="text-2xl font-bold">
                  Current Question
                </h2>

              </div>

              <p className="text-lg leading-relaxed">
                {question}
              </p>

            </motion.div>

          )}

          {/* ANSWER */}

          {threadId && (

            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">

              <textarea
                value={answer}
                onChange={(e) =>
                  setAnswer(e.target.value)
                }
                placeholder="Type your answer..."
                className="w-full h-52 bg-transparent outline-none resize-none text-lg"
              />

            </div>

          )}

          {/* CONTROLS */}

          {threadId && (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <button
                onClick={handleRecording}
                className={`py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                  isRecording
                    ? "bg-red-500 animate-pulse"
                    : "bg-green-500 hover:scale-105"
                }`}
              >

                {isRecording
                  ? <Square />
                  : <Mic />}

                {isRecording
                  ? "Stop Recording"
                  : "Start Recording"}

              </button>

              <button
                disabled={isSubmitting}
                onClick={() =>
                  submitAnswer()
                }
                className="bg-white text-black py-5 rounded-3xl font-bold text-lg hover:scale-105"
              >
                Submit Answer
              </button>

              <button
                disabled={isSubmitting}
                onClick={() =>
                  submitAnswer("finish")
                }
                className="bg-gradient-to-r from-red-500 to-pink-500 py-5 rounded-3xl font-bold text-lg hover:scale-105"
              >
                End Interview
              </button>

            </div>

          )}

        </div>

      </div>

    </div>
  )
}

export default InterviewScreen