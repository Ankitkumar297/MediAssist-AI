"""Small offline check of the three request paths and PDF extraction."""
from tempfile import SpooledTemporaryFile
from unittest.mock import AsyncMock, patch

import pymupdf
from starlette.datastructures import UploadFile

from main import AIResponse, ChatRequest, SymptomRequest, chat, health, report, symptoms


async def main():
    print("Checking health", flush=True)
    assert health()["status"] == "ok"
    with patch("main.generate", new=AsyncMock(return_value=AIResponse(answer="Educational response."))):
        print("Checking chat", flush=True)
        assert (await chat(ChatRequest(message="What is blood pressure?"))).answer
        print("Checking symptoms", flush=True)
        assert (await symptoms(SymptomRequest(symptoms="Mild headache today"))).answer
        assert "emergency" in (await symptoms(SymptomRequest(symptoms="severe chest pain"))).answer.lower()
        print("Creating PDF", flush=True)
        pdf = pymupdf.open()
        pdf.new_page().insert_text((72, 72), "Hemoglobin 13.5 g/dL, reference range 12-16")
        data = pdf.tobytes()
        pdf.close()
        buffer = SpooledTemporaryFile(max_size=10 * 1024 * 1024)
        buffer.write(data)
        buffer.seek(0)
        upload = UploadFile(filename="sample.pdf", file=buffer, headers={"content-type": "application/pdf"})
        print("Checking report", flush=True)
        assert (await report(upload)).answer
    print("Backend smoke test passed: health, chat, symptoms, PDF report")


if __name__ == "__main__":
    # These endpoints complete synchronously with Gemini mocked and an in-memory PDF.
    coroutine = main()
    try:
        coroutine.send(None)
    except StopIteration:
        pass
