import { useEffect, useState } from "react"

function Timer({
  duration,
  onTimeUp
}) {

  const [timeLeft, setTimeLeft] =
    useState(duration)

  useEffect(() => {

    setTimeLeft(duration)

    const interval = setInterval(() => {

      setTimeLeft(prev => {

        if (prev <= 1) {

          clearInterval(interval)

          if (onTimeUp) {
            onTimeUp()
          }

          return 0
        }

        return prev - 1

      })

    }, 1000)

    return () => clearInterval(interval)

  }, [duration])

  return (

    <div className="text-xl font-bold">

      Time Left: {timeLeft}s

    </div>
  )
}

export default Timer