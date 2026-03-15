from fastapi import APIRouter, UploadFile, File

router = APIRouter()

@router.post("/recognize")
async def face_recognize(session_id: str, photo: UploadFile = File(...)):
    """Nhận diện khuôn mặt và tự động điểm danh"""

    pass

@router.post("/enroll/{student_id}")
async def enroll_face(student_id: str, photos: list[UploadFile] = File(...)):
    """Đăng ký khuôn mặt cho học sinh (3-5 ảnh)"""

    pass

@router.post("/qr-checkin")
async def qr_checkin():
    """Điểm danh bằng mã QR"""

    pass
