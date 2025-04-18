function injectChatbot() {
    // Check if chatbot already exists
    if (window.chatbot) {
        console.log('Chatbot already initialized');
        return;
    }

    // Add chatbot CSS and Font Awesome
    if (!document.querySelector('link[href="/assets/css/chatbot.css"]')) {
        const chatbotCSS = document.createElement('link');
        chatbotCSS.rel = 'stylesheet';
        chatbotCSS.href = '/assets/css/chatbot.css';
        document.head.appendChild(chatbotCSS);
    }

    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }

    // Check if Chatbot class is already available
    if (typeof Chatbot !== 'undefined') {
        window.chatbot = new Chatbot();
        console.log('Chatbot initialized directly');
    } else {
        // Add chatbot script
        const chatbotScript = document.createElement('script');
        chatbotScript.src = '/assets/js/chatbot.js';
        chatbotScript.onload = function() {
            // Initialize chatbot only after script is loaded
            if (typeof Chatbot !== 'undefined') {
                window.chatbot = new Chatbot();
                console.log('Chatbot initialized after script load');
            } else {
                console.error('Chatbot class not found');
            }
        };
        document.body.appendChild(chatbotScript);
    }
}

// Run the injector when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectChatbot);
} else {
    // DOM already loaded, run immediately
    injectChatbot();
}