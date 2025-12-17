from fastapi import APIRouter

router = APIRouter()

@router.get("/connection")
def health_check():
    return {"status": "connected", "message": "Backend is reachable"}
