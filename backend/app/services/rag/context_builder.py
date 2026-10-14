def build_context(results: list) -> str:
    context_parts = []

    for index, result in enumerate(results, start=1):

        source = f"""
[Source {index}]
File: {result["filename"]}
Page: {result["page_number"]}

{result["content"]}
"""

        context_parts.append(source.strip())

    return "\n\n".join(context_parts)