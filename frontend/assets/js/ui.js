/**
 * UI utilities for rendering components
 */

// Render navigation based on authentication status
const renderNavigation = () => {
  const navContainer = document.querySelector('#nav-container');
  if (!navContainer) return;
  
  const isLoggedIn = isAuthenticated();
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  navContainer.innerHTML = `
    <nav class="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-gray-800 text-white shadow-md transition-all duration-300" id="main-nav">
      <div class="flex items-center">
        <a href="/" class="flex items-center gap-2">
          <img src="/assets/images/logo.svg" alt="Fundraiser Logo" class="h-8">
          <span class="text-2xl font-bold text-indigo-300">Fundraiser</span>
        </a>
      </div>
      <div class="flex space-x-4 items-center">
        <a href="/" class="hover:text-indigo-200">Home</a>
        ${isLoggedIn ? `
          <a href="/dashboard.html" class="hover:text-indigo-200">Dashboard</a>
          <a href="/create.html" class="hover:text-indigo-200">Create Campaign</a>
          <button id="logout-btn" class="hover:text-indigo-200">Logout</button>
        ` : `
          <a href="/login.html" class="hover:text-indigo-200">Login</a>
          <a href="/register.html" class="hover:text-indigo-200">Register</a>
        `}
        <button id="dark-mode-toggle" class="p-2 rounded-full ${isDarkMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'} transition-colors" title="${isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}">
          ${isDarkMode ? 
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" /></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>'
          }
        </button>
      </div>
    </nav>
    <div class="h-16"></div> <!-- Spacer to account for fixed navbar -->
  `;
  
  // Add event listener for logout
  if (isLoggedIn) {
    document.querySelector('#logout-btn').addEventListener('click', () => {
      API.auth.logout();
      window.location.href = '/';
    });
  }
  
  // Add event listener for dark mode toggle
  document.querySelector('#dark-mode-toggle').addEventListener('click', toggleDarkMode);
  
  // Add scroll event listener to change navbar styles on scroll
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('main-nav');
    if (navbar) {
      if (window.scrollY > 10) {
        navbar.classList.remove('bg-gray-800');
        navbar.classList.add('bg-indigo-800');
      } else {
        navbar.classList.remove('bg-indigo-800');
        navbar.classList.add('bg-gray-800');
      }
    }
  });
};

// Toggle dark mode
const toggleDarkMode = () => {
  // Get current state before toggling
  const currentIsDarkMode = document.body.classList.contains('dark-mode');
  // Toggle to opposite state
  const newIsDarkMode = !currentIsDarkMode;
  
  // Apply the new state directly instead of toggling
  if (newIsDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  // Save the new state
  localStorage.setItem('darkMode', newIsDarkMode);
  
  // Update the UI
  updateDarkModeIcon(newIsDarkMode);
  
  // Apply dark mode to all elements immediately
  if (newIsDarkMode) {
    applyDarkModeToAllElements();
  } else {
    removeDarkModeFromAllElements();
  }
};

// Initialize dark mode based on saved preference
const initDarkMode = () => {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  // Ensure consistent state by explicitly setting/removing the class
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  updateDarkModeIcon(isDarkMode);
  
  // Apply dark mode to all elements if needed
  if (isDarkMode) {
    applyDarkModeToAllElements();
  }
};

// Update the dark mode icon based on current state
const updateDarkModeIcon = (isDarkMode) => {
  const toggleButton = document.querySelector('#dark-mode-toggle');
  if (!toggleButton) return;
  
  // Update the button content based on mode
  toggleButton.innerHTML = isDarkMode 
    ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" /></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>';
    
  // Update button tooltip
  toggleButton.title = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  
  // Update background color
  toggleButton.classList.toggle('bg-yellow-500', isDarkMode);
  toggleButton.classList.toggle('bg-indigo-600', !isDarkMode);
};

// Apply dark mode to dynamically loaded content
const applyDarkModeToContent = (container) => {
  if (!container) return;
  applyDarkModeToElement(container);
};

// Render campaign cards
const renderCampaignCards = (campaigns, containerId) => {
  const container = document.querySelector(containerId);
  if (!container) return;
  
  if (campaigns.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500 my-8">No campaigns found.</p>';
    return;
  }
  
  // Filter out completed campaigns if on homepage
  const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';
  const filteredCampaigns = isHomepage 
    ? campaigns.filter(campaign => {
        const progress = calculateProgress(campaign.raised_amount || 0, campaign.goal_amount);
        return parseFloat(progress) < 100;
      })
    : campaigns;
  
  if (filteredCampaigns.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500 my-8">No active campaigns found.</p>';
    return;
  }
  
  let html = '';
  
  filteredCampaigns.forEach(campaign => {
    const progress = calculateProgress(campaign.raised_amount || 0, campaign.goal_amount);
    const isCompleted = parseFloat(progress) >= 100;
    
    // Choose a campaign-specific image or fallback to default
    let imagePath = campaign.image_path || '/assets/images/default-campaign.jpg';
    
    // For demo purposes, assign specific images to campaigns based on their title keywords
    if (!campaign.image_path) {
      if (campaign.title.toLowerCase().includes('education')) {
        imagePath = '/assets/images/campaigns/education-sample.jpg';
      } else if (campaign.title.toLowerCase().includes('medical') || campaign.title.toLowerCase().includes('health')) {
        imagePath = '/assets/images/campaigns/medical-sample.jpg';
      } else if (campaign.title.toLowerCase().includes('charity')) {
        imagePath = '/assets/images/default-campaign.jpg';
      } else if (campaign.title.toLowerCase().includes('emergency')) {
        imagePath = '/assets/images/default-campaign.jpg';
      }
    }
    
    html += `
      <div class="campaign-card bg-white rounded-lg shadow-md overflow-hidden">
        <div class="relative overflow-hidden ${isCompleted ? 'campaign-completed' : ''}">
          <img src="${imagePath}" alt="${campaign.title}" class="w-full h-48 object-cover transition-transform duration-500 hover:scale-110">
          <div class="absolute top-2 right-2 ${isCompleted ? 'badge-completed' : 'badge-active'} text-white text-xs font-bold px-2 py-1 rounded-full">
            ${progress}% Funded
          </div>
          ${isCompleted ? `
          <div class="confetti-container">
            ${Array(10).fill(0).map((_, i) => `
              <div class="confetti" style="left: ${Math.random() * 100}%; animation-delay: ${Math.random() * 2}s;"></div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        <div class="p-4">
          <h2 class="text-xl font-semibold mb-2 hover:text-indigo-600 transition-colors">
            <a href="/campaign.html?id=${campaign.id}">${campaign.title}</a>
          </h2>
          <p class="text-gray-600 mb-3 line-clamp-2">${campaign.description}</p>
          
          <div class="mb-4">
            <div class="text-sm text-gray-500 flex justify-between">
              <span>Raised: ${formatCurrency(campaign.raised_amount || 0)}</span>
              <span>Goal: ${formatCurrency(campaign.goal_amount)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div class="progress-bar ${isCompleted ? 'bg-green-500' : 'bg-indigo-600'} h-2.5 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
            </div>
          </div>
          
          <div class="flex justify-between items-center mt-4">
            <a href="/campaign.html?id=${campaign.id}" class="text-indigo-600 hover:text-indigo-800 font-medium">View Details</a>
            ${!isCompleted ? `
            <a href="/donate.html?id=${campaign.id}" class="btn px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">Donate Now</a>
            ` : `
            <span class="flex items-center text-green-600 font-medium">
              <span class="icon-complete mr-1"></span>
              Goal Reached
            </span>
            `}
          </div>
          <div class="mt-3 text-right">
            <span class="text-sm text-gray-500">${campaign.donation_count || 0} Donations</span>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Apply dark mode to newly rendered content
  applyDarkModeToContent(container);
};

// Render a single campaign detail
const renderCampaignDetail = (campaign, containerId) => {
  const container = document.querySelector(containerId);
  if (!container) return;
  
  const progress = calculateProgress(campaign.raised_amount || 0, campaign.goal_amount);
  const isCompleted = parseFloat(progress) >= 100;
  
  // Choose a campaign-specific image or fallback to default
  let imagePath = campaign.image_path || '/assets/images/default-campaign.jpg';
  
  // For demo purposes, assign specific images to campaigns based on their title keywords
  if (!campaign.image_path) {
    if (campaign.title.toLowerCase().includes('education')) {
      imagePath = '/assets/images/campaigns/education-sample.jpg';
    } else if (campaign.title.toLowerCase().includes('medical') || campaign.title.toLowerCase().includes('health')) {
      imagePath = '/assets/images/campaigns/medical-sample.jpg';
    } else if (campaign.title.toLowerCase().includes('charity')) {
      imagePath = '/assets/images/default-campaign.jpg';
    } else if (campaign.title.toLowerCase().includes('emergency')) {
      imagePath = '/assets/images/default-campaign.jpg';
    }
  }
  
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="relative">
      <img src="${imagePath}" alt="${campaign.title}" class="w-full h-64 object-cover">
        ${isCompleted ? `
        <div class="absolute top-0 right-0 m-4">
          <div class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md font-bold flex items-center">
            <span class="icon-complete mr-2"></span>
            Goal Reached
          </div>
        </div>
        ` : ''}
      </div>
      <div class="p-6">
        <h1 class="text-3xl font-bold mb-4">${campaign.title}</h1>
        
        <div class="mb-6">
          <div class="text-sm text-gray-500 flex justify-between mb-1">
            <span>Raised: ${formatCurrency(campaign.raised_amount || 0)}</span>
            <span>Goal: ${formatCurrency(campaign.goal_amount)}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="progress-bar ${isCompleted ? 'bg-green-500' : 'bg-indigo-600'} h-2.5 rounded-full" style="width: ${progress}%"></div>
          </div>
          <div class="text-right text-xs text-gray-500 mt-1">${progress}% Complete</div>
        </div>
        
        <div class="flex justify-between items-center mb-6">
          <div>
            <p class="text-sm text-gray-500">Created by: ${campaign.creator_name}</p>
            <p class="text-sm text-gray-500">Created on: ${formatDate(campaign.created_at)}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">${campaign.donation_count || 0} Donations</p>
          </div>
        </div>
        
        <div class="border-t border-gray-200 pt-6 mb-6">
          <h2 class="text-xl font-semibold mb-3">About this campaign</h2>
          <p class="text-gray-700 whitespace-pre-line">${campaign.description}</p>
        </div>
        
        ${isCompleted ? `
        <div class="bg-green-50 p-6 rounded-lg mt-6 text-center border border-green-200">
          <h3 class="text-xl font-semibold mb-3 text-green-700">Funding Goal Reached!</h3>
          <p class="text-gray-700 mb-4">Thank you to all our donors for helping us achieve our goal!</p>
          <div class="flex justify-center">
            <a href="/" class="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 transform hover:scale-105">
              Browse More Campaigns
            </a>
          </div>
        </div>
        ` : `
        <div class="bg-indigo-50 p-6 rounded-lg mt-6 text-center">
          <h3 class="text-xl font-semibold mb-3">Support this campaign</h3>
          <p class="text-gray-700 mb-4">Your donation can make a real difference. Help us reach the goal!</p>
          <a href="/donate.html?id=${campaign.id}" class="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-105">
            Donate Now
          </a>
        </div>
        `}
      </div>
    </div>
  `;
  
  // Apply dark mode to newly rendered content
  applyDarkModeToContent(container);
  
  // Add confetti effect for completed campaigns
  if (isCompleted) {
    addConfettiEffect(container);
  }
};

// Add confetti effect to completed campaigns
const addConfettiEffect = (container) => {
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  confettiContainer.style.position = 'absolute';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '0';
  confettiContainer.style.overflow = 'visible';
  confettiContainer.style.zIndex = '10';
  
  // Add 30 confetti pieces
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 3}s`;
    confettiContainer.appendChild(confetti);
  }
  
  // Insert the confetti container at the beginning of the main container
  const firstElement = container.firstChild;
  container.insertBefore(confettiContainer, firstElement);
};

// Render recent donations
const renderRecentDonations = (donations, containerId) => {
  const container = document.querySelector(containerId);
  if (!container) return;
  
  if (donations.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500 my-4">No donations yet.</p>';
    return;
  }
  
  let html = '<ul class="divide-y divide-gray-200">';
  
  donations.forEach(donation => {
    html += `
      <li class="py-3">
        <div class="flex justify-between">
          <div>
            <p class="font-medium">${donation.donor_name}</p>
            <p class="text-sm text-gray-500">${formatDate(donation.donated_at)}</p>
          </div>
          <p class="font-semibold">${formatCurrency(donation.amount)}</p>
        </div>
      </li>
    `;
  });
  
  html += '</ul>';
  container.innerHTML = html;
  
  // Apply dark mode to newly rendered content
  applyDarkModeToContent(container);
};

// Render user's campaigns for dashboard
const renderUserCampaigns = (campaigns, containerId) => {
  const container = document.querySelector(containerId);
  if (!container) return;
  
  if (campaigns.length === 0) {
    container.innerHTML = `
      <div class="text-center my-8">
        <p class="text-gray-500 mb-4">You haven't created any campaigns yet.</p>
        <a href="/create.html" class="btn px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Campaign</a>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  campaigns.forEach(campaign => {
    const progress = calculateProgress(campaign.raised_amount || 0, campaign.goal_amount);
    const isCompleted = parseFloat(progress) >= 100;
    
    // Choose a campaign-specific image or fallback to default
    let imagePath = campaign.image_path || '/assets/images/default-campaign.jpg';
    
    // For demo purposes, assign specific images to campaigns based on their title keywords
    if (!campaign.image_path) {
      if (campaign.title.toLowerCase().includes('education')) {
        imagePath = '/assets/images/campaigns/education-sample.jpg';
      } else if (campaign.title.toLowerCase().includes('medical') || campaign.title.toLowerCase().includes('health')) {
        imagePath = '/assets/images/campaigns/medical-sample.jpg';
      } else if (campaign.title.toLowerCase().includes('charity')) {
        imagePath = '/assets/images/default-campaign.jpg';
      } else if (campaign.title.toLowerCase().includes('emergency')) {
        imagePath = '/assets/images/default-campaign.jpg';
      }
    }
    
    html += `
      <div class="card bg-white rounded-lg shadow-md overflow-hidden">
        <div class="flex flex-col md:flex-row">
          <div class="relative">
          <img src="${imagePath}" alt="${campaign.title}" class="w-full md:w-48 h-48 object-cover">
            ${isCompleted ? `
            <div class="absolute top-0 right-0 m-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                <span class="icon-complete mr-1"></span>
                Completed
              </span>
            </div>
            ` : ''}
          </div>
          <div class="p-4 flex-1">
            <div class="flex justify-between">
            <h2 class="text-xl font-semibold mb-2">${campaign.title}</h2>
              ${isCompleted ? `
              <span class="inline-flex items-center text-green-600">
                <span class="icon-complete mr-1"></span>
                Goal Reached
              </span>
              ` : ''}
            </div>
            
            <div class="mb-3">
              <div class="text-sm text-gray-500 flex justify-between">
                <span>Raised: ${formatCurrency(campaign.raised_amount || 0)}</span>
                <span>Goal: ${formatCurrency(campaign.goal_amount)}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div class="progress-bar ${isCompleted ? 'bg-green-500' : 'bg-indigo-600'} h-2.5 rounded-full" style="width: ${progress}%"></div>
              </div>
              <div class="text-right text-xs text-gray-500 mt-1">${progress}%</div>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-auto">
              <a href="/campaign.html?id=${campaign.id}" class="btn px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">View</a>
              <a href="/edit-campaign.html?id=${campaign.id}" class="btn px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">Edit</a>
              <button class="btn px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm delete-campaign" data-id="${campaign.id}">Delete</button>
            </div>
            
            <div class="mt-3 text-sm text-gray-500 flex justify-between">
              <span>${campaign.donation_count || 0} Donations</span>
              <span>Created: ${formatDate(campaign.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Add event listeners for delete buttons
  document.querySelectorAll('.delete-campaign').forEach(button => {
    button.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
        const campaignId = button.getAttribute('data-id');
        try {
          await API.campaigns.delete(campaignId);
          showFlash('Campaign deleted successfully', 'success');
          // Refresh the list
          loadUserCampaigns();
        } catch (error) {
          showFlash(error.message || 'Error deleting campaign', 'error');
        }
      }
    });
  });
  
  // Apply dark mode to newly rendered content
  applyDarkModeToContent(container);
};

// Initialize page based on URL
const initPage = () => {
  const path = window.location.pathname;
  
  // Initialize dark mode before rendering components
  initDarkMode();
  
  // Common initialization for all pages
  renderNavigation();
  
  // Create a flash container if it doesn't exist
  if (!document.querySelector('#flash-container')) {
    const flashContainer = document.createElement('div');
    flashContainer.id = 'flash-container';
    flashContainer.className = 'fixed top-4 right-4 z-50 w-80';
    document.body.appendChild(flashContainer);
  }
  
  // Route-specific initialization
  if (path === '/' || path === '/index.html') {
    loadHomePage();
  } else if (path === '/campaign.html') {
    loadCampaignDetails();
  } else if (path === '/login.html') {
    setupLoginForm();
  } else if (path === '/register.html') {
    setupRegisterForm();
  } else if (path === '/dashboard.html') {
    checkAuth(() => loadUserCampaigns());
  } else if (path === '/create.html') {
    checkAuth(() => setupCampaignForm());
  } else if (path === '/edit-campaign.html') {
    checkAuth(() => setupEditCampaignForm());
  }
  
  // Watch for DOM changes to apply dark mode to dynamically added elements
  if (MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      if (localStorage.getItem('darkMode') === 'true') {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                applyDarkModeToElement(node);
              }
            });
          }
        });
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
};

// Load the home page content
const loadHomePage = async () => {
  try {
    const campaigns = await API.campaigns.getAll();
    renderCampaignCards(campaigns, '#campaign-list');
    
    // Add stats section
    try {
      const stats = await API.donations.getTotalRaised();
      const statsContainer = document.querySelector('#stats-container');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="bg-indigo-700 text-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold mb-4">Total Raised</h2>
            <p class="text-4xl font-extrabold">${formatCurrency(stats.total)}</p>
            <p class="mt-2">Across all campaigns</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  } catch (error) {
    showFlash(error.message || 'Error loading campaigns', 'error');
  }
};

// Load campaign details
const loadCampaignDetails = async (campaignId) => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = campaignId || urlParams.get('id');
  
  if (!id) {
    window.location.href = '/';
    return;
  }
  
  try {
    const campaign = await API.campaigns.getById(id);
    renderCampaignDetail(campaign, '#campaign-detail');
    
    try {
      const donations = await API.campaigns.getDonations(id);
      const donationsContainer = document.querySelector('#recent-donations');
      if (donationsContainer) {
        // Clear the loading spinner
        donationsContainer.innerHTML = '';
        
        // Create heading
        const heading = document.createElement('h3');
        heading.className = 'text-xl font-semibold mb-3';
        heading.textContent = 'Recent Donations';
        donationsContainer.appendChild(heading);
        
        if (donations.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'text-center py-6';
          emptyState.innerHTML = `
            <p class="text-gray-500">No donations yet. Be the first to donate!</p>
            <a href="/donate.html?id=${id}" class="btn bg-indigo-600 text-white px-4 py-2 rounded mt-4 inline-block">Donate Now</a>
          `;
          donationsContainer.appendChild(emptyState);
          return;
        }
        
        const donationsList = document.createElement('div');
        donationsList.className = 'space-y-4 mt-4';
        
        donations.forEach(donation => {
          const donationItem = document.createElement('div');
          donationItem.className = 'flex items-center justify-between border-b border-gray-200 pb-3';
          donationItem.innerHTML = `
            <div>
              <p class="font-medium">${donation.donor_name || 'Anonymous'}</p>
              <p class="text-sm text-gray-500">${formatDate(donation.created_at)}</p>
            </div>
            <div class="text-indigo-600 font-bold">${formatCurrency(donation.amount)}</div>
          `;
          donationsList.appendChild(donationItem);
        });
        
        donationsContainer.appendChild(donationsList);
      }
    } catch (error) {
      // Handle token expiration for donations request
      if (!API.handleTokenError(error)) {
        console.error('Error fetching donations:', error);
        
        const donationsContainer = document.querySelector('#recent-donations');
        if (donationsContainer) {
          donationsContainer.innerHTML = `
            <h3 class="text-xl font-semibold mb-3">Recent Donations</h3>
            <p class="text-red-500">Error loading donations. Please try again later.</p>
          `;
        }
      }
    }
  } catch (error) {
    // Handle token expiration for campaign details request
    if (!API.handleTokenError(error)) {
      showFlash(error.message || 'Error loading campaign details', 'error');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  }
};

// Load user's campaigns for dashboard
const loadUserCampaigns = async () => {
  try {
    const campaigns = await API.users.getCampaigns();
    renderUserCampaigns(campaigns, '#user-campaigns');
  } catch (error) {
    // Use the token error handler from API
    if (!API.handleTokenError(error)) {
      showFlash(error.message || 'Error loading your campaigns', 'error');
    }
  }
};

// Setup login form
const setupLoginForm = () => {
  const form = document.querySelector('#login-form');
  if (!form) return;
  
  // Apply dark mode to form elements
  applyDarkModeToContent(form);
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    
    try {
      const credentials = {
        email: form.email.value,
        password: form.password.value
      };
      
      await API.auth.login(credentials);
      showFlash('Login successful! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    } catch (error) {
      showFlash(error.message || 'Invalid credentials', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
  });
};

// Setup registration form
const setupRegisterForm = () => {
  const form = document.querySelector('#register-form');
  if (!form) return;
  
  // Apply dark mode to form elements
  applyDarkModeToContent(form);
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';
    
    try {
      if (form.password.value !== form.confirm_password.value) {
        throw new Error('Passwords do not match');
      }
      
      const userData = {
        name: form.name.value,
        email: form.email.value,
        password: form.password.value
      };
      
      await API.auth.register(userData);
      showFlash('Account created successfully! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    } catch (error) {
      showFlash(error.message || 'Error creating account', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Register';
    }
  });
};

// Setup campaign creation form
const setupCampaignForm = () => {
  const form = document.querySelector('#campaign-form');
  if (!form) return;
  
  // Apply dark mode to form elements
  applyDarkModeToContent(form);
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating campaign...';
    
    try {
      const formData = new FormData(form);
      
      await API.campaigns.create(formData);
      showFlash('Campaign created successfully! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    } catch (error) {
      showFlash(error.message || 'Error creating campaign', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Create Campaign';
    }
  });
};

// Setup campaign edit form
const setupEditCampaignForm = async () => {
  const form = document.querySelector('#edit-campaign-form');
  if (!form) return;
  
  // Apply dark mode to form elements
  applyDarkModeToContent(form);
  
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if (!id) {
    window.location.href = '/dashboard.html';
    return;
  }
  
  try {
    const campaign = await API.campaigns.getById(id);
    
    // Populate form fields
    form.title.value = campaign.title;
    form.description.value = campaign.description;
    form.goal_amount.value = campaign.goal_amount;
    
    // If there's an image, show a preview
    if (campaign.image_path) {
      const previewContainer = document.querySelector('#image-preview');
      if (previewContainer) {
        previewContainer.innerHTML = `
          <div class="mb-3">
            <p class="text-sm text-gray-500 mb-1">Current Image:</p>
            <img src="${campaign.image_path}" alt="Current campaign image" class="h-32 object-cover rounded">
          </div>
        `;
      }
    }
    
    // Set up form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Updating...';
      
      try {
        const formData = new FormData(form);
        formData.append('id', id);
        
        await API.campaigns.update(id, formData);
        showFlash('Campaign updated successfully!', 'success');
        
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1000);
      } catch (error) {
        // Handle token expiration
        if (!API.handleTokenError(error)) {
          showFlash(error.message || 'Error updating campaign', 'error');
        }
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Update Campaign';
      }
    });
  } catch (error) {
    // Handle token expiration
    if (!API.handleTokenError(error)) {
      showFlash(error.message || 'Error loading campaign details', 'error');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 3000);
    }
  }
};

// Check if user is authenticated
const checkAuth = (callback) => {
  if (!isAuthenticated()) {
    showFlash('Please log in to access this page', 'error');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1000);
    return;
  }
  
  callback();
};

// Apply dark mode classes to all relevant elements
const applyDarkModeToAllElements = () => {
  document.querySelectorAll('.bg-white, .bg-gray-50, .bg-gray-100').forEach(el => {
    if (!el.classList.contains('force-light')) {
      el.classList.add('dark-mode-el');
    }
  });
  
  document.querySelectorAll('.text-gray-600, .text-gray-700, .text-gray-800').forEach(el => {
    if (!el.classList.contains('force-light-text')) {
      el.classList.add('dark-mode-text');
    }
  });
};

// Remove dark mode classes from all elements
const removeDarkModeFromAllElements = () => {
  document.querySelectorAll('.dark-mode-el').forEach(el => {
    el.classList.remove('dark-mode-el');
  });
  
  document.querySelectorAll('.dark-mode-text').forEach(el => {
    el.classList.remove('dark-mode-text');
  });
};

// Apply dark mode to a single element and its children
const applyDarkModeToElement = (element) => {
  if (!element || localStorage.getItem('darkMode') !== 'true') return;
  
  // Apply to the element itself if it has the right classes
  if (element.classList) {
    if ((element.classList.contains('bg-white') || 
         element.classList.contains('bg-gray-50') || 
         element.classList.contains('bg-gray-100')) && 
        !element.classList.contains('force-light')) {
      element.classList.add('dark-mode-el');
    }
    
    if ((element.classList.contains('text-gray-600') || 
         element.classList.contains('text-gray-700') || 
         element.classList.contains('text-gray-800')) && 
        !element.classList.contains('force-light-text')) {
      element.classList.add('dark-mode-text');
    }
  }
  
  // Apply to children
  if (element.querySelectorAll) {
    element.querySelectorAll('.bg-white, .bg-gray-50, .bg-gray-100').forEach(el => {
      if (!el.classList.contains('force-light')) {
        el.classList.add('dark-mode-el');
      }
    });
    
    element.querySelectorAll('.text-gray-600, .text-gray-700, .text-gray-800').forEach(el => {
      if (!el.classList.contains('force-light-text')) {
        el.classList.add('dark-mode-text');
      }
    });
  }
};

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage);

// Listen for changes to localStorage (for multi-tab support)
window.addEventListener('storage', (event) => {
  if (event.key === 'darkMode') {
    // Synchronize dark mode across tabs without page reload
    const isDarkMode = event.newValue === 'true';
    
    if (isDarkMode && !document.body.classList.contains('dark-mode')) {
      document.body.classList.add('dark-mode');
      applyDarkModeToAllElements();
    } else if (!isDarkMode && document.body.classList.contains('dark-mode')) {
      document.body.classList.remove('dark-mode');
      removeDarkModeFromAllElements();
    }
    
    updateDarkModeIcon(isDarkMode);
  }
});