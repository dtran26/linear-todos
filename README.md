# Linear TODOs

A VSCode extension that converts TODO comments into Linear issues with full code context.

## Features

- **TODO Detection**: Automatically finds TODO comments in TypeScript, JavaScript, Python, Java, Go, Rust, C++, and C#
- **Linear Integration**: Create Linear issues directly from TODO comments with code context
- **Visual Indicators**: Highlighted TODOs with status-based colors and hover previews
- **Bidirectional Linking**: TODOs automatically link to their Linear issues

## Requirements

- VSCode 1.65.0 or higher
- Linear account
- [Linear Connect extension](https://marketplace.visualstudio.com/items?itemName=Linear.linear-connect) (auto-installed)

## Quick Start

1. **Install** the extension from the marketplace or VSIX file
2. **Authenticate** with Linear when prompted (uses Linear Connect)
3. **Create issues** by hovering over TODO comments and clicking "Create Issue"

## Usage

### Creating Issues
- Hover over any `TODO:` comment and click "Create Issue"
- Or use Command Palette: `Linear TODOs: Create Linear Issue from TODO`
- Or right-click selected text to create an issue

### Viewing Information
- Hover over TODOs to see details and linked issue status
- Status bar shows TODO count for current file
- Linked TODOs show ✓ indicator

## Settings

- `linearTodos.teamId`: Default Linear team ID (optional)
- `linearTodos.autoHighlight`: Enable TODO highlighting (default: true)
- `linearTodos.showStatusBar`: Show TODO count in status bar (default: true)

## Commands

- `Linear TODOs: Create Linear Issue from TODO`
- `Linear TODOs: Open Linear Issue`
- `Linear TODOs: Refresh TODOs`
- `Linear TODOs: Configure Linear Integration`

## Example

```typescript
// TODO: Implement proper error handling for API calls
async function fetchUserData(id: string) {
    return fetch(`/api/users/${id}`);
}
```

Hover over the TODO → Click "Create Issue" → Linear issue created with code context.

## Troubleshooting

- **Extension not working**: Ensure Linear Connect is installed and restart VSCode
- **TODOs not detected**: Use `TODO:` format and enable `autoHighlight`
- **Auth issues**: Check Linear workspace access and internet connection

## Contributing

Report bugs, suggest features, or submit pull requests on [GitHub](https://github.com/dtran26/linear-todos).

## License

MIT
