# AI Chatbot Testing Guide

## Overview
This guide will help you test the AI-powered chatbot to ensure it's generating AI responses rather than using pre-written answers.

## What Changed
The chatbot has been updated to:
1. Always prioritize AI responses from Gemini API
2. Remove most pre-written, hardcoded responses
3. Add better error handling and debugging capabilities
4. Include a new test page with debug console

## AI Chatbot Features

### Natural Language Understanding
The chatbot uses Google's Gemini AI to understand user queries and provide contextually relevant responses.

### Form Filling Assistance
The chatbot can help users fill out various forms on the website, including campaign creation, donation forms, and user registration.

### Context Awareness
The chatbot is aware of which page the user is on and can provide page-specific assistance.

### Campaign Templates
When users need help with campaign creation, the chatbot can provide templates and suggestions based on the campaign type.

### Email Drafting
The chatbot can generate email templates for various fundraising purposes:
- Thank you emails to donors
- Campaign update emails for supporters
- Sponsorship requests (corporate and individual)
- Campaign sharing emails
- Specialized templates for medical, education, and emergency campaigns
- Sponsorship follow-up messages

The chatbot can extract campaign information from your messages or use details from the campaign page you're currently viewing.

### Data Integration
The chatbot now connects directly to the fundraising platform's database, enabling:

1. **Real-time Statistics** - The chatbot can pull current donation statistics, including total amount raised, number of donations, successful campaigns, and popular categories.

2. **Campaign Recommendations** - Users can ask the chatbot to recommend campaigns based on interests (e.g., "Find medical campaigns" or "Show me education fundraisers").

3. **Popular Campaigns** - The chatbot can display trending campaigns ordered by donation activity.

4. **Search Functionality** - Users can search for specific types of campaigns through the chatbot interface.

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

## How to Use the Chatbot

### Getting Platform Statistics
Ask questions like:
- "What are the current fundraising statistics?"
- "How much money has been raised on this platform?"
- "What are the most popular campaign categories?"

### Finding Campaigns
Try phrases like:
- "Recommend campaigns about education"
- "Find medical fundraisers"
- "Show me popular campaigns"
- "Suggest campaigns for community projects"

### Drafting Emails
For campaign communication, ask the chatbot to help you draft emails:
- "Draft a thank you email for donors"
- "Write an email to update supporters on my campaign progress"
- "Create a sponsorship request email for a company"
- "Help me write an email to share my medical campaign"
- "Draft a follow-up email for a potential sponsor"

You can add campaign details to your request:
- "Draft an email to share my campaign 'School Supplies for Kids' with a goal of $5,000"
- "Write a thank you email for donors to my medical treatment fundraiser" 