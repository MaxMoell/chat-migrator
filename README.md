# ChatGPT to Claude Migration Tool

**Migrate your ChatGPT conversations to Claude with one click** - completely free, privacy-focused, and automated.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### Current Features (v1.0)
- ✅ **Complete Privacy**: All processing happens locally in your browser - no data is sent to any server
- ✅ **Bulk Export**: Export all conversations at once or select specific ones
- ✅ **Smart Parsing**: Handles ChatGPT's complex graph structure (message regenerations, edits, branches)
- ✅ **Rich Format**: Preserves code blocks, timestamps, model information, and citations
- ✅ **Branch Support**: Includes alternative message regenerations as separate sections
- ✅ **Filter & Search**: Find specific conversations by title, date, or content type
- ✅ **Claude-Optimized**: Generates clean Markdown files ready for Claude Projects
- ✅ **Dark Mode**: Beautiful UI that works in light and dark mode
- 🚀 **Auto-Scrape** (Beta): Automatically extract conversations directly from ChatGPT using Playwright

### Coming Soon (Roadmap)
- 🔄 **Automatic Migration**: Connect your ChatGPT and Claude accounts for one-click migration
- 🔄 **API Integration**: Direct export from ChatGPT API and upload to Claude Projects
- 🔄 **Settings Management**: Save API keys securely for seamless automation
- 🔄 **Interactive Tutorial**: Step-by-step guide for first-time users
- 🔄 **Image Support**: Embed images from conversations (Base64 or references)
- 🔄 **Bi-directional Sync**: Claude → ChatGPT migration support
- 🔄 **Other Platforms**: Support for Gemini, Perplexity, and other AI assistants

## 📸 Screenshots

*Coming soon*

## 🎯 How It Works

### Current Method (Manual)

1. **Export from ChatGPT**
   - Go to ChatGPT Settings → Data controls → Export data
   - Click "Export" and confirm
   - Wait for the email with your download link
   - Download and extract the ZIP file

2. **Upload & Convert**
   - Open the tool in your browser
   - Upload your `conversations.json` file
   - The tool automatically parses all conversations
   - Select which conversations to export (or select all)

3. **Download & Import**
   - Click "Export" to download a ZIP file with Markdown files
   - Extract the files
   - Upload them to Claude or a Claude Project

### Automated Method (Auto-Scrape with Playwright)

1. **Start Auto-Scrape**
   - Click "Auto-Scrape from ChatGPT"
   - A browser window opens to ChatGPT
   - Log in if needed

2. **Automatic Extraction**
   - Tool automatically scrolls through all conversations
   - Extracts messages directly from the page
   - No waiting for export emails
   - All processing happens locally

3. **Export**
   - Select which conversations to export
   - Download as ZIP with Markdown files
   - Upload to Claude Project

> **Note**: Auto-Scrape requires Playwright setup. See [PLAYWRIGHT_SETUP.md](PLAYWRIGHT_SETUP.md) for details.

## 🛠️ Technical Details

### Tech Stack

- **Frontend**: Next.js 16 with React 19 and TypeScript
- **Styling**: Tailwind CSS 4
- **Processing**: 100% client-side (no backend required)
- **Export**: JSZip for creating downloadable archives
- **Date Formatting**: date-fns

### Project Structure

```
├── app/
│   ├── page.tsx              # Main application page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── ui/
│       ├── FileUpload.tsx         # Drag & drop file upload
│       ├── ConversationList.tsx   # Conversation browser with filters
│       ├── ExportButton.tsx       # Export with progress
│       └── StatsCard.tsx          # Statistics display
├── lib/
│   ├── parser/
│   │   └── chatgpt-parser.ts      # Parse ChatGPT JSON format
│   ├── converter/
│   │   └── markdown-converter.ts  # Convert to Markdown
│   ├── exporter/
│   │   └── zip-exporter.ts        # Create ZIP archives
│   └── utils/
│       └── file-helpers.ts        # File validation & reading
└── types/
    └── chatgpt.ts            # TypeScript type definitions
```

### Key Features Explained

#### Graph Structure Parsing
ChatGPT stores conversations as a graph with parent-child relationships, enabling features like message regeneration. Our parser:
- Traverses the graph to find the main conversation thread
- Extracts alternative branches (regenerations)
- Handles edge cases and malformed data
- Prevents infinite loops in circular references

#### Markdown Conversion
Each conversation is converted to a readable Markdown file with:
- Conversation metadata (title, date, models used)
- Main conversation thread with role indicators (👤 User, 🤖 Assistant)
- Formatted code blocks with syntax highlighting
- Alternative branches (if any) clearly separated
- Citations and model information noted where available

#### Bulk Operations
- Process hundreds of conversations efficiently
- Real-time progress tracking during export
- Estimated file size calculation
- Auto-selection of all conversations
- Memory-efficient streaming

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chat-migrator.git
cd chat-migrator

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔐 Privacy & Security

- **No Server Processing**: Everything runs in your browser using JavaScript
- **No Data Storage**: Files are processed in memory only, nothing is saved
- **No Tracking**: No analytics, no cookies, no data collection
- **Open Source**: Full code transparency - audit it yourself
- **Local First**: Your data never leaves your device

## 📊 Browser Support

Works in all modern browsers with JavaScript enabled:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## 🗺️ Roadmap

### Phase 1: Core Functionality ✅
- [x] ChatGPT JSON parsing
- [x] Markdown conversion
- [x] ZIP export
- [x] UI with filters and search
- [x] Dark mode support

### Phase 2: Automation (In Progress)
- [ ] Settings page for API keys
- [ ] ChatGPT API integration for automatic export
- [ ] Claude/Anthropic API integration for automatic upload
- [ ] One-click migration workflow
- [ ] Interactive tutorial/onboarding

### Phase 3: Advanced Features
- [ ] Image embedding support
- [ ] Bi-directional migration (Claude → ChatGPT)
- [ ] Support for other platforms (Gemini, Perplexity)
- [ ] Conversation analytics and insights
- [ ] Custom export templates
- [ ] Scheduled automatic backups

## 🤝 Contributing

Contributions are welcome! This is an open-source project aimed at helping users maintain their AI conversation history.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use, modify, and distribute.

## 🐛 Troubleshooting

### Common Issues

**Q: The upload fails with "Invalid JSON structure"**
A: Make sure you're uploading the `conversations.json` file from your ChatGPT export, not the entire ZIP file.

**Q: Some conversations are missing**
A: The parser filters out conversations that don't have valid message content. Check the browser console for errors.

**Q: Export is slow for large files**
A: Processing hundreds of conversations can take a few minutes. The progress bar shows the current status.

**Q: Dark mode doesn't work**
A: Make sure your system/browser is set to dark mode. The UI automatically adapts.

### Still Having Issues?

1. Check that your JSON file is from a valid ChatGPT export
2. Ensure you're using a modern browser
3. Try with a smaller subset of conversations first
4. Open an issue on GitHub with:
   - Browser and version
   - Error message (if any)
   - Steps to reproduce

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/chat-migrator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/chat-migrator/discussions)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Anthropic for Claude
- OpenAI for ChatGPT
- All contributors and users

---

**Note**: This tool is not affiliated with OpenAI or Anthropic. It's a community project to help users migrate their data between AI platforms.

**Made with ❤️ for the AI community**
