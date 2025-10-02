from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
from app.database import get_db, engine
from app.models import Base
from app.routers import instagram, analysis

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Instagram竞争对手分析API",
    description="沙特K12市场Instagram竞品分析仪表盘",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 前端开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(instagram.router, prefix="/api/instagram", tags=["Instagram"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["分析"])

@app.get("/")
def read_root():
    return {"message": "Instagram竞争对手分析API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)