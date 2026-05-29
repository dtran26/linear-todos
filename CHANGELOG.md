# Change Log

All notable changes to the "linear-todos" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] - 2026-05-29

### Added
- ⚙️ `linearTodos.defaultImpact` setting to control the impact level applied when creating an issue. Set it to `high`, `medium`, or `low` to skip the impact prompt entirely and always use that priority; leave it on `ask` (default) to keep being prompted each time.

### Changed
- Creating an issue no longer forces you through the impact picker when a default impact is configured.

## [1.0.0] - 2024-12-19

### Added
- ✨ Smart TODO detection and highlighting for multiple programming languages
- 🔗 One-click Linear issue creation from TODO comments
- 👀 Hover tooltips with Linear issue details and quick actions
- 📊 Status bar TODO counter with refresh functionality
- 📱 Context menu integration for easy access
- 🔄 Bidirectional linking between TODOs and Linear issues
- 🌐 Deep linking to open Linear issues directly from code
- 📝 Code context capture when creating Linear issues

### Features
- Support for TypeScript, JavaScript, Python, Java, Go, Rust, C++, C#
- Secure OAuth authentication via Linear Connect extension
- Simple TODO-only pattern detection
- Visual indicators for linked vs unlinked TODOs
- File location tracking in Linear issues
- Clean output channel logging for debugging