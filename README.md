# Pedo

A simple, distraction-free PDF reader for Windows. No toolbar, no clutter. Just your PDF, almost full screen, in a dark brown theme.

## Features

- Opens PDF files in tabs, shown in the title bar
- Continuous scrolling through all pages
- Keyboard navigation:
  - **Left / Right**: previous / next page
  - **Up / Down**: scroll a few lines
- **Ctrl + Scroll** or **Ctrl + / Ctrl -** to zoom
- **F** or the small button in the top right for fullscreen (**Esc** to exit)
- Open files with **Ctrl + O**, drag and drop, or double click a PDF in Windows
- Set as your default PDF reader

## Shortcuts

| Key | Action |
| --- | --- |
| Left / Right | Previous / next page |
| Up / Down | Scroll up / down |
| Ctrl + O | Open a PDF |
| Ctrl + W | Close current tab |
| Ctrl + Scroll | Zoom in / out |
| Ctrl + / Ctrl - | Zoom in / out |
| F | Toggle fullscreen |

## Installation

1. Go to the **Releases** page of this repository.
2. Download `Pedo Setup 1.0.0.exe`.
3. Run the installer.

Windows may show a "Windows protected your PC" warning because the app isn't signed. Click **More info**, then **Run anyway**.

## Run from source

You need [Node.js](https://nodejs.org) installed.

```
git clone https://github.com/YOUR-USERNAME/pedo.git
cd pedo
npm install
npm start
```

## Build the installer

```
npm run dist
```

The installer will be created in the `dist` folder.

## Built with

- [Electron](https://www.electronjs.org/)
- [PDF.js](https://mozilla.github.io/pdf.js/)

## Author

Pulindu Theekshana

## License

ISC
