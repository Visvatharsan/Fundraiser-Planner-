/**
 * Campaign Cleanup Utility
 * 
 * This script helps to delete specific campaigns.
 * To use: 
 * 1. Login to your account
 * 2. Go to dashboard page
 * 3. Open browser console
 * 4. Copy and paste this entire script and press Enter
 */

// Function to delete campaigns by title
async function deleteCampaignsByTitle(targetTitles) {
  try {
    // Fetch all user campaigns
    const campaigns = await API.users.getCampaigns();
    console.log('Found', campaigns.length, 'campaigns');
    
    // Filter the campaigns to delete
    const campaignsToDelete = campaigns.filter(campaign => 
      targetTitles.includes(campaign.title)
    );
    
    if (campaignsToDelete.length === 0) {
      console.log('No matching campaigns found to delete');
      return;
    }
    
    console.log('Found', campaignsToDelete.length, 'campaigns to delete:');
    campaignsToDelete.forEach(c => console.log(`- ${c.title} (ID: ${c.id})`));
    
    // Delete each campaign
    for (const campaign of campaignsToDelete) {
      try {
        console.log(`Deleting campaign: ${campaign.title} (ID: ${campaign.id})...`);
        await API.campaigns.delete(campaign.id);
        console.log(`Successfully deleted campaign: ${campaign.title}`);
      } catch (error) {
        console.error(`Error deleting campaign ${campaign.title}:`, error);
      }
    }
    
    // Refresh the dashboard
    console.log('Refreshing dashboard...');
    await loadUserCampaigns();
    console.log('Dashboard refreshed');
    
    return campaignsToDelete.length;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return 0;
  }
}

// Check if user is on dashboard and logged in
if (window.location.pathname !== '/dashboard.html') {
  console.log('Please navigate to the dashboard page first');
} else if (!isAuthenticated()) {
  console.log('Please log in first');
} else {
  console.log('Starting campaign cleanup...');
  
  // Campaigns to delete
  const targetCampaigns = [
    'Clean Water Initiative',
    'Education for Children'
  ];
  
  // Run the deletion process
  deleteCampaignsByTitle(targetCampaigns)
    .then(count => {
      if (count > 0) {
        console.log(`Cleanup complete! Deleted ${count} campaigns.`);
        showFlash(`Successfully deleted ${count} campaigns`, 'success');
      } else {
        console.log('No campaigns were deleted');
      }
    })
    .catch(error => {
      console.error('Cleanup failed:', error);
      showFlash('Error during campaign cleanup', 'error');
    });
} 