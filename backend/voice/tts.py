import edge_tts
import uuid
import os


async def text_to_speech(text):

    os.makedirs(
        "generated_audio",
        exist_ok=True
    )

    filename = f"{uuid.uuid4()}.mp3"

    filepath = os.path.join(
        "generated_audio",
        filename
    )

    communicate = edge_tts.Communicate(
        text,
        voice="en-US-GuyNeural"
    )

    await communicate.save(filepath)

    return filename