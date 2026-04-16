from __future__ import annotations

from app.models.domain import ExtractedSection


def extract_sections(text: str) -> list[ExtractedSection]:
    sections = []
    current_title = "Overview"
    current_lines: list[str] = []
    order = 1
    for line in text.splitlines():
        if line.startswith("#"):
            if current_lines:
                sections.append(
                    ExtractedSection(
                        id=f"section_{order}",
                        title=current_title,
                        body="\n".join(current_lines).strip(),
                        order=order,
                        tags=[],
                    )
                )
                order += 1
            current_title = line.lstrip("#").strip()
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines:
        sections.append(
            ExtractedSection(
                id=f"section_{order}",
                title=current_title,
                body="\n".join(current_lines).strip(),
                order=order,
                tags=[],
            )
        )
    return sections or [
        ExtractedSection(id="section_1", title="Overview", body=text, order=1, tags=[]),
    ]
