from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def create_leave_request():
    """Tạo đơn xin nghỉ phép"""

    pass

@router.put("/{leave_id}/approve")
async def approve_leave(leave_id: str):
    """Duyệt đơn xin nghỉ"""

    pass

@router.get("/")
async def list_leave_requests():
    """Lấy danh sách đơn xin nghỉ"""

    pass
