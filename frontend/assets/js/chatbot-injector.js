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
        
        // Set up navigation listeners for context awareness
        setupNavigationListeners();
    } else {
        // Add chatbot script
        const chatbotScript = document.createElement('script');
        chatbotScript.src = '/assets/js/chatbot.js';
        chatbotScript.onload = function() {
            // Initialize chatbot only after script is loaded
            if (typeof Chatbot !== 'undefined') {
                window.chatbot = new Chatbot();
                console.log('Chatbot initialized after script load');
                
                // Set up navigation listeners for context awareness
                setupNavigationListeners();
            } else {
                console.error('Chatbot class not found');
            }
        };
        document.body.appendChild(chatbotScript);
    }
}

// Function to set up navigation event listeners for SPA context refresh
function setupNavigationListeners() {
    // Store current URL to detect changes
    let lastUrl = window.location.href;
    
    // Listen for navigation events in SPAs
    
    // Option 1: Use History API events
    window.addEventListener('popstate', function() {
        console.log('Navigation detected (popstate)');
        refreshChatbotContext();
    });
    
    // Option 2: Monitor URL changes periodically
    // This helps with programmatic navigation in SPAs
    setInterval(function() {
        if (lastUrl !== window.location.href) {
            console.log('Navigation detected (URL change)');
            lastUrl = window.location.href;
            refreshChatbotContext();
        }
    }, 500);
    
    // Option 3: Listen for click events on anchor elements
    // This covers direct link navigation
    document.addEventListener('click', function(event) {
        // Check if clicked element is a link
        let target = event.target;
        while (target && target.tagName !== 'A') {
            target = target.parentNode;
            if (!target || target === document) {
                return;
            }
        }
        
        // Check if link is to same origin (internal navigation)
        if (target.href && 
            target.href.indexOf(window.location.origin) === 0 && 
            !target.getAttribute('download') && 
            target.getAttribute('target') !== '_blank') {
            
            // For SPA navigation that might not trigger popstate
            setTimeout(refreshChatbotContext, 200);
        }
    });
}

// Function to refresh chatbot context when navigation occurs
function refreshChatbotContext() {
    if (window.chatbot && typeof window.chatbot.refreshPageContext === 'function') {
        window.chatbot.refreshPageContext();
    }
}

// Run the injector when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectChatbot);
} else {
    // DOM already loaded, run immediately
    injectChatbot();
}