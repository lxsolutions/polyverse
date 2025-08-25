






from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    model_policy: str
    input_text: str

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Route chat requests to appropriate AI models based on policy.
    For now, return a mock response.
    """
    if request.model_policy == "cheap":
        return {"response": f"Cheap model would say: {request.input_text}"}
    elif request.model_policy == "balanced":
        return {"response": f"Balanced model would say: {request.input_text}"}
    elif request.model_policy == "accurate":
        return {"response": f"Accurate model would say: {request.input_text}"}
    else:
        raise HTTPException(status_code=400, detail="Invalid model policy")

class SummarizeRequest(BaseModel):
    text: str

@app.post("/summarize")
async def summarize(request: SummarizeRequest):
    """
    Route summarization requests to appropriate AI models.
    For now, return a mock summary.
    """
    # Mock summarization - in production this would call an actual model
    words = request.text.split()
    if len(words) <= 5:
        return {"summary": request.text}
    else:
        return {"summary": " ".join(words[:5]) + "..."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)





