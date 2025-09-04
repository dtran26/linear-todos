# Linear TODOs - VSCode Extension

A powerful VSCode extension that integrates with Linear to help manage TODOs and technical debt directly from your code. Never let TODOs go unassigned again!

## 🚀 Features

### 📝 Smart TODO Detection
- Automatically detects TODO, FIXME, HACK, XXX, and BUG comments in your code
- Supports multiple programming languages (TypeScript, JavaScript, Python, Java, Go, Rust, C++, C#)
- Configurable patterns to match your team's conventions

### 🔗 Linear Integration
- **One-click issue creation**: Convert any TODO comment into a Linear issue with full context
- **Hover previews**: See Linear issue details directly in your editor
- **Bidirectional linking**: TODOs are automatically linked to their corresponding Linear issues
- **Deep linking**: Click to open Linear issues directly from your code

### 🎨 Visual Indicators
- **Syntax highlighting**: TODOs are highlighted with different colors based on their status
- **Priority indicators**: Visual priority badges (🔴 High, 🟡 Medium, 🔵 Low)
- **Status bar**: Shows total TODO count in the current file
- **Decorations**: Linked TODOs show ✓, unlinked TODOs show 📝

### ⚡ Smart Features
- **Automatic priority detection**: Analyzes TODO text to determine priority level
- **Code context capture**: Includes surrounding code when creating Linear issues
- **File location tracking**: Precise line and file information in Linear issues

## 📋 Requirements

- VSCode 1.76.1 or higher
- Linear account
- [Linear Connect extension](https://marketplace.visualstudio.com/items?itemName=Linear.linear-connect) (automatically installed as dependency)

## ⚙️ Setup & Configuration

### 1. Install the Extension
1. Download the `.vsix` file or install from the VSCode marketplace
2. In VSCode, go to Extensions view (`Ctrl+Shift+X`)
3. Click the "..." menu and select "Install from VSIX..."

### 2. Authenticate with Linear
The extension uses the official [Linear Connect extension](https://marketplace.visualstudio.com/items?itemName=Linear.linear-connect) for secure OAuth authentication:

1. When you first create a Linear issue, you'll be prompted to authenticate
2. Click "Allow" to grant permissions to your Linear workspace
3. The authentication is handled securely through Linear's OAuth flow

### 3. Optional Team Configuration
Run the command `Linear TODOs: Configure Linear Integration` from the Command Palette (`Ctrl+Shift+P`) to:
- Set a default team ID (optional - if not set, the first available team will be used)
- Configure other extension settings

## 🎯 Usage

### Creating Linear Issues from TODOs

1. **From TODO comment**: Place your cursor on any TODO comment and:
   - Use the Command Palette: `Linear TODOs: Create Linear Issue from TODO`
   - Right-click and select "Create Linear Issue from TODO"
   - Use the hover tooltip and click "Create Issue"

2. **From selection**: Select any text and right-click to create a Linear issue

### Viewing TODO Information

1. **Hover**: Hover over any TODO comment to see:
   - Priority level and type
   - Code context
   - Linked Linear issue details (if available)
   - Quick action buttons

2. **Status bar**: Click the TODO counter in the status bar to refresh

### Managing Linked TODOs

- Once a TODO is linked to a Linear issue, it shows a ✓ indicator
- Hover to see issue status, assignee, and other details
- Click "Open in Linear" to view the full issue

## 🔧 Extension Settings

This extension contributes the following settings:

* `linearTodos.teamId`: Default Linear team ID for creating issues (optional - uses first available team if not set)
* `linearTodos.todoPatterns`: Array of patterns to detect as TODOs (default: `["TODO", "FIXME", "HACK", "XXX", "BUG"]`)
* `linearTodos.autoHighlight`: Enable/disable automatic highlighting of TODO items (default: `true`)
* `linearTodos.showStatusBar`: Show/hide TODO count in status bar (default: `true`)

**Note:** Authentication is handled automatically through the Linear Connect extension - no API keys needed!

## 📝 TODO Comment Formats

The extension recognizes various TODO formats:

```typescript
// TODO: Implement user authentication
// FIXME: Fix memory leak in data processing
// HACK: Temporary workaround for API limitation
// XXX: This code needs refactoring
// BUG: Incorrect calculation in edge cases

/* TODO: Multi-line todos are also supported */
# TODO: Works in Python comments too
// TODO: Add error handling !!! (High priority)
```

### Priority Detection

The extension automatically detects priority levels based on:

- **High Priority**: BUG, FIXME, or keywords like "urgent", "critical", "!!!"
- **Low Priority**: XXX or keywords like "minor", "optional", "nice to have"
- **Medium Priority**: Everything else (default)

## 🚀 Commands

- `Linear TODOs: Create Linear Issue from TODO` - Convert TODO at cursor to Linear issue
- `Linear TODOs: Open Linear Issue` - Open linked Linear issue in browser
- `Linear TODOs: Refresh TODOs` - Rescan current file for TODOs
- `Linear TODOs: Configure Linear Integration` - Set up Linear API credentials

## 💡 Example Workflow

1. **Write code with TODOs**:
   ```typescript
   // TODO: Implement proper error handling for API calls
   async function fetchUserData(id: string) {
       return fetch(`/api/users/${id}`);
   }
   ```

2. **Hover over the TODO** to see options and context

3. **Click "Create Issue"** to generate a Linear issue with:
   - Title: "Implement proper error handling for API calls (src/api.ts:2)"
   - Description: Code context, file location, and TODO details
   - Automatic priority assignment

4. **TODO becomes linked** and shows ✓ with issue details on hover

5. **Track progress** in Linear and see updates reflected in your code

## 🔍 Troubleshooting

### Extension Not Working
- Ensure the Linear Connect extension is installed and enabled
- Try restarting VSCode
- Check that you're authenticated with Linear (try creating an issue to trigger authentication)

### TODOs Not Detected
- Check the `todoPatterns` setting to ensure your format is included
- Make sure `autoHighlight` is enabled
- Try refreshing with `Linear TODOs: Refresh TODOs`

### Linear Authentication Issues
- Make sure you have access to the Linear workspace
- Try signing out and back in through Linear Connect
- Check your internet connection
- Ensure the team exists and you have access to it

## 🤝 Contributing

This extension is open source. Feel free to contribute by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests

## 📄 License

MIT License - see LICENSE file for details

## 🎉 Release Notes

### 0.0.1 (Initial Release)

- ✨ TODO detection and highlighting
- 🔗 Linear issue creation from TODOs
- 👀 Hover tooltips with issue previews
- 📊 Status bar TODO counter
- ⚙️ Configurable settings and patterns
- 🎯 Smart priority detection
- 📱 Context menu integration
