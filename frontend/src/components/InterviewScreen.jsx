import { useState } from "react"

import axios from "axios"

import Timer from "./Timer"

import useRecorder from "../hooks/useRecorder"



function InterviewScreen() {

  const [syllabusText, setSyllabusText] =
  useState("")

  const [question, setQuestion] =
    useState("")

  const [threadId, setThreadId] =
    useState("")

  const [answer, setAnswer] =
    useState("")

  const [history, setHistory] =
    useState([])

  const [
    interviewComplete,
    setInterviewComplete
  ] = useState(false)

  const [report, setReport] =
    useState(null)

  const [
    questionNumber,
    setQuestionNumber
  ] = useState(0)

  const {
    startRecording,
    stopRecording,
    isRecording
  } = useRecorder()

  // ===== PLAY AUDIO =====

  const playAudio = (audioUrl) => {

    if (!audioUrl) return

    const audio =
      new Audio(audioUrl)

    audio.play()
  }

  // ===== SUBMIT ANSWER =====

  const submitAnswer = async (
    customAnswer = null
  ) => {

    const finalAnswer =

      customAnswer ||

      (answer.trim()
        ? answer
        : "[No Answer Provided]")

    try {

      const response =
        await axios.post(
          "http://127.0.0.1:8000/interview/answer",
          {
            thread_id: threadId,
            answer: finalAnswer
          }
        )

      setAnswer("")

      // ===== INTERVIEW ENDED =====

      if (
        response.data.interview_complete
      ) {

        setInterviewComplete(true)

        setReport(
          response.data.report
        )

      }

      // ===== NEXT QUESTION =====

      else {

        setQuestion(
          response.data.next_question
        )

        setHistory(
          response.data.conversation || []
        )

        // Reset timer
        setQuestionNumber(
          prev => prev + 1
        )

        playAudio(
          response.data.audio_url
        )
      }

    } catch (error) {

      console.error(error)
    }
  }

  // ===== RECORDING =====

  const handleRecording = async () => {

    // ===== START =====

    if (!isRecording) {

      await startRecording()
    }

    // ===== STOP =====

    else {

      const audioBlob =
        await stopRecording()

      const formData =
        new FormData()

      formData.append(
        "audio",
        audioBlob,
        "recording.webm"
      )

      try {

        const response =
          await axios.post(
            "http://127.0.0.1:8000/interview/upload-audio",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data"
              }
            }
          )

        const transcript =
          response.data.transcript

        setAnswer(transcript)

        // Auto submit
        await submitAnswer(
          transcript
        )

      } catch (error) {

        console.error(error)
      }
    }
  }
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
        "http://127.0.0.1:8000/interview/upload-syllabus",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data"
          }
        }
      )

    setSyllabusText(
      response.data.syllabus_text
    )

    console.log(
      response.data.syllabus_text
    )

  } catch (error) {

    console.error(error)
  }
}

  // ===== START INTERVIEW =====

  const startInterview = async () => {

    try {

      const response =
        await axios.post(
          "http://127.0.0.1:8000/interview/start",
          {
            syllabus_text: syllabusText,
            strictness: 5
          }
        )

      setQuestion(
        response.data.question
      )

      setThreadId(
        response.data.thread_id
      )

      setQuestionNumber(1)

      playAudio(
        response.data.audio_url
      )

    } catch (error) {

      console.error(error)
    }
  }

  // ===== REPORT SCREEN =====

  if (interviewComplete) {

    return (

      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-lg">

        <h1 className="text-3xl font-bold mb-6">
          Interview Report
        </h1>

        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto">

          {JSON.stringify(
            report,
            null,
            2
          )}

        </pre>

      </div>
    )
  }

  // ===== MAIN SCREEN =====

  return (

    <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-lg">

      <h1 className="text-3xl font-bold mb-6">
        AI Mock Interview
      </h1>

      <div className="mb-6">

  <input
    type="file"
    accept=".pdf"
    onChange={handlePdfUpload}
  />

</div>

      {/* ===== START BUTTON ===== */}

      {!threadId && (

        <button
          onClick={startInterview}
          className="bg-black text-white px-5 py-2 rounded-lg"
        >
          Start Interview
        </button>

      )}

      {/* ===== INTERVIEW UI ===== */}

      {threadId && (

        <div className="space-y-6">

          {/* ===== TIMER ===== */}

          <Timer
            key={questionNumber}
            duration={60}
            onTimeUp={submitAnswer}
          />

          {/* ===== QUESTION ===== */}

          <div className="border rounded-lg p-5">

            <h2 className="font-semibold mb-3">
              Current Question
            </h2>

            <p>{question}</p>

          </div>

          {/* ===== RECORDING ===== */}

          <div className="flex gap-4">

            <button
              onClick={handleRecording}
              className={`px-5 py-2 rounded-lg text-white ${
                isRecording
                  ? "bg-red-500"
                  : "bg-green-500"
              }`}
            >

              {isRecording
                ? "Stop Recording"
                : "Start Recording"}

            </button>

          </div>

          {/* ===== TEXTAREA ===== */}

          <textarea
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            placeholder="Type your answer..."
            className="w-full border rounded-lg p-4 h-40"
          />

          {/* ===== ACTIONS ===== */}

          <div className="flex gap-4">

            <button
              onClick={() =>
                submitAnswer()
              }
              className="bg-black text-white px-5 py-2 rounded-lg"
            >
              Submit Answer
            </button>

            <button
              onClick={() =>
                submitAnswer("finish")
              }
              className="bg-red-500 text-white px-5 py-2 rounded-lg"
            >
              End Interview
            </button>

          </div>

          {/* ===== CONVERSATION ===== */}

          <div>

            <h2 className="text-2xl font-bold mb-4">
              Conversation
            </h2>

            <div className="space-y-4">

              {history.map(
                (item, index) => (

                  <div
                    key={index}
                    className="border rounded-lg p-4"
                  >

                    <p className="font-semibold">

                      {item.role === "interviewer"
                        ? "Interviewer"
                        : "Candidate"}

                    </p>

                    <p className="mt-2">
                      {item.content}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default InterviewScreen