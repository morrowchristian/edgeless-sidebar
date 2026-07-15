# Contributing to Edgeless Sidebar

We love your input! We want to make contributing to Edgeless Sidebar as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Issues

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/morrowchristian/edgeless-sidebar/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
- Be specific!
- Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](LICENSE) that covers the project. Feel free to contact the maintainers if that's a concern.

## Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as
contributors and maintainers pledge to making participation in our project and
our community a harassment-free experience for everyone.

### Our Standards

Examples of behavior that contributes to creating a positive environment
include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Our Responsibilities

Project maintainers have the right and responsibility to remove, edit, or
reject comments, commits, code, wiki edits, issues, and other contributions
that are not aligned to this Code of Conduct.

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/edgeless-sidebar.git

# Navigate to directory
cd edgeless-sidebar

# Install dependencies (coming soon)
npm install

# Open in Chrome developer mode
# Navigate to chrome://extensions/
# Enable Developer mode
# Click "Load unpacked"
# Select the extension directory
```

## Project Structure

```edgeless-sidebar/
├── assets/              # Icons, screenshots, demo
├── ui/
│   ├── sidebar.js       # Content injection
│   ├── sidebar.css      # Global styles
│   ├── panel.html       # Sidebar HTML
│   └── panel.js         # UI controller
├── background.js        # Service worker
├── manifest.json        # Extension config
└── README.md           # Documentation
```

## Coding Style

- **Javascript**: ES6+, 2 spaces indentation
- **CSS**: BEM naming, 2 spaces indentation
- **HTML**: Semantic HTML5, accessible

## Testing

Testing is currently manual. We're working on adding automated tests:

1. Load the extension in developer mode

2. Test all features:

- Toggle sidebar
- Switch alignment
- Pin apps
- Remove apps
- Notes auto-save
- Calculator
- Context awareness

## Release Process

1. Update version in manifest.json

2. Update CHANGELOG.md

3. Create a GitHub release

4. Package the extension

5. Submit to Chrome Web Store

## Questions?

Feel free to open an issue or reach out to the maintainers.
