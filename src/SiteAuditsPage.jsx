import React, { useEffect, useState } from 'react';
import { getPackages, updateCompanyAuditStatus, savePackages } from './firestoreHelpers';
import { useLocation } from 'react-router-dom';

const AUDIT_STATUS_KEY = 'siteAuditStatus';
const PRE_EOC_STATUS_KEY = 'sitePreEOCStatus';

function parseDisplayDateToInput(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!match) return null;
  const [_, month, day, year] = match;
  const normalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  return new Date(`${normalizedMonth} ${day}, ${year}`);
}

function getEOC(start) {
  if (!start) return '';
  const match = start.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!match) return '';
  const [_, month, day, year] = match;
  const normalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  const date = new Date(`${normalizedMonth} ${day}, ${year}`);
  if (isNaN(date)) return '';
  date.setFullYear(date.getFullYear() + 1);
  return `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
}

function daysBetween(date1, date2) {
  const ms = 1000 * 60 * 60 * 24;
  return Math.floor((date2 - date1) / ms);
}

function getPackageClass(pkg) {
  if (pkg === 'SEO - BASIC') return 'package-basic';
  if (pkg === 'SEO - PREMIUM') return 'package-premium';
  if (pkg === 'SEO - PRO') return 'package-pro';
  if (pkg === 'SEO - ULTIMATE') return 'package-ultimate';
  return '';
}

function SiteAuditsPage() {
  const location = useLocation();
  const [companies, setCompanies] = useState([]);
  const [auditStatus, setAuditStatus] = useState({}); // { [companyId]: 'Pending' | 'Completed' }
  const [preEOCStatus, setPreEOCStatus] = useState({}); // { [companyId]: 'Pending' | 'Completed' }

  useEffect(() => {
    getPackages().then(pkgs => {
      const all = Object.values(pkgs).flat();
      setCompanies(all);
      // Build status maps from company fields
      const auditB = {};
      const auditC = {};
      all.forEach(c => {
        auditB[c.id] = c.siteAuditBStatus || 'Pending';
        auditC[c.id] = c.siteAuditCStatus || 'Pending';
      });
      setAuditStatus(auditB);
      setPreEOCStatus(auditC);
    });
  }, [location]);

  const today = new Date();

  // Table 1: Half-year since start (183 days or more, Pending only)
  const table1 = companies.filter(c => {
    if (!c.start) return false;
    const startDate = parseDisplayDateToInput(c.start);
    if (!startDate) return false;
    const daysSinceStart = daysBetween(startDate, today);
    return daysSinceStart >= 183 && (auditStatus[c.id] !== 'Completed');
  });

  // Table 2: Pre-EOC (334 days or more since start, Pending only)
  const table2 = companies.filter(c => {
    if (!c.start) return false;
    const startDate = parseDisplayDateToInput(c.start);
    if (!startDate) return false;
    const daysSinceStart = daysBetween(startDate, today);
    return daysSinceStart >= 334 && (preEOCStatus[c.id] !== 'Completed');
  });

  // Alert logic
  const showAuditBAlert = table1.length > 0;
  const showAuditCAlert = table2.length > 0;

  const handleAuditStatusChange = async (id, value) => {
    // Optimistically update local state
    setAuditStatus(prev => ({ ...prev, [id]: value }));
    // Remove from companies in UI if completed
    if (value === 'Completed') {
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, siteAuditBStatus: value } : c));
    }
    try {
      await updateCompanyAuditStatus(id, 'siteAuditBStatus', value);
      // Also update in meta/packages
      const pkgs = await getPackages();
      let updated = false;
      Object.keys(pkgs).forEach(pkg => {
        pkgs[pkg] = pkgs[pkg].map(c => {
          if (c.id === id) {
            updated = true;
            return { ...c, siteAuditBStatus: value };
          }
          return c;
        });
      });
      if (updated) await savePackages(pkgs);
      // Now reload
      const all = Object.values(pkgs).flat();
      setCompanies(all);
      const auditB = {};
      const auditC = {};
      all.forEach(c => {
        auditB[c.id] = c.siteAuditBStatus || 'Pending';
        auditC[c.id] = c.siteAuditCStatus || 'Pending';
      });
      setAuditStatus(auditB);
      setPreEOCStatus(auditC);
    } catch (err) {
      // Revert optimistic update on error
      setAuditStatus(prev => ({ ...prev, [id]: 'Pending' }));
      alert('Failed to update status. Please try again.');
    }
  };
  const handlePreEOCStatusChange = async (id, value) => {
    setPreEOCStatus(prev => ({ ...prev, [id]: value }));
    if (value === 'Completed') {
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, siteAuditCStatus: value } : c));
    }
    try {
      await updateCompanyAuditStatus(id, 'siteAuditCStatus', value);
      // Also update in meta/packages
      const pkgs = await getPackages();
      let updated = false;
      Object.keys(pkgs).forEach(pkg => {
        pkgs[pkg] = pkgs[pkg].map(c => {
          if (c.id === id) {
            updated = true;
            return { ...c, siteAuditCStatus: value };
          }
          return c;
        });
      });
      if (updated) await savePackages(pkgs);
      // Now reload
      const all = Object.values(pkgs).flat();
      setCompanies(all);
      const auditB = {};
      const auditC = {};
      all.forEach(c => {
        auditB[c.id] = c.siteAuditBStatus || 'Pending';
        auditC[c.id] = c.siteAuditCStatus || 'Pending';
      });
      setAuditStatus(auditB);
      setPreEOCStatus(auditC);
    } catch (err) {
      setPreEOCStatus(prev => ({ ...prev, [id]: 'Pending' }));
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <section className="company-tracker-page" style={{ width: '100%', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
      {/* Alerts */}
      {showAuditBAlert && (
        <div style={{
          background: '#fffbe6',
          color: '#b26a00',
          borderRadius: 12,
          padding: '1em 2em',
          fontWeight: 700,
          fontSize: '1.08em',
          border: '1.5px solid #ffe082',
          boxShadow: '0 1px 4px #fffbe6',
          marginBottom: 18,
          marginLeft: 2,
          letterSpacing: '0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{fontSize:'1.2em',marginRight:8}}>⚠️</span>
          {table1.length} package{table1.length > 1 ? 's' : ''} need Site Audit B.
        </div>
      )}
      {showAuditCAlert && (
        <div style={{
          background: '#e3f2fd',
          color: '#1976d2',
          borderRadius: 12,
          padding: '1em 2em',
          fontWeight: 700,
          fontSize: '1.08em',
          border: '1.5px solid #90caf9',
          boxShadow: '0 1px 4px #e3f2fd',
          marginBottom: 18,
          marginLeft: 2,
          letterSpacing: '0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{fontSize:'1.2em',marginRight:8}}>🔔</span>
          {table2.length} package{table2.length > 1 ? 's' : ''} need Site Audit C.
        </div>
      )}
      <h1 className="fancy-title" style={{ textAlign: 'center', marginBottom: 10, marginTop: 0 }}>Site Audits</h1>
      <p className="hero-desc" style={{ textAlign: 'center', marginBottom: 18, marginTop: 0 }}>Companies are automatically sorted into the tables below based on their package start and EOC dates.</p>
      <div
        className="site-audits-table-row"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '2vw',
          width: '100%',
          maxWidth: 1600,
          margin: '0 auto',
          padding: '0.5vw 0 2vw 0',
          boxSizing: 'border-box',
          background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
          borderRadius: 24,
          boxShadow: '0 2px 24px #ececec',
        }}
      >
        {/* Table 1 */}
        <div
          style={{
            flex: '0 1 48%',
            width: '48%',
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 2px 16px #ececec',
            padding: '2em 1.5em',
            margin: 0,
            minWidth: 0,
            overflowX: 'auto',
          }}
        >
          <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.3em', marginBottom: 18, letterSpacing: '0.04em', color: '#b26a00' }}>Site Audit B</h2>
          <table className="company-table report-table" style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', background: 'rgba(255,255,255,0.98)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px #ececec' }}>
            <thead>
              <tr style={{ background: '#f7f6f2' }}>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Company Name</th>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Package</th>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Start Date</th>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Days Since Start</th>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {table1.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies for half-year audit today.</td></tr>
              ) : table1.map(c => {
                const startDate = parseDisplayDateToInput(c.start);
                const daysSinceStart = startDate ? daysBetween(startDate, today) : 0;
                return (
                  <tr key={c.id} style={{ transition: 'background 0.18s' }}>
                    <td style={{ padding: '0.7em', textAlign: 'center', fontWeight: 700, background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #b26a00', letterSpacing: '0.02em', borderRadius: 8 }}>{c.name}</td>
                    <td style={{ padding: '0.7em', textAlign: 'center' }}>
                      <span className={getPackageClass(c.package)}>{c.package}</span>
                    </td>
                    <td style={{ padding: '0.7em', textAlign: 'center' }}>{c.start}</td>
                    <td style={{ padding: '0.7em', textAlign: 'center', fontWeight: 600, color: '#b26a00' }}>{daysSinceStart}</td>
                    <td style={{ padding: '0.7em', textAlign: 'center' }}>
                      <select value={auditStatus[c.id] || 'Pending'} onChange={e => handleAuditStatusChange(c.id, e.target.value)} style={{ padding: '0.3em 1em', borderRadius: 8, fontWeight: 600, background: auditStatus[c.id] === 'Completed' ? '#eaffea' : '#ffeaea', color: auditStatus[c.id] === 'Completed' ? '#19744d' : '#c00', border: '1.5px solid #b6b6d8', minWidth: 120, boxShadow: '0 1px 4px #ececec', transition: 'background 0.18s, color 0.18s' }}>
                        <option value="Pending">🔴 Pending</option>
                        <option value="Completed">🟢 Completed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Table 2 */}
        <div
          style={{
            flex: '0 1 48%',
            width: '48%',
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 2px 16px #ececec',
            padding: '2em 1.5em',
            margin: 0,
            minWidth: 0,
            overflowX: 'auto',
          }}
        >
          <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.3em', marginBottom: 18, letterSpacing: '0.04em', color: '#1976d2' }}>Site Audit C</h2>
          <table className="company-table report-table" style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', background: 'rgba(255,255,255,0.98)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px #ececec' }}>
            <thead>
              <tr style={{ background: '#f7f6f2' }}>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Company Name</th>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Package</th>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Start Date</th>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Days Since Start</th>
                <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {table2.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies for pre-EOC audit today.</td></tr>
              ) : table2.map(c => {
                const startDate = parseDisplayDateToInput(c.start);
                const daysSinceStart = startDate ? daysBetween(startDate, today) : 0;
                return (
                  <tr key={c.id} style={{ transition: 'background 0.18s' }}>
                    <td style={{ padding: '0.7em', textAlign: 'center', fontWeight: 700, background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #1976d2', letterSpacing: '0.02em', borderRadius: 8 }}>{c.name}</td>
                    <td style={{ padding: '0.7em', textAlign: 'center' }}>
                      <span className={getPackageClass(c.package)}>{c.package}</span>
                    </td>
                    <td style={{ padding: '0.7em', textAlign: 'center' }}>{c.start}</td>
                    <td style={{ padding: '0.7em', textAlign: 'center', fontWeight: 600, color: '#1976d2' }}>{daysSinceStart}</td>
                    <td style={{ padding: '0.7em', textAlign: 'center' }}>
                      <select value={preEOCStatus[c.id] || 'Pending'} onChange={e => handlePreEOCStatusChange(c.id, e.target.value)} style={{ padding: '0.3em 1em', borderRadius: 8, fontWeight: 600, background: preEOCStatus[c.id] === 'Completed' ? '#eaffea' : '#ffeaea', color: preEOCStatus[c.id] === 'Completed' ? '#19744d' : '#c00', border: '1.5px solid #b6b6d8', minWidth: 120, boxShadow: '0 1px 4px #ececec', transition: 'background 0.18s, color 0.18s' }}>
                        <option value="Pending">🔴 Pending</option>
                        <option value="Completed">🟢 Completed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default SiteAuditsPage; 