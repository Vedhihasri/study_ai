import json

from app.services.llm_service import client, MODEL_NAME


def generate_exam(
    topic: str,
    difficulty: str,
    question_count: int,
    context: str
):
    prompt = f"""
You are an exam question generator for an AI study assistant.

Generate exactly {question_count} multiple-choice exam questions.

Topic:
{topic}

Difficulty:
{difficulty}

Study material:
{context}

Rules:

1. Generate exactly {question_count} questions.
2. Questions must be based ONLY on the provided study material.
3. Do not use outside knowledge.
4. Each question must have exactly four options.
5. Use option labels A, B, C, and D.
6. Each question must have exactly one correct answer.
7. Provide a short explanation for the correct answer.
8. Assign the requested difficulty to each question.
9. Do not reveal answers outside the JSON structure.
10. Return valid JSON only.
11. Do not use Markdown code fences.

Return this exact JSON structure:

{{
    "questions": [
        {{
            "question": "Question text",
            "question_type": "mcq",
            "option_a": "Option A",
            "option_b": "Option B",
            "option_c": "Option C",
            "option_d": "Option D",
            "correct_answer": "A",
            "explanation": "Explanation",
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
                "content": (
                    "You generate accurate, source-grounded exam questions. "
                    "Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.3,
    )

    content = response.choices[0].message.content.strip()

    # Remove accidental Markdown fences
    if content.startswith("```"):
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

    data = json.loads(content)

    questions = data.get("questions", [])

    if len(questions) != question_count:
        raise ValueError(
            f"Expected {question_count} questions, "
            f"but received {len(questions)}."
        )

    return questions