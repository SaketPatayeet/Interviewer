import { useEffect, useRef, useState } from "react"

function Timer({

  duration,

  question,

  onTimeUp
}) {

  const [timeLeft, setTimeLeft] =
    useState(duration)

  const hasTriggeredRef =
    useRef(false)

  const intervalRef =
    useRef(null)

  // ===== RESET ONLY WHEN QUESTION CHANGES =====

  useEffect(() => {

    // ===== RESET =====

    setTimeLeft(duration)

    hasTriggeredRef.current = false

    // ===== CLEAR OLD =====

    if (intervalRef.current) {

      clearInterval(
        intervalRef.current
      )
    }

    // ===== START TIMER =====

    intervalRef.current =
      setInterval(() => {

        setTimeLeft(prev => {

          if (prev <= 1) {

            clearInterval(
              intervalRef.current
            )

            if (
              !hasTriggeredRef.current
            ) {

              hasTriggeredRef.current = true

              if (onTimeUp) {

                onTimeUp()
              }
            }

            return 0
          }

          return prev - 1
        })

      }, 1000)

    // ===== CLEANUP =====

    return () => {

      if (intervalRef.current) {

        clearInterval(
          intervalRef.current
        )
      }
    }

  }, [question]) // ONLY QUESTION

  return (

    <div className="text-xl font-bold">

      Time Left: {timeLeft}s

    </div>
  )
}

export default Timer