"""Builds ../index.html from template.html, the language files and the data folder.
Run from this folder: python3 build.py"""
import json, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
ORDER = ["nb", "en", "es", "pl", "lt", "uk", "ar", "so", "ti", "tl", "ja"]
src = open("template.html", encoding="utf-8").read()
langs = "\n".join(open(f"lang/{c}.js", encoding="utf-8").read() for c in ORDER)
wire = json.load(open("../wire.json", encoding="utf-8"))  # fallback headlines baked into the page
src = (src.replace("/*LANGS*/", langs)
          .replace("/*SHELTERS*/", open("../data/tilfluktsrom-oslo-baerum.json", encoding="utf-8").read())
          .replace("/*GEO*/", open("../data/postnummer-gater-oslo-baerum.json", encoding="utf-8").read())
          .replace("/*WIREAT*/", json.dumps(wire.get("at")))
          .replace("/*WIRE*/", json.dumps(wire.get("items", []), ensure_ascii=False)))
# The claude.ai artifact host adds the document skeleton; GitHub Pages needs it in the file.
src = ('<!doctype html>\n<html lang="nb">\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<meta name="color-scheme" content="light dark">\n' + src + '\n</html>\n')
open("../index.html", "w", encoding="utf-8").write(src)
print("index.html", len(src), "bytes")
