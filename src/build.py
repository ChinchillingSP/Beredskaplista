"""Builds ../index.html and ../sw.js from template.html, the language files and the data folder.
Run from this folder: python3 build.py"""
import datetime, glob, hashlib, json, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
ORDER = ["nb", "en", "es", "pl", "lt", "uk", "ar", "so", "ti", "tl", "ja"]
GOOGLE_FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Noto+Sans:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Noto+Sans+Ethiopic:wght@400;700&display=swap">'

src = open("template.html", encoding="utf-8").read()
assert GOOGLE_FONTS in src, "font link in template.html changed: update GOOGLE_FONTS"
langs = "\n".join(open(f"lang/{c}.js", encoding="utf-8").read() for c in ORDER)
wire = json.load(open("../wire.json", encoding="utf-8"))  # fallback headlines baked into the page
src = (src.replace("/*LANGS*/", langs)
          .replace("/*SHELTERS*/", open("../data/tilfluktsrom-oslo-baerum.json", encoding="utf-8").read())
          .replace("/*GEO*/", open("../data/postnummer-gater-oslo-baerum.json", encoding="utf-8").read())
          .replace("/*WIREAT*/", json.dumps(wire.get("at")))
          .replace("/*BUILT*/", json.dumps(datetime.date.today().isoformat()))  # "last updated" footer
          .replace("/*LIBBASE*/", json.dumps("vendor/"))   # export libraries hosted in this repo
          .replace("/*USE_SW*/", "true")                   # offline support (not possible inside claude.ai)
          .replace(GOOGLE_FONTS, '<link rel="stylesheet" href="fonts/fonts.css">')
          .replace("/*WIRE*/", json.dumps(wire.get("items", []), ensure_ascii=False)))
# The claude.ai artifact host adds the document skeleton; GitHub Pages needs it in the file.
src = ('<!doctype html>\n<html lang="nb">\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<meta name="color-scheme" content="light dark">\n' + src + '\n</html>\n')
open("../index.html", "w", encoding="utf-8").write(src)

# Service worker. The cache name is a hash of everything it precaches, so every
# change to the page gives a new version and old caches are removed on their own.
fonts = sorted(os.path.relpath(f, "..") for f in glob.glob("../fonts/*.woff2"))
precache = ["./", "index.html", "wire.json", "fonts/fonts.css"] + fonts
h = hashlib.sha256()
for f in ["index.html", "fonts/fonts.css"] + fonts:
    h.update(open(os.path.join("..", f), "rb").read())
version = "beredskap-" + h.hexdigest()[:12]
sw = open("sw.template.js", encoding="utf-8").read()
sw = sw.replace("/*VERSION*/", json.dumps(version)).replace("/*PRECACHE*/", json.dumps(precache, indent=1))
open("../sw.js", "w", encoding="utf-8").write(sw)
print("index.html", len(src), "bytes;", "sw.js", version, len(precache), "files precached")
