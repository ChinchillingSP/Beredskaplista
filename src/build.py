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
open("../index.html", "w", encoding="utf-8").write(src)
print("index.html", len(src), "bytes")
