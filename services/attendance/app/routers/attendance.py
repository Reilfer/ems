from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter()

@router.post("/")
async def create_session():
    """Tạo phiên điểm danh mới cho lớp"""

    pass

@router.post("/mark")
async def mark_attendance():
    """Điểm danh cho danh sách học sinh"""

    pass

@router.get("/{class_id}/date/{date}")
async def get_attendance(class_id: str, date: str):
    """Lấy danh sách điểm danh theo lớp và ngày"""

    pass

@router.get("/reports")
async def get_reports():
    """Thống kê điểm danh theo khoảng thời gian"""

    pass
