import React, { useEffect, useState } from 'react';
import { getPackages, updateCompanyAuditStatus, updatePackageCompanyStatus } from './firestoreHelpers';
import * as XLSX from 'xlsx';
import { getEOC } from './App.jsx';

const PACKAGE_COLORS = {
  'SEO - BASIC': '#4E342E',
  'SEO - PREMIUM': '#0097A7',
  'SEO - PRO': '#7B1FA2',
  'SEO - ULTIMATE': '#283593',
};

const PACKAGE_BORDERS = {
  'SEO - ULTIMATE': '2.5px solid #FFD600',
};

const TASK_GROUPS = [
  { key: 'report', label: 'Report', fields: [
    { key: 'reportI', label: 'I' },
    { key: 'reportII', label: 'II' },
  ] },
  { key: 'linkBuilding', label: 'Link Building', fields: [
    { key: 'linkBuildingStatus', label: '' },
  ] },
  { key: 'siteAudit', label: 'Site Audit', fields: [
    { key: 'siteAuditBStatus', label: 'B' },
    { key: 'siteAuditCStatus', label: 'C' },
  ] },
  { key: 'bookmarking', label: 'Bookmarking', fields: [
    { key: 'bmCreation', label: 'Creation' },
    { key: 'bmSubmission', label: 'Submission' },
  ] },
];

const STATUS_DISPLAY = {
  completed: { icon: '✅', color: '#43a047', label: 'Completed' },
  pending: { icon: '⏳', color: '#ffa726', label: 'Pending' },
  not_started: { icon: '❌', color: '#e53935', label: 'Not Started' },
  undefined: { icon: '❓', color: '#bdbdbd', label: 'Not set' },
};

const PACKAGE_LIST = [
  'SEO - BASIC',
  'SEO - PREMIUM',
  'SEO - PRO',
  'SEO - ULTIMATE',
];

function getStatusDisplay(status) {
  if (!status) return STATUS_DISPLAY.undefined;
  const normalized = typeof status === 'string' ? status.toLowerCase() : status;
  return STATUS_DISPLAY[normalized] || { icon: status, color: '#bdbdbd', label: status };
}

// Helper: Export to CSV
function exportToCSV(rows) {
  if (!rows.length) return;
  const headers = [
    'Company Name',
    'Package',
    'Report I',
    'Report II',
    'Link Building',
    'Site Audit B',
    'Site Audit C',
    'Bookmarking Creation',
    'Bookmarking Submission',
  ];
  const csvRows = [headers.join(',')];
  rows.forEach(row => {
    const lb = row.linkBuildingStatus ? row.linkBuildingStatus.toLowerCase() : '';
    csvRows.push([
      '"' + (row.name || '') + '"',
      '"' + (row.package || '') + '"',
      row.reportI || '',
      row.reportII || '',
      lb,
      row.siteAuditBStatus || '',
      row.siteAuditCStatus || '',
      row.bmCreation || '',
      row.bmSubmission || '',
    ].join(','));
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'company-overview.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Helper: Export to Excel
function exportToExcel(rows) {
  if (!rows.length) return;
  const wsData = [
    [
      'Company Name',
      'Package',
      'Report I',
      'Report II',
      'Link Building',
      'Site Audit B',
      'Site Audit C',
      'Bookmarking Creation',
      'Bookmarking Submission',
    ],
    ...rows.map(row => [
      row.name || '',
      row.package || '',
      row.reportI || '',
      row.reportII || '',
      row.linkBuildingStatus ? row.linkBuildingStatus.toLowerCase() : '',
      row.siteAuditBStatus || '',
      row.siteAuditCStatus || '',
      row.bmCreation || '',
      row.bmSubmission || '',
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Company Overview');
  XLSX.writeFile(wb, 'company-overview.xlsx');
}

export default function CompanyOverview({ darkMode, setDarkMode }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);
  const [packageFilter, setPackageFilter] = useState('all');
  const PAGE_SIZE = 10;
  const GRID_COLUMNS = 2;

  useEffect(() => {
    getPackages().then(pkgs => {
      // Flatten all companies from all packages
      const allRows = [];
      Object.entries(pkgs).forEach(([pkg, companies]) => {
        companies.forEach(company => {
          allRows.push({ ...company, package: pkg });
        });
      });
      setRows(allRows);
    });
  }, []);

  // Filtering logic
  const filteredRows = rows.filter(row => {
    // Package filter
    if (packageFilter !== 'all' && row.package !== packageFilter) return false;
    // Status filter
    if (filter !== 'all') {
      // Check if any status field matches the filter (case-insensitive)
      const matches = TASK_GROUPS.some(group =>
        group.fields.some(field => {
          const val = row[field.key];
          if (!val) return false;
          return val.toLowerCase() === filter;
        })
      );
      if (!matches) return false;
    }
    // Search filter
    if (row.name && !row.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Pagination
  const pageCount = Math.ceil(filteredRows.length / PAGE_SIZE);
  const paginatedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Handle status update
  const handleStatusChange = async (row, fieldKey, value) => {
    await updatePackageCompanyStatus(row.id, row.package, fieldKey, value);
    // Re-fetch packages to update UI
    getPackages().then(pkgs => {
      const allRows = [];
      Object.entries(pkgs).forEach(([pkg, companies]) => {
        companies.forEach(company => {
          allRows.push({ ...company, package: pkg });
        });
      });
      setRows(allRows);
      setSelectedRow(prev => prev && prev.id === row.id && prev.package === row.package ? { ...prev, [fieldKey]: value } : prev);
    });
  };

  return (
    <div style={{ padding: 24, background: darkMode ? '#181a1b' : '#f7f6f2', minHeight: '100vh' }}>
      <h2>Company Task Overview</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
        <button onClick={() => exportToCSV(filteredRows)} style={{ padding: '6px 16px', borderRadius: 6, background: '#1976d2', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Export to CSV</button>
        <button onClick={() => exportToExcel(filteredRows)} style={{ padding: '6px 16px', borderRadius: 6, background: '#43a047', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Export to Excel</button>
        <label style={{ marginLeft: 24 }}>Filter by status: </label>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="not_started">Not Started</option>
        </select>
        <label style={{ marginLeft: 24 }}>Filter by package: </label>
        <select value={packageFilter} onChange={e => { setPackageFilter(e.target.value); setPage(1); }}>
          <option value="all">All</option>
          {PACKAGE_LIST.map(pkg => (
            <option key={pkg} value={pkg}>{pkg}</option>
          ))}
        </select>
        <div className="search-filter-wrapper">
          <span className="search-filter-icon" role="img" aria-label="Search">🔍</span>
          <input
            type="text"
            className="search-filter-input"
            placeholder="Search company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ minWidth: 180 }}
          />
        </div>
      </div>
      <style>{`
.package-badge {
  transition: filter 0.18s, box-shadow 0.18s;
}
.package-badge:hover {
  filter: brightness(1.15);
  box-shadow: 0 2px 12px #bdbdbd;
}
.search-filter-wrapper {
  position: relative;
  display: inline-block;
}
.search-filter-input {
  padding: 8px 32px 8px 36px;
  border-radius: 20px;
  border: 1.5px solid #bdbdbd;
  font-size: 1em;
  box-shadow: 0 1px 4px #ececec;
  outline: none;
  transition: border 0.18s, box-shadow 0.18s;
  background: #fafbfc;
}
.search-filter-input:focus {
  border: 1.5px solid #1976d2;
  box-shadow: 0 2px 8px #b3c6e7;
  background: #fff;
}
.search-filter-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2em;
  color: #bdbdbd;
  pointer-events: none;
}
.company-details-card {
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 18px;
  box-shadow: 0 4px 24px #e0e7ef;
  padding: 28px 28px 20px 28px;
  max-width: 1000px;
  width: 90vw;
  margin: 0 auto;
  margin-top: 32px;
  font-size: 1.08em;
}
.company-details-title {
  font-size: 1.35em;
  font-weight: 800;
  margin-bottom: 10px;
  letter-spacing: 0.01em;
}
.company-details-list {
  margin-bottom: 18px;
  padding-left: 0;
  list-style: none;
}
.company-details-list li {
  margin-bottom: 4px;
  font-size: 1em;
}
.company-details-section {
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ececec;
}
.company-details-section:last-child {
  border-bottom: none;
}
.company-details-label {
  font-weight: 700;
  margin-right: 8px;
  color: #232323;
  min-width: 90px;
  display: inline-block;
}
.company-details-status {
  margin-left: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  font-size: 1em;
}
.status-completed { color: #43a047; }
.status-pending { color: #ffa726; }
.status-not_started { color: #e53935; }
.status-not_set { color: #bdbdbd; }
.company-details-select {
  border-radius: 12px;
  padding: 6px 18px 6px 10px;
  font-size: 1em;
  border: 1.5px solid #bdbdbd;
  background: #f7f7fa;
  font-weight: 600;
  margin-left: 8px;
  margin-right: 4px;
  outline: none;
  transition: border 0.18s, box-shadow 0.18s;
}
.company-details-select:focus {
  border: 1.5px solid #1976d2;
  box-shadow: 0 2px 8px #b3c6e7;
  background: #fff;
}
.company-details-close {
  margin-top: 18px;
  background: #232323;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 28px;
  font-size: 1.08em;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;
  box-shadow: 0 1px 4px #ececec;
}
.company-details-close:hover {
  background: #1976d2;
}
.status-icon {
  margin-right: 4px;
  font-size: 1.1em;
}
.company-details-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(44, 62, 80, 0.32);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.company-details-modal {
  z-index: 1100;
  max-width: 1100px;
  width: 98vw;
  box-shadow: 0 8px 32px #23232333;
  border-radius: 18px;
  background: #fff;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.company-details-section-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ececec;
}
.company-details-section-row:last-child {
  border-bottom: none;
}
.company-details-section-label {
  font-weight: 700;
  color: #232323;
  min-width: 110px;
  font-size: 1.08em;
  margin-right: 8px;
}
.company-details-status-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}
.company-details-status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.company-details-section-grid {
  display: grid;
  grid-template-columns: 140px repeat(2, 1fr);
  align-items: center;
  gap: 0 18px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ececec;
}
.company-details-section-grid:last-child {
  border-bottom: none;
}
.company-details-grid-label {
  font-weight: 700;
  color: #232323;
  font-size: 1.08em;
  margin-right: 8px;
  grid-row: 1;
  grid-column: 1;
}
.company-details-grid-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.status-pill {
  display: inline-block;
  padding: 2px 16px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1em;
  margin: 0 2px;
  background: #e0e0e0;
  color: #232323;
  min-width: 80px;
  text-align: center;
  box-shadow: 0 1px 2px #ececec;
  vertical-align: middle;
  transition: background 0.18s, color 0.18s;
}
.status-pill.completed {
  background: #43a047;
  color: #fff;
}
.status-pill.pending {
  background: #ffa726;
  color: #fff;
}
.status-pill.not_set {
  background: #bdbdbd;
  color: #fff;
}
`}</style>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Company Name</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Package</th>
            {TASK_GROUPS.map(group => (
              <th key={group.key} style={{ border: '1px solid #ccc', padding: 8 }}>
                {group.label}
                {group.fields.length > 1 && (
                  <div style={{ fontSize: '0.8em', color: '#888' }}>
                    {group.fields.map(f => f.label).join(' / ')}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map(row => (
            <tr key={row.id + row.package} style={{ cursor: 'pointer' }} onClick={() => setSelectedRow(row)}>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{row.name}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>
                <span className="package-badge" style={{
                  background: PACKAGE_COLORS[row.package] || '#eee',
                  color: '#fff',
                  padding: '2px 18px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: '1em',
                  border: PACKAGE_BORDERS[row.package] || 'none',
                  marginRight: 2,
                  letterSpacing: '0.03em',
                  boxShadow: '0 1px 4px #ececec',
                  display: 'inline-block',
                }}>{row.package}</span>
              </td>
              {TASK_GROUPS.map(group => (
                <td key={group.key} style={{ border: '1px solid #ccc', padding: 8, textAlign: 'center' }}>
                  {group.fields.map((field, idx) => {
                    const status = getStatusDisplay(row[field.key]);
                    let pillClass = 'status-pill';
                    if (status.label === 'Completed') pillClass += ' completed';
                    else if (status.label === 'Pending') pillClass += ' pending';
                    else pillClass += ' not_set';
                    return (
                      <React.Fragment key={field.key}>
                        <span className={pillClass}>{status.label}</span>
                        {group.fields.length > 1 && idx < group.fields.length - 1 && <span style={{ color: '#232323', fontWeight: 700, margin: '0 2px' }}>/</span>}
                      </React.Fragment>
                    );
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination controls */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
        <span>Page {page} of {pageCount || 1}</span>
        <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount || pageCount === 0}>Next</button>
      </div>
      {selectedRow && (
        <div className="company-details-modal-overlay" onClick={e => { if (e.target.classList.contains('company-details-modal-overlay')) setSelectedRow(null); }}>
          <div className="company-details-modal">
            <div className="company-details-card">
              <div className="company-details-title">Details for {selectedRow.name}</div>
              <ul className="company-details-list">
                <li><span className="company-details-label">Package:</span> <span className="package-badge" style={{
                  background: PACKAGE_COLORS[selectedRow.package] || '#eee',
                  color: '#fff',
                  padding: '2px 18px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: '1em',
                  border: PACKAGE_BORDERS[selectedRow.package] || 'none',
                  marginRight: 2,
                  letterSpacing: '0.03em',
                  boxShadow: '0 1px 4px #ececec',
                  display: 'inline-block',
                }}>{selectedRow.package}</span></li>
                <li><span className="company-details-label">Start Date:</span> {selectedRow.start || 'N/A'}</li>
                <li><span className="company-details-label">EOC Date:</span> {selectedRow.eoc || (selectedRow.start ? getEOC(selectedRow.start) : 'N/A')}</li>
                <li><span className="company-details-label">Status:</span> <span style={{
                  color: selectedRow.status === 'Active' ? '#43a047' : selectedRow.status === 'OnHold' ? '#8e24aa' : '#232323',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}>
                  {selectedRow.status === 'Active' && <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#43a047', marginRight: 8 }} />}
                  {selectedRow.status === 'OnHold' && <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#8e24aa', marginRight: 8 }} />}
                  {selectedRow.status || 'N/A'}
                </span></li>
                <li><span className="company-details-label">ID:</span> {selectedRow.id || 'N/A'}</li>
              </ul>
              <div className="company-details-section-grid">
                <div className="company-details-grid-label">Report:</div>
                {TASK_GROUPS[0].fields.map((field, idx) => {
                  let status = getStatusDisplay(selectedRow[field.key]);
                  return (
                    <div key={field.key} className="company-details-grid-cell">
                      <span style={{ minWidth: 24 }}>{field.label}:</span>
                      <select
                        className="company-details-select"
                        value={selectedRow[field.key] || ''}
                        onChange={e => handleStatusChange(selectedRow, field.key, e.target.value)}
                      >
                        <option value="">Not set</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <span className={`company-details-status status-${(status.label || '').replace(/ /g, '_').toLowerCase()}`}>
                        <span className="status-icon">{status.icon}</span>{status.label}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: GRID_COLUMNS - TASK_GROUPS[0].fields.length }).map((_, idx) => (
                  <div key={`report-empty-${idx}`} className="company-details-grid-cell" />
                ))}
              </div>
              <div className="company-details-section-grid">
                <div className="company-details-grid-label">Link Building:</div>
                {TASK_GROUPS[1].fields.map((field, idx) => {
                  let status = getStatusDisplay(selectedRow[field.key]);
                  if (TASK_GROUPS[1].key === 'linkBuilding' && (!selectedRow[field.key] || status.label === 'Not set')) {
                    status = getStatusDisplay('pending');
                  }
                  return (
                    <div key={field.key} className="company-details-grid-cell">
                      <span style={{ minWidth: 24 }}>{field.label}:</span>
                      <select
                        className="company-details-select"
                        value={selectedRow[field.key] || ''}
                        onChange={e => handleStatusChange(selectedRow, field.key, e.target.value)}
                      >
                        <option value="">Not set</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <span className={`company-details-status status-${(status.label || '').replace(/ /g, '_').toLowerCase()}`}>
                        <span className="status-icon">{status.icon}</span>{status.label}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: GRID_COLUMNS - TASK_GROUPS[1].fields.length }).map((_, idx) => (
                  <div key={`linkbuilding-empty-${idx}`} className="company-details-grid-cell" />
                ))}
              </div>
              <div className="company-details-section-grid">
                <div className="company-details-grid-label">Site Audit:</div>
                {TASK_GROUPS[2].fields.map((field, idx) => {
                  let status = getStatusDisplay(selectedRow[field.key]);
                  return (
                    <div key={field.key} className="company-details-grid-cell">
                      <span style={{ minWidth: 24 }}>{field.label}:</span>
                      <select
                        className="company-details-select"
                        value={selectedRow[field.key] || ''}
                        onChange={e => handleStatusChange(selectedRow, field.key, e.target.value)}
                      >
                        <option value="">Not set</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <span className={`company-details-status status-${(status.label || '').replace(/ /g, '_').toLowerCase()}`}>
                        <span className="status-icon">{status.icon}</span>{status.label}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: GRID_COLUMNS - TASK_GROUPS[2].fields.length }).map((_, idx) => (
                  <div key={`siteaudit-empty-${idx}`} className="company-details-grid-cell" />
                ))}
              </div>
              <div className="company-details-section-grid">
                <div className="company-details-grid-label">Bookmarking:</div>
                {TASK_GROUPS[3].fields.map((field, idx) => {
                  let status = getStatusDisplay(selectedRow[field.key]);
                  return (
                    <div key={field.key} className="company-details-grid-cell">
                      <span style={{ minWidth: 70 }}>{field.label}:</span>
                      <select
                        className="company-details-select"
                        value={selectedRow[field.key] || ''}
                        onChange={e => handleStatusChange(selectedRow, field.key, e.target.value)}
                      >
                        <option value="">Not set</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <span className={`company-details-status status-${(status.label || '').replace(/ /g, '_').toLowerCase()}`}>
                        <span className="status-icon">{status.icon}</span>{status.label}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: GRID_COLUMNS - TASK_GROUPS[3].fields.length }).map((_, idx) => (
                  <div key={`bookmarking-empty-${idx}`} className="company-details-grid-cell" />
                ))}
              </div>
              <button className="company-details-close" onClick={() => setSelectedRow(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 