import React, { useEffect, useState } from 'react';
import { getEOCAccounts, reactivateEOCAccount, updateEOCDate } from './firestoreHelpers';
import * as XLSX from 'xlsx';

const PACKAGE_COLORS = {
  'SEO - BASIC': '#4E342E',
  'SEO - PREMIUM': '#0097A7',
  'SEO - PRO': '#7B1FA2',
  'SEO - ULTIMATE': '#283593',
};

const PACKAGE_BORDERS = {
  'SEO - ULTIMATE': '2.5px solid #FFD600',
};

export default function EOCAccounts({ darkMode }) {
  const [eocAccounts, setEocAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [packageFilter, setPackageFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState(null); // For confirmation modal
  const [showSuccessToast, setShowSuccessToast] = useState(false); // For success message
  const [editModal, setEditModal] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const PAGE_SIZE = 10;

  useEffect(() => {
    loadEOCAccounts();
  }, []);

  const loadEOCAccounts = async () => {
    const accounts = await getEOCAccounts();
    setEocAccounts(accounts);
  };

  // Update reactivation handling
  const handleReactivate = async (account) => {
    setConfirmModal(account);
  };

  // Handle actual reactivation
  const confirmReactivation = async () => {
    const account = confirmModal;
    try {
      await reactivateEOCAccount(account.id, account.package);
      await loadEOCAccounts();
      setConfirmModal(null);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Error reactivating account:', error);
    }
  };

  // Handle EOC date edit
  const handleEditEOC = (account) => {
    setEditModal(account);
    setEditDate(account.eocDate || '');
  };

  // Handle date update
  const handleDateUpdate = async () => {
    try {
      if (!editDate) {
        alert('Please enter a valid date');
        return;
      }

      await updateEOCDate(editModal.id, editModal.package, editDate);
      await loadEOCAccounts();
      setEditModal(null);
      setToastMessage('EOC date updated successfully');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Error updating EOC date:', error);
      alert('Error updating EOC date');
    }
  };

  // Add styles for modal and toast
  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: '#fff',
      padding: '24px',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '400px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    },
    modalTitle: {
      fontSize: '1.2em',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#1e293b',
    },
    modalText: {
      marginBottom: '24px',
      color: '#475569',
      lineHeight: '1.5',
    },
    modalButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    buttonCancel: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      background: '#fff',
      color: '#475569',
      cursor: 'pointer',
      fontSize: '0.95em',
      fontWeight: '500',
    },
    buttonConfirm: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      background: '#4caf50',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '0.95em',
      fontWeight: '500',
    },
    successToast: {
      position: 'fixed',
      top: '24px',
      right: '24px',
      padding: '12px 24px',
      background: '#4caf50',
      color: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out',
    },
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!filteredAccounts.length) return;
    const wsData = [
      [
        'Company Name',
        'Package',
        'Start Date',
        'EOC Date',
        'Status'
      ],
      ...filteredAccounts.map(row => [
        row.name || '',
        row.package || '',
        row.start || '',
        row.eocDate || '',
        row.status || ''
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EOC Accounts');
    XLSX.writeFile(wb, 'eoc-accounts.xlsx');
  };

  // Filtering logic
  const filteredAccounts = eocAccounts.filter(account => {
    if (packageFilter !== 'all' && account.package !== packageFilter) return false;
    if (search && !account.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Pagination
  const pageCount = Math.ceil(filteredAccounts.length / PAGE_SIZE);
  const paginatedAccounts = filteredAccounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ 
      padding: 24, 
      background: darkMode ? '#181a1b' : '#f7f6f2', 
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 32,
        background: darkMode ? '#242628' : '#ffffff',
        padding: '20px 24px',
        borderRadius: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.75rem',
          fontWeight: 600,
          color: darkMode ? '#e4e6eb' : '#1a202c'
        }}>EOC Accounts Archive</h2>
        <button 
          onClick={exportToExcel}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: '#43a047',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(67, 160, 71, 0.2)',
            ':hover': {
              background: '#388e3c',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px rgba(67, 160, 71, 0.2)'
            }
          }}
        >
          <span style={{ fontSize: '1.1em' }}>📊</span>
          Export to Excel
        </button>
      </div>

      {/* Filters Section */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24, 
        alignItems: 'center', 
        flexWrap: 'wrap',
        background: darkMode ? '#242628' : '#ffffff',
        padding: '16px 24px',
        borderRadius: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ 
            fontWeight: 500,
            color: darkMode ? '#e4e6eb' : '#4a5568'
          }}>Package:</label>
          <select 
            value={packageFilter} 
            onChange={e => { setPackageFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1.5px solid #e2e8f0',
              background: darkMode ? '#2d3033' : '#fff',
              color: darkMode ? '#e4e6eb' : '#1a202c',
              minWidth: 160,
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px top 50%',
              backgroundSize: '10px auto',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <option value="all">All Packages</option>
            {Object.keys(PACKAGE_COLORS).map(pkg => (
              <option key={pkg} value={pkg}>{pkg}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          position: 'relative',
          flex: 1,
          maxWidth: 400
        }}>
          <input
            type="text"
            placeholder="Search company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: 8,
              border: '1.5px solid #e2e8f0',
              background: darkMode ? '#2d3033' : '#fff',
              color: darkMode ? '#e4e6eb' : '#1a202c',
              fontSize: '0.95rem',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
          />
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#a0aec0',
            pointerEvents: 'none'
          }}>
            🔍
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ 
        background: darkMode ? '#242628' : '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div className="responsive-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: darkMode ? '#2d3033' : '#f8fafc' }}>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Company Name</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Package</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Start Date</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>EOC Date</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'center', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Status</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'center', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.map(account => (
                <tr 
                  key={account.id} 
                  style={{ 
                    borderBottom: `1px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                    transition: 'background-color 0.2s ease',
                    ':hover': {
                      backgroundColor: darkMode ? '#2d3033' : '#f8fafc'
                    }
                  }}
                >
                  <td style={{ 
                    padding: '16px 20px',
                    color: darkMode ? '#e4e6eb' : '#1a202c',
                    fontSize: '0.95rem'
                  }}>{account.name}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className="package-badge" style={{
                      background: PACKAGE_COLORS[account.package] || '#eee',
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      border: PACKAGE_BORDERS[account.package] || 'none',
                      display: 'inline-block',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {account.package}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '16px 20px',
                    color: darkMode ? '#e4e6eb' : '#1a202c',
                    fontSize: '0.95rem'
                  }}>{account.start || 'N/A'}</td>
                  <td style={{ 
                    padding: '16px 20px',
                    color: darkMode ? '#e4e6eb' : '#1a202c',
                    fontSize: '0.95rem'
                  }}>{account.eocDate || 'N/A'}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      background: '#ef5350',
                      color: '#fff',
                      boxShadow: '0 2px 4px rgba(239, 83, 80, 0.2)'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#fff',
                      }} />
                      EOC
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleReactivate(account)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)',
                        ':hover': {
                          background: '#43a047',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 6px rgba(76, 175, 80, 0.2)'
                        }
                      }}
                    >
                      Reactivate
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedAccounts.length === 0 && (
                <tr>
                  <td 
                    colSpan={6} 
                    style={{ 
                      padding: 32, 
                      textAlign: 'center', 
                      color: darkMode ? '#a0aec0' : '#718096',
                      fontSize: '0.95rem'
                    }}
                  >
                    No EOC accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Section */}
      <div style={{ 
        marginTop: 24, 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 16, 
        alignItems: 'center',
        padding: '16px 24px',
        background: darkMode ? '#242628' : '#ffffff',
        borderRadius: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: page === 1 ? (darkMode ? '#3d4144' : '#e2e8f0') : '#1976d2',
            color: page === 1 ? (darkMode ? '#a0aec0' : '#718096') : '#fff',
            border: 'none',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: page === 1 ? 'none' : '0 2px 4px rgba(25, 118, 210, 0.2)',
            ':hover': page !== 1 && {
              background: '#1565c0',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px rgba(25, 118, 210, 0.2)'
            }
          }}
        >
          Previous
        </button>
        <span style={{
          color: darkMode ? '#e4e6eb' : '#4a5568',
          fontSize: '0.95rem',
          fontWeight: 500
        }}>
          Page {page} of {pageCount || 1}
        </span>
        <button
          onClick={() => setPage(p => Math.min(pageCount, p + 1))}
          disabled={page === pageCount || pageCount === 0}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: page === pageCount ? (darkMode ? '#3d4144' : '#e2e8f0') : '#1976d2',
            color: page === pageCount ? (darkMode ? '#a0aec0' : '#718096') : '#fff',
            border: 'none',
            cursor: page === pageCount ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: page === pageCount ? 'none' : '0 2px 4px rgba(25, 118, 210, 0.2)',
            ':hover': page !== pageCount && {
              background: '#1565c0',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px rgba(25, 118, 210, 0.2)'
            }
          }}
        >
          Next
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div style={styles.modalOverlay} onClick={() => setConfirmModal(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>Confirm Reactivation</div>
            <div style={styles.modalText}>
              Are you sure you want to reactivate <strong>{confirmModal.name}</strong>? This will move the company back to active accounts.
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.buttonCancel}
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button 
                style={styles.buttonConfirm}
                onClick={confirmReactivation}
              >
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit EOC Date Modal */}
      {editModal && (
        <div style={styles.modalOverlay} onClick={() => setEditModal(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>Edit EOC Date</div>
            <div style={styles.modalText}>
              Update EOC date for <strong>{editModal.name}</strong>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                placeholder="e.g., January 1, 2025"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.95rem',
                  color: '#1a202c'
                }}
              />
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#718096', 
                marginTop: '8px' 
              }}>
                Format: Month Day, Year (e.g., January 1, 2025)
              </div>
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.buttonCancel}
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
              <button 
                style={styles.buttonConfirm}
                onClick={handleDateUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div style={styles.successToast}>
          ✅ {toastMessage || 'Operation completed successfully'}
        </div>
      )}

      {/* Add CSS for animation */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
} 