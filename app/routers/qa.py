from fastapi import APIRouter
from app.models.schemas import QuestionRequest, AnswerResponse
from app.services.qa import answer_question

router = APIRouter()


@router.post("/ask", response_model=AnswerResponse)
def ask_question(request: QuestionRequest):
    result = answer_question(request.question, top_k=request.top_k)
    return result