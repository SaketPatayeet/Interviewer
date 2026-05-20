from faster_whisper import WhisperModel

import sounddevice as sd

from scipy.io.wavfile import write

from whisper_service import transcribe_audio

import uuid


model = WhisperModel("base")


def listen(seconds=5):

    fs = 16000

    print("Listening...")

    audio = sd.rec(
        int(seconds * fs),
        samplerate=fs,
        channels=1
    )

    sd.wait()

    # ===== UNIQUE AUDIO FILE =====

    filename = f"temp_{uuid.uuid4()}.wav"

    write(filename, fs, audio)

    # ===== TRANSCRIBE =====

    text = transcribe_audio(filename)

    # ===== RETURN BOTH =====

    return {

        "text": text,

        "audio_path": filename
    }