# Quick Start Guide - ChatGPT to Claude Migration Tool

## 🚀 Start the Tool

```bash
# Make sure you're in the project directory
cd chat-migrator

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Two Migration Methods

### Method 1: Manual Export (Easiest)

1. **Export from ChatGPT:**
   - Go to [ChatGPT Settings](https://chat.openai.com/settings)
   - Click "Data controls" → "Export data"
   - Confirm and wait for email
   - Download and extract the ZIP file

2. **Upload to Tool:**
   - Open the migration tool
   - Drag & drop `conversations.json` or click to browse
   - Wait for parsing (a few seconds for hundreds of conversations)

3. **Select & Export:**
   - Use filters to find specific conversations
   - Select individual conversations or "Select All"
   - Click "Export" button
   - Download the ZIP file with markdown files

4. **Import to Claude:**
   - Extract the ZIP file
   - Upload markdown files to a Claude Project
   - Or paste them into individual Claude conversations

### Method 2: Auto-Scrape (Fastest) 🚀

1. **Start Auto-Scrape:**
   - Click "Auto-Scrape from ChatGPT" button
   - Read the instructions and click "Start Auto-Scraping"

2. **Login:**
   - A browser window will open to ChatGPT
   - Log in if you're not already logged in
   - Wait for the tool to detect login (automatic)

3. **Automatic Extraction:**
   - The tool scrolls through your conversation list
   - Opens each conversation and extracts messages
   - Progress bar shows current status
   - Keep the browser window open!

4. **Select & Export:**
   - Once complete, conversations appear in the tool
   - Select which ones to export
   - Click "Export" to download ZIP

## ⚙️ Settings (Optional)

Click the Settings icon (top right) to:
- Configure API keys for future enhancements
- View your configuration

## 💡 Tips

### For Best Results:
- **Auto-Scrape**: Make sure you're logged in to ChatGPT
- **Large Exports**: Auto-scrape handles 100s of conversations (takes a few minutes)
- **Code Preservation**: Both methods preserve code blocks perfectly
- **Branches**: Alternative message regenerations are included

### Troubleshooting:
- **Auto-scrape timeout**: Log in to ChatGPT first, then start auto-scrape
- **Missing conversations**: Try the manual export method
- **Slow export**: Normal for 100+ conversations, be patient!

## 📊 What Gets Exported

Each conversation becomes a markdown file with:
- ✅ Conversation title and metadata
- ✅ All messages (user & assistant)
- ✅ Timestamps
- ✅ Code blocks with syntax highlighting
- ✅ Alternative branches (if any)
- ✅ Model information

Plus an index file (`README.md`) with:
- Overview of all conversations
- Statistics and date ranges
- Quick navigation links

## 🎯 Next Steps

After export:
1. Extract the ZIP file
2. Review the `README.md` for overview
3. Upload to Claude:
   - **Claude Projects**: Upload all files at once
   - **Individual Chats**: Paste markdown content

## 🔐 Privacy & Security

- ✅ Everything runs locally on your computer
- ✅ Manual method: Only your browser touches the JSON file
- ✅ Auto-scrape: Browser automation on YOUR machine
- ✅ No data sent to external servers
- ✅ Your ChatGPT credentials never leave your computer

## 📚 Additional Resources

- [Full README](README.md) - Complete feature list
- [Playwright Setup](PLAYWRIGHT_SETUP.md) - Technical details for auto-scrape
- [Settings](http://localhost:3000/settings) - Configure API keys

## 🐛 Need Help?

1. Check browser console for errors
2. Try with 1-2 conversations first
3. Open an issue on GitHub with details

---

**Ready to migrate?** Start with method 1 (manual) if this is your first time, or dive into auto-scrape for speed! 🚀
