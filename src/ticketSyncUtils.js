// Utility functions for syncing ticket status with package task status

// Helper function to check if a ticket is a Business Profile Claiming ticket
export const isBusinessProfileClaimingTicket = (ticket) => {
  return ticket.isBusinessProfileClaiming || 
         ticket.taskType === 'businessProfileClaiming' || 
         ticket.type === 'Business Profile Claiming';
};

// Helper function to sync ticket status with package task status
export const syncTicketWithPackage = async (ticket, newStatus, packages, setPackages, setCachedData, user, setIsUpdatingPackages, savePackages, toast) => {
  // Check if this is a Business Profile Claiming ticket
  if (!ticket || !isBusinessProfileClaimingTicket(ticket)) {
    return false;
  }
  
  // For tickets without companyId, try to find the company by name
  let companyId = ticket.companyId;
  let companyName = ticket.companyName || ticket.company;
  
  if (!companyId && companyName) {
    // Search for the company in packages by name
    for (const [pkgName, pkgCompanies] of Object.entries(packages)) {
      const foundCompany = pkgCompanies.find(c => c.name === companyName);
      if (foundCompany) {
        companyId = foundCompany.id;
        break;
      }
    }
  }
  
  if (!companyId) {
    console.log('❌ Cannot sync ticket: missing companyId and cannot find company by name');
    return false;
  }
  
  try {
    let updated = false;
    let updatedPackages = { ...packages };
    
    // Find the company in packages and update task status
    for (const [pkgName, pkgCompanies] of Object.entries(updatedPackages)) {
      const companyIndex = pkgCompanies.findIndex(c => c.id === companyId);
      
      if (companyIndex !== -1) {
        const currentTaskStatus = pkgCompanies[companyIndex].tasks?.businessProfileClaiming;
        
        console.log(`🔄 Syncing Business Profile Claiming ticket for company ${companyName}:`, {
          ticketStatus: newStatus,
          currentTaskStatus: currentTaskStatus,
          companyId: companyId,
          packageName: pkgName
        });
        
        // Enhanced sync logic
        if (newStatus === 'closed' && currentTaskStatus === 'Ticket') {
          console.log(`✅ Setting Business Profile Claiming to 'Completed' for ${companyName}`);
          updatedPackages[pkgName][companyIndex].tasks.businessProfileClaiming = 'Completed';
          updated = true;
        } else if (newStatus === 'open' && currentTaskStatus === 'Completed') {
          console.log(`🔄 Setting Business Profile Claiming back to 'Ticket' for ${companyName}`);
          updatedPackages[pkgName][companyIndex].tasks.businessProfileClaiming = 'Ticket';
          updated = true;
        } else if (newStatus === 'open' && currentTaskStatus === 'Pending') {
          console.log(`🔄 Setting Business Profile Claiming to 'Ticket' for ${companyName}`);
          updatedPackages[pkgName][companyIndex].tasks.businessProfileClaiming = 'Ticket';
          updated = true;
        } else {
          console.log(`⏭️ No sync needed for ${companyName}:`, {
            ticketStatus: newStatus,
            currentTaskStatus: currentTaskStatus
          });
        }
        break;
      }
    }
    
    if (updated) {
      console.log(`💾 Saving updated packages for ${companyName}`);
      // Set flag to prevent packages listener from interfering
      setIsUpdatingPackages(true);
      
      // Update local state immediately for real-time UI updates
      setPackages(updatedPackages);
      setCachedData(`packages_${user.uid}`, updatedPackages);
      
      // Save to Firestore in background
      await savePackages(updatedPackages);
      
      // Allow listener to update after a delay
      setTimeout(() => setIsUpdatingPackages(false), 2000);
      
      // Show success message
      toast.success(`✅ Package task updated for ${companyName}`);
      return true;
    }
  } catch (error) {
    console.error('Error syncing ticket with package:', error);
    toast.error(`Failed to sync package task for ${companyName}`);
  }
  return false;
};
