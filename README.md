# Expense Tracker (PWA)

An offline-capable expense tracker built with plain HTML, CSS and JavaScript. No build tools or installs needed.

## Features
- Add, edit and delete income and expense entries (amount, category, date, note)
- Monthly summary: income, expenses, balance
- Spending-by-category bars
- Data saved in your browser (localStorage), survives refresh and works offline
- Export all data to CSV
- Installable on phone or desktop (PWA), dark mode follows your system

## Run it
A PWA needs `http://localhost` (opening index.html by double-click works for the app, but offline/install will not).
Easiest options:
1. **VS Code:** install the "Live Server" extension, right-click `index.html` → Open with Live Server.
2. **Python:** open a terminal in this folder and run `python -m http.server 8000`, then visit http://localhost:8000
3. **Node:** `npx serve`

Install on a phone: deploy the folder to Netlify / GitHub Pages (HTTPS), open the link, then use "Add to Home screen" / "Install app".

## How it works (for interviews)
- `index.html`: structure and form. `style.css`: layout, responsive grid, dark mode via `prefers-color-scheme`.
- `app.js`: keeps an `items` array, saves it to `localStorage`, and re-renders summary, category bars and list on every change. Text is inserted with `textContent` so user input is never treated as HTML.
- `manifest.json`: tells the browser the app name, icons and colors so it can be installed.
- `sw.js`: service worker that caches the app files on first load (cache-first), so the app opens with no internet.

## Ideas to extend
Budget limits per category, charts (Chart.js), multiple currencies, cloud sync with Firebase.
