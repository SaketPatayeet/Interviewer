import os
import subprocess

import librosa
import numpy as np


class VoiceAnalyzer:

    def convert_to_wav(
        self,
        input_path
    ):

        output_path = (
            input_path.rsplit(".", 1)[0]
            + ".wav"
        )

        command = [

            "ffmpeg",

            "-y",

            "-i",
            input_path,

            "-ar",
            "16000",

            "-ac",
            "1",

            output_path
        ]

        subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        return output_path


    def analyze(
        self,
        audio_path: str,
        transcription: str,
        state: dict
    ):

        # ===== CONVERT WEBM TO WAV =====

        wav_path = self.convert_to_wav(
            audio_path
        )

        # ===== LOAD AUDIO =====

        audio, sr = librosa.load(
            wav_path,
            sr=16000
        )

        # ===== SPEECH RATE =====

        words = len(
            transcription.split()
        )

        duration = len(audio) / sr

        speech_rate = (

            (words / duration) * 60

            if duration > 0 else 0
        )

        # ===== PITCH =====

        pitch = librosa.yin(

            audio,

            fmin=50,

            fmax=400
        )

        pitch = pitch[
            ~np.isnan(pitch)
        ]

        pitch_variance = (

            np.std(pitch)

            if len(pitch) > 0 else 0
        )

        # ===== ENERGY =====

        rms = librosa.feature.rms(
            y=audio
        )[0]

        energy = np.mean(rms)

        # ===== SILENCE =====

        intervals = librosa.effects.split(
            audio,
            top_db=20
        )

        voiced_duration = sum(

            (end - start) / sr

            for start, end in intervals
        )

        pause_duration = max(

            duration - voiced_duration,

            0
        )

        # ===== CONFIDENCE =====

        confidence_score = (
            calculate_confidence(

                pitch_variance,

                energy,

                speech_rate,

                pause_duration
            )
        )

        # ===== CLEANUP =====

        if os.path.exists(wav_path):

            os.remove(wav_path)

        return {

            "response_id":
                state.get(
                    "question_count",
                    0
                ),

            "speech_rate":
                round(
                    speech_rate,
                    2
                ),

            "pitch_variance":
                round(
                    float(pitch_variance),
                    2
                ),

            "energy":
                round(
                    float(energy),
                    4
                ),

            "pause_duration":
                round(
                    float(pause_duration),
                    2
                ),

            "confidence_score":
                round(
                    float(confidence_score),
                    2
                )
        }


def calculate_confidence(

    pitch_var,

    energy,

    rate,

    pause_duration
):

    score = 0.5

    # ===== PITCH =====

    if pitch_var < 30:

        score += 0.15

    elif pitch_var > 60:

        score -= 0.15

    # ===== RATE =====

    if 100 <= rate <= 160:

        score += 0.2

    elif rate < 70 or rate > 190:

        score -= 0.2

    # ===== ENERGY =====

    if energy > 0.02:

        score += 0.1

    # ===== PAUSES =====

    if pause_duration > 5:

        score -= 0.2

    return np.clip(score, 0, 1)