# Edgeless Sidebar

> An un-copiloted app tower workspace layout. Built because you decided to go Edge-less.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-141e24.svg?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.5.0-brightgreen.svg?style=for-the-badge)](https://github.com/morrowchristian/edgeless-sidebar/releases)

**Edgeless Sidebar** is a productivity-focused Chrome extension that brings back the beloved sidebar functionality Microsoft removed from Edge. It provides a highly customizable, split-screen workspace that houses your pinned web apps alongside persistent utilities.

![Edgeless Sidebar Demo](assets/demo.gif)

## ✨ Features

### 🎯 Core Features

- **Split-Screen Workspace**: Dynamic 420px sidebar that adjusts your main content without overlapping
- **App Tower**: Pin your favorite web apps (Notion, YouTube, WhatsApp, etc.) for quick access
- **Persistent Notes**: Auto-saving markdown scratchpad with word-break protection
- **Calculator Widget**: Built-in utility for quick calculations
- **Keyboard Shortcuts**: `Cmd/Ctrl + Shift + E` to toggle sidebar alignment
- **Dark Theme**: Beautiful dark mode optimized for productivity

### 🚀 Advanced Features

- **Context Awareness**: Automatically switches content based on active tab
- **Iframe De-blocker**: Bypasses X-Frame-Options to display any website
- **Offline Avatars**: Canvas-generated text icons when favicons fail to load
- **Instant Auto-save**: Every keystroke is saved to Chrome storage
- **Split Layout**: Works on left or right side of your screen

## 📸 Screenshots

|                Main View                   |               Notes Widget                 |                    Calculator                    |
|--------------------------------------------|--------------------------------------------|--------------------------------------------------|
|  ![Main View](assets/screenshots/main.png) |    ![Notes](assets/screenshots/notes.png)  | ![Calculator](assets/screenshots/calculator.png) |

|                App Tower                   |              Context Awareness             |                     Settings                     |
|--------------------------------------------|--------------------------------------------|--------------------------------------------------|
| ![App Tower](assets/screenshots/tower.png) | ![Context](assets/screenshots/context.png) |   ![Settings](assets/screenshots/settings.png)   |

## 🚀 Installation

### From Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store listing](https://chrome.google.com/webstore)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Clone this repository:
```git clone https://github.com/morrowchristian/edgeless-sidebar.git```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension directory

## 🎮 Usage

### Basic Controls

- **Toggle Sidebar**: Click the extension icon in your toolbar
- **Switch Alignment**: Press `Cmd/Ctrl + Shift + E`
- **Pin Current Tab**: Click the `+` button in the app tower
- **Remove App**: Hover over an app icon and click the `×` button

### Widgets

- **Notes**: Type anywhere in the notes area - auto-saves instantly
- **Calculator**: Click the "Calculator" tab in the widget deck

### Keyboard Shortcuts

|         Shortcut         |                      Action           |
|--------------------------|---------------------------------------|

| `Cmd/Ctrl + Shift + E`   | Toggle sidebar alignment (Left/Right) |
| `Click Extension Icon`   |             Show/Hide sidebar         |

## 🏗️ Architecture

```text
edgeless-sidebar/
├── manifest.json # Extension configuration
├── background.js # Service worker & network proxy
├── assets/ # Icons and screenshots
└── ui/
├── sidebar.js # Content injection script
├── sidebar.css # Global styling
├── panel.html # Sidebar HTML structure
└── panel.js # UI controller & logic
```

### Technical Stack

- **Manifest V3**: Latest Chrome extension platform
- **Service Worker**: Background processing and network rules
- **Chrome Storage API**: Persistent data management
- **DeclarativeNetRequest**: Iframe header stripping
- **Vanilla JavaScript**: No external dependencies

## 🔧 Development

### Prerequisites

- Google Chrome (version 88+)
- Basic knowledge of Chrome extension development

### Setup

Clone the repository
git clone `https://github.com/morrowchristian/edgeless-sidebar.git`

Navigate to directory
cd edgeless-sidebar

Install dependencies (if any)

```bash
npm install 
```

### Building

## Create a production build

```bash
npm run build
```

## Package for Chrome Web Store

```bash
npm run package
```

### Testing

1. Load the extension in developer mode
2. Open Chrome DevTools (`F12`)
3. Check the Console tab for logs
4. Use the Extension Inspector for background script debugging

## 🛠️ Troubleshooting

### Common Issues

#### Sidebar doesn't appear

- Ensure you're not on a Chrome internal page (`chrome://`, `edge://`)
- Check if the extension is enabled in `chrome://extensions/`
- Try refreshing the page

#### Apps won't load in iframe

- Some sites block iframes for security
- The extension attempts to bypass this with network rules
- Try manually entering the URL if it fails

#### Notes not saving

- Check Chrome storage permissions
- Ensure you have enough storage space
- Try restarting the browser

#### Performance issues

- Close unused tabs
- Limit the number of pinned apps (5-7 recommended)
- Disable other extensions temporarily

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: Open an issue with detailed steps
2. **Suggest Features**: Share your ideas in discussions
3. **Submit PRs**: Follow the contribution guidelines

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use 2 spaces for indentation
- Follow existing naming conventions
- Add comments for complex logic
- Test thoroughly before submitting

## 📝 Roadmap

### v0.6.0 (In Progress)

- [ ] Multiple widget support (to-do list, timer)
- [ ] Drag-and-drop app reordering
- [ ] Custom themes (light mode, accent colors)

### v0.7.0 (Planned)

- [ ] Syncing across devices
- [ ] Keyboard shortcuts for widgets
- [ ] Quick search in sidebar

### v1.0.0 (Future)

- [ ] Fullscreen mode
- [ ] Workspace templates
- [ ] API for third-party integrations

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- Inspired by Microsoft Edge's original sidebar feature
- Icons provided by [Google Material Icons](https://material.io/icons)
- Built with ❤️ for the productivity community

## 📫 Contact

- **GitHub**: [@morrowchristian](https://github.com/morrowchristian)
- **Email**: `morrowchristan@icloud.com`

## ⭐ Support

If you find this extension useful, please:

- Star the repository ⭐
- Rate it on the Chrome Web Store ⭐⭐⭐⭐⭐
- Share it with your network 🚀
- Contribute to the project 🤝

---

**Built because you decided to go Edge-less.** 🎯
