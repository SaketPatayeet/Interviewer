import { useEffect, useRef, useState } from "react"

import axios from "axios"

import {
  Mic,
  Square,
  Upload,
  Download,
  Brain,
  Timer as TimerIcon,
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



const API =
  "http://127.0.0.1:8000"

const MAX_DURATION = 60

const MAX_QUESTIONS = 10



function InterviewScreen() {

  // ======================================================
  // STATE
  // ======================================================

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

  // ======================================================
  // VIDEO
  // ======================================================

  const videoRef = useRef(null)

  const [mediaRecorder, setMediaRecorder] =
    useState(null)

  const [stream, setStream] =
    useState(null)

  // ======================================================
  // RECORDER
  // ======================================================

  const {
    startRecording,
    stopRecording,
    isRecording
  } = useRecorder()

  // ======================================================
  // TIMER
  // ======================================================

  useEffect(() => {

    if (!threadId) return

    if (interviewComplete) return

    const interval = setInterval(() => {

      setTimeLeft(prev => {

        if (prev <= 1) {

          clearInterval(interval)

          handleTimeUp()

          return 0
        }

        return prev - 1
      })

    }, 1000)

    return () =>
      clearInterval(interval)

  }, [questionNumber])

  const resetTimer = () => {

    setTimeLeft(MAX_DURATION)
  }

  const handleTimeUp = async () => {

    if (isRecording) {

      await handleRecording()

    } else {

      await submitAnswer()
    }
  }

  // ======================================================
  // AUDIO
  // ======================================================

  const playAudio = (audioUrl) => {

    if (!audioUrl) return

    const audio = new Audio(audioUrl)

    audio.play()
  }

  // ======================================================
  // VIDEO RECORDING
  // ======================================================

  const startVideoRecording = async () => {

    try {

      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })

      setStream(mediaStream)

      if (videoRef.current) {

        videoRef.current.srcObject =
          mediaStream
      }

      const recorder =
        new MediaRecorder(mediaStream, {
          mimeType: "video/webm"
        })

      recorder.start()

      setMediaRecorder(recorder)

    } catch (error) {

      console.error(error)
    }
  }

  const stopVideoRecording = () => {

    return new Promise((resolve) => {

      if (!mediaRecorder) {

        resolve(null)

        return
      }

      const chunks = []

      mediaRecorder.ondataavailable =
        (event) => {

          if (event.data.size > 0) {

            chunks.push(event.data)
          }
        }

      mediaRecorder.onstop = () => {

        const blob = new Blob(
          chunks,
          {
            type: "video/webm"
          }
        )

        if (stream) {

          stream
            .getTracks()
            .forEach(track => track.stop())
        }

        resolve(blob)
      }

      mediaRecorder.stop()
    })
  }

  // ======================================================
  // START INTERVIEW
  // ======================================================

  const startInterview = async () => {

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

      resetTimer()

    } catch (error) {

      console.error(error)

    } finally {

      setIsThinking(false)
    }
  }

  // ======================================================
  // SUBMIT ANSWER
  // ======================================================

  const submitAnswer = async (
    customAnswer = null,
    audioData = {},
    visionData = {}
  ) => {

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

        return
      }

      setQuestion(data.next_question)

      setHistory(
        data.conversation || []
      )

      setQuestionNumber(
        prev => prev + 1
      )

      playAudio(data.audio_url)

      resetTimer()

    } catch (error) {

      console.error(error)

    } finally {

      setIsSubmitting(false)

      setIsThinking(false)
    }
  }

  // ======================================================
  // RECORDING
  // ======================================================

  const handleRecording = async () => {

    // ===== START =====

    if (!isRecording) {

      await startRecording()

      await startVideoRecording()

      return
    }

    // ===== STOP =====

    try {

      const audioBlob =
        await stopRecording()

      const videoBlob =
        await stopVideoRecording()

      // ===== AUDIO =====

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

      // ===== VIDEO =====

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

  // ======================================================
  // PDF UPLOAD
  // ======================================================

  const handlePdfUpload = async (
    event
  ) => {

    const file =
      event.target.files[0]

    if (!file) return

    const formData =
      new FormData()

    formData.append(
      "file",
      file
    )

    try {

      const response =
        await axios.post(
          `${API}/interview/upload-syllabus`,
          formData
        )

      setSyllabusText(
        response.data.syllabus_text
      )

    } catch (error) {

      console.error(error)
    }
  }

  // ======================================================
  // REPORT SCREEN
  // ======================================================

  if (interviewComplete) {

    return (

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-10">

        <div className="max-w-5xl mx-auto">

          <motion.div
            initial={{
              opacity: 0,
              y: 30
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl"
          >

            <div className="text-center mb-10">

              <Trophy
                size={60}
                className="mx-auto mb-4 text-yellow-400"
              />

              <h1 className="text-5xl font-bold mb-4">
                Interview Report
              </h1>

              <p className="text-6xl font-bold text-green-400">
                {report.final_score}/10
              </p>

            </div>

            <div className="space-y-8">

              <div>

                <h2 className="text-2xl font-bold mb-3">
                  Overall Performance
                </h2>

                <p className="text-gray-300">
                  {
                    report.overall_performance
                  }
                </p>

              </div>

              <div>

                <h2 className="text-2xl font-bold mb-3">
                  Strengths
                </h2>

                <div className="grid gap-3">

                  {report.strengths.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl"
                      >
                        {item}
                      </div>

                    )
                  )}

                </div>

              </div>

              <div>

                <h2 className="text-2xl font-bold mb-3">
                  Weaknesses
                </h2>

                <div className="grid gap-3">

                  {report.weaknesses.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl"
                      >
                        {item}
                      </div>

                    )
                  )}

                </div>

              </div>

              <div>

                <h2 className="text-2xl font-bold mb-3">
                  Suggestions
                </h2>

                <div className="grid gap-3">

                  {report.suggestions.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl"
                      >
                        {item}
                      </div>

                    )
                  )}

                </div>

              </div>

              <button
                onClick={() =>
                  generateReportPdf(report)
                }
                className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
              >

                <Download />

                Download PDF Report

              </button>

            </div>

          </motion.div>

        </div>

      </div>
    )
  }

  // ======================================================
  // MAIN UI
  // ======================================================

  return (

    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-6">

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

        {/* ================================================= */}
        {/* LEFT PANEL */}
        {/* ================================================= */}

        <div className="space-y-6">

          {/* ===== AI CARD ===== */}

          <motion.div
            initial={{
              opacity: 0,
              x: -20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
          >

            <div className="flex items-center gap-4">

              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">

                <Brain size={32} />

              </div>

              <div>

                <h2 className="text-2xl font-bold">
                  AI Interviewer
                </h2>

                <p className="text-gray-400">

                  {isThinking
                    ? "Thinking..."
                    : "Ready"}

                </p>

              </div>

            </div>

          </motion.div>

          {/* ===== TIMER ===== */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

            <div className="w-40 mx-auto">

              <CircularProgressbar
                value={timeLeft}
                maxValue={MAX_DURATION}
                text={`${timeLeft}s`}
                styles={buildStyles({
                  textColor: "#fff",
                  pathColor: "#22c55e",
                  trailColor:
                    "rgba(255,255,255,0.1)"
                })}
              />

            </div>

          </div>

          {/* ===== VIDEO ===== */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">

            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-[300px] object-cover"
            />

          </div>

          {/* ===== METRICS ===== */}

          <div className="grid grid-cols-2 gap-4">

            <MetricCard
              title="Confidence"
              value={
                audioMetrics.confidence ||
                "--"
              }
            />

            <MetricCard
              title="Eye Contact"
              value={
                visionMetrics.eye_contact ||
                "--"
              }
            />

            <MetricCard
              title="Speech Rate"
              value={
                audioMetrics.speaking_rate ||
                "--"
              }
            />

            <MetricCard
              title="Posture"
              value={
                visionMetrics.posture ||
                "--"
              }
            />

          </div>

        </div>

        {/* ================================================= */}
        {/* RIGHT PANEL */}
        {/* ================================================= */}

        <div className="lg:col-span-2 space-y-6">

          {/* ===== HEADER ===== */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-center justify-between">

            <div>

              <h1 className="text-4xl font-bold">
                AI Mock Interview
              </h1>

              <p className="text-gray-400 mt-2">
                Question {questionNumber}
                {" "}
                /
                {" "}
                {MAX_QUESTIONS}
              </p>

            </div>

            <label className="bg-white text-black px-5 py-3 rounded-2xl cursor-pointer font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-3">

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

          {/* ===== START ===== */}

          {!threadId && (

            <button
              onClick={startInterview}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 py-5 rounded-3xl text-xl font-bold hover:scale-[1.02] transition-all duration-300"
            >
              Start Interview
            </button>

          )}

          {/* ===== QUESTION ===== */}

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
              className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
            >

              <div className="flex items-center gap-3 mb-5">

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

          {/* ===== ANSWER ===== */}

          {threadId && (

            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6">

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

          {/* ===== CONTROLS ===== */}

          {threadId && (

            <div className="flex gap-4">

              <div className="flex gap-4">

  {/* ===== RECORD ===== */}

  <button
    onClick={handleRecording}
    className={`flex-1 py-5 rounded-3xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
      isRecording
        ? "bg-red-500 animate-pulse scale-105"
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

  {/* ===== SUBMIT ===== */}

  <button
    disabled={isSubmitting}
    onClick={() =>
      submitAnswer()
    }
    className="flex-1 bg-white text-black py-5 rounded-3xl font-bold text-lg hover:scale-105 transition-all duration-300"
  >
    Submit Answer
  </button>

  {/* ===== END INTERVIEW ===== */}

  <button
    disabled={isSubmitting}
    onClick={() =>
      submitAnswer("finish")
    }
    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-5 rounded-3xl font-bold text-lg hover:scale-105 transition-all duration-300"
  >
    End Interview
  </button>

</div>

              

            </div>

          )}

        </div>

      </div>

    </div>
  )
}



function MetricCard({
  title,
  value
}) {

  return (

    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-5">

      <p className="text-gray-400 text-sm">
        {title}
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {value}
      </h3>

    </div>
  )
}



export default InterviewScreen