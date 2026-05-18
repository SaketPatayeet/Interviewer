from faster_whisper import WhisperModel
import sounddevice as sd
from scipy.io.wavfile import write


model = WhisperModel("base")


def listen(seconds=5):

    fs = 16000

    print("\nListening...")

    audio = sd.rec(
        int(seconds * fs),
        samplerate=fs,
        channels=1
    )

    sd.wait()

    write("temp.wav", fs, audio)

    segments, _ = model.transcribe("temp.wav")

    text = ""

    for segment in segments:

        text += segment.text

    return text.strip()