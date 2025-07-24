import React, { useState, useEffect } from 'react';
import { savePackages } from './firestoreHelpers';

const PACKAGE_KEY = 'company-package-pages';
const TRASH_KEY = 'company-trash';
const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];
const linksPerPackage = {
  'SEO - BASIC': '15 Links',
  'SEO - PREMIUM': '17 Links',
  'SEO - PRO': '20 Links',
  'SEO - ULTIMATE': '42 Links',
};

export default function LinkBuildings({ packages, setPackages, darkMode, setDarkMode }) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];
  const [status, setStatus] = useState({});
  const [confirmRemove, setConfirmRemove] = useState({ pkg: null, companyId: null, companyName: '' });
  const [search, setSearch] = useState({});
  const [statusFilter, setStatusFilter] = useState({});
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  // Add per-package page state
  const [page, setPage] = useState({});
  const PAGE_SIZE = 15;

  useEffect(() => {
    // Initialize status from company data if available
    const initialStatus = {};
    Object.values(packages).forEach(companies => {
      companies.forEach(c => {
        initialStatus[c.id] = c.linkBuildingStatus || 'Pending';
      });
    });
    setStatus(initialStatus);
  }, [packages]);

  // Handle status change for a company and persist in Firestore
  const handleStatusChange = async (pkg, companyId, value) => {
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c => c.id === companyId ? { ...c, linkBuildingStatus: value } : c);
    setPackages(updatedPackages); // Optimistically update UI
    await savePackages(updatedPackages); // Persist to Firestore
  };

  // Dropdown style (reuse from Report page)
  const getDropdownStyle = value => ({
    borderRadius: 8,
    padding: '0.3em 1em',
    fontWeight: 600,
    fontSize: '1rem',
    background: value === 'Completed'
      ? 'linear-gradient(90deg, #eaffea 60%, #b6f5c3 100%)'
      : value === 'Pending'
      ? 'linear-gradient(90deg, #ffeaea 60%, #ffd6d6 100%)'
      : 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
    color: value === 'Completed' ? '#19744d' : value === 'Pending' ? '#c00' : '#232323',
    border: '1.5px solid #b6b6d8',
    outline: 'none',
    minWidth: 120,
    boxShadow: '0 1px 4px #ececec',
    transition: 'background 0.18s, color 0.18s',
  });

  // Remove company from package
  const handleRemoveFromLinkBuilding = (pkg, companyId, companyName) => {
    setConfirmRemove({ pkg, companyId, companyName });
  };
  const handleRemoveConfirm = () => {
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).filter(c => c.id !== confirmRemove.companyId);
    setPackages(updatedPackages); // Optimistically update UI
    if (window.fetchAlerts) fetchAlerts(); // Optimistically update alerts
    savePackages(updatedPackages);
    setConfirmRemove({ pkg: null, companyId: null, companyName: '' });
    setShowDeleteToast(true);
    setTimeout(() => setShowDeleteToast(false), 1800);
  };
  const handleRemoveCancel = () => setConfirmRemove({ pkg: null, companyId: null, companyName: '' });

  return (
    <section className="company-tracker-page" style={{paddingTop: 12, background: darkMode ? '#181a1b' : '#f7f6f2'}}>
      <h1 className="fancy-title">Link Building for {currentMonth}</h1>
      <p className="hero-desc" style={{marginBottom: 10}}>All companies, grouped by SEO package for link building.</p>
      {packageNames.map(pkg => {
        const companies = (packages[pkg] || []).filter(c => c.status !== 'OnHold');
        const filteredCompanies = companies.filter(c => {
          const matchesSearch = !search[pkg] || c.name.toLowerCase().includes(search[pkg].toLowerCase());
          const matchesStatus = !statusFilter[pkg] || (status[c.id] || 'Pending') === statusFilter[pkg];
          return matchesSearch && matchesStatus;
        });
        // Pagination logic
        const currentPage = page[pkg] || 1;
        const pageCount = Math.ceil(filteredCompanies.length / PAGE_SIZE);
        const paginated = filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        const pendingCount = filteredCompanies.filter(c => (status[c.id] || 'Pending') !== 'Completed').length;
        return (
          <div key={pkg} style={{ marginBottom: 32, width: '100%' }}>
            {pendingCount > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#fffbe6',
                color: '#b26a00',
                borderRadius: 999,
                padding: '0.5em 1.5em',
                fontWeight: 700,
                fontSize: '1.08em',
                border: '1.5px solid #ffe082',
                boxShadow: '0 1px 4px #fffbe6',
                marginBottom: 18,
                marginLeft: 2,
                letterSpacing: '0.03em',
              }}>
                <span style={{fontSize:'1.2em',marginRight:8}}>⚠️</span>
                {pendingCount} compan{pendingCount === 1 ? 'y' : 'ies'} under the {pkg.replace('SEO - ', '').toUpperCase()} SEO package are still pending for Link Building this month.
              </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 0}}>
              <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">🔗</span>Total: {filteredCompanies.length}</div>
              <h2 className="fancy-subtitle">{pkg}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select
                  value={statusFilter[pkg] || ''}
                  onChange={e => {
                    setStatusFilter(f => ({ ...f, [pkg]: e.target.value }));
                    setPage(p => ({ ...p, [pkg]: 1 }));
                  }}
                  style={{ minWidth: 90, borderRadius: 8, border: '1.5px solid #b6b6d8', fontSize: '1em', background: '#faf9f6', color: '#232323', fontWeight: 600, boxShadow: '0 1px 4px #ececec', padding: '0.3em 1em' }}
                >
                  <option value="">All</option>
                  <option value="Pending">🔴 Pending</option>
                  <option value="Completed">🟢 Completed</option>
                </select>
                <input
                  type="text"
                  className="package-search-input"
                  style={{ minWidth: 180, marginLeft: 0, marginBottom: 0, fontSize: '1em' }}
                  placeholder={`Search company...`}
                  value={search[pkg] || ''}
                  onChange={e => setSearch(s => ({ ...s, [pkg]: e.target.value }))}
                />
              </div>
            </div>
            <div className="table-scroll-container table-responsive" style={{marginBottom: 0, height: 'auto', width: '100%', position: 'relative'}}>
              <div className="responsive-table-wrapper">
                <table className="company-table report-table" style={{marginBottom: 0, width: '100%', tableLayout: 'fixed'}}>
                  <thead>
                    <tr>
                      <th className="company-col">Company Name</th>
                      <th className="package-col">SEO Package</th>
                      <th className="report-col">Links</th>
                      <th className="report-col">Status</th>
                      <th className="report-col" style={{minWidth:60}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies in this package.</td></tr>
                    )}
                    {paginated.map(c => (
                      <tr key={c.id}>
                        <td className="company-name company-col">{c.name}</td>
                        <td className="package-col">
                          <span className={
                            c.package === 'SEO - BASIC' ? 'package-basic' :
                            c.package === 'SEO - PREMIUM' ? 'package-premium' :
                            c.package === 'SEO - PRO' ? 'package-pro' :
                            c.package === 'SEO - ULTIMATE' ? 'package-ultimate' : ''
                          }>
                            {c.package}
                          </span>
                        </td>
                        <td className="report-col">
                          <span style={{
                            display: 'inline-block',
                            fontWeight: 700,
                            fontSize: '1.08em',
                            letterSpacing: '0.03em',
                            borderRadius: 12,
                            padding: '0.22em 1.2em',
                            boxShadow: '0 1px 6px #ececec',
                            background: pkg === 'SEO - BASIC' ? 'linear-gradient(90deg, #e0e7ef 60%, #f7f6f2 100%)'
                              : pkg === 'SEO - PREMIUM' ? 'linear-gradient(90deg, #b2ebf2 60%, #e0f7fa 100%)'
                              : pkg === 'SEO - PRO' ? 'linear-gradient(90deg, #ede7f6 60%, #d1c4e9 100%)'
                              : pkg === 'SEO - ULTIMATE' ? 'linear-gradient(90deg, #e3f2fd 60%, #bbdefb 100%)'
                              : '#f7f6f2',
                            color: pkg === 'SEO - BASIC' ? '#4e342e'
                              : pkg === 'SEO - PREMIUM' ? '#00838f'
                              : pkg === 'SEO - PRO' ? '#6a1b9a'
                              : pkg === 'SEO - ULTIMATE' ? '#1976d2'
                              : '#232323',
                            border: '1.5px solid #e0e0e0',
                            margin: '0.1em 0',
                            minWidth: 80,
                            textAlign: 'center',
                            userSelect: 'none',
                            transition: 'background 0.18s, color 0.18s',
                          }}>{linksPerPackage[pkg]}</span>
                        </td>
                        <td className="report-col">
                          <select
                            value={status[c.id] || 'Pending'}
                            onChange={e => handleStatusChange(pkg, c.id, e.target.value)}
                            style={getDropdownStyle(status[c.id] || 'Pending')}
                          >
                            <option value="Pending">🔴 Pending</option>
                            <option value="Completed">🟢 Completed</option>
                          </select>
                        </td>
                        <td className="report-col" style={{textAlign:'center'}}>
                          <button
                            className="remove-btn"
                            style={{ background: '#ffeaea', color: '#c00', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1.2em', cursor: 'pointer', padding: '0.2em 0.8em', marginLeft: 4 }}
                            title="Remove company from link building"
                            onClick={() => handleRemoveFromLinkBuilding(pkg, c.id, c.name)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Pagination controls */}
            {pageCount > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 16 }}>
                <button
                  onClick={() => setPage(p => ({ ...p, [pkg]: (p[pkg] || 1) - 1 }))}
                  disabled={currentPage === 1}
                  style={{ padding: '0.4em 1.2em', borderRadius: 8, border: '1.5px solid #b6b6d8', background: currentPage === 1 ? '#eee' : '#faf9f6', color: '#232323', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >Prev</button>
                <span style={{ fontWeight: 600, fontSize: '1.05em' }}>Page {currentPage} of {pageCount}</span>
                <button
                  onClick={() => setPage(p => ({ ...p, [pkg]: (p[pkg] || 1) + 1 }))}
                  disabled={currentPage === pageCount}
                  style={{ padding: '0.4em 1.2em', borderRadius: 8, border: '1.5px solid #b6b6d8', background: currentPage === pageCount ? '#eee' : '#faf9f6', color: '#232323', fontWeight: 600, cursor: currentPage === pageCount ? 'not-allowed' : 'pointer' }}
                >Next</button>
              </div>
            )}
          </div>
        );
      })}
      {/* Confirmation Modal for Remove in Link Buildings page */}
      {confirmRemove.companyId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Remove Company?</div>
            <div className="confirm-desc">Are you sure you want to remove <b>{confirmRemove.companyName}</b> from <b>{confirmRemove.pkg}</b>?</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleRemoveConfirm}>Yes, Remove</button>
              <button className="confirm-btn cancel" onClick={handleRemoveCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
} 