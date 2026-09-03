# Ticker logos

Drop real ticker logo image files here, named by symbol:

```
public/logos/TSLA.svg
public/logos/MU.svg
public/logos/NVDA.svg
```

`.svg` is preferred; `.png` works too. After a file is added, its ticker is
mapped in `lib/logos.ts` (e.g. `TSLA: "/logos/TSLA.svg"`) and the avatar
renders it in place of the brand-color monogram tile. Missing or failed
files fall back to the tile automatically, so logos can be added one at a
time without breaking anything.
