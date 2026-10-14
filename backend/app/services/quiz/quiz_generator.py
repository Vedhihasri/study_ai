import json
import re

from app.services.llm_service import client, MODEL_NAME

def generate_quiz(
    topic: str,
    context: str,
    difficulty: str = "medium",
    question_count: int = 5,
):
    prompt = f"""
You are an AI quiz generator for a study assistant.

Generate a quiz using ONLY the provided study material.

Topic:
{topic}

Difficulty:
{difficulty}

Number of questions:
{question_count}

Study material:
{context}

Rules:

1. Generate exactly {question_count} multiple-choice questions.
2. Every question must be answerable from the study material.
3. Do not use outside knowledge.
4. Do not invent facts.
5. Each question must have exactly four options.
6. Only one option must be correct.
7. Include a short explanation for the correct answer.
8. Keep questions educational and meaningful.
9. Avoid duplicate questions.
10. Match the requested difficulty.
11. Return ONLY valid JSON.
12. Do not include Markdown or ```json.

Required JSON format:

{{
  "questions": [
    {{
      "question": "Question text",
      "option_a": "Option A",
      "option_b": "Option B",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_answer": "B",
      "explanation": "Explanation based on the study material.",
      "difficulty": "{difficulty}"
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": "You generate grounded educational quizzes in valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content.strip()

    # Remove accidental markdown fences
    content = re.sub(r"^```json\s*", "", content)
    content = re.sub(r"^```\s*", "", content)
    content = re.sub(r"\s*```$", "", content)

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"LLM returned invalid quiz JSON: {content}"
        ) from exc

    questions = data.get("questions", [])

    if len(questions) != question_count:
        raise ValueError(
            f"Expected {question_count} questions, received {len(questions)}."
        )

    return questions