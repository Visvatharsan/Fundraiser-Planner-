# AI Chatbot Testing Guide

## Overview
This guide will help you test the AI-powered chatbot to ensure it's generating AI responses rather than using pre-written answers.

## What Changed
The chatbot has been updated to:
1. Always prioritize AI responses from Gemini API
2. Remove most pre-written, hardcoded responses
3. Add better error handling and debugging capabilities
4. Include a new test page with debug console

## How to Test

### Step 1: Open the AI Chatbot Test Page
Navigate to `/frontend/chatbot-ai-test.html` in your browser. This special test page includes a debug panel that will show API requests and responses.

### Step 2: Open the Chatbot
Click the "Open Chatbot" button on the test page to launch the chatbot interface.

### Step 3: Ask Test Questions
Try asking various questions to test the AI responses. Some examples:
- "How do I create a campaign?"
- "What payment methods are accepted for donations?"
- "Can you help me write a good campaign description?"

### Step 4: Check Debug Panel
The debug panel will show logs of:
- API key validation
- API requests being sent
- Response status codes
- Any errors encountered

## Troubleshooting

### If You Still Get Pre-Written Answers

1. **API Key Issue**
   Check the debug panel for any API key errors. If you see "Invalid Gemini API key format", you'll need to:
   - Obtain a valid Gemini API key from Google AI Studio
   - Update the key in `frontend/assets/js/chatbot.js` (line 3)

2. **Domain Constraints**
   The AI is instructed to only answer questions related to fundraising. If you ask off-topic questions, it may use a standard response. Try asking website-specific questions.

3. **Cache Issues**
   Your browser might be caching old JavaScript. Try:
   - Hard refreshing your browser (Ctrl+F5 or Cmd+Shift+R)
   - Clearing browser cache
   - Opening in an incognito/private window

4. **Network Issues**
   If the API calls are failing, you'll see error messages in the debug console. Ensure:
   - Your internet connection is working
   - You're not being blocked by firewalls
   - The API key has proper permissions

## Advanced Options

### Using Environment Variables
You can load the API key from environment variables instead:
1. In `chatbot.js`, uncomment line 6:
   ```javascript
   this.apiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
   ```
2. Set the environment variable before starting your server

### Customizing AI Behavior
You can modify the system prompts in the `getGeminiResponse` method to change how the AI responds.

## Need Further Help?
If you continue experiencing issues or have questions, please reach out for support. 