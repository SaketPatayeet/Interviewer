from fastapi import APIRouter
from fastapi import UploadFile, File

import uuid
import os

from langgraph.types import Command

from graph import graph

from voice.tts import text_to_speech
from voice.whisper_service import transcribe_audio
from voice.voice_analyzer import VoiceAnalyzer
from vision.vision_analyzer import VisionAnalyzer

from utils.pdf_parser import extract_text

router = APIRouter(
    prefix="/interview",
    tags=["Interview"]
)

analyzer = VoiceAnalyzer()
vision_analyzer = VisionAnalyzer()

@router.post("/upload-syllabus")
async def upload_syllabus(
    file: UploadFile = File(...)
):

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    file_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(file_path, "wb") as buffer:

        buffer.write(
            await file.read()
        )

    syllabus_text = extract_text(
        file_path
    )

    return {
        "syllabus_text": syllabus_text
    }

@router.post("/start")
async def start_interview(data: dict):

    thread_id = str(uuid.uuid4())

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    initial_state = {

        "syllabus_text": data["syllabus_text"],

        "strictness": data.get(
            "strictness",
            5
        ),

        "audio_metrics": [],
        "vision_metrics": [],
        "evaluations": [],
        "conversation": [],
        "weak_topics": [],
        "question_count": 0,
        "follow_up_count": 0,
        "topic_question_count": 0,
        "current_topic_index": 0,
        "should_end": False
    }

    # Start graph execution
    result = graph.invoke(
        initial_state,
        config=config
    )

    # Get interrupted question
    question = result["__interrupt__"][0].value

    # Generate TTS audio
    audio_filename = await text_to_speech(
        question
    )

    return {

        "thread_id": thread_id,

        "question": question,

        "audio_url":
            f"http://127.0.0.1:8000/audio/{audio_filename}",

        "time_limit": 60
    }


@router.post("/answer")
async def submit_answer(data: dict):

    thread_id = data["thread_id"]

    answer = data["answer"]

    audio_metrics = data.get(
        "audio_metrics",
        {}
    )

    vision_metrics = data.get(
        "vision_metrics",
        {}
    )

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    # Resume graph execution
    result = graph.invoke(
    Command(
        resume={
            "answer": answer,
            "audio_metrics": audio_metrics,
            "vision_metrics": vision_metrics
        }
    ),
    config=config
)

    # ===== INTERVIEW FINISHED =====

    if "report" in result:

        return {

            "interview_complete": True,

            "report": result["report"]
        }

    # ===== NEXT QUESTION =====

    question = result["__interrupt__"][0].value

    audio_filename = await text_to_speech(
        question
    )

    return {

        "interview_complete": False,

        "next_question": question,

        "audio_url":
            f"http://127.0.0.1:8000/audio/{audio_filename}",

        "conversation":
            result.get("conversation", [])
    }


@router.post("/upload-audio")
async def upload_audio(
    audio: UploadFile = File(...)
):

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    # ===== KEEP ORIGINAL EXTENSION =====

    extension = (
        audio.filename
        .split(".")[-1]
    )

    filename = (
        f"{uuid.uuid4()}.{extension}"
    )

    file_path = os.path.join(
        "uploads",
        filename
    )

    # ===== SAVE AUDIO =====

    with open(file_path, "wb") as buffer:

        buffer.write(
            await audio.read()
        )

    print("\nSAVED AUDIO:")
    print(file_path)

    # ===== TRANSCRIBE =====

    transcript = transcribe_audio(
        file_path
    )

    # ===== ANALYZE =====

    metrics = analyzer.analyze(
        file_path,
        transcript,
        {}
    )

    return {

        "transcript": transcript,

        "audio_metrics": metrics
    }

@router.post("/upload-video")
async def upload_video(
    video: UploadFile = File(...)
):

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    filename = f"{uuid.uuid4()}.webm"

    file_path = os.path.join(
        "uploads",
        filename
    )

    # ===== SAVE VIDEO =====

    with open(file_path, "wb") as buffer:

        buffer.write(
            await video.read()
        )

    # ===== ANALYZE VIDEO =====

    vision_metrics = (
        vision_analyzer.analyze(
            file_path
        )
    )

    return {

        "vision_metrics":
            vision_metrics
    }