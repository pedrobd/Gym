"""Gera dist/artifact.html: uma única página (CSS e JS embutidos) para publicar como Artifact no claude.ai."""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text()
title = re.search(r"<title>.*?</title>", html, re.S).group(0)
fonts = re.search(r'<link rel="stylesheet" href="https://fonts[^>]+>', html).group(0)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
body = re.sub(r'\s*<script src="[^"]+"></script>', "", body)

out = "\n".join([
    title,
    '<meta name="claude:viewport-fit-sides" content="cover">',
    fonts,
    "<style>\n" + (root / "style.css").read_text() + "</style>",
    body.strip(),
    "<script>\n" + (root / "data.js").read_text() + "</script>",
    "<script>\n" + (root / "app.js").read_text() + "</script>",
])
dist = root / "dist"
dist.mkdir(exist_ok=True)
(dist / "artifact.html").write_text(out + "\n")
print(dist / "artifact.html")
