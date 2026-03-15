
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.routers import attendance, face_recognition, leave_requests, health

app = FastAPI(
    title="ReilferEDUV - Attendance Service",
    description="Điểm danh & Nhận diện khuôn mặt",
    version="1.0.0",
    docs_url="/api/docs/attendance",
    root_path="/api/v1/attendance",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(attendance.router, prefix="/sessions", tags=["Attendance"])
app.include_router(face_recognition.router, prefix="/face", tags=["Face Recognition"])
app.include_router(leave_requests.router, prefix="/leaves", tags=["Leave Requests"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
