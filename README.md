# Beredskapslista

Household emergency preparedness list for Norway, based on the advice from DSB (the Norwegian Directorate for Civil Protection). The aim is to manage on your own for a week without power, water or shops.

**Live page:** https://chinchillingsp.github.io/Beredskaplista/

## Features

- 11 languages: Norwegian (default), English, Spanish, Polish, Lithuanian, Ukrainian, Arabic, Somali, Tigrinya, Filipino and Japanese.
- Household calculator: adults, children, young children in nappies and adults under 40 (for iodine tablets), for 3, 7 or 14 days.
- Editable checklist with stock, target, note and date, plus a calendar of the dates.
- Excel and PDF download, and JSON export/import of your own data.
- Power outage clock.
- Shelter finder for Oslo and Bærum by postcode, street or coordinates, using a local copy of DSB's public shelter register.
- Emergency numbers, siren signals and a news tab with security, AI and Norwegian headlines.
- Installable as an app on Android and iPhone (install button on the overview tab).
- Works offline: after the first visit with a connection, the page opens without network (service worker). Excel and PDF need a connection the first time each is used.

## Privacy

What you type is stored only in your own browser (localStorage). The page has no trackers, no ads, no analytics and no accounts, and it does not send your data anywhere. Export your data to keep a copy: clearing the browser deletes it.

## Not official advice

This page is made in good faith, but it is not official advice. If in doubt or if something here is wrong, follow DSB: https://www.dsb.no/sikkerhverdag/egenberedskap/

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | The built page that GitHub Pages serves. Do not edit it by hand. |
| `wire.json` | Latest news headlines, read by the page every 5 minutes. |
| `sw.js` | Service worker for offline use. Built from `src/sw.template.js`; do not edit by hand. |
| `manifest.webmanifest`, `icons/` | Lets phones install the page as an app (home screen icon, opens offline). |
| `fonts/` | Self-hosted fonts, so text looks the same offline. |
| `vendor/` | Excel and PDF libraries, loaded only when someone downloads. |
| `src/template.html` | Page layout, styles and code. |
| `src/lang/*.js` | One file per language. |
| `src/build.py` | Builds `index.html` and `sw.js` from `src/` and `data/`. |
| `data/` | Shelter and postcode data (see below). |

To rebuild after a change: `python3 src/build.py`, then commit `index.html` and `sw.js` together with your source changes.

## Data sources and licences

- Public shelters: DSB, via Geonorge, under the Norwegian Licence for Open Government Data (NLOD 2.0). Extract of 9 November 2026, converted to WGS84; mirror used: https://github.com/avimedia/tilfluktsrom-data
- Postcodes with coordinates: Erik Bolstad, https://www.erikbolstad.no/postnummer-koordinatar/ (CC BY 3.0).
- Advice texts are based on DSB's self-preparedness guidance (sikkerhverdag / dsb.no).
- Fonts: Archivo, Noto Sans, Noto Sans Arabic and Noto Sans Ethiopic, via Fontsource, under the SIL Open Font License 1.1 (`fonts/LICENSE-*.txt`).
- Libraries: SheetJS xlsx 0.18.5 (Apache 2.0), jsPDF 2.5.1 (MIT) and html2canvas 1.4.1 (MIT), with their licences in `vendor/`.
- The news tab is inspired by the Global Threat Desk by atomsmasher-design (MIT).

## Licence

Code and texts: MIT, see `LICENSE`. Third-party data keeps its own licence (above).

Author: José Chinchilla.
