// Site configuration. Using `self` instead of `window` here so this same
// file can be loaded both by regular pages AND by the service worker
// (self.X works in both contexts; window doesn't exist inside a worker).

// Paste your Google Maps JavaScript API key between the quotes below.
// See README.md for how to get a free key from Google Cloud Console.
self.GOOGLE_MAPS_API_KEY = "AIzaSyB14Rr36Ap6Sow-4rF8Flwrr7UlMwbLlS8";

// Published-to-web CSV links for the Google Sheets tabs that drive this
// site's content. See README.md for how to set these up. Leave as
// PASTE_..._HERE to fall back to the bundled local data/ JSON files.
self.WINES_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSk1COlNcyORW5IHzCCUrxLKaMhFNaD7ihWDMDn0n59f02tCXHjBNigX_gcq05MP3vnV-CnfexG31F7/pub?gid=635833342&single=true&output=csv";
self.FLASHCARDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSk1COlNcyORW5IHzCCUrxLKaMhFNaD7ihWDMDn0n59f02tCXHjBNigX_gcq05MP3vnV-CnfexG31F7/pub?gid=1815874725&single=true&output=csv";
self.FOOD_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSk1COlNcyORW5IHzCCUrxLKaMhFNaD7ihWDMDn0n59f02tCXHjBNigX_gcq05MP3vnV-CnfexG31F7/pub?gid=1284452391&single=true&output=csv";
