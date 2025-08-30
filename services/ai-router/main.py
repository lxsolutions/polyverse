






from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import redis
import json
import uuid
import asyncio
from typing import Dict, Any

app = FastAPI()

# Redis connection
redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

class TaskRequest(BaseModel):
    task_type: str
    data: Dict[str, Any]
    model_policy: str = "balanced"

class TaskResponse(BaseModel):
    task_id: str
    status: str
    result: Dict[str, Any] = None

async def wait_for_task_result(task_id: str, timeout: int = 10) -> Dict[str, Any]:
    """Wait for task result from Redis pub/sub"""
    pubsub = redis_client.pubsub()
    pubsub.subscribe(f'task_result_{task_id}')
    
    try:
        for message in pubsub.listen():
            if message['type'] == 'message':
                return json.loads(message['data'])
    except asyncio.TimeoutError:
        return {"error": "Task timeout"}
    finally:
        pubsub.unsubscribe()

@app.post("/task", response_model=TaskResponse)
async def create_task(request: TaskRequest, background_tasks: BackgroundTasks):
    """Create a new AI task and dispatch to appropriate agent"""
    task_id = str(uuid.uuid4())
    
    # Dispatch task to appropriate agent channel
    if request.task_type == "summarization":
        channel = "summarization_tasks"
    elif request.task_type == "moderation":
        channel = "moderation_tasks"
    elif request.task_type == "onboarding":
        channel = "onboarding_tasks"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown task type: {request.task_type}")
    
    # Create task payload
    task_payload = {
        "task_id": task_id,
        "task_type": request.task_type,
        "model_policy": request.model_policy,
        **request.data
    }
    
    # Publish task to agent
    redis_client.publish(channel, json.dumps(task_payload))
    
    return TaskResponse(
        task_id=task_id,
        status="dispatched",
        result={"message": f"Task dispatched to {request.task_type} agent"}
    )

@app.get("/task/{task_id}", response_model=TaskResponse)
async def get_task_result(task_id: str):
    """Get result for a specific task"""
    # Check if result is cached
    result_key = f"task_result:{task_id}"
    result = redis_client.get(result_key)
    
    if result:
        return TaskResponse(
            task_id=task_id,
            status="completed",
            result=json.loads(result)
        )
    
    return TaskResponse(
        task_id=task_id,
        status="processing",
        result={"message": "Task still processing"}
    )

# Health check endpoint
@app.get("/healthz")
async def health_check():
    return {"status": "healthy", "service": "ai-router"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)





