from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from exporter.cdu_generator import generate_cdu_from_blocks

app = FastAPI()

# CORS setup to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev use only; lock this down in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/export", response_class=PlainTextResponse)
async def export_blocks(request: Request):
    data = await request.json()
    blocks = data.get("blocks", [])
    return generate_cdu_from_blocks(blocks)
