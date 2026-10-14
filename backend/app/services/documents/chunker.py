
import re


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 150,
) -> list[str]:
    """
    Split text into overlapping chunks, preferring paragraph
    and sentence boundaries over arbitrary character boundaries.
    """

    text = text.strip()

    if not text:
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be between 0 and chunk_size")

    # Normalize whitespace while preserving paragraph boundaries.
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    paragraphs = [
        paragraph.strip()
        for paragraph in re.split(r"\n\s*\n", text)
        if paragraph.strip()
    ]

    chunks = []
    current = ""

    for paragraph in paragraphs:
        # Split unusually long paragraphs into sentence-like pieces.
        if len(paragraph) > chunk_size:
            pieces = re.split(r"(?<=[.!?])\s+", paragraph)
        else:
            pieces = [paragraph]

        for piece in pieces:
            piece = piece.strip()

            if not piece:
                continue

            if len(piece) > chunk_size:
                # Hard-split only when a single piece is still too long.
                if current:
                    chunks.append(current)
                    current = ""

                start = 0
                step = chunk_size - overlap

                while start < len(piece):
                    part = piece[start:start + chunk_size].strip()

                    if part:
                        chunks.append(part)

                    start += step

                continue

            candidate = f"{current}\n\n{piece}" if current else piece

            if len(candidate) <= chunk_size:
                current = candidate
            else:
                if current:
                    chunks.append(current)

                # Carry some previous context into the next chunk.
                tail = current[-overlap:].strip() if current else ""
                current = f"{tail}\n\n{piece}" if tail else piece

                # Avoid exceeding the limit if the overlap was too large.
                if len(current) > chunk_size:
                    current = piece

    if current:
        chunks.append(current)

    return chunks