# Testing

## Automated checks

Run these before pushing a change to `src/`:

```
python3 src/build.py
cd tests
npm install
npx playwright install chromium
npm test
```

`tests/run.js` serves the repository at `http://localhost:8790/Beredskaplista/` and checks, in a simulated Android phone and iPhone:

- the service worker takes control and the page is installable (manifest without errors);
- after one visit online, the page opens offline on the power-outage tab, with the offline bar and the dark theme;
- the saved list, the stored headlines, the shelter search and an Excel download work offline;
- the one-second timers only run on their own tab;
- no request goes to another server;
- the print sheet fits on one A4 page in all 11 languages;
- iPhone shows the Add to Home Screen steps.

## Manual check on a real phone (5 minutes)

Android (Chrome):

1. Open https://chinchillingsp.github.io/Beredskaplista/ with a connection. Tap "Install the app" on the overview tab.
2. Type a number in the list (for example drinking water).
3. Turn on airplane mode, close Chrome completely (swipe it away) and open the app from its home screen icon.
4. Check: the page opens on the power-outage tab with the offline bar, the number you typed is still there, the shelter search works.

iPhone (Safari):

1. Open the same address in Safari with a connection. Tap Share, then "Add to Home Screen".
2. Open the app from the home screen icon (not Safari) and type a number in the list. Data typed in Safari does not carry over to the app.
3. Turn on airplane mode, close the app (swipe it away) and open it again from the icon.
4. Check the same points as on Android.

Note: the first visit always needs a connection. Install the app and print the emergency sheet while things are normal.
