import fitz
from bs4 import BeautifulSoup
import re
from pathlib import Path
from typing import List, Dict, Any

class TextExtractor:
    @staticmethod
    def extract_pdf(file_path: str) -> List[Dict[str, Any]]:
        doc = fitz.open(file_path)
        pages = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text").strip()
            if text:
                pages.append({
                    "page_number": page_num + 1,
                    "text": text
                })
        doc.close()
        return pages

    @staticmethod
    def extract_html(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        soup = BeautifulSoup(content, "html.parser")
        for script_or_style in soup(["script", "style", "nav", "footer"]):
            script_or_style.decompose()
        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = "\n".join(lines)
        return [{"page_number": 1, "text": clean_text}]

    @staticmethod
    def extract_markdown(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        clean_text = re.sub(r'#+\s*', '', content)
        clean_text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean_text)
        lines = [line.strip() for line in clean_text.splitlines() if line.strip()]
        return [{"page_number": 1, "text": "\n".join(lines)}]

    @classmethod
    def extract(cls, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        ext = file_type.lower().lstrip(".")
        if ext == "pdf":
            return cls.extract_pdf(file_path)
        elif ext in ["html", "htm"]:
            return cls.extract_html(file_path)
        elif ext in ["md", "markdown", "txt"]:
            return cls.extract_markdown(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
