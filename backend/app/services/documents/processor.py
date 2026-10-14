import os
from pypdf import PdfReader
from docx import Document as DocxDocument


def extract_text(file_path: str):
    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        return extract_pdf(file_path)

    if extension == ".docx":
        return extract_docx(file_path)

    if extension == ".txt":
        return extract_txt(file_path)

    raise ValueError(f"Unsupported file type: {extension}")


def extract_pdf(file_path: str):
    reader = PdfReader(file_path)
    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text(extraction_mode="layout") or ""
        except TypeError:
            # Compatibility fallback for older pypdf versions
            text = page.extract_text() or ""

        # Normalize line endings and remove excessive blank lines
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        lines = [line.rstrip() for line in text.splitlines()]

        # Preserve paragraph boundaries while removing empty lines
        cleaned_lines = []
        previous_blank = False

        for line in lines:
            line = line.strip()

            if not line:
                if cleaned_lines and not previous_blank:
                    cleaned_lines.append("")
                previous_blank = True
            else:
                cleaned_lines.append(line)
                previous_blank = False

        cleaned_text = "\n".join(cleaned_lines).strip()

        # Ignore empty or nearly empty extracted pages
        if len(cleaned_text) >= 20:
            pages.append({
                "page_number": page_number,
                "text": cleaned_text
            })

    return pages

def extract_docx(file_path: str):
    document = DocxDocument(file_path)

    text = []

    for paragraph in document.paragraphs:
        content = paragraph.text.strip()

        if content:
            text.append(content)

    return [{
        "page_number": None,
        "text": "\n\n".join(text)
    }]


def extract_txt(file_path: str):
    with open(file_path, "r", encoding="utf-8") as file:
        text = file.read()

    return [{
        "page_number": None,
        "text": text
    }]