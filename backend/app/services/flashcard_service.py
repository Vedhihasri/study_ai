from app.services.llm_service import client, MODEL_NAME


def generate_flashcards(
    topic: str,
    context: str,
    difficulty: str,
    card_count: int
):
    prompt = f"""
You are an AI study assistant generating flashcards
from an uploaded educational document.

Generate exactly {card_count} flashcards about:

TOPIC:
{topic}

DIFFICULTY:
{difficulty}

DOCUMENT CONTEXT:
{context}

RULES:

1. Use ONLY information present in the document context.
2. Do not use outside knowledge.
3. Do not invent facts.
4. Every answer must be supported by the document context.
5. Questions should test understanding of the topic.
6. Keep questions clear and suitable for students.
7. Keep answers concise but complete.
8. Avoid duplicate questions.
9. Do not include markdown.
10. Do not include numbering.
11. Return ONLY valid JSON.
12. The JSON must contain exactly this structure:

{{
  "flashcards": [
    {{
      "question": "Question here",
      "answer": "Answer here"
    }}
  ]
}}

Generate exactly {card_count} flashcards.
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You generate grounded educational flashcards "
                    "from provided document context."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    content = response.choices[0].message.content.strip()

    return content