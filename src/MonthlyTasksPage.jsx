import React, { useState, useEffect } from 'react';
import { savePackages, saveHistoryLog, loadHistoryLog, clearHistoryLog } from './firestoreHelpers';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from 'sonner';
import './MonthlyTasksPage.css'; // New import for modern styles

const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];
const packageColors = {
  'SEO - BASIC': '#4A3C31',
  'SEO - PREMIUM': '#00bcd4',
  'SEO - PRO': '#8E24AA',
  'SEO - ULTIMATE': '#1A237E',
};

// Link Building requirements for each package
const linkRequirements = {
  'SEO - BASIC': 15,
  'SEO - PREMIUM': 17,
  'SEO - PRO': 20,
  'SEO - ULTIMATE': 25,
};

export default function MonthlyTasksPage({ packages, setPackages }) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  const [selectedTaskType, setSelectedTaskType] = useState('reports');
  const [selectedPackage, setSelectedPackage] = useState('SEO - BASIC');
  const [search, setSearch] = useState({});
  const [filters, setFilters] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [revertModal, setRevertModal] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 10;
  
  // Status filter state
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Analytics toggle state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Monthly tracking state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [monthlyLinks, setMonthlyLinks] = useState({});
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showMonthlyLinks, setShowMonthlyLinks] = useState(false);

  // Load history
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadHistoryLog('monthly-tasks');
        const historyArray = loaded?.log || loaded || [];
        setHistory(Array.isArray(historyArray) ? historyArray : []);
      } catch (error) {
        console.error('Failed to load history:', error);
        toast.error('Failed to load history');
      }
    })();
  }, []);

  // Save history
  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('monthly-tasks', history).catch(err => {
        console.error('Failed to save history:', err);
        toast.error('Failed to save history');
      });
    }
  }, [history]);

  // Initialize all companies with required fields when component loads
  useEffect(() => {
    const initializeCompaniesWithRequiredFields = async () => {
      let hasChanges = false;
      const updatedPackages = { ...packages };
      
      Object.keys(updatedPackages).forEach(pkg => {
        if (updatedPackages[pkg]) {
          updatedPackages[pkg] = updatedPackages[pkg].map(company => {
            const enhancedCompany = { ...company };
            let companyChanged = false;
            
            // Initialize missing task fields for all task types
            if (!enhancedCompany.reportI) {
              enhancedCompany.reportI = 'Pending';
              companyChanged = true;
            }
            if (!enhancedCompany.reportII) {
              enhancedCompany.reportII = 'Pending';
              companyChanged = true;
            }
            if (!enhancedCompany.bmCreation) {
              enhancedCompany.bmCreation = 'Pending';
              companyChanged = true;
            }
            if (!enhancedCompany.bmSubmission) {
              enhancedCompany.bmSubmission = 'Pending';
              companyChanged = true;
            }
            if (!enhancedCompany.linkBuildingStatus) {
              enhancedCompany.linkBuildingStatus = 'Pending';
              companyChanged = true;
            }
            
            if (companyChanged) {
              hasChanges = true;
            }
            
            return enhancedCompany;
          });
        }
      });
      
      // Save changes if any companies were updated
      if (hasChanges) {
        setPackages(updatedPackages);
        try {
          await savePackages(updatedPackages);
          console.log('Successfully initialized all companies with required fields');
        } catch (error) {
          console.error('Failed to save initialized companies:', error);
        }
      }
    };

    initializeCompaniesWithRequiredFields();
  }, []); // Run only once when component mounts

  // Load monthly links when package changes
  useEffect(() => {
    if (selectedTaskType === 'linkBuildings' && selectedPackage) {
      loadMonthlyLinksFromFirebase();
    }
  }, [selectedPackage, selectedTaskType]);

  // Reset dropdown states when switching to Link Building tab
  useEffect(() => {
    if (selectedTaskType === 'linkBuildings') {
      setShowMonthlyLinks(false);
      setShowAnalytics(false);
      setSelectedMonth(null);
    }
  }, [selectedTaskType]);

  const createHistoryEntry = (companyId, companyName, packageName, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    companyId,
    companyName,
    packageName,
    field,
    oldValue,
    newValue,
    action,
    taskType: selectedTaskType
  });

  const addToHistory = (entry) => {
    setHistory(prev => [entry, ...prev.slice(0, 49)]);
  };

  const handleStatusChange = async (pkg, companyId, fieldKey, value) => {
    const company = packages[pkg]?.find(c => c.id === companyId);
    const oldValue = company?.[fieldKey] || 'Pending';

    // For Report II and BM Creation, show confirmation modal and prevent editing if already completed
    if (fieldKey === 'reportII' || fieldKey === 'bmCreation') {
      if (oldValue === 'Completed') {
        toast.error(`${fieldKey === 'reportII' ? 'Report II' : 'BM Creation'} is already completed and cannot be changed`);
        return;
      }
      if (value === 'Completed') {
        setConfirmModal({
          type: fieldKey === 'reportII' ? 'reportII' : 'bmCreation',
          companyId,
          companyName: company.name,
          packageName: pkg,
          fieldKey,
          oldValue,
          newValue: value
        });
        return;
      }
    }

    try {
      const updatedPackages = { ...packages };
      updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c => {
        if (c.id === companyId) {
          // Ensure all required fields are present when updating
          const updatedCompany = { ...c, [fieldKey]: value };
          
          // Initialize missing task fields based on selected task type
          if (selectedTaskType === 'reports') {
            if (!updatedCompany.reportI) updatedCompany.reportI = 'Pending';
            if (!updatedCompany.reportII) updatedCompany.reportII = 'Pending';
          } else if (selectedTaskType === 'linkBuildings') {
            if (!updatedCompany.linkBuildingStatus) updatedCompany.linkBuildingStatus = 'Pending';
          } else if (selectedTaskType === 'bookmarkings') {
            if (!updatedCompany.bmCreation) updatedCompany.bmCreation = 'Pending';
            if (!updatedCompany.bmSubmission) updatedCompany.bmSubmission = 'Pending';
          }
          
          return updatedCompany;
        }
        return c;
      });
      
      setPackages(updatedPackages);
      await savePackages(updatedPackages);

      const historyEntry = createHistoryEntry(
        companyId,
        company.name,
        pkg,
        fieldKey,
        oldValue,
        value
      );
      addToHistory(historyEntry);
      toast.success(`${company.name}'s ${fieldKey} updated to ${value}`);
    } catch (err) {
      toast.error(`Failed to update status for ${company.name}`);
    }
  };

  const confirmStatusChange = async () => {
    if (!confirmModal) return;

    try {
      const { companyId, packageName, fieldKey, oldValue, newValue } = confirmModal;
      const updatedPackages = { ...packages };
      updatedPackages[packageName] = (updatedPackages[packageName] || []).map(c => {
        if (c.id === companyId) {
          // Ensure all required fields are present when updating
          const updatedCompany = { ...c, [fieldKey]: newValue };
          
          // Initialize missing task fields based on selected task type
          if (selectedTaskType === 'reports') {
            if (!updatedCompany.reportI) updatedCompany.reportI = 'Pending';
            if (!updatedCompany.reportII) updatedCompany.reportII = 'Pending';
          } else if (selectedTaskType === 'linkBuildings') {
            if (!updatedCompany.linkBuildingStatus) updatedCompany.linkBuildingStatus = 'Pending';
          } else if (selectedTaskType === 'bookmarkings') {
            if (!updatedCompany.bmCreation) updatedCompany.bmCreation = 'Pending';
            if (!updatedCompany.bmSubmission) updatedCompany.bmSubmission = 'Pending';
          }
          
          return updatedCompany;
        }
        return c;
      });
      
      setPackages(updatedPackages);
      await savePackages(updatedPackages);

      const historyEntry = createHistoryEntry(
        companyId,
        confirmModal.companyName,
        packageName,
        fieldKey,
        oldValue,
        newValue
      );
      addToHistory(historyEntry);
      toast.success(`${confirmModal.companyName}'s ${fieldKey} updated to ${newValue}`);
      setConfirmModal(null);
    } catch (err) {
      toast.error(`Failed to update status for ${confirmModal.companyName}`);
    }
  };

  // Helper function to check if Ready for Report II should be shown
  const shouldShowReadyForReportII = (company) => {
    if (!company.start) return false;
    const startDate = parseDisplayDateToInput(company.start);
    if (!startDate) return false;
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    return daysDiff >= 16;
  };

  // Helper function to format start date
  const formatStartDate = (company) => {
    if (!company.start) return 'Not set';
    
    // Parse the date and format it with abbreviated month name
    const startDate = parseDisplayDateToInput(company.start);
    if (!startDate) return company.start;
    
    // Format as "MMM DD, YYYY" (e.g., "Jan 1, 2025") for better fit
    const month = startDate.toLocaleDateString('en-US', { month: 'short' });
    const day = startDate.getDate();
    const year = startDate.getFullYear();
    
    return `${month} ${day}, ${year}`;
  };

  // Helper function to parse display date to input date
  const parseDisplayDateToInput = (dateStr) => {
    if (!dateStr) return null;
    const match = dateStr.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (!match) return null;
    const [_, month, day, year] = match;
    const normalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return new Date(`${normalizedMonth} ${day}, ${year}`);
  };

  const getTaskFields = () => {
    switch (selectedTaskType) {
      case 'reports':
        return [
          { key: 'reportI', label: 'Report I', color: '#007bff', icon: '📊' },
          { key: 'reportII', label: 'Report II', color: '#28a745', icon: '📈' }
        ];
      case 'linkBuildings':
        return [
          { key: 'linkBuildingStatus', label: 'Link Building Status', color: '#ffc107', icon: '🔗' }
        ];
      case 'bookmarkings':
        return [
          { key: 'bmCreation', label: 'BM Creation', color: '#6f42c1', icon: '🔖' },
          { key: 'bmSubmission', label: 'BM Submission', color: '#fd7e14', icon: '📝' }
        ];
      default:
        return [];
    }
  };

  const getFilteredCompanies = () => {
    const companies = packages[selectedPackage] || [];
    const currentSearch = search[selectedPackage] || '';
    
    // Ensure all companies have the required task fields initialized
    const companiesWithRequiredFields = companies.map(company => {
      const enhancedCompany = { ...company };
      
      // Initialize missing task fields based on selected task type
      if (selectedTaskType === 'reports') {
        if (!enhancedCompany.reportI) enhancedCompany.reportI = 'Pending';
        if (!enhancedCompany.reportII) enhancedCompany.reportII = 'Pending';
      } else if (selectedTaskType === 'linkBuildings') {
        if (!enhancedCompany.linkBuildingStatus) enhancedCompany.linkBuildingStatus = 'Pending';
      } else if (selectedTaskType === 'bookmarkings') {
        if (!enhancedCompany.bmCreation) enhancedCompany.bmCreation = 'Pending';
        if (!enhancedCompany.bmSubmission) enhancedCompany.bmSubmission = 'Pending';
      }
      
      return enhancedCompany;
    });
    
    // Apply search filter
    let filtered = companiesWithRequiredFields.filter(company =>
      company.name.toLowerCase().includes(currentSearch.toLowerCase())
    );
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => {
        const taskFields = getTaskFields();
        return taskFields.some(field => company[field.key] === statusFilter);
      });
    }
    
    return filtered;
  };

  const filteredCompanies = getFilteredCompanies();
  const taskFields = getTaskFields();

  // Pagination logic
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);
  const startIndex = (currentPage - 1) * companiesPerPage;
  const endIndex = startIndex + companiesPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTaskType, selectedPackage, search[selectedPackage], statusFilter]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const revertChange = (historyEntry) => {
    setRevertModal(historyEntry);
  };

  const confirmRevert = async () => {
    if (!revertModal) return;

    try {
      const { companyId, packageName, field, oldValue } = revertModal;
      const updatedPackages = { ...packages };
      updatedPackages[packageName] = (updatedPackages[packageName] || []).map(c =>
        c.id === companyId ? { ...c, [field]: oldValue } : c
      );
      setPackages(updatedPackages);
      await savePackages(updatedPackages);

      const revertEntry = createHistoryEntry(
        companyId,
        revertModal.companyName,
        packageName,
        field,
        revertModal.newValue,
        oldValue,
        'reverted'
      );
      addToHistory(revertEntry);
      toast.success(`Reverted ${field} for ${revertModal.companyName}`);
      setRevertModal(null);
    } catch (err) {
      toast.error('Failed to revert change');
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistoryLog('monthly-tasks');
      setHistory([]);
      toast.success('History cleared successfully');
      setClearHistoryModal(false);
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#28a745';
      case 'In Progress': return '#ffc107';
      case 'Ready for Report II': return '#fd7e14';
      case 'Break': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case 'Completed': return '#d4edda';
      case 'In Progress': return '#fff3cd';
      case 'Ready for Report II': return '#ffeaa7';
      case 'Break': return '#f8f9fa';
      default: return '#f8f9fa';
    }
  };

  // Calculate statistics for the current package and task type
  const calculateStatistics = () => {
    const companies = packages[selectedPackage] || [];
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.status !== 'OnHold').length;
    const onHoldCompanies = totalCompanies - activeCompanies;

    // Calculate task-specific statistics for Reports
    let reportIStats = { pending: 0, completed: 0, break: 0 };
    let reportIIStats = { pending: 0, completed: 0, break: 0 };
    let readyForReportII = 0;

    // Calculate task-specific statistics for Bookmarkings
    let bmCreationStats = { pending: 0, completed: 0, break: 0 };
    let bmSubmissionStats = { pending: 0, completed: 0, break: 0 };

    if (selectedTaskType === 'reports') {
      companies.forEach(company => {
        // Report I statistics
        const reportIStatus = company.reportI || 'Pending';
        if (reportIStatus === 'Pending') reportIStats.pending++;
        else if (reportIStatus === 'Completed') reportIStats.completed++;
        else if (reportIStatus === 'Break') reportIStats.break++;

        // Report II statistics
        const reportIIStatus = company.reportII || 'Pending';
        if (reportIIStatus === 'Pending') reportIIStats.pending++;
        else if (reportIIStatus === 'Completed') reportIIStats.completed++;
        else if (reportIIStatus === 'Break') reportIIStats.break++;

        // Count ready for Report II
        if (shouldShowReadyForReportII(company) && reportIIStatus !== 'Completed') {
          readyForReportII++;
        }
      });
    } else if (selectedTaskType === 'bookmarkings') {
      companies.forEach(company => {
        // BM Creation statistics
        const bmCreationStatus = company.bmCreation || 'Pending';
        if (bmCreationStatus === 'Pending') bmCreationStats.pending++;
        else if (bmCreationStatus === 'Completed') bmCreationStats.completed++;
        else if (bmCreationStatus === 'Break') bmCreationStats.break++;

        // BM Submission statistics
        const bmSubmissionStatus = company.bmSubmission || 'Pending';
        if (bmSubmissionStatus === 'Pending') bmSubmissionStats.pending++;
        else if (bmSubmissionStatus === 'Completed') bmSubmissionStats.completed++;
        else if (bmSubmissionStatus === 'Break') bmSubmissionStats.break++;
      });
    }

    return {
      total: totalCompanies,
      active: activeCompanies,
      onHold: onHoldCompanies,
      reportI: reportIStats,
      reportII: reportIIStats,
      readyForReportII,
      bmCreation: bmCreationStats,
      bmSubmission: bmSubmissionStats
    };
  };

  const stats = calculateStatistics();

  // Calculate link building progress for the selected package
  const calculateLinkBuildingProgress = () => {
    if (selectedTaskType !== 'linkBuildings') return null;
    
    const companies = packages[selectedPackage] || [];
    const requiredLinks = linkRequirements[selectedPackage];
    const completedCompanies = companies.filter(c => c.linkBuildingStatus === 'Completed').length;
    const totalCompanies = companies.length;
    
    return {
      required: requiredLinks,
      completed: completedCompanies,
      total: totalCompanies,
      percentage: totalCompanies > 0 ? Math.round((completedCompanies / totalCompanies) * 100) : 0,
      remaining: Math.max(0, requiredLinks - completedCompanies)
    };
  };

  const linkProgress = calculateLinkBuildingProgress();

  // Monthly link tracking functions
  const getCurrentMonthLinks = () => {
    const monthKey = `${selectedPackage}_${selectedMonth}`;
    return monthlyLinks[monthKey] || [];
  };

  const addLink = async (linkData) => {
    const monthKey = `${selectedPackage}_${selectedMonth}`;
    const newLink = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: linkData.url,
      description: linkData.description || '',
      dateAdded: new Date().toISOString(),
      status: 'Active'
    };
    
    try {
      const updatedMonthlyLinks = {
        ...monthlyLinks,
        [monthKey]: [...(monthlyLinks[monthKey] || []), newLink]
      };

      setMonthlyLinks(updatedMonthlyLinks);
      await saveMonthlyLinksToFirebase(updatedMonthlyLinks);
      toast.success('Link added successfully!');
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add link. Please try again.');
    }
  };

  const removeLink = async (linkId) => {
    const monthKey = `${selectedPackage}_${selectedMonth}`;
    try {
      const updatedMonthlyLinks = {
        ...monthlyLinks,
        [monthKey]: (monthlyLinks[monthKey] || []).filter(link => link.id !== linkId)
      };

      setMonthlyLinks(updatedMonthlyLinks);
      await saveMonthlyLinksToFirebase(updatedMonthlyLinks);
      toast.success('Link removed successfully!');
    } catch (error) {
      console.error('Error removing link:', error);
      toast.error('Failed to remove link. Please try again.');
    }
  };

  const editLink = async (linkId, updatedData) => {
    const monthKey = `${selectedPackage}_${selectedMonth}`;
    try {
      const updatedMonthlyLinks = {
        ...monthlyLinks,
        [monthKey]: (monthlyLinks[monthKey] || []).map(link => 
          link.id === linkId ? { ...link, ...updatedData } : link
        )
      };

      setMonthlyLinks(updatedMonthlyLinks);
      await saveMonthlyLinksToFirebase(updatedMonthlyLinks);
      toast.success('Link updated successfully!');
    } catch (error) {
      console.error('Error updating link:', error);
      toast.error('Failed to update link. Please try again.');
    }
  };

  const getMonthlyLinkStats = () => {
    const monthKey = `${selectedPackage}_${selectedMonth}`;
    const links = monthlyLinks[monthKey] || [];
    return {
      total: links.length,
      active: links.filter(link => link.status === 'Active').length,
      used: links.filter(link => link.status === 'Used').length
    };
  };

  // Firebase functions for monthly links
  const saveMonthlyLinksToFirebase = async (linksData) => {
    try {
      const docRef = doc(db, 'monthlyLinks', selectedPackage);
      await setDoc(docRef, {
        package: selectedPackage,
        links: linksData,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving monthly links:', error);
      throw error;
    }
  };

  const loadMonthlyLinksFromFirebase = async () => {
    try {
      const docRef = doc(db, 'monthlyLinks', selectedPackage);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMonthlyLinks(data.links || {});
      } else {
        setMonthlyLinks({});
      }
    } catch (error) {
      console.error('Error loading monthly links:', error);
      toast.error('Failed to load monthly links');
    }
  };

  const processBulkPaste = async () => {
    if (!bulkPasteText.trim()) return;

    // If no month is selected, default to current month
    const targetMonth = selectedMonth !== null ? selectedMonth : new Date().getMonth();

    // Split by newlines and commas, then clean up
    const links = bulkPasteText
      .split(/[\n,]/)
      .map(link => link.trim())
      .filter(link => link && (link.startsWith('http://') || link.startsWith('https://')));

    if (links.length === 0) {
      toast.error('No valid links found. Please ensure links start with http:// or https://');
      return;
    }

    try {
      // Add all links to the target month
      const monthKey = `${selectedPackage}_${targetMonth}`;
      const newLinks = links.map(url => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url: url,
        description: '',
        dateAdded: new Date().toISOString(),
        status: 'Active'
      }));

      // Update local state
      const updatedMonthlyLinks = {
        ...monthlyLinks,
        [monthKey]: [...(monthlyLinks[monthKey] || []), ...newLinks]
      };
      
      setMonthlyLinks(updatedMonthlyLinks);

      // Save to Firebase
      await saveMonthlyLinksToFirebase(updatedMonthlyLinks);

      // Clear the bulk paste text
      setBulkPasteText('');
      
      toast.success(`Successfully added ${links.length} links to ${monthNames[targetMonth]}`);
    } catch (error) {
      console.error('Error adding links:', error);
      toast.error('Failed to add links. Please try again.');
    }
  };

  return (
    <div className="monthly-tasks-modern">
      {/* Header */}
      <div className="monthly-tasks-header">
        <h1 className="monthly-tasks-title">
          Monthly Tasks for {currentMonth}
        </h1>
        <p className="monthly-tasks-subtitle">
          Manage your reports, link buildings, and bookmarkings in one place.
        </p>
      </div>

      {/* Task Type Tabs */}
      <div className="monthly-tasks-tabs">
        <h3 className="monthly-tasks-tabs-title">
          📋 Task Categories
        </h3>
        <div className="monthly-tasks-tabs-container">
          <button
            onClick={() => setSelectedTaskType('reports')}
            className={`monthly-tasks-tab${selectedTaskType === 'reports' ? ' active' : ''}`}
          >
            <span>📊</span> Reports
          </button>
          <button
            onClick={() => setSelectedTaskType('linkBuildings')}
            className={`monthly-tasks-tab link-buildings${selectedTaskType === 'linkBuildings' ? ' active' : ''}`}
          >
            <span>🔗</span> Link Buildings
          </button>
          <button
            onClick={() => setSelectedTaskType('bookmarkings')}
            className={`monthly-tasks-tab bookmarkings${selectedTaskType === 'bookmarkings' ? ' active' : ''}`}
          >
            <span>🔖</span> Bookmarkings
          </button>
        </div>
      </div>

      {/* Package Selection */}
      <div className="monthly-tasks-packages">
        <h3 className="monthly-tasks-packages-title">
          📦 Package Selection
        </h3>
        <div className="monthly-tasks-packages-container">
          {packageNames.map(pkg => (
            <button
              key={pkg}
              onClick={() => setSelectedPackage(pkg)}
              className={`monthly-tasks-package ${pkg.toLowerCase().replace('seo - ', '').replace(' ', '-')}${selectedPackage === pkg ? ' active' : ''}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span>{pkg.replace('SEO - ', '')}</span>
                {selectedTaskType === 'linkBuildings' && (
                  <span style={{ 
                    fontSize: '0.7rem', 
                    opacity: selectedPackage === pkg ? '0.9' : '0.7',
                    fontWeight: '500'
                  }}>
                    {linkRequirements[pkg]} links
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Links Used Toggle Button */}
      {selectedTaskType === 'linkBuildings' && (
        <div className="monthly-tasks-link-management">
          <h3 className="monthly-tasks-link-management-title">
            🔗 Link Management
          </h3>
          <button
            onClick={() => {
              if (showMonthlyLinks) {
                // If closing, also close any open month links
                setShowMonthlyLinks(false);
                setSelectedMonth(null);
              } else {
                // If opening, just show the monthly tabs
                setShowMonthlyLinks(true);
              }
            }}
            className="monthly-tasks-link-toggle"
          >
            <span>🔗</span>
            <span>Links used</span>
            <span style={{ fontSize: '0.9rem', opacity: '0.7' }}>
              {showMonthlyLinks ? 'Hide' : 'Show'}
            </span>
            <span style={{
              fontSize: '1rem',
              transform: showMonthlyLinks ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}>
              {showMonthlyLinks ? '▲' : '▼'}
            </span>
          </button>
        </div>
      )}

      {/* Monthly Tabs with Toggleable Dropdowns */}
      {selectedTaskType === 'linkBuildings' && showMonthlyLinks && (
        <div style={{
          marginBottom: '20px',
          background: `linear-gradient(135deg, ${packageColors[selectedPackage]} 0%, ${packageColors[selectedPackage]}dd 100%)`,
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          boxShadow: `0 8px 24px ${packageColors[selectedPackage]}30`,
          position: 'relative',
          overflow: 'hidden',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '4rem',
            opacity: '0.1',
            transform: 'rotate(15deg)'
          }}>🔗</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Monthly Tabs with Add Links Button */}
            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {monthNames.map((month, index) => (
                <button
                  key={month}
                  onClick={() => {
                    if (selectedMonth === index) {
                      // If same month is clicked, toggle the dropdown
                      setSelectedMonth(null);
                    } else {
                      // If different month is clicked, select it
                      setSelectedMonth(index);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: selectedMonth === index 
                      ? '2px solid rgba(255,255,255,0.8)' 
                      : '1px solid rgba(255,255,255,0.3)',
                    background: selectedMonth === index
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontWeight: selectedMonth === index ? 600 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '60px',
                    position: 'relative'
                  }}
                >
                  {month}
                  {(() => {
                    const monthKey = `${selectedPackage}_${index}`;
                    const monthLinks = monthlyLinks[monthKey] || [];
                    if (monthLinks.length > 0) {
                      return (
                        <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: '#ff6b6b',
                          color: 'white',
                          borderRadius: '50%',
                          width: '14px',
                          height: '14px',
                          fontSize: '0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600'
                        }}>
                          {monthLinks.length}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </button>
              ))}
              
              {/* Add Links Button */}
              <button
                onClick={() => setShowBulkAddModal(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.6)',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '8px'
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>➕</span>
                Add Links
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Links Dropdown */}
      {selectedTaskType === 'linkBuildings' && selectedMonth !== null && (
        <div style={{ 
          marginBottom: '24px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {/* Monthly Links Content */}
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🔗</span>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.3rem', 
                  fontWeight: '700',
                  color: '#495057'
                }}>
                  {monthNames[selectedMonth]} Links for {selectedPackage.replace('SEO - ', '')}
                </h3>
              </div>
              
              <button
                onClick={() => {
                  const links = getCurrentMonthLinks();
                  if (links.length === 0) {
                    toast.error('No links to copy');
                    return;
                  }
                  
                  const linkUrls = links.map(link => link.url).join('\n');
                  navigator.clipboard.writeText(linkUrls).then(() => {
                    toast.success(`Copied ${links.length} links to clipboard!`);
                  }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = linkUrls;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    toast.success(`Copied ${links.length} links to clipboard!`);
                  });
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '2px solid #007bff',
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📋</span>
                Copy All Links
              </button>
            </div>

            {/* Links List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {getCurrentMonthLinks().length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6c757d',
                  fontSize: '1.1rem',
                  fontStyle: 'italic'
                }}>
                  No links added for {monthNames[selectedMonth]} yet. Use the "Add Links" button above to bulk add links!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getCurrentMonthLinks().map((link) => (
                    <div
                      key={link.id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #e0e7ef',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <span style={{ fontSize: '1.1rem' }}>🔗</span>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#007bff',
                                textDecoration: 'none',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                              }}
                            >
                              {link.url}
                            </a>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              background: link.status === 'Active' 
                                ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                                : 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                              color: 'white'
                            }}>
                              {link.status}
                            </span>
                          </div>
                          {link.description && (
                            <div style={{
                              color: '#6c757d',
                              fontSize: '0.85rem',
                              marginLeft: '24px'
                            }}>
                              {link.description}
                            </div>
                          )}
                          <div style={{
                            color: '#adb5bd',
                            fontSize: '0.75rem',
                            marginLeft: '24px',
                            marginTop: '4px'
                          }}>
                            Added: {new Date(link.dateAdded).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          gap: '6px'
                        }}>
                          <button
                            onClick={() => {
                              setEditingLink(link);
                              setShowLinkModal(true);
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #007bff',
                              background: '#fff',
                              color: '#007bff',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            title="Edit Link"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => removeLink(link.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #dc3545',
                              background: '#fff',
                              color: '#dc3545',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            title="Remove Link"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Toggle Button */}
      <div className="monthly-tasks-analytics-toggle">
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`monthly-tasks-analytics-btn${showAnalytics ? ' active' : ''}`}
        >
          <span>
            {showAnalytics ? '📊' : '📈'}
          </span>
          <span>
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </span>
          <span style={{ 
            fontSize: '1rem', 
            transition: 'transform 0.3s ease',
            transform: showAnalytics ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </button>
      </div>

      {/* Enhanced Statistics Dashboard */}
      {showAnalytics && (
        <div style={{ 
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: showAnalytics ? 'slideDown 0.3s ease-out' : 'none'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '2px solid rgba(102, 126, 234, 0.2)'
          }}>
            <span style={{ fontSize: '1.8rem' }}>📊</span>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#495057',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {selectedTaskType === 'reports' ? 'Reports Analytics' : 
               selectedTaskType === 'linkBuildings' ? 'Link Building Analytics' : 
               'Bookmarking Analytics'}
            </h2>
          </div>

        <div style={{ 
          display: 'flex', 
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {/* Overall Statistics Card */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '180px',
            flex: '1 1 180px'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              fontSize: '3rem',
              opacity: '0.1',
              transform: 'rotate(15deg)'
            }}>👥</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.8rem', opacity: '0.9', marginBottom: '6px' }}>Total Companies</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>{stats.total}</div>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '6px', 
                height: '4px', 
                overflow: 'hidden',
                marginBottom: '6px'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                  height: '100%',
                  width: '100%',
                  borderRadius: '6px'
                }} />
              </div>
              <div style={{ fontSize: '0.7rem', opacity: '0.8' }}>
                Active: {stats.active} • On Hold: {stats.onHold}
              </div>
            </div>
          </div>

          {/* Active Companies Card */}
          <div style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 8px 24px rgba(40, 167, 69, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '180px',
            flex: '1 1 180px'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              fontSize: '3rem',
              opacity: '0.1',
              transform: 'rotate(15deg)'
            }}>✅</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.8rem', opacity: '0.9', marginBottom: '6px' }}>Active Companies</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>{stats.active}</div>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '6px', 
                height: '4px', 
                overflow: 'hidden',
                marginBottom: '6px'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                  height: '100%',
                  width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%`,
                  borderRadius: '6px',
                  transition: 'width 0.8s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.7rem', opacity: '0.8' }}>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
              </div>
            </div>
          </div>

          {/* On Hold Companies Card */}
          <div style={{
            background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 8px 24px rgba(255, 193, 7, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '180px',
            flex: '1 1 180px'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              fontSize: '3rem',
              opacity: '0.1',
              transform: 'rotate(15deg)'
            }}>⏸️</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.8rem', opacity: '0.9', marginBottom: '6px' }}>On Hold</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>{stats.onHold}</div>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '6px', 
                height: '4px', 
                overflow: 'hidden',
                marginBottom: '6px'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                  height: '100%',
                  width: `${stats.total > 0 ? (stats.onHold / stats.total) * 100 : 0}%`,
                  borderRadius: '6px',
                  transition: 'width 0.8s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.7rem', opacity: '0.8' }}>
                {stats.total > 0 ? Math.round((stats.onHold / stats.total) * 100) : 0}% of total
              </div>
            </div>
          </div>
        </div>

        {/* Task-Specific Statistics for Link Building */}
        {selectedTaskType === 'linkBuildings' && (
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* Monthly Links Statistics */}
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(23, 162, 184, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '200px',
              flex: '1 1 200px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                fontSize: '3rem',
                opacity: '0.1',
                transform: 'rotate(15deg)'
              }}>🔗</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>
                  {monthNames[selectedMonth]} Links
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{getMonthlyLinkStats().total}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Total</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{getMonthlyLinkStats().active}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Active</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{getMonthlyLinkStats().used}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Used</div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                    <span>Usage</span>
                    <span>{getMonthlyLinkStats().total > 0 ? Math.round((getMonthlyLinkStats().used / getMonthlyLinkStats().total) * 100) : 0}%</span>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '6px', 
                    height: '4px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                      height: '100%',
                      width: `${getMonthlyLinkStats().total > 0 ? (getMonthlyLinkStats().used / getMonthlyLinkStats().total) * 100 : 0}%`,
                      borderRadius: '6px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Link Building Progress */}
            <div style={{
              background: 'linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(111, 66, 193, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '200px',
              flex: '1 1 200px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                fontSize: '3rem',
                opacity: '0.1',
                transform: 'rotate(15deg)'
              }}>📈</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>Link Building</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                      {(() => {
                        const companies = packages[selectedPackage] || [];
                        return companies.filter(c => c.linkBuildingStatus === 'Completed').length;
                      })()}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Completed ✅</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                      {(() => {
                        const companies = packages[selectedPackage] || [];
                        return companies.filter(c => c.linkBuildingStatus === 'Pending').length;
                      })()}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Pending ⏳</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                      {(() => {
                        const companies = packages[selectedPackage] || [];
                        return companies.filter(c => c.linkBuildingStatus === 'Break').length;
                      })()}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Break ⏸️</div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                    <span>Rate</span>
                    <span>
                      {(() => {
                        const companies = packages[selectedPackage] || [];
                        const completed = companies.filter(c => c.linkBuildingStatus === 'Completed').length;
                        return companies.length > 0 ? Math.round((completed / companies.length) * 100) : 0;
                      })()}%
                    </span>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '6px', 
                    height: '4px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                      height: '100%',
                      width: `${(() => {
                        const companies = packages[selectedPackage] || [];
                        const completed = companies.filter(c => c.linkBuildingStatus === 'Completed').length;
                        return companies.length > 0 ? (completed / companies.length) * 100 : 0;
                      })()}%`,
                      borderRadius: '6px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task-Specific Statistics for Reports */}
        {selectedTaskType === 'reports' && (
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* Report I Compact Card */}
            <div style={{
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(0, 123, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '200px',
              flex: '1 1 200px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                fontSize: '3rem',
                opacity: '0.1',
                transform: 'rotate(15deg)'
              }}>📊</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>Report I</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.reportI.completed}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Completed ✅</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.reportI.pending}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Pending ⏳</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.reportI.break}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Break ⏸️</div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                    <span>Rate</span>
                    <span>{stats.total > 0 ? Math.round((stats.reportI.completed / stats.total) * 100) : 0}%</span>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '6px', 
                    height: '4px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                      height: '100%',
                      width: `${stats.total > 0 ? (stats.reportI.completed / stats.total) * 100 : 0}%`,
                      borderRadius: '6px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Report II Compact Card */}
            <div style={{
              background: 'linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(111, 66, 193, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '200px',
              flex: '1 1 200px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                fontSize: '3rem',
                opacity: '0.1',
                transform: 'rotate(15deg)'
              }}>📈</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>Report II</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.reportII.completed}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Completed ✅</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.reportII.pending}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Pending ⏳</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.reportII.break}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Break ⏸️</div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                    <span>Rate</span>
                    <span>{stats.total > 0 ? Math.round((stats.reportII.completed / stats.total) * 100) : 0}%</span>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '6px', 
                    height: '4px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                      height: '100%',
                      width: `${stats.total > 0 ? (stats.reportII.completed / stats.total) * 100 : 0}%`,
                      borderRadius: '6px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* Task-Specific Statistics for Bookmarkings */}
        {selectedTaskType === 'bookmarkings' && (
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* BM Creation Compact Card */}
            <div style={{
              background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(111, 66, 193, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '200px',
              flex: '1 1 200px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                fontSize: '3rem',
                opacity: '0.1',
                transform: 'rotate(15deg)'
              }}>🔖</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>BM Creation</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.bmCreation?.completed || 0}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Completed ✅</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.bmCreation?.pending || 0}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Pending ⏳</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.bmCreation?.break || 0}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Break ⏸️</div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                    <span>Rate</span>
                    <span>{stats.total > 0 ? Math.round((stats.bmCreation?.completed || 0 / stats.total) * 100) : 0}%</span>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '6px', 
                    height: '4px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                      height: '100%',
                      width: `${stats.total > 0 ? (stats.bmCreation?.completed || 0 / stats.total) * 100 : 0}%`,
                      borderRadius: '6px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* BM Submission Compact Card */}
            <div style={{
              background: 'linear-gradient(135deg, #fd7e14 0%, #e55a00 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(253, 126, 20, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '200px',
              flex: '1 1 200px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                fontSize: '3rem',
                opacity: '0.1',
                transform: 'rotate(15deg)'
              }}>📝</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>BM Submission</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.bmSubmission?.completed || 0}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Completed ✅</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.bmSubmission?.pending || 0}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Pending ⏳</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.bmSubmission?.break || 0}</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Break ⏸️</div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                    <span>Rate</span>
                    <span>{stats.total > 0 ? Math.round((stats.bmSubmission?.completed || 0 / stats.total) * 100) : 0}%</span>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '6px', 
                    height: '4px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                      height: '100%',
                      width: `${stats.total > 0 ? (stats.bmSubmission?.completed || 0 / stats.total) * 100 : 0}%`,
                      borderRadius: '6px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Search and History Controls */}
      <div className="monthly-tasks-controls">
        <div className="monthly-tasks-search-container">
          <div className="monthly-tasks-search">
            <input
              type="text"
              placeholder={`Search companies in ${selectedPackage}...`}
              value={search[selectedPackage] || ''}
              onChange={(e) => setSearch(prev => ({ ...prev, [selectedPackage]: e.target.value }))}
              className="monthly-tasks-search-input"
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e0e7ef'}
            />
            <span className="monthly-tasks-search-icon">
              🔍
            </span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`monthly-tasks-history-btn${showHistory ? ' active' : ''}`}
          >
            <span>📋</span>
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
          {showHistory && (
            <button
              onClick={() => setClearHistoryModal(true)}
              className="monthly-tasks-clear-history-btn"
            >
              <span>🗑️</span>
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="monthly-tasks-history">
          <h3 className="monthly-tasks-history-title">
            <span>📊</span> Recent Changes
          </h3>
          <div className="monthly-tasks-history-content">
            {history.length === 0 ? (
              <p className="monthly-tasks-history-empty">No recent changes</p>
            ) : (
              <table className="monthly-tasks-history-table">
                <thead>
                  <tr>
                    <th>⏰ Time</th>
                    <th>🏢 Company</th>
                    <th>📦 Package</th>
                    <th>📝 Field</th>
                    <th>🔄 Old Value</th>
                    <th>✨ New Value</th>
                    <th>⚡ Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(entry => (
                    <tr key={entry.id}>
                      <td>{formatTimestamp(entry.timestamp)}</td>
                      <td>{entry.companyName}</td>
                      <td>{entry.packageName}</td>
                      <td>{entry.field}</td>
                      <td>{entry.oldValue}</td>
                      <td>{entry.newValue}</td>
                      <td>
                        <button
                          onClick={() => revertChange(entry)}
                          className="monthly-tasks-history-revert-btn"
                        >
                          🔄 Revert
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="monthly-tasks-table-container">
        {filteredCompanies.length === 0 ? (
          <div className="monthly-tasks-table-empty">
            <div className="monthly-tasks-table-empty-icon">📭</div>
            <p className="monthly-tasks-table-empty-text">
              No companies found for {selectedPackage} or matching your search.
            </p>
          </div>
        ) : (
          <>
            {/* Status Filter Bar */}
            <div className="monthly-tasks-status-filter">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="monthly-tasks-status-filter-label">
                  🔍 Filter by Status:
                </span>
                
                {/* Status Filter Buttons */}
                <div className="monthly-tasks-status-filter-buttons">
                  {[
                    { value: 'all', label: 'All', icon: '📋', color: '#6c757d' },
                    { value: 'Pending', label: 'Pending', icon: '⏳', color: '#ffc107' },
                    { value: 'Completed', label: 'Completed', icon: '✅', color: '#28a745' },
                    { value: 'Break', label: 'Break', icon: '⏸️', color: '#6c757d' }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      className={`monthly-tasks-status-filter-btn${statusFilter === filter.value ? ' active' : ''}`}
                      style={{ color: filter.color, borderColor: statusFilter === filter.value ? filter.color : '#dee2e6' }}
                    >
                      <span>{filter.icon}</span>
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Filter Summary */}
              <div className="monthly-tasks-status-filter-summary">
                <span>📊</span>
                <span>
                  {statusFilter === 'all' 
                    ? `Showing all ${filteredCompanies.length} companies`
                    : `Showing ${filteredCompanies.length} companies with status "${statusFilter}"`
                  }
                </span>
              </div>
            </div>

            <table className="monthly-tasks-table">
            <thead>
              <tr>
                <th>
                  🏢 Company Name
                </th>
                {selectedTaskType === 'reports' && (
                  <th style={{
                    width: '160px',
                    maxWidth: '160px',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px',
                      position: 'relative'
                    }}>
                      <span>📅</span>
                      <span>Start Date</span>
                    </div>
                  </th>
                )}
                {taskFields.map(field => (
                  <th key={field.key}>
                    {field.icon} {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td 
                    colSpan={selectedTaskType === 'reports' ? taskFields.length + 2 : taskFields.length + 1}
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#6c757d',
                      fontSize: '1.1rem',
                      fontStyle: 'italic'
                    }}
                  >
                    {filteredCompanies.length === 0 
                      ? `No companies found in ${selectedPackage} for ${selectedTaskType}`
                      : 'No companies match your current search criteria'
                    }
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((company, index) => (
                <tr
                  key={company.id}
                  className={company.status === 'OnHold' ? 'onhold' : ''}
                >
                  <td className={`monthly-tasks-company-cell${company.status === 'OnHold' ? ' onhold' : ''}`}>
                    <div className="monthly-tasks-company-content">
                      <span>{company.name}</span>
                      {/* On Hold indicator */}
                      {company.status === 'OnHold' && (
                        <span style={{ fontSize: '0.8rem', color: '#ba68c8' }} title="Company is on hold">⏸️</span>
                      )}
                      {/* Overall completion indicator */}
                      <div className="monthly-tasks-company-indicators">
                      {(() => {
                        const taskFields = getTaskFields();
                        const completedTasks = taskFields.filter(field => company[field.key] === 'Completed').length;
                        const totalTasks = taskFields.length;
                        
                        if (completedTasks === 0) {
                          return <span style={{ fontSize: '0.8rem', color: '#ffc107' }}>⏳</span>;
                        } else if (completedTasks === totalTasks) {
                          return <span style={{ fontSize: '0.8rem', color: '#28a745' }}>✅</span>;
                        } else {
                          return <span style={{ fontSize: '0.8rem', color: '#007bff' }}>🔄</span>;
                        }
                      })()}
                      </div>
                    </div>
                  </td>
                  {selectedTaskType === 'reports' && (
                    <td style={{ 
                      padding: '20px 8px',
                      width: '160px',
                      maxWidth: '160px'
                    }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={formatStartDate(company)}
                          readOnly
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            borderRadius: '8px',
                            border: '2px solid #e0e7ef',
                            fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            color: '#495057',
                            fontWeight: '600',
                            cursor: 'default',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            textAlign: 'center',
                            boxSizing: 'border-box',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            position: 'relative'
                          }}
                          title="Start date (read-only)"
                        />
                        <span style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.9rem',
                          color: '#6c757d',
                          zIndex: 1
                        }}>
                          📅
                        </span>
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          bottom: '0',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          borderRadius: '8px',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          pointerEvents: 'none'
                        }} />
                      </div>
                    </td>
                  )}
                  {taskFields.map(field => (
                    <td key={field.key} style={{ 
                      padding: '20px 16px', 
                      position: 'relative',
                      background: company[field.key] === 'Completed' 
                        ? 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)'
                        : company[field.key] === 'Pending'
                          ? 'linear-gradient(135deg, #ffeaea 0%, #ffd6d6 100%)'
                          : company[field.key] === 'Break'
                            ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                            : 'transparent',
                      borderRadius: (company[field.key] === 'Completed' || company[field.key] === 'Pending' || company[field.key] === 'Break') ? '8px' : '0',
                      border: company[field.key] === 'Completed' 
                        ? '2px solid #28a745' 
                        : company[field.key] === 'Pending'
                          ? '2px solid #ff6b6b'
                          : company[field.key] === 'Break'
                            ? '2px solid #6c757d'
                            : 'none'
                    }}>
                      <select
                        value={company[field.key] || 'Pending'}
                        onChange={(e) => handleStatusChange(selectedPackage, company.id, field.key, e.target.value)}
                        disabled={(field.key === 'reportII' || field.key === 'bmCreation') && company[field.key] === 'Completed' || company.status === 'OnHold'}
                        className={`monthly-tasks-status-select ${(company[field.key] || 'Pending').toLowerCase()}`}
                        style={{
                          color: getStatusColor(company[field.key] || 'Pending'),
                          borderColor: getStatusColor(company[field.key] || 'Pending')
                        }}
                      >
                        {selectedTaskType === 'reports' ? (
                          <>
                            <option value="Pending" style={{ color: '#ffc107', fontWeight: '600' }}>⏳ Pending</option>
                            <option value="Completed" style={{ color: '#28a745', fontWeight: '600' }}>✅ Completed</option>
                            <option value="Break" style={{ color: '#6c757d', fontWeight: '600' }}>⏸️ Break</option>
                          </>
                        ) : selectedTaskType === 'linkBuildings' ? (
                          <>
                            <option value="Pending" style={{ color: '#ffc107', fontWeight: '600' }}>⏳ Pending</option>
                            <option value="Completed" style={{ color: '#28a745', fontWeight: '600' }}>✅ Completed</option>
                            <option value="Break" style={{ color: '#6c757d', fontWeight: '600' }}>⏸️ Break</option>
                          </>
                        ) : selectedTaskType === 'bookmarkings' ? (
                          <>
                            <option value="Pending" style={{ color: '#ffc107', fontWeight: '600' }}>⏳ Pending</option>
                            <option value="Completed" style={{ color: '#28a745', fontWeight: '600' }}>✅ Completed</option>
                            <option value="Break" style={{ color: '#6c757d', fontWeight: '600' }}>⏸️ Break</option>
                          </>
                        ) : (
                          <>
                            <option value="Pending" style={{ color: '#ffc107', fontWeight: '600' }}>⏳ Pending</option>
                            <option value="In Progress" style={{ color: '#007bff', fontWeight: '600' }}>🔄 In Progress</option>
                            <option value="Completed" style={{ color: '#28a745', fontWeight: '600' }}>✅ Completed</option>
                          </>
                        )}
                      </select>
                      
                      {/* Ready for Report II Notification */}
                      {field.key === 'reportII' && 
                       shouldShowReadyForReportII(company) && 
                       company[field.key] !== 'Completed' && (
                        <div className="monthly-tasks-badge ready">
                          📋 Ready for Report II
                        </div>
                      )}
                      
                      {/* Report II Completed Badge */}
                      {field.key === 'reportII' && company[field.key] === 'Completed' && (
                        <div className="monthly-tasks-badge done">
                          ✅ Done
                        </div>
                      )}

                      {/* BM Creation Completed Badge */}
                      {field.key === 'bmCreation' && company[field.key] === 'Completed' && (
                        <div className="monthly-tasks-badge done">
                          ✅ Done
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
            </tbody>
          </table>
            </>
          )}
        </div>

      {/* Pagination Controls */}
      {filteredCompanies.length > companiesPerPage && (
        <div className="monthly-tasks-pagination">
          <div className="monthly-tasks-pagination-info">
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCompanies.length)} of {filteredCompanies.length} companies
            </span>
          </div>
          
          <div className="monthly-tasks-pagination-controls">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="monthly-tasks-pagination-btn"
            >
              ← Previous
            </button>
            
            <div className="monthly-tasks-pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`monthly-tasks-pagination-page${currentPage === pageNum ? ' active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="monthly-tasks-pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {confirmModal && (
        <div className="monthly-tasks-modal-overlay">
          <div className="monthly-tasks-modal">
            <div className="monthly-tasks-modal-icon">⚠️</div>
            <h3 className="monthly-tasks-modal-title">
              Confirm {confirmModal.fieldKey === 'reportII' ? 'Report II' : 'BM Creation'} Completion
            </h3>
            <p className="monthly-tasks-modal-desc">
              Are you sure you want to mark {confirmModal.fieldKey === 'reportII' ? 'Report II' : 'BM Creation'} as completed for <strong>{confirmModal.companyName}</strong>? 
              <br /><br />
              <span style={{ color: '#dc3545', fontWeight: '600' }}>⚠️ Warning:</span> {confirmModal.fieldKey === 'reportII' ? 'Report II' : 'BM Creation'} is a one-time task. Once completed, it cannot be changed or undone.
            </p>
            <div className="monthly-tasks-modal-buttons">
              <button
                onClick={() => setConfirmModal(null)}
                className="monthly-tasks-modal-btn cancel"
              >
                ❌ Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="monthly-tasks-modal-btn confirm"
              >
                ✅ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {revertModal && (
        <div className="monthly-tasks-modal-overlay">
          <div className="monthly-tasks-modal">
            <div className="monthly-tasks-modal-icon">⚠️</div>
            <h3 className="monthly-tasks-modal-title">
              Revert Change
            </h3>
            <p className="monthly-tasks-modal-desc">
              Are you sure you want to revert {revertModal.field} for {revertModal.companyName} back to "{revertModal.oldValue}"?
            </p>
            <div className="monthly-tasks-modal-buttons">
              <button
                onClick={() => setRevertModal(null)}
                className="monthly-tasks-modal-btn cancel"
              >
                ❌ Cancel
              </button>
              <button
                onClick={confirmRevert}
                className="monthly-tasks-modal-btn revert"
              >
                🔄 Revert
              </button>
            </div>
          </div>
        </div>
      )}

      {clearHistoryModal && (
        <div className="monthly-tasks-modal-overlay">
          <div className="monthly-tasks-modal">
            <div className="monthly-tasks-modal-icon">🗑️</div>
            <h3 className="monthly-tasks-modal-title">
              Clear History
            </h3>
            <p className="monthly-tasks-modal-desc">
              Are you sure you want to clear all history? This action cannot be undone.
            </p>
            <div className="monthly-tasks-modal-buttons">
              <button
                onClick={() => setClearHistoryModal(false)}
                className="monthly-tasks-modal-btn cancel"
              >
                ❌ Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="monthly-tasks-modal-btn revert"
              >
                🗑️ Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <LinkModal
          editingLink={editingLink}
          onClose={() => {
            setShowLinkModal(false);
            setEditingLink(null);
          }}
          onSave={async (linkData) => {
            try {
              if (editingLink) {
                await editLink(editingLink.id, linkData);
              } else {
                await addLink(linkData);
              }
              setShowLinkModal(false);
              setEditingLink(null);
            } catch (error) {
              console.error('Error saving link:', error);
            }
          }}
        />
      )}

      {/* Bulk Add Links Modal */}
      {showBulkAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f8f9fa'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.8rem' }}>📋</span>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#495057' }}>
                  Bulk Add Links
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowBulkAddModal(false);
                  setBulkPasteText('');
                }}
                style={{
                  background: 'rgba(108, 117, 125, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(108, 117, 125, 0.2)';
                  e.target.style.color = '#495057';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(108, 117, 125, 0.1)';
                  e.target.style.color = '#6c757d';
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600', 
                color: '#495057',
                fontSize: '1rem'
              }}>
                Target Month
              </label>
              <select
                value={selectedMonth !== null ? selectedMonth : new Date().getMonth()}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e0e7ef',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#e0e7ef'}
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600', 
                color: '#495057',
                fontSize: '1rem'
              }}>
                Links (one per line or separated by commas)
              </label>
              <textarea
                placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #e0e7ef',
                  fontSize: '1rem',
                  minHeight: '180px',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  lineHeight: '1.5'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#e0e7ef'}
              />
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '28px',
              border: '2px solid #e0e7ef',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <span style={{ fontWeight: '700', color: '#495057', fontSize: '1.1rem' }}>Tips:</span>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: '24px',
                color: '#6c757d',
                fontSize: '0.95rem',
                lineHeight: '1.6'
              }}>
                <li style={{ marginBottom: '6px' }}>Paste multiple links separated by newlines or commas</li>
                <li style={{ marginBottom: '6px' }}>Only valid URLs (starting with http:// or https://) will be added</li>
                <li style={{ marginBottom: '6px' }}>All links will be added to the selected month</li>
                <li style={{ marginBottom: '0' }}>You can edit individual links later</li>
              </ul>
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'flex-end',
              paddingTop: '16px',
              borderTop: '2px solid #f8f9fa'
            }}>
              <button
                onClick={() => {
                  setShowBulkAddModal(false);
                  setBulkPasteText('');
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '2px solid #6c757d',
                  background: '#fff',
                  color: '#6c757d',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '100px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.color = '#6c757d';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkPasteText.trim()) {
                    processBulkPaste();
                    setShowBulkAddModal(false);
                  } else {
                    toast.error('Please enter some links to add');
                  }
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>➕</span>
                Add All Links
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Link Modal Component
function LinkModal({ editingLink, onClose, onSave }) {
  const [url, setUrl] = useState(editingLink?.url || '');
  const [description, setDescription] = useState(editingLink?.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSave({ url: url.trim(), description: description.trim() });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        border: '1px solid #e0e7ef'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '1.8rem' }}>🔗</span>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.4rem', 
            fontWeight: '700',
            color: '#495057'
          }}>
            {editingLink ? 'Edit Link' : 'Add New Link'}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#495057'
            }}>
              Link URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e0e7ef',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e0e7ef'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#495057'
            }}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this link..."
              rows="3"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e0e7ef',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e0e7ef'}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '2px solid #6c757d',
                background: '#fff',
                color: '#6c757d',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ❌ Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '2px solid #28a745',
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {editingLink ? '✏️ Update' : '➕ Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
