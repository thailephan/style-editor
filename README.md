# Dragger - Style Editor Chrome Extension

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0-green.svg)

**Dragger** is a lightweight, real-time Google Chrome extension designed for developers and designers to inspect and modify web element styles directly in the browser with a premium, interactive interface.

## ✨ Features

- **Element Selection**: Highlight elements on hover and click to inspect.
- **Interactive Editor Panel**: A draggable, glassmorphic panel to edit styles.
- **Visual Controls**:
  - **Layout**: Adjust Width, Height, and Display modes.
  - **Typography**: Change colors, fonts, sizes, and weights with smart font detection.
  - **Spacing**: Visual "box model" controls for Margins and Padding.
  - **Borders & Backgrounds**: Full control over borders, radius, and background colors/opacity.
  - **3D Transforms**: Translate, Scale, and Rotate elements in 3D space.
- **Productive Workflow**:
  - Scrubbable inputs (drag to change values).
  - Undo/Redo history stack.
  - Reset element to original state.

## 🚀 Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/dragger.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"**.
5. Select the `dragger` directory from your computer.

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES6+), HTML5
- **Styling**: Vanilla CSS (Variables, Flexbox/Grid)
- **Architecture**: Manifest V3

## 📂 Project Structure

- `manifest.json` - Extension configuration.
- `content.js` - Main logic for selection and style manipulation.
- `content.css` - Styles for the editor UI (isolated shadow DOM).
- `background.js` - Service worker for extension events.
- `site/` - The landing page for the extension (deployed to Vercel).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by Thai Le
</p>
