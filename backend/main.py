from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from interview import router as interview_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated MP3 files
app.mount(
    "/audio",
    StaticFiles(directory="generated_audio"),
    name="audio"
)

app.include_router(interview_router)