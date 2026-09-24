#!/usr/bin/env python3
"""Convert structured College Board scraper JSONL into the app's bank format."""

import argparse
import json
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path


DROP_CONTENT = {"script", "style", "template", "iframe", "object", "embed"}
VOID_TAGS = {"br", "hr"}
BLOCK_TAGS = {
    "p", "div", "figure", "figcaption", "caption", "tr", "li",
    "ul", "ol", "blockquote", "table", "thead", "tbody", "tfoot",
}


class SafeHtml(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.drop_depth = 0

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in DROP_CONTENT:
            self.drop_depth += 1
            return
        if self.drop_depth:
            return
        clean = []
        for key, value in attrs:
            key = key.lower()
            value = value or ""
            if key.startswith("on"):
                continue
            if key in {"href", "src", "xlink:href"} and not value.startswith("#"):
                continue
            if key == "style" and re.search(r"(?:url\s*\(|expression\s*\()", value, re.I):
                continue
            clean.append(f' {key}="{escape(value, quote=True)}"')
        self.parts.append(f"<{tag}{''.join(clean)}>")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag.lower() not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in DROP_CONTENT:
            self.drop_depth = max(0, self.drop_depth - 1)
            return
        if not self.drop_depth and tag not in VOID_TAGS:
            self.parts.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.drop_depth:
            self.parts.append(escape(data, quote=False))

    def html(self):
        return "".join(self.parts).strip()


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.hidden_depth = 0
        self.tag_stack = []

    def handle_starttag(self, tag, attrs):
        classes = next((value for key, value in attrs if key.lower() == "class"), "") or ""
        hidden = "sr-only" in classes.split()
        self.tag_stack.append((tag.lower(), hidden))
        if hidden:
            self.hidden_depth += 1
        if self.hidden_depth:
            return
        if tag.lower() in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        hidden = False
        if self.tag_stack:
            _, hidden = self.tag_stack.pop()
        if not self.hidden_depth and tag.lower() in BLOCK_TAGS:
            self.parts.append("\n")
        if hidden:
            self.hidden_depth = max(0, self.hidden_depth - 1)

    def handle_data(self, data):
        if not self.hidden_depth:
            self.parts.append(data)

    def text(self):
        return " ".join("".join(self.parts).split()).strip()


def sanitize(value):
    parser = SafeHtml()
    parser.feed(value or "")
    parser.close()
    return parser.html()


def plain(value):
    parser = PlainText()
    parser.feed(value or "")
    parser.close()
    return parser.text()


def convert(record):
    metadata = record["metadata"]
    content = record["content"]
    answers = content.get("correct_answers") or []
    options = content.get("answer_options") or []
    choices = {option["letter"]: plain(option["content_html"]) for option in options}
    choices_html = {option["letter"]: sanitize(option["content_html"]) for option in options}

    skill = metadata["skill"].strip()
    if skill == "Cross-text Connections":
        skill = "Cross-Text Connections"

    if set(choices) != {"A", "B", "C", "D"}:
        raise ValueError(f"{metadata['question_id']}: expected choices A-D")
    if len(answers) != 1 or answers[0] not in choices:
        raise ValueError(f"{metadata['question_id']}: invalid correct answer {answers}")

    passage_html = sanitize(content.get("prompt_html"))
    prompt_html = sanitize(content.get("stem_html"))
    rationale_html = sanitize(content.get("rationale_html"))
    return {
        "id": metadata["question_id"],
        "assessment": "PSAT",
        "domain": metadata["domain"],
        "skill": skill,
        "difficulty": metadata["difficulty"],
        "passage": plain(passage_html),
        "prompt": plain(prompt_html),
        "choices": choices,
        "correct": answers[0],
        "rationale": plain(rationale_html),
        "table_data": None,
        "passage_html": passage_html,
        "prompt_html": prompt_html,
        "choices_html": choices_html,
        "rationale_html": rationale_html,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="Scraper data.jsonl")
    parser.add_argument("output", type=Path, help="Destination bank JSON")
    args = parser.parse_args()

    records = [json.loads(line) for line in args.input.read_text().splitlines() if line.strip()]
    questions = sorted((convert(record) for record in records), key=lambda item: item["id"])
    ids = [question["id"] for question in questions]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate question IDs")
    args.output.write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(questions)} PSAT questions to {args.output}")


if __name__ == "__main__":
    main()
