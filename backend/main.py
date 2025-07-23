# Run with: python -m uvicorn main:app --reload

from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from exporter.cdu_generator import generate_cdu_from_blocks

# Utilities for converting CDU → JSON
from cdu_parser import extrair_cdu, ler_dcdu_completo
from cdu_json_converter import dcdu_to_reactflow

import tempfile
import os

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


# ---------------------------------------------------------------------------
# "Import" endpoint – receives a .cdu file and returns its JSON representation
# ---------------------------------------------------------------------------


@app.post("/import")
async def import_cdu(file: UploadFile = File(...)):
    """Accepts a CDU file upload (multipart/form-data) and returns its ReactFlow-compatible JSON representation."""

    # 1. Persist the uploaded file to a temporary location because the parser
    #    expects a filesystem path.
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".cdu") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        # 2. Extract and parse the first DCDU block within the file.
        blocos_cdu = extrair_cdu(tmp_path, "DCDU")
        if not blocos_cdu:
            raise HTTPException(status_code=400, detail="Nenhum bloco DCDU encontrado no arquivo enviado.")

        dcdu_completo = ler_dcdu_completo(blocos_cdu[0])

        # 3. Convert the parsed CDU structure into the JSON schema expected by
        #    the frontend (React Flow model).
        json_result = dcdu_to_reactflow(dcdu_completo)

        return JSONResponse(content=json_result)

    finally:
        # Clean up temp file if it was created
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

