# Web-Ready Sizer

Adobe Illustrator CEP extension that turns designs into real web sizes: `rem`, Tailwind classes and breakpoints — all from one panel inside Illustrator.

**Compatibility:** Illustrator 2020 through 2023 (CEP 9/10/11, versions 24.x – 27.x).

Full documentation lives in [`web-ready-sizer/README.md`](web-ready-sizer/README.md).

## Quick start

```bash
# Windows
install\install-windows.bat

# macOS
bash install/install-mac.sh
```

Then restart Illustrator and open `Window > Extensions > Web-Ready Sizer`.

## Layout

```
web-ready-sizer/
├── CSXS/          CEP manifest
├── client/        panel UI (HTML/CSS/JS, no build step)
├── jsx/           ExtendScript host layer (ES3)
├── docs/          install and user guides
├── install/       Windows/macOS install and uninstall scripts
├── locale/        ar/en string tables
├── resources/     design token presets
├── tests/unit/    Node test suite
└── tools/         syntax check, smoke test, preview server
```

## Development

```bash
npm test        # unit tests
npm run check   # syntax + ES3 guard
npm run serve   # browser preview on :4173
```

## License

MIT
