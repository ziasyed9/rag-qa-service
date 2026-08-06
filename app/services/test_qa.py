from app.services.qa import answer_question

if __name__ == "__main__":
    result = answer_question("What Python experience is required?")
    print("Question:", result["question"])
    print("Answer:", result["answer"])
    print("Sources:", result["sources"])