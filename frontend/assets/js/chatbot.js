class Chatbot {
    constructor() {
        // Ensure a valid API key is set for Gemini API
        this.apiKey = 'AIzaSyBXv_SRiPeXbZRPxGtvNwO_fSeohmCz9PU';
        
        // Uncomment the line below if you want to load the API key from environment variables
        // this.apiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
        
        // Validate API key format
        if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY' || !this.apiKey.startsWith('AIza')) {
            console.error('Invalid Gemini API key format. Please check your API key.');
        }
        
        this.chatHistory = this.loadChatHistory() || [];
        this.isOpen = false;
        this.lastMessageWasCampaignTypeQuestion = false; // Track if we asked user for campaign type
        this.userData = null; // Store user data for personalization
        this.currentPageContext = this.detectCurrentPageContext(); // Store current page context
        
        // Store campaign data for recommendations
        this.campaignStats = null;
        this.popularCampaigns = [];
        
        this.initializeUI();
        this.addResizeListener();
        this.loadUserData(); // Load user data if available
        
        // Load initial statistics when chatbot is initialized
        this.loadChatbotStatistics();
    }

    initializeUI() {
        // Create chatbot container
        const container = document.createElement('div');
        container.id = 'chatbot-container';
        container.innerHTML = `
            <div id="chatbot-toggle" class="chatbot-toggle">
                <i class="fas fa-robot"></i>
            </div>
            <div id="chatbot-window" class="chatbot-window">
                <div class="chatbot-header">
                    <h3>Fundraiser Assistant</h3>
                    <div>
                        <button id="clear-chat" title="Clear Chat History" style="margin-right: 10px; background: none; border: none; color: white; cursor: pointer;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <button id="close-chatbot" class="close-btn">×</button>
                    </div>
                </div>
                <div id="chat-messages" class="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" id="chat-input" placeholder="Ask about the fundraising platform...">
                    <button id="send-message">Send <i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Add event listeners
        document.getElementById('chatbot-toggle').addEventListener('click', () => this.toggleChat());
        document.getElementById('close-chatbot').addEventListener('click', () => this.toggleChat());
        document.getElementById('send-message').addEventListener('click', () => this.handleUserMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserMessage();
        });
        document.getElementById('clear-chat').addEventListener('click', () => this.clearChatHistory());

        // Ensure chatbot container is positioned properly
        this.adjustChatPositionForNavbar();

        // Restore chat history from previous session
        this.restoreChatHistory();

        // Add initial greeting if no chat history
        if (this.chatHistory.length === 0) {
            this.addMessage("Hello! I'm your Fundraiser Assistant. I can help you with:\n\n- Creating fundraising campaigns\n- Making donations\n- Navigating the website\n- Managing your account\n\n**Need help filling out a form?** I can provide examples of campaign names, descriptions, and suggested goal amounts based on your campaign type. Just say \"Help me fill out a campaign form\" to get started!", 'bot');
        }
    }

    addResizeListener() {
        // Adjust chat window dimensions on window resize
        window.addEventListener('resize', () => {
            this.adjustChatWindowSize();
            this.adjustChatPositionForNavbar();
        });
    }

    adjustChatWindowSize() {
        // Ensure the messages container has the correct height
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            const headerHeight = document.querySelector('.chatbot-header').offsetHeight;
            const inputHeight = document.querySelector('.chat-input-container').offsetHeight;
            const windowHeight = window.innerHeight;
            const navbarHeight = document.querySelector('#main-nav')?.offsetHeight || 64; // Get navbar height
            
            // Account for navbar in the total height calculation
            messagesContainer.style.height = `${windowHeight - headerHeight - inputHeight - navbarHeight}px`;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    toggleChat() {
        // Refresh page context when chat is opened
        if (!this.isOpen) {
            this.refreshPageContext();
            this.loadUserData(); // Refresh user data when chat is opened
            this.loadChatbotStatistics(); // Refresh campaign statistics when chat is opened
        }
        
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chatbot-window');
        const body = document.body;
        
        // Display first to enable transition
        if (this.isOpen) {
            chatWindow.style.display = 'block';
            // Trigger reflow to ensure transition happens
            void chatWindow.offsetWidth;
            chatWindow.classList.add('open');
            
            // Add class to body to adjust layout
            body.classList.add('chatbot-open');
            
            // Adjust dimensions
            this.adjustChatWindowSize();
            
            // Scroll to bottom when opening
            const messagesContainer = document.getElementById('chat-messages');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            // Focus input
            document.getElementById('chat-input').focus();
        } else {
            chatWindow.classList.remove('open');
            
            // Remove class from body to restore layout
            body.classList.remove('chatbot-open');
            
            // Wait for transition to complete before hiding
            setTimeout(() => {
                if (!this.isOpen) { // Double check in case it was reopened
                    chatWindow.style.display = 'none';
                }
            }, 400); // Match the CSS transition duration
        }
    }

    async handleUserMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        // Show loading indicator
        const messagesContainer = document.getElementById('chat-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading';
        
        // Create typing animation dots
        const typingAnimation = document.createElement('div');
        typingAnimation.className = 'typing-animation';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'typing-dot';
            typingAnimation.appendChild(dot);
        }
        
        loadingDiv.appendChild(typingAnimation);
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            // Always prioritize AI responses for all questions
            // Only use static responses for campaign type followup as it requires context
            const lowerMessage = message.toLowerCase();
            const campaignTypes = ['medical', 'education', 'community', 'creative', 'nonprofit', 'emergency', 'personal'];
            let response = '';
            
            // Check for email drafting requests
            if ((lowerMessage.includes('draft') || lowerMessage.includes('write') || lowerMessage.includes('create')) && 
                (lowerMessage.includes('email') || lowerMessage.includes('mail') || lowerMessage.includes('message'))) {
                
                console.log('Email drafting request detected');
                
                // Determine the type of email to draft
                let emailPurpose = 'share'; // Default to sharing campaign
                
                if (lowerMessage.includes('thank') || lowerMessage.includes('appreciation') || lowerMessage.includes('donor')) {
                    emailPurpose = 'thanks';
                    console.log('Drafting thank you email for donors');
                } 
                else if (lowerMessage.includes('update') || lowerMessage.includes('progress')) {
                    emailPurpose = 'update';
                    console.log('Drafting campaign update email');
                }
                else if (lowerMessage.includes('sponsor') || lowerMessage.includes('sponsorship')) {
                    if (lowerMessage.includes('company') || lowerMessage.includes('corporate') || lowerMessage.includes('business')) {
                        emailPurpose = 'corporate_sponsorship';
                        console.log('Drafting corporate sponsorship email');
                    } 
                    else if (lowerMessage.includes('follow') || lowerMessage.includes('follow-up') || lowerMessage.includes('followup')) {
                        emailPurpose = 'sponsorship_followup';
                        console.log('Drafting sponsorship follow-up email');
                    }
                    else {
                        emailPurpose = 'individual_sponsorship';
                        console.log('Drafting individual sponsorship email');
                    }
                }
                else if (lowerMessage.includes('medical') || lowerMessage.includes('health') || lowerMessage.includes('treatment')) {
                    emailPurpose = 'medical_share';
                    console.log('Drafting medical fundraiser email');
                }
                else if (lowerMessage.includes('education') || lowerMessage.includes('school') || lowerMessage.includes('student')) {
                    emailPurpose = 'education_share';
                    console.log('Drafting education fundraiser email');
                }
                else if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('disaster')) {
                    emailPurpose = 'emergency_share';
                    console.log('Drafting emergency relief email');
                }
                else {
                    console.log('Drafting general campaign sharing email');
                }
                
                // Check if the user provided campaign details in their message
                let campaignDetails = null;
                let extractedTitle = null;
                let extractedGoal = null;
                
                // Try to extract campaign title if provided in the format "for campaign X" or "for X campaign"
                const titleRegex = /for\s+(?:campaign\s+)?["']?([^"']+)["']?(?:\s+campaign)?/i;
                const titleMatch = message.match(titleRegex);
                if (titleMatch && titleMatch[1]) {
                    extractedTitle = titleMatch[1].trim();
                    console.log('Extracted campaign title:', extractedTitle);
                }
                
                // Try to extract goal amount if provided
                const goalRegex = /(?:goal|amount|raise)\s+(?:of\s+)?[$£€]?(\d+(?:,\d+)*(?:\.\d+)?)/i;
                const goalMatch = message.match(goalRegex);
                if (goalMatch && goalMatch[1]) {
                    // Convert to number, removing commas
                    extractedGoal = parseFloat(goalMatch[1].replace(/,/g, ''));
                    console.log('Extracted goal amount:', extractedGoal);
                }
                
                // If we have any extracted info, create a campaign details object
                if (extractedTitle || extractedGoal) {
                    campaignDetails = {
                        title: extractedTitle || "[Your Campaign Name]",
                        description: "[Your Campaign Description]",
                        goal: extractedGoal || "[Your Campaign Goal]",
                        url: "[Campaign URL]"
                    };
                }
                
                // If the user is on a campaign page, try to get that campaign's details
                if (this.currentPageContext && this.currentPageContext.pageName === 'Campaign' && this.currentPageContext.campaignData) {
                    console.log('Using current campaign page data for email');
                    campaignDetails = {
                        title: this.currentPageContext.campaignData.title,
                        description: this.currentPageContext.campaignData.description,
                        goal: this.currentPageContext.campaignData.goal_amount,
                        url: window.location.href
                    };
                }
                
                // Use AI to draft a custom email body instead of predefined templates
                try {
                    // Format campaign details for the prompt
                    const campaignInfo = campaignDetails ? 
                        `Campaign Title: ${campaignDetails.title}\nGoal Amount: ${campaignDetails.goal}\nDescription: ${campaignDetails.description}\nURL: ${campaignDetails.url}\n` :
                        "No specific campaign details were provided.";
                    
                    // Create a prompt for drafting the email
                    const emailPrompt = `I need you to write a custom email body (not a template) for a ${emailPurpose.replace('_', ' ')} message for a fundraising campaign with these details:\n\n${campaignInfo}\n\nPlease write ONLY the body of the email, without the subject line, greeting (Dear...), or signature. Make it personal, compelling, and authentic - not a template. The email should be about ${emailPurpose === 'thanks' ? 'thanking donors' : emailPurpose === 'update' ? 'updating supporters on campaign progress' : emailPurpose === 'corporate_sponsorship' ? 'requesting corporate sponsorship' : emailPurpose === 'individual_sponsorship' ? 'requesting individual sponsorship' : emailPurpose === 'sponsorship_followup' ? 'following up on sponsorship request' : 'sharing the campaign with friends and family'}. Create completely fresh text, not a fill-in-the-blank template.`;
                    
                    // Get custom AI response for the email body
                    const draftEmail = await this.getGeminiResponse(emailPrompt);
                    
                    // Create a response with the email and instructions
                    response = `Here's a custom email body for your ${emailPurpose.replace('_', ' ')} message:\n\n\`\`\`\n${draftEmail}\n\`\`\`\n\nYou can copy this text and use it as the body of your email. Remember to add your own subject line, greeting, and signature.`;
                } catch (error) {
                    console.error('Error getting AI response for email drafting:', error);
                    // Fall back to template if AI fails
                    const draftEmail = this.createDraftEmail(emailPurpose, campaignDetails);
                    response = `Here's a draft email body for your ${emailPurpose.replace('_', ' ')} message:\n\n\`\`\`\n${draftEmail}\n\`\`\`\n\nYou can copy this text and use it as the body of your email. Remember to add your own subject line, greeting, and signature. Replace any placeholder text in [brackets] with your actual information.`;
                }
            }
            // Check for requests for platform statistics
            else if (lowerMessage.includes('statistics') || 
                lowerMessage.includes('platform stats') || 
                lowerMessage.includes('how many campaigns') || 
                lowerMessage.includes('how much has been raised')) {
                
                console.log('Fetching platform statistics...');
                // Refresh statistics to ensure they're current
                await this.loadChatbotStatistics();
                response = this.formatStatistics();
            }
            // Check for popular campaign requests
            else if (lowerMessage.includes('popular campaign') || 
                lowerMessage.includes('trending campaign') ||
                lowerMessage.includes('show me popular') ||
                (lowerMessage.includes('show') && lowerMessage.includes('campaign'))) {
                
                console.log('Fetching popular campaigns...');
                await this.getPopularCampaigns();
                if (this.popularCampaigns && this.popularCampaigns.length > 0) {
                    console.log(`Found ${this.popularCampaigns.length} popular campaigns to display`);
                    response = this.formatCampaignResults(this.popularCampaigns, 'popular');
                }
            }
            // Check for campaign recommendation requests
            else if ((lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('find')) && 
                (lowerMessage.includes('campaign') || lowerMessage.includes('fundraiser'))) {
                
                // Extract potential interests from the message
                let potentialInterests = lowerMessage
                    .replace(/recommend|suggest|find|campaign|fundraiser|campaigns|fundraisers|related to|about|for/g, '')
                    .trim();
                
                console.log('Searching campaigns with interests:', potentialInterests);
                if (potentialInterests) {
                    // Search campaigns based on extracted interests
                    const recommendedCampaigns = await this.searchCampaigns(potentialInterests);
                    if (recommendedCampaigns && recommendedCampaigns.length > 0) {
                        console.log(`Found ${recommendedCampaigns.length} recommended campaigns`);
                        response = this.formatCampaignResults(recommendedCampaigns, 'recommended');
                    }
                }
            }
            // Only keep the campaign type followup logic as it's contextual
            else if (this.lastMessageWasCampaignTypeQuestion) {
                // Look for campaign type in user response
                let detectedType = null;
                for (const type of campaignTypes) {
                    if (lowerMessage.includes(type)) {
                        detectedType = type;
                        break;
                    }
                }
                
                if (detectedType) {
                    // Even for campaign type questions, use AI to generate response
                    try {
                        // Instead of hardcoded response
                        // response = this.provideCompleteCampaignSuggestions(detectedType);
                        
                        // Create a specific prompt for campaign suggestions
                        const campaignTypePrompt = `The user wants help creating a ${detectedType} fundraising campaign. Please provide specific suggestions for:
1. Example campaign titles for a ${detectedType} campaign
2. A template for writing an effective ${detectedType} campaign description
3. Appropriate fundraising goal amounts for ${detectedType} campaigns
4. Tips specific to ${detectedType} fundraising campaigns`;
                        
                        // Get AI response for this specific context
                        response = await this.getGeminiResponse(campaignTypePrompt);
                    } catch (error) {
                        console.error("Error getting AI response for campaign type:", error);
                        // Fall back to static response only if AI fails
                        response = this.provideCompleteCampaignSuggestions(detectedType);
                    }
                    
                    this.lastMessageWasCampaignTypeQuestion = false;
                }
            }
            
            // If we don't have a response yet, use the AI API
            if (!response) {
                response = await this.getGeminiResponse(message);
            }
            
            // Remove loading indicator
            messagesContainer.removeChild(loadingDiv);
            this.addMessage(response, 'bot');
        } catch (error) {
            // Remove loading indicator
            messagesContainer.removeChild(loadingDiv);
            this.addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
            console.error('Error:', error);
        }
    }

    async getGeminiResponse(message) {
        try {
            // Try gemini-1.5-flash model first (Gemini 2.0 Flash)
            let url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
            
            console.log('Sending request to Gemini 2.0 Flash API...');
            
            // Prepare chat history for the API
            const recentMessages = this.getConversationHistory(8); // Get more conversation history
            const conversationContext = this.getConversationContext(); // Get detected context
            let contents = [];
            
            // Improved system message with clear domain constraints and form filling capabilities
            let systemPrompt = `You are a helpful assistant for a fundraising website. Your purpose is to help users navigate the website, answer their questions about the website's features, fundraising campaigns, donations, and using the platform. 

IMPORTANT: You're specifically designed to help users with the following:

1. Fill out forms on the website - providing step-by-step guidance for completing forms, explaining each field and its purpose.
2. Provide real-time statistics about the fundraising platform, including donation totals, campaign counts, and popular categories.
3. Recommend specific campaigns based on user interests or show popular campaigns.
4. Draft emails for campaign creators - including thank you emails, campaign updates, sponsorship requests, and campaign sharing.
5. Answer questions about campaign creation, donation processes, and platform features.

When users ask for campaign recommendations, I will search the database and provide actual campaign data. When users ask about statistics, I will provide real-time platform data. When users ask for help writing emails, I can generate templates for different purposes.

For email drafting, I can help with:
- Thank you emails to donors
- Campaign updates for supporters
- Sponsorship requests (corporate or individual)
- Campaign sharing emails (general or specific to medical, education, or emergency campaigns)
- Sponsorship follow-up messages

When users need help with forms, guide them through:
1. Creating a campaign form (title, description, goal amount, category)
2. Donation form (amount, payment details, optional message)
3. Registration/login forms (username, email, password)
4. Account settings and profile forms

When users ask for help with a specific form, provide detailed guidance on:
- What each field requires
- Tips for writing effective content (for campaign descriptions)
- Suggestions for setting reasonable funding goals
- Help with payment methods and donation amounts
- Step-by-step walkthroughs of the entire process

CONSTRAINTS:
1. You must ONLY answer questions directly related to the fundraising website, its features, and how to use it.
2. If asked about ANYTHING outside of fundraising, donations, campaigns, or website features, politely decline to answer and explain you can only help with website-related questions.
3. Do NOT provide information on topics unrelated to the website, even if you know the answer.
4. Keep your answers concise, friendly, and focused on the website functionality.
5. When declining to answer off-topic questions, suggest website-related topics you can help with instead.

The website has the following main features and pages:
- Home page: Lists featured campaigns and general information
- Campaign page: Shows details about a specific campaign (title, description, goal amount, progress, donations)
- Create Campaign page: Form to create a new fundraising campaign (title, description, goal amount, category)
- Donate page: Form to make a donation to a campaign (amount, payment info, optional message)
- Dashboard: Manage your created campaigns (edit, delete, view stats)
- Login/Register pages: User authentication for campaign creators`;

            // Add user personalization if user data is available
            if (this.userData) {
                systemPrompt += `\n\nPERSONALIZATION CONTEXT:
- User name: ${this.userData.name || 'Anonymous'}
- User email: ${this.userData.email || 'Not available'}
- User has ${this.userData.campaigns?.length || 0} active campaigns
- User has made ${this.userData.donations?.length || 0} donations
- User account created: ${this.userData.createdAt || 'Recently'}
- User preferences: ${this.userData.preferences || 'Not specified'}

Use this information to provide personalized responses. For example:
- Refer to the user by name when appropriate
- Reference their existing campaigns when discussing campaign creation
- Acknowledge their donation history when discussing donations
- Tailor suggestions based on their previous activity`;
            }

            // Add current page context to system prompt
            if (this.currentPageContext) {
                systemPrompt += `\n\nPAGE CONTEXT:
The user is currently on the ${this.currentPageContext.pageName} page.
${this.currentPageContext.contextDescription}`;

                // If there's active form context, add specific form guidance
                if (this.currentPageContext.formContext) {
                    const formContext = this.currentPageContext.formContext;
                    systemPrompt += `\n\nACTIVE FORM CONTEXT:
The user is currently working with a ${formContext.formType} form containing the following fields: ${formContext.activeFields.join(', ')}.
Prioritize giving specific, field-by-field guidance for this form if the user asks for help.`;
                    
                    // Add form-specific tips based on type
                    switch (formContext.formType) {
                        case 'campaign':
                            systemPrompt += `\n\nCAMPAIGN FORM TIPS:
- Campaign title: Should be clear, concise, and compelling (30-60 characters ideal)
- Description: Tell a story with clear need, impact, and use of funds (500+ words recommended)
- Goal amount: Set realistic but ambitious goals based on actual needs
- Categories: Choose most relevant to help discovery`;
                            break;
                        case 'donation':
                            systemPrompt += `\n\nDONATION FORM TIPS:
- Donation amount: Suggest appropriate amounts based on campaign type
- Payment methods: Explain available options (credit card, PayPal, etc.)
- Donor name display: Explain privacy options for how name will appear
- Gift options: Clarify if donation can be made on behalf of someone else`;
                            break;
                        case 'registration':
                            systemPrompt += `\n\nREGISTRATION FORM TIPS:
- Username: Should be unique and appropriate
- Password: Recommend strong password practices
- Email verification: Explain the process
- Profile setup: Suggest completing profile for better fundraising results`;
                            break;
                    }
                }
            }

            // Add context-specific instructions if we have detected a conversation context
            if (conversationContext) {
                switch(conversationContext) {
                    case 'campaign_creation':
                        systemPrompt += `\n\nIMPORTANT: The user is currently discussing CAMPAIGN CREATION. Keep your responses focused on this topic, and maintain continuity from previous messages. Help them create an effective campaign by providing specific guidance on titles, descriptions, and goals.`;
                        break;
                    case 'donation':
                        systemPrompt += `\n\nIMPORTANT: The user is currently discussing DONATIONS. Keep your responses focused on this topic, and maintain continuity from previous messages. Help them understand the donation process, payment options, and how to support campaigns effectively.`;
                        break;
                    case 'sponsorship':
                        systemPrompt += `\n\nIMPORTANT: The user is currently discussing SPONSORSHIPS. Keep your responses focused on this topic, and maintain continuity from previous messages. Provide information about sponsorship opportunities, benefits, and how to approach potential sponsors.`;
                        break;
                    case 'campaign_management':
                        systemPrompt += `\n\nIMPORTANT: The user is currently discussing CAMPAIGN MANAGEMENT. Keep your responses focused on this topic, and maintain continuity from previous messages. Help them understand how to edit, monitor, and manage their fundraising campaigns.`;
                        break;
                    case 'email_drafting':
                        systemPrompt += `\n\nIMPORTANT: The user is currently discussing EMAIL TEMPLATES or DRAFTING. Keep your responses focused on this topic, and maintain continuity from previous messages. Help them create effective emails for their fundraising needs.`;
                        break;
                    case 'account_settings':
                        systemPrompt += `\n\nIMPORTANT: The user is currently discussing ACCOUNT SETTINGS. Keep your responses focused on this topic, and maintain continuity from previous messages. Help them manage their account preferences, profile information, and security settings.`;
                        break;
                    case 'technical_support':
                        systemPrompt += `\n\nIMPORTANT: The user is currently discussing TECHNICAL ISSUES. Keep your responses focused on troubleshooting, and maintain continuity from previous messages. Provide clear steps to resolve common platform issues.`;
                        break;
                }
            }
            
            contents.push({
                role: "user",
                parts: [{
                    text: systemPrompt
                }]
            });
            
            contents.push({
                role: "model",
                parts: [{
                    text: "I understand my role as a website assistant with strict constraints. I'll only answer questions related to the fundraising website, its features, and how to use it. For any off-topic questions, I'll politely decline and redirect users to website-related topics I can help with."
                }]
            });
            
            // Add chat history and current message
            for (const msg of recentMessages) {
                contents.push({
                    role: msg.role === "bot" ? "model" : "user",
                    parts: [{ text: msg.text }]
                });
            }
            
            // Add current message if not included in history
            if (recentMessages.length === 0 || recentMessages[recentMessages.length - 1].role !== "user") {
                contents.push({
                    role: "user",
                    parts: [{ text: message }]
                });
            }
            
            try {
                // Construct API request
                const requestBody = {
                    contents,
                    generationConfig: {
                        temperature: 0.4,
                        topK: 40,
                        topP: 0.8,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                };
                
                // Make the API request
                console.log(`Using API key: ${this.apiKey.substring(0, 8)}...`); // Log partial key for debugging
                const response = await fetch(`${url}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error Response:', errorData);
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Received response from Gemini API');
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    // Extract the AI response text
                    const aiResponse = data.candidates[0].content.parts[0].text;
                    return aiResponse;
                } else {
                    console.error('Unexpected response format:', data);
                    throw new Error('Unexpected response format from Gemini API');
                }
            } catch (apiError) {
                console.error('Primary API error:', apiError);
                
                // Try fallback to Gemini 1.0 Pro if 2.0 fails
                try {
                    console.log('Falling back to Gemini 1.0 Pro API...');
                    const fallbackUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
                    
                    // Simplify content format for fallback API
                    let fallbackContents = [{
                        parts: [{
                            text: `System Instructions: ${systemPrompt}`
                        }]
                    }];
                    
                    // Add conversation history and current message
                    if (recentMessages.length > 0) {
                        fallbackContents.push({
                            parts: [{
                                text: `Conversation history: ${this.formatChatHistoryForPrompt()}`
                            }]
                        });
                    }
                    
                    // Add the current message
                    fallbackContents.push({
                        parts: [{
                            text: `User's current message: ${message}`
                        }]
                    });
                    
                    const fallbackRequestBody = {
                        contents: fallbackContents,
                        generationConfig: {
                            temperature: 0.4,
                            topK: 40,
                            topP: 0.8,
                            maxOutputTokens: 2048
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            }
                        ]
                    };
                    
                    const fallbackResponse = await fetch(`${fallbackUrl}?key=${this.apiKey}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(fallbackRequestBody)
                    });
                    
                    if (!fallbackResponse.ok) {
                        const fallbackErrorData = await fallbackResponse.json();
                        console.error('Fallback API Error Response:', fallbackErrorData);
                        throw new Error(`Fallback API error: ${fallbackResponse.status}`);
                    }
                    
                    const fallbackData = await fallbackResponse.json();
                    console.log('Received response from fallback Gemini Pro API');
                    
                    if (!fallbackData.candidates || !fallbackData.candidates[0]?.content?.parts?.[0]?.text) {
                        console.error('Invalid response format from fallback API:', fallbackData);
                        throw new Error('Invalid response format from fallback API');
                    }
                    
                    return fallbackData.candidates[0].content.parts[0].text;
                } catch (secondaryError) {
                    console.error('Error with fallback Gemini Pro API:', secondaryError);
                    
                    // If both API calls fail, return a friendly error message
                    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or contact support if the problem persists.";
                }
            }
        } catch (error) {
            console.error('Error in getGeminiResponse:', error);
            return "Sorry, I encountered an error while processing your request. Please try again later.";
        }
    }

    // Helper method to check if a message is within our domain
    isWithinDomain(message) {
        // List of fundraising website related keywords including form-related terms
        const domainKeywords = [
            'fundrais', 'campaign', 'donat', 'goal', 'charity', 'login', 'register', 'dashboard', 
            'create', 'edit', 'account', 'payment', 'website', 'platform', 'page', 'money', 'fund', 
            'support', 'contribute', 'cause', 'help', 'password', 'profile', 'settings',
            // Form-related keywords
            'form', 'fill', 'submit', 'field', 'input', 'require', 'complete', 'application',
            'step', 'guide', 'how to', 'instructions', 'title', 'description', 'amount', 'category',
            'email', 'username', 'verification', 'validate', 'error', 'required field',
            // Email-related keywords
            'draft', 'mail', 'message', 'template', 'thank', 'gratitude', 'update', 'progress',
            'sharing', 'outreach', 'donor', 'supporter', 'subject', 'greeting', 'signature',
            // Sponsorship-related keywords
            'sponsor', 'sponsorship', 'corporate', 'company', 'organization', 'business',
            'partner', 'partnership', 'funding', 'investor', 'opportunity', 'proposal',
            'benefit', 'recognition', 'level', 'gold', 'silver', 'bronze', 'tier', 'followup'
        ];
        
        const lowercaseMsg = message.toLowerCase();
        
        // Check if any domain keyword is in the message
        return domainKeywords.some(keyword => lowercaseMsg.includes(keyword));
    }

    // Add a markdown parsing function
    parseMarkdown(text) {
        // First, escape any HTML to prevent injection
        text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Handle paragraphs first
        let formatted = text.split('\n\n').map(para => {
            if (para.trim()) {
                return `<p>${para}</p>`;
            }
            return '';
        }).join('');
        
        // Handle single newlines within paragraphs (don't split list items)
        formatted = formatted.replace(/<p>(.+?)\n(?![\*\-\d+])(.+?)<\/p>/gs, '<p>$1<br>$2</p>');
        
        // Handle bullet lists
        formatted = formatted.replace(/<p>(\s*[\*\-]\s+.+?(\n\s*[\*\-]\s+.+?)*)<\/p>/gs, (match, list) => {
            const items = list.split('\n').filter(line => line.trim()).map(line => {
                return `<li>${line.replace(/^\s*[\*\-]\s+/, '')}</li>`;
            }).join('');
            return `<ul>${items}</ul>`;
        });
        
        // Handle numbered lists
        formatted = formatted.replace(/<p>(\s*\d+\.\s+.+?(\n\s*\d+\.\s+.+?)*)<\/p>/gs, (match, list) => {
            const items = list.split('\n').filter(line => line.trim()).map(line => {
                return `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`;
            }).join('');
            return `<ol>${items}</ol>`;
        });
        
        // Handle bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle italic
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Handle code blocks (if needed)
        formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
        
        return formatted;
    }

    // Update the addMessage method to use our new parser
    addMessage(text, sender) {
        // Add to chat history
        this.chatHistory.push({
            text: text,
            role: sender,
            timestamp: new Date().toISOString()
        });
        
        // Save to session storage
        this.saveChatHistory();
        
        // Add to UI
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Format markdown if it's a bot message
        if (sender === 'bot') {
            messageDiv.innerHTML = this.parseMarkdown(text);
        } else {
            // For user messages, just use text content
            messageDiv.textContent = text;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    getConversationHistory(count = 10) {
        // Get more context from conversation history (default: last 10 messages)
        return this.chatHistory.slice(-count);
    }
    
    // Add a method to analyze conversation context
    getConversationContext() {
        // Get the last several messages to analyze context
        const recentMessages = this.getConversationHistory(10);
        if (recentMessages.length < 2) return null;
        
        // Extract key topics from recent conversation
        const combinedText = recentMessages
            .map(msg => msg.text.toLowerCase())
            .join(' ');
            
        // Detect ongoing conversation topics - Enhanced with more contexts
        const contextMap = {
            campaign_creation: ['create campaign', 'start campaign', 'campaign form', 'new campaign', 'setup campaign', 'campaign idea', 'fundraiser idea'],
            donation: ['donate', 'donation', 'give money', 'support campaign', 'contribute', 'payment method', 'credit card', 'donor'],
            sponsorship: ['sponsor', 'sponsorship', 'corporate', 'partner', 'business support', 'company sponsor'],
            campaign_management: ['dashboard', 'edit campaign', 'delete campaign', 'manage campaign', 'statistics', 'analytics', 'progress', 'update campaign'],
            email_drafting: ['draft email', 'write email', 'create email', 'message template', 'thank you message', 'donor message'],
            account_settings: ['account', 'profile', 'settings', 'password', 'email address', 'notification', 'preferences'],
            technical_support: ['error', 'problem', 'not working', 'bug', 'issue', 'help me with', 'trouble with']
        };
        
        // Find which context has the most matches
        let bestContext = null;
        let bestScore = 0;
        
        for (const [context, keywords] of Object.entries(contextMap)) {
            let score = 0;
            for (const keyword of keywords) {
                if (combinedText.includes(keyword)) {
                    score++;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestContext = context;
            }
        }
        
        return bestScore > 0 ? bestContext : null;
    }
    
    formatChatHistoryForPrompt() {
        // Format the chat history for the fallback prompt
        const lastMessages = this.getConversationHistory(8); // Use more messages
        return lastMessages.map(msg => 
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
        ).join('\n');
    }
    
    saveChatHistory() {
        // Save chat history to session storage
        try {
            sessionStorage.setItem('chatbot_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }
    
    loadChatHistory() {
        // Load chat history from session storage
        try {
            const history = sessionStorage.getItem('chatbot_history');
            return history ? JSON.parse(history) : null;
        } catch (error) {
            console.error('Error loading chat history:', error);
            return null;
        }
    }
    
    // Update restoreChatHistory to use our new parser
    restoreChatHistory() {
        // Restore chat messages UI from history
        const messagesContainer = document.getElementById('chat-messages');
        
        for (const msg of this.chatHistory) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.role}-message`;
            
            if (msg.role === 'bot') {
                messageDiv.innerHTML = this.parseMarkdown(msg.text);
            } else {
                messageDiv.textContent = msg.text;
            }
            
            messagesContainer.appendChild(messageDiv);
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    clearChatHistory() {
        // Clear chat history
        this.chatHistory = [];
        this.saveChatHistory();
        
        // Clear UI
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
        
        // Add initial greeting
        this.addMessage("Hello! I'm your Fundraiser Assistant. I can help you with:\n\n- Creating fundraising campaigns\n- Making donations\n- Navigating the website\n- Managing your account\n\n**Need help filling out a form?** I can provide examples of campaign names, descriptions, and suggested goal amounts based on your campaign type. Just say \"Help me fill out a campaign form\" to get started!", 'bot');
    }

    // Add a new method to adjust chatbot position relative to navbar
    adjustChatPositionForNavbar() {
        // Set initial position after navbar is rendered
        setTimeout(() => {
            const navbar = document.querySelector('#main-nav');
            if (navbar) {
                const navbarHeight = navbar.offsetHeight;
                const chatbotWindow = document.getElementById('chatbot-window');
                if (chatbotWindow) {
                    // Update top position and height based on navbar height
                    chatbotWindow.style.top = `${navbarHeight}px`;
                    chatbotWindow.style.height = `calc(100vh - ${navbarHeight}px)`;
                }
            }
        }, 100); // Small delay to ensure navbar is rendered
    }

    // Add form helper methods to assist with specific forms

    // Helper method to guide through campaign creation
    provideCampaignFormGuidance() {
        return `Here's how to create a new fundraising campaign:

1. **Navigate to Create Campaign**: 
   - Log in to your account first
   - Click on the "Start a Campaign" button on the homepage or "Create Campaign" in the navigation menu

2. **Fill out the campaign form**:
   - **Title**: Create a clear, compelling title (max 100 characters)
   - **Description**: Explain your cause in detail - why you're raising funds, how they'll be used, and who will benefit
   - **Goal Amount**: Set a realistic fundraising target in dollars
   - **Category**: Select the category that best describes your campaign

3. **Tips for an effective campaign**:
   - Use a specific, meaningful title that clearly states your cause
   - Include personal stories in your description to connect with donors
   - Set a reasonable funding goal based on your actual needs
   - Be transparent about how funds will be used
   - Consider adding images that represent your cause

4. **Review and Submit**:
   - Check all information for accuracy
   - Click "Create Campaign" to publish

Would you like more specific guidance for any part of this process?`;
    }

    // Helper method to guide through donation process
    provideDonationFormGuidance() {
        return `Here's how to make a donation to a campaign:

1. **Find the campaign**: 
   - Browse campaigns on the homepage or use search
   - Click on the campaign you want to support

2. **Start the donation process**:
   - Click the "Donate Now" button on the campaign page

3. **Fill out the donation form**:
   - **Amount**: Enter how much you'd like to donate
   - **Payment Information**: Enter your card details (securely processed)
   - **Message** (optional): Leave a supportive message to the campaign creator
   - **Display Name** (optional): Choose how your name appears publicly or donate anonymously

4. **Review and Complete**:
   - Verify all information is correct
   - Click "Complete Donation" to process your payment

5. **Confirmation**:
   - You'll receive a confirmation message and email receipt
   - Your donation will immediately be added to the campaign's progress

Need help with a specific part of the donation process?`;
    }

    // Helper method to guide through registration
    provideRegistrationGuidance() {
        return `Here's how to register for an account:

1. **Navigate to Register**:
   - Click "Register" in the top navigation menu

2. **Fill out the registration form**:
   - **Username**: Choose a unique username
   - **Email**: Enter a valid email address (you'll need to verify this)
   - **Password**: Create a strong password (min 8 characters with numbers and special characters)
   - **Confirm Password**: Re-enter your password

3. **Terms and Privacy**:
   - Review the terms of service and privacy policy
   - Check the box to accept

4. **Complete Registration**:
   - Click "Create Account" button
   - Check your email for a verification link
   - Click the link to activate your account

5. **Set Up Your Profile** (optional):
   - Add a profile picture
   - Complete your bio information
   - Add any payment methods for faster donations

After registering, you'll be able to create campaigns, make donations, and track your activity on the platform.

Need help with any of these steps?`;
    }

    // Add field-specific guidance method
    provideFieldGuidance(fieldType) {
        const guidanceMap = {
            'title': `**Campaign Title Tips:**
- Keep it clear and specific (max 100 characters)
- Include the purpose of your fundraiser
- Make it attention-grabbing but honest
- Example: "Medical Treatment for Sarah's Recovery" is better than "Please Help"`,

            'description': `**Campaign Description Tips:**
- Start with a compelling introduction that explains your situation
- Use paragraphs for readability
- Include:
  - Why you need the funds
  - How they will be used
  - Who will benefit
  - Your personal connection to the cause
- Add details that build trust
- Be honest and transparent
- Ideal length: 300-500 words`,

            'goal': `**Fundraising Goal Tips:**
- Set a realistic amount based on your actual needs
- Consider breaking larger goals into phases if possible
- Include a breakdown of costs if appropriate
- Remember that reaching 30% of your goal early increases chances of success
- You can exceed your goal, so it's okay to set it at the minimum needed`,

            'payment': `**Payment Information Tips:**
- We accept major credit/debit cards (Visa, Mastercard, Amex)
- PayPal integration is available
- All payment information is encrypted and secure
- You'll need to enter:
  - Card number
  - Expiration date
  - CVV code
  - Billing zip/postal code
- We never store your complete card details`,

            'email': `**Email Field Tips:**
- Use an email address you check regularly
- You'll receive important notifications here
- Confirmation emails for donations/campaigns will be sent here
- Format: name@example.com
- This will be used for account recovery if needed`,

            'password': `**Password Tips:**
- Create a strong, unique password
- Requirements:
  - At least 8 characters
  - Include at least one number
  - Include at least one special character
  - Include uppercase and lowercase letters
- Don't reuse passwords from other sites
- We use encryption to protect your password`
        };
        
        return guidanceMap[fieldType] || `I don't have specific guidance for that field. Could you ask about a different part of the form?`;
    }

    // Add example generation methods for campaign creation

    // Method to generate campaign name examples based on campaign type
    generateCampaignNameExamples(campaignType) {
        const nameExamples = {
            'medical': [
                "Medical Treatment Fund for [Name]",
                "Help [Name] Beat [Condition]",
                "Support [Name]'s Recovery Journey",
                "Emergency Medical Fund: [Name]'s [Treatment] Needs",
                "Critical Care Funding for [Name]"
            ],
            'education': [
                "College Fund for [Name/Group]",
                "[Name]'s Educational Journey",
                "Help [Name] Reach Their Academic Dreams",
                "Scholarship Fund: Supporting [Community/Group]",
                "[School/Program] Tuition Support"
            ],
            'community': [
                "[Community Name] Improvement Project",
                "Rebuild [Community Location]",
                "Support [Community Center/Resource]",
                "[Community] Emergency Relief Fund",
                "Help [Community] Thrive Again"
            ],
            'creative': [
                "Fund [Name]'s [Art/Film/Music] Project",
                "Bring [Project Name] to Life",
                "Support [Name]'s Creative Vision",
                "Help Launch [Product/Album/Book]",
                "[Name]'s [Creative Medium] Production Fund"
            ],
            'nonprofit': [
                "Support [Organization]'s Mission",
                "Help [Organization] Serve [Beneficiaries]",
                "[Cause] Awareness and Support Campaign",
                "Expand [Organization]'s Impact",
                "Annual Fundraiser for [Organization]"
            ],
            'emergency': [
                "Emergency Relief for [Name/Family]",
                "[Disaster] Recovery Fund",
                "Immediate Help Needed: [Situation]",
                "Crisis Support for [Name/Group]",
                "Urgent: Help [Name/Group] Recover from [Event]"
            ],
            'personal': [
                "[Name]'s [Goal/Dream] Fund",
                "Help [Name] with [Life Event]",
                "Support [Name] During [Challenge]",
                "[Name]'s Journey to [Goal]",
                "Fund [Name]'s [Personal Project/Need]"
            ]
        };

        // Default examples if no specific type is matched
        const defaultExamples = [
            "Support Our Important Cause",
            "Help Us Make a Difference",
            "Fund Our Community Project",
            "Join Our Mission: [Brief Description]",
            "Help Us Achieve [Goal]"
        ];

        return nameExamples[campaignType.toLowerCase()] || defaultExamples;
    }

    // Method to generate appropriate goal amounts based on campaign type
    suggestGoalAmount(campaignType) {
        const goalSuggestions = {
            'medical': {
                range: "$2,500 - $50,000",
                factors: [
                    "Type of medical treatment needed",
                    "Duration of treatment/recovery",
                    "Insurance coverage gaps",
                    "Associated costs (travel, accommodation, lost wages)",
                    "Specialized equipment needs"
                ],
                examples: [
                    "Basic medical procedures: $2,500 - $7,500",
                    "Major surgery: $10,000 - $25,000",
                    "Long-term treatment: $20,000 - $50,000+",
                    "Specialized care: $15,000 - $40,000"
                ]
            },
            'education': {
                range: "$1,000 - $25,000",
                factors: [
                    "Type of educational program",
                    "Duration of studies",
                    "Current financial resources",
                    "Additional expenses (books, housing, etc.)",
                    "Partial vs. full funding needs"
                ],
                examples: [
                    "Semester expenses: $2,000 - $5,000",
                    "Annual tuition: $5,000 - $15,000",
                    "Complete degree program: $10,000 - $25,000",
                    "Educational materials/equipment: $1,000 - $3,000"
                ]
            },
            'community': {
                range: "$2,500 - $100,000",
                factors: [
                    "Scale of the community project",
                    "Number of people impacted",
                    "Materials and equipment required",
                    "Professional services needed",
                    "Timeframe for implementation"
                ],
                examples: [
                    "Small community event: $1,000 - $5,000",
                    "Community space renovation: $10,000 - $30,000",
                    "Large infrastructure project: $25,000 - $100,000",
                    "Community program funding: $5,000 - $20,000 per year"
                ]
            },
            'creative': {
                range: "$1,000 - $20,000",
                factors: [
                    "Type of creative project",
                    "Production costs",
                    "Equipment/materials needed",
                    "Marketing and distribution",
                    "Timeline for completion"
                ],
                examples: [
                    "Art exhibition: $1,000 - $5,000",
                    "Short film production: $5,000 - $15,000",
                    "Album recording: $3,000 - $10,000",
                    "Book publishing: $2,000 - $8,000"
                ]
            },
            'nonprofit': {
                range: "$5,000 - $100,000+",
                factors: [
                    "Organization size and reach",
                    "Specific program being funded",
                    "Operational costs",
                    "Staff and resource requirements",
                    "Duration of funding needed"
                ],
                examples: [
                    "Program launch: $5,000 - $15,000",
                    "Annual operations: $25,000 - $100,000",
                    "Specific initiative: $10,000 - $50,000",
                    "Equipment/facility needs: $15,000 - $75,000"
                ]
            },
            'emergency': {
                range: "$1,000 - $25,000",
                factors: [
                    "Nature of the emergency",
                    "Immediate needs (housing, food, etc.)",
                    "Replacement of essential items",
                    "Recovery timeframe",
                    "Number of people affected"
                ],
                examples: [
                    "Individual crisis: $1,000 - $5,000",
                    "Family emergency: $5,000 - $15,000",
                    "Disaster recovery: $10,000 - $25,000",
                    "Temporary housing: $3,000 - $10,000"
                ]
            },
            'personal': {
                range: "$1,000 - $15,000",
                factors: [
                    "Specific personal goal",
                    "Timeline for achievement",
                    "Current resources available",
                    "Essential vs. ideal funding",
                    "Support network availability"
                ],
                examples: [
                    "Personal milestone event: $1,000 - $5,000",
                    "Major life transition: $5,000 - $10,000",
                    "Personal project: $2,000 - $8,000",
                    "Skill development/training: $1,000 - $7,000"
                ]
            }
        };

        // Default suggestions if no specific type is matched
        const defaultSuggestions = {
            range: "$1,000 - $10,000",
            factors: [
                "Scope of your project/need",
                "Timeline for completion",
                "Number of people impacted",
                "Material and resource costs",
                "Your existing resources"
            ],
            examples: [
                "Small project/need: $1,000 - $3,000",
                "Medium project/need: $3,000 - $7,000",
                "Large project/need: $7,000 - $10,000+"
            ]
        };

        return goalSuggestions[campaignType.toLowerCase()] || defaultSuggestions;
    }

    // Method to generate description template based on campaign type
    generateDescriptionTemplate(campaignType) {
        const descriptionTemplates = {
            'medical': 
`**My Medical Journey**

My name is [Name], and I am facing [medical condition/situation]. I was diagnosed with [condition/situation details] on [approximate date/timeframe].

**How This Affects Me**
[Describe how this medical situation impacts your daily life, work, family, etc. Share your personal journey and challenges.]

**Treatment Plan**
The doctors have recommended [treatment details], which will require [timeframe for treatment]. This treatment offers [potential outcomes and hopes for recovery].

**Financial Need**
The total cost of treatment is estimated at [total amount], which includes:
- Medical procedures: $[amount]
- Medication: $[amount]
- Hospital stays: $[amount]
- Travel to treatment: $[amount]
- Lost wages during recovery: $[amount]

**How Your Support Helps**
Your donation will directly help cover these medical expenses and allow me to focus on healing rather than financial stress. Every contribution, regardless of size, makes a meaningful difference in my recovery journey.

**About Me**
[Share a brief personal background to help donors connect with you. Include any relevant details about family, work, community involvement, etc.]

Thank you for taking the time to read my story and consider supporting my medical journey. I'm grateful for any help you can provide.`,

            'education':
`**Educational Dreams**

My name is [Name], and I am pursuing [degree/educational program] at [school/institution].

**My Educational Journey**
[Share your educational background, achievements, and what has led you to this point. Explain why this education is important to you.]

**My Goals**
My goal is to [specific educational or career goals]. This education will help me [explain how this education connects to your future plans and aspirations].

**Financial Need**
The total cost for my [educational program/timeframe] is [total amount], which includes:
- Tuition: $[amount]
- Books and materials: $[amount]
- Essential equipment: $[amount]
- Living expenses: $[amount]

**How Your Support Helps**
Your contribution will help me [specific ways the funds will help - complete my degree, focus on studies without working full-time, etc.]. I am committed to making the most of this educational opportunity.

**My Commitment**
[Explain what steps you're taking personally to fund your education - working part-time, applying for scholarships, etc.] Your support will complement these efforts and make this educational journey possible.

Thank you for considering an investment in my education and future. I'm grateful for any support you can provide.`,

            'community':
`**Supporting Our Community**

**The Project**
We are raising funds for [community project/initiative] located in [location/community]. This project will [brief description of what the project aims to accomplish].

**Community Impact**
This initiative will directly benefit [describe who will benefit and how many people]. The impact will include [specific positive changes this will bring to the community].

**The Need**
Our community faces [describe the current challenge or need this project addresses]. [Provide specific examples or stories that illustrate the need].

**Project Plan**
The funds raised will be used for:
- [Specific expense/item]: $[amount]
- [Specific expense/item]: $[amount]
- [Specific expense/item]: $[amount]
- [Specific expense/item]: $[amount]

**Timeline**
We plan to implement this project over [timeframe], with the following milestones:
- [Month/Date]: [Project phase]
- [Month/Date]: [Project phase]
- [Month/Date]: [Project completion]

**About Our Organization**
[Information about the community group/organization behind this project, including history, mission, and past accomplishments]

Your support will help strengthen our community and create lasting positive change. Thank you for joining us in this important initiative.`,

            'creative':
`**Creative Vision**

**The Project**
I'm [Name], and I'm creating [type of creative project - film, album, book, art exhibition, etc.]. This project is about [brief description of the creative concept and vision].

**Project Details**
[Elaborate on your creative vision - what makes this project unique, what you hope to express or achieve, why it matters]

**My Background**
[Share relevant experience, training, or previous work that qualifies you for this project]

**Budget Breakdown**
To bring this [creative project] to life, I need to fund:
- [Specific expense/item]: $[amount]
- [Specific expense/item]: $[amount]
- [Specific expense/item]: $[amount]
- [Specific expense/item]: $[amount]

**Timeline**
My production schedule includes:
- [Month/Date]: [Production phase]
- [Month/Date]: [Production phase]
- [Month/Date]: [Completion/Release]

**Rewards & Recognition**
Supporters will receive [describe any special acknowledgments, early access, or rewards for donors].

**Why This Matters**
[Explain the impact of this creative project - who will benefit from it, how it contributes to culture or community, why now is the time for this work]

Thank you for supporting independent creative work and helping bring this project to life!`,

            'emergency':
`**Emergency Situation**

**What Happened**
On [date], [describe the emergency situation] affected [me/my family/name]. [Provide details about the unexpected crisis - natural disaster, accident, sudden loss, etc.]

**Current Situation**
Right now, we are [describe current living situation, immediate challenges, and urgent needs]. The impact has been [describe how this emergency has affected daily life, work, housing, etc.]

**Immediate Needs**
The funds raised will address our urgent needs for:
- [Specific need]: $[amount]
- [Specific need]: $[amount]
- [Specific need]: $[amount]
- [Specific need]: $[amount]

**Recovery Plan**
Our plan for recovery includes [outline steps for stabilizing the situation and moving forward]. We anticipate needing [timeframe] to [recovery goal].

**About Us**
[Share some background about the affected person/family/group to help donors connect with your situation]

**Updates**
I commit to posting updates about our situation and recovery. Your support in this difficult time means everything to us, and we're grateful for any help you can provide.

Thank you for your compassion and generosity during this challenging time.`
        };

        // Default template if no specific type is matched
        const defaultTemplate = 
`**Campaign Overview**

**About This Campaign**
[Introduce yourself/organization and the purpose of this fundraiser]

**The Need**
[Explain the specific need or challenge this fundraiser addresses]

**How Funds Will Be Used**
The funds raised will go toward:
- [Specific use]: $[amount]
- [Specific use]: $[amount]
- [Specific use]: $[amount]
- [Specific use]: $[amount]

**Why This Matters**
[Explain why this cause is important and the impact donations will have]

**Timeline**
[Share when and how the funds will be used]

**About Me/Us**
[Provide background information to build trust with potential donors]

**Thank You**
[Express gratitude for considering a donation to your cause]`;

        return descriptionTemplates[campaignType.toLowerCase()] || defaultTemplate;
    }

    // Add a new method to provide complete form suggestions
    provideCompleteCampaignSuggestions(campaignType) {
        if (!campaignType) {
            return `To help you fill out your campaign form, I need to know what type of campaign you're creating. Is it for:

- Medical expenses
- Education funding
- Community project
- Creative project
- Nonprofit organization
- Emergency relief
- Personal cause

Please let me know which type best matches your campaign, and I'll provide specific suggestions for the name, description, and appropriate goal amount.`;
        }

        const nameExamples = this.generateCampaignNameExamples(campaignType);
        const goalSuggestions = this.suggestGoalAmount(campaignType);
        const descriptionTemplate = this.generateDescriptionTemplate(campaignType);

        return `## ${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Campaign Suggestions

### Campaign Name Ideas
${nameExamples.map(name => `- ${name}`).join('\n')}

### Suggested Goal Amount
**Range**: ${goalSuggestions.range}

**Factors to consider when setting your goal:**
${goalSuggestions.factors.map(factor => `- ${factor}`).join('\n')}

**Typical examples:**
${goalSuggestions.examples.map(example => `- ${example}`).join('\n')}

### Description Template
Use this template to craft your campaign description:

\`\`\`
${descriptionTemplate}
\`\`\`

### Tips for Success
- Be specific about how funds will be used
- Share your personal connection to the cause
- Add photos that show the need or project
- Update supporters regularly after launching
- Share your campaign on social media

Would you like me to help with a specific part of your campaign form?`;
    }
    
    // Create a draft email for campaign sharing or donor outreach
    createDraftEmail(purpose, campaignDetails = null) {
        // Default campaign details if none provided
        const campaign = campaignDetails || {
            title: "[Your Campaign Name]",
            description: "[Your Campaign Description]",
            goal: "[Your Campaign Goal]",
            url: "[Campaign URL]"
        };
        
        // Helper function to format currency within this method
        const formatCurrencyLocal = (amount) => {
            // Check if amount is a number or a placeholder string
            if (typeof amount === 'number') {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(amount);
            }
            return amount; // Return as is if it's a placeholder string
        };
        
        // Try to determine campaign type for more targeted templates
        const campaignType = this.determineCampaignType(campaign.title, campaign.description);
        
        // Email body templates for different purposes
        const templates = {
            // Template for sharing campaign with friends and family
            share: `I hope this email finds you well. I'm reaching out because I've recently launched a fundraising campaign that's very important to me.

Campaign: ${campaign.title}
Goal: ${formatCurrencyLocal(campaign.goal)}

${campaign.description.substring(0, 150)}...

Your support would mean the world to me. Even a small donation can make a big difference, and sharing the campaign with others would help tremendously.

You can view and support the campaign here: ${campaign.url}

Thank you for considering!`,

            // Sponsorship request template - Corporate
            corporate_sponsorship: `I hope this email finds you well. I'm writing to invite [Company Name] to consider sponsoring our fundraising campaign, "${campaign.title}."

About Our Campaign:
${campaign.description.substring(0, 200)}...

Our fundraising goal is ${formatCurrencyLocal(campaign.goal)}, and we're seeking partners who share our commitment to [cause/community/purpose].

Sponsorship Benefits:
- Brand visibility to our [number/estimate] of supporters and followers
- Recognition on our campaign page and all promotional materials
- [Specific benefit based on sponsorship level]
- [Specific benefit based on sponsorship level]
- Opportunity to demonstrate corporate social responsibility in the [relevant] sector

Sponsorship Opportunities:
- Gold Level: $[amount] - [list benefits]
- Silver Level: $[amount] - [list benefits]
- Bronze Level: $[amount] - [list benefits]
- Custom sponsorship packages are also available

I would welcome the opportunity to discuss this partnership in more detail. Could we schedule a brief call to explore how [Company Name] might participate?

You can view our campaign here: ${campaign.url}

Thank you for considering this opportunity. I look forward to your response.`,

            // Sponsorship request template - Individual
            individual_sponsorship: `I hope this message finds you well. My name is [Your Name], and I'm reaching out regarding a sponsorship opportunity for our campaign, "${campaign.title}."

About the Campaign:
${campaign.description.substring(0, 150)}...

We're looking to raise ${formatCurrencyLocal(campaign.goal)} to [brief explanation of purpose].

Why I'm Reaching Out to You:
[Explain connection or why you believe they would be interested in this specific cause]

How Your Sponsorship Would Help:
- [Specific impact #1]
- [Specific impact #2]
- [Specific impact #3]

In Recognition of Your Support:
- Your name/logo featured on our campaign page
- Acknowledgment in campaign updates and communications
- [Other recognition appropriate to your campaign]

You can learn more about our campaign here: ${campaign.url}

I would be happy to discuss this opportunity further or answer any questions you might have. Thank you for considering supporting our cause.`,

            // Sponsorship follow-up template
            sponsorship_followup: `I hope this message finds you well. I'm writing to follow up on my previous email regarding sponsorship opportunities for our fundraising campaign, "${campaign.title}."

Since my last email, we've made significant progress:
- [Update on campaign progress, e.g., "Reached 40% of our goal"]
- [Another relevant update]
- [New supporters or developments]

I wanted to ensure you had all the information needed to consider supporting our campaign. Your sponsorship would make a meaningful difference by helping us [specific impact].

For your convenience, I've attached additional information about our sponsorship opportunities and the specific impact your support would have.

Please let me know if you have any questions or if you'd like to schedule a brief conversation to discuss this further.

You can view our campaign here: ${campaign.url}

Thank you again for considering this opportunity. I look forward to your response.`,

            // Medical campaign sharing template
            medical_share: `I hope this message finds you well. I'm reaching out about an important fundraising campaign I've started to help with medical expenses.

I've created a fundraiser called "${campaign.title}" with a goal of ${formatCurrencyLocal(campaign.goal)} to help cover costs for [specific medical treatment/condition].

This fundraiser will help with:
- Medical bills and hospital expenses
- Ongoing treatment costs
- [Other specific needs]

Any support you can offer - whether through a donation or simply sharing the campaign with others - would mean so much.

You can view the campaign and contribute here: ${campaign.url}

Thank you for your kindness and support during this challenging time.`,

            // Education campaign sharing template
            education_share: `I hope you're doing well! I wanted to share an education fundraising campaign I've recently launched called "${campaign.title}".

This initiative aims to raise ${formatCurrencyLocal(campaign.goal)} to support:
- [Specific educational program/need]
- [Educational materials/resources]
- [Student support/scholarships]

Education creates lasting change, and your contribution will help make this possible. Even a small donation can make a significant difference in a student's life.

Learn more and support this cause here: ${campaign.url}

If you could also share this campaign with others who might be interested, it would help us reach our goal faster.

Thank you for helping invest in education!`,

            // Emergency relief campaign sharing template
            emergency_share: `I hope this email finds you well. I'm reaching out about an urgent situation that requires immediate support.

I've started a fundraising campaign "${campaign.title}" to help with an emergency situation:
[Brief description of the emergency/disaster/situation]

We're trying to raise ${formatCurrencyLocal(campaign.goal)} as quickly as possible to provide:
- [Immediate need #1]
- [Immediate need #2]
- [Immediate need #3]

The situation is time-sensitive, and any help you can provide would make a real difference right now. Even sharing the campaign with your network would be incredibly helpful.

You can contribute here: ${campaign.url}

Thank you for your compassion and support during this difficult time.`,

            // Template for thanking donors
            thanks: `I wanted to personally thank you for your generous donation to my fundraising campaign, ${campaign.title}.

Your contribution of [Donation Amount] is making a real difference in helping me reach my goal of ${formatCurrencyLocal(campaign.goal)}. With your support, we're now [X]% closer to making this project a reality.

[Include a brief update on the campaign or how funds will be used]

I'm truly grateful for your kindness and support. I'll be sure to keep you updated on our progress.`,

            // Template for campaign update to supporters
            update: `I wanted to provide you with an update on our fundraising campaign, ${campaign.title}.

Current Progress:
- Amount raised: [Current Amount]
- Goal: ${formatCurrencyLocal(campaign.goal)}
- Percentage complete: [X]%

Recent Developments:
[Share 2-3 key updates, milestones, or impacts]

Next Steps:
[Explain what's coming next for the campaign]

Thank you for your continued support. Every donation, share, and word of encouragement makes a difference.

If you'd like to check on our progress or share the campaign again, you can visit: ${campaign.url}`,

            // Template for reaching fundraising milestone
            milestone: `I have exciting news to share about our fundraising campaign, ${campaign.title}!

We've just reached an important milestone: [describe milestone - e.g., "50% of our goal", "100 donors", "first project phase funded"].

Thanks to generous supporters like you, we've now raised [Current Amount] toward our goal of ${formatCurrencyLocal(campaign.goal)}.

This milestone means we can now:
- [Action or outcome made possible]
- [Action or outcome made possible]

[Share a brief story or specific example of impact]

We still have more to accomplish to reach our full goal. If you could share our campaign with friends and family, it would help us tremendously: ${campaign.url}

Thank you for being part of this journey and making a difference!`
        };
        
        // Select the appropriate template based on purpose and campaign type
        let template = templates.share; // Default template
        
        if (purpose === 'share') {
            // Select specialized sharing template based on campaign type
            if (campaignType === 'medical') {
                template = templates.medical_share;
            } else if (campaignType === 'education') {
                template = templates.education_share;
            } else if (campaignType === 'emergency') {
                template = templates.emergency_share;
            } else {
                template = templates.share;
            }
        } else if (purpose === 'thanks') {
            template = templates.thanks;
        } else if (purpose === 'update') {
            template = templates.update;
        } else if (purpose === 'milestone') {
            template = templates.milestone;
        } else if (purpose === 'corporate_sponsorship') {
            template = templates.corporate_sponsorship;
        } else if (purpose === 'individual_sponsorship') {
            template = templates.individual_sponsorship;
        } else if (purpose === 'sponsorship_followup') {
            template = templates.sponsorship_followup;
        }
        
        return template;
    }
    
    // Helper method to determine campaign type from title and description
    determineCampaignType(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        
        // Check for medical campaign indicators
        if (text.includes('medical') || text.includes('health') || text.includes('treatment') || 
            text.includes('hospital') || text.includes('surgery') || text.includes('cancer') ||
            text.includes('therapy') || text.includes('patient') || text.includes('disease') ||
            text.includes('illness') || text.includes('recovery') || text.includes('care')) {
            return 'medical';
        }
        
        // Check for education campaign indicators
        if (text.includes('education') || text.includes('school') || text.includes('student') || 
            text.includes('college') || text.includes('university') || text.includes('scholarship') ||
            text.includes('tuition') || text.includes('classroom') || text.includes('learning') ||
            text.includes('educational') || text.includes('teacher') || text.includes('study')) {
            return 'education';
        }
        
        // Check for emergency/disaster relief campaign indicators
        if (text.includes('emergency') || text.includes('disaster') || text.includes('relief') || 
            text.includes('crisis') || text.includes('urgent') || text.includes('immediate') ||
            text.includes('fire') || text.includes('flood') || text.includes('hurricane') ||
            text.includes('earthquake') || text.includes('accident') || text.includes('urgent')) {
            return 'emergency';
        }
        
        // Check for community project indicators
        if (text.includes('community') || text.includes('neighborhood') || text.includes('local') || 
            text.includes('town') || text.includes('city') || text.includes('public') ||
            text.includes('park') || text.includes('center') || text.includes('space')) {
            return 'community';
        }
        
        // Check for creative project indicators
        if (text.includes('creative') || text.includes('art') || text.includes('music') || 
            text.includes('film') || text.includes('theater') || text.includes('book') ||
            text.includes('album') || text.includes('performance') || text.includes('exhibition') ||
            text.includes('artist') || text.includes('project')) {
            return 'creative';
        }
        
        // Default to generic campaign type
        return 'general';
    }

    // New method to load user data from API if user is logged in
    async loadUserData() {
        try {
            // Check if user is authenticated using the API utility
            if (typeof isAuthenticated === 'function' && isAuthenticated()) {
                // Load user data using the API
                const userData = await API.auth.getUser();
                
                if (userData) {
                    console.log('Loaded user data for chatbot personalization');
                    this.userData = userData;
                    
                    // Additionally, load user's campaigns if available
                    try {
                        const userCampaigns = await API.users.getCampaigns();
                        if (userCampaigns && userCampaigns.length > 0) {
                            this.userData.campaigns = userCampaigns;
                        }
                    } catch (campaignError) {
                        console.warn('Unable to load user campaigns:', campaignError);
                    }
                }
            }
        } catch (error) {
            console.warn('Unable to load user data for chatbot:', error);
            // Non-critical error, continue without user data
            this.userData = null;
        }
    }
    
    // New method to detect current page context
    detectCurrentPageContext() {
        // Get current page URL
        const currentUrl = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        
        // Get specific page parameters for better context
        const campaignId = urlParams.get('id');
        const campaignName = document.querySelector('.campaign-title')?.textContent || '';
        
        // Determine page context based on URL
        const pageContexts = {
            '/index.html': {
                pageName: 'Home',
                contextDescription: 'This page displays featured fundraising campaigns and general information about the platform. The user may be looking for campaigns to support or information about starting their own campaign.'
            },
            '/': {
                pageName: 'Home',
                contextDescription: 'This page displays featured fundraising campaigns and general information about the platform. The user may be looking for campaigns to support or information about starting their own campaign.'
            },
            '/campaign.html': {
                pageName: 'Campaign Details',
                contextDescription: `This page shows details about a specific fundraising campaign${campaignName ? ` called "${campaignName}"` : ''} with ID ${campaignId || 'unknown'}. The user may want to donate to this campaign or learn more about it.`
            },
            '/create.html': {
                pageName: 'Create Campaign',
                contextDescription: 'This page contains a form for creating a new fundraising campaign. The user is likely looking for help filling out the campaign details, understanding what makes an effective campaign, or technical help with the form.'
            },
            '/edit-campaign.html': {
                pageName: 'Edit Campaign',
                contextDescription: `This page allows users to edit an existing campaign${campaignId ? ` with ID ${campaignId}` : ''}. The user might need help updating their campaign details, improving their description, or understanding how edits might affect their campaign.`
            },
            '/donate.html': {
                pageName: 'Donation',
                contextDescription: `This page contains a donation form${campaignId ? ` for campaign ID ${campaignId}` : ''}${campaignName ? ` called "${campaignName}"` : ''}. The user may need help with payment methods, donation amounts, or understanding how their donation will be used.`
            },
            '/dashboard.html': {
                pageName: 'Dashboard',
                contextDescription: 'This page shows the user\'s campaigns and donation statistics. The user might need help interpreting their campaign performance, managing their campaigns, or understanding the analytics.'
            },
            '/login.html': {
                pageName: 'Login',
                contextDescription: 'This page contains a login form. The user might need help accessing their account, recovering a forgotten password, or understanding account security.'
            },
            '/register.html': {
                pageName: 'Registration',
                contextDescription: 'This page contains a registration form for new accounts. The user might need help creating an account, understanding the required fields, or learning about account features.'
            }
        };
        
        // Try to extract active form information if present on the page
        let activeFormContext = this.detectActiveForm();
        let contextObject = pageContexts[currentUrl] || {
            pageName: 'Unknown',
            contextDescription: 'The user is on a page that I don\'t have specific context for. They may need general help with the fundraising platform.'
        };
        
        // Add active form context if available
        if (activeFormContext) {
            contextObject.formContext = activeFormContext;
            contextObject.contextDescription += ` The user is currently filling out a ${activeFormContext.formType} form with fields: ${activeFormContext.activeFields.join(', ')}.`;
        }
        
        return contextObject;
    }
    
    // New method to detect the active form on the page
    detectActiveForm() {
        const forms = document.querySelectorAll('form');
        if (!forms || forms.length === 0) return null;
        
        // Try to determine which form is currently active or in view
        let activeForm = null;
        let formType = 'unknown';
        let activeFields = [];
        
        // Loop through forms
        for (const form of forms) {
            // Check form id or class for hints about form type
            const formId = form.id || '';
            const formClass = form.className || '';
            
            if (formId.includes('donation') || formClass.includes('donation') || form.querySelector('[name="donation-amount"]')) {
                formType = 'donation';
            } else if (formId.includes('campaign') || formClass.includes('campaign-form') || form.querySelector('[name="campaign-title"]')) {
                formType = 'campaign';
            } else if (formId.includes('login') || formClass.includes('login') || form.querySelector('[name="password"]')) {
                formType = 'login';
            } else if (formId.includes('register') || formClass.includes('register') || form.querySelector('[name="confirm-password"]')) {
                formType = 'registration';
            }
            
            // Get names of visible form fields
            const fields = form.querySelectorAll('input, textarea, select');
            activeFields = Array.from(fields)
                .filter(field => field.offsetParent !== null) // Only visible fields
                .map(field => field.name || field.id || field.placeholder || 'unnamed field')
                .filter(name => name !== 'unnamed field');
            
            // If we found fields, consider this the active form
            if (activeFields.length > 0) {
                activeForm = form;
                break;
            }
        }
        
        if (!activeForm) return null;
        
        return {
            formType,
            activeFields
        };
    }
    
    // Add method to refresh context when page changes (for single page applications)
    refreshPageContext() {
        this.currentPageContext = this.detectCurrentPageContext();
        console.log('Updated page context:', this.currentPageContext.pageName);
    }
    
    // New methods for data integration
    
    // Fetch real-time statistics from the server
    async loadChatbotStatistics() {
        try {
            const response = await fetch('/api/campaigns/chatbot/statistics');
            if (!response.ok) {
                throw new Error('Failed to fetch chatbot statistics');
            }
            
            this.campaignStats = await response.json();
            console.log('Chatbot statistics loaded:', this.campaignStats);
            
            // Also load popular campaigns
            await this.getPopularCampaigns();
        } catch (error) {
            console.error('Error loading chatbot statistics:', error);
        }
    }
    
    // Get popular campaigns (when no specific interests are provided)
    async getPopularCampaigns() {
        try {
            const response = await fetch('/api/campaigns/chatbot/recommendations');
            if (!response.ok) {
                throw new Error('Failed to fetch popular campaigns');
            }
            
            const data = await response.json();
            this.popularCampaigns = data.campaigns || [];
            console.log('Popular campaigns loaded:', this.popularCampaigns);
        } catch (error) {
            console.error('Error loading popular campaigns:', error);
        }
    }
    
    // Search for campaigns based on user interests
    async searchCampaigns(keywords) {
        try {
            // Format keywords for URL
            const keywordsParam = encodeURIComponent(keywords);
            const response = await fetch(`/api/campaigns/chatbot/recommendations?keywords=${keywordsParam}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch campaign recommendations');
            }
            
            const data = await response.json();
            return data.campaigns || [];
        } catch (error) {
            console.error('Error searching campaigns:', error);
            return [];
        }
    }
    
    // Format campaign results for chatbot display
    formatCampaignResults(campaigns, searchType = 'recommended') {
        if (!campaigns || campaigns.length === 0) {
            return "I couldn't find any campaigns matching your interests.";
        }
        
        let resultsMessage = searchType === 'recommended' 
            ? "Here are some campaigns that match your interests:\n\n" 
            : "Here are some popular campaigns you might be interested in:\n\n";
        
        campaigns.forEach((campaign, index) => {
            // Calculate percentage funded
            const percentFunded = campaign.goal_amount > 0 
                ? Math.round((campaign.raised_amount / campaign.goal_amount) * 100) 
                : 0;
            
            resultsMessage += `**${index + 1}. ${campaign.title}**\n`;
            resultsMessage += `Created by: ${campaign.creator_name}\n`;
            resultsMessage += `Raised: $${campaign.raised_amount.toLocaleString()} of $${campaign.goal_amount.toLocaleString()} (${percentFunded}%)\n`;
            resultsMessage += `Donations: ${campaign.donation_count}\n\n`;
        });
        
        resultsMessage += "You can view more details by clicking on any campaign title on the home page.";
        
        return resultsMessage;
    }
    
    // Format statistics for chatbot display
    formatStatistics() {
        if (!this.campaignStats) {
            return "Sorry, I couldn't retrieve the campaign statistics at this time.";
        }
        
        const { donation_stats, campaign_stats, top_categories } = this.campaignStats;
        
        let statsMessage = "**Current Fundraising Statistics:**\n\n";
        
        // Donation stats
        statsMessage += `📊 **Total Raised:** $${donation_stats.total_raised.toLocaleString()}\n`;
        statsMessage += `🎁 **Total Donations:** ${donation_stats.total_donations.toLocaleString()}\n`;
        statsMessage += `💰 **Average Donation:** $${Math.round(donation_stats.average_donation).toLocaleString()}\n\n`;
        
        // Campaign stats
        statsMessage += `📋 **Active Campaigns:** ${campaign_stats.total_campaigns}\n`;
        statsMessage += `✅ **Successful Campaigns:** ${campaign_stats.successful_campaigns}\n\n`;
        
        // Top categories
        statsMessage += "**Most Popular Campaign Categories:**\n";
        top_categories.forEach((category, index) => {
            statsMessage += `${index + 1}. ${category.name.charAt(0).toUpperCase() + category.name.slice(1)} (${category.count} campaigns)\n`;
        });
        
        return statsMessage;
    }
}

// We'll initialize this externally, don't auto-initialize
// This allows both direct script inclusion and injector to work