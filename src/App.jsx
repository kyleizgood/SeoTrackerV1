import { useState, useEffect, useRef } from 'react';
import './App.css'
import Sidebar from './Sidebar';
import TemplateManager from './TemplateManager';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DApaChecker from './DApaChecker';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Tickets from './Tickets';
import LinkBuildings from './LinkBuildings';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthPage from './AuthPage';
import Login from './Login';
import Register from './Register';
import { getCompanies, saveCompany, deleteCompany } from './firestoreHelpers';
import { getPackages, savePackages, getTrash, saveTrash, getTemplates, saveTemplate, deleteTemplate, getTickets, saveTicket, deleteTicket } from './firestoreHelpers';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from './firebase';

function HomeHero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <h1 className="fancy-title">Welcome to Your Personal Tracker</h1>
      <p className="hero-desc">Customize this space for your daily routine, notes, or anything you want!</p>
      <button className="hero-cta" onClick={() => navigate('/company-tracker')}>Go to Company Tracker</button>
    </section>
  );
}

const ALL_PACKAGES = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);

function getEOC(start) {
  // start: e.g. 'February 4, 2017'
  if (!start) return '';
  const match = start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
  if (!match) return '';
  const [_, month, day, year] = match;
  const date = new Date(`${month} ${day}, ${year}`);
  if (isNaN(date)) return '';
  date.setFullYear(date.getFullYear() + 1);
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function CompanyTracker({ editCompany, setEditData, editData, clearEdit, packages, setPackages }) {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    name: '',
    startDate: null,
    status: 'Active',
  });
  const [editId, setEditId] = useState(null);
  const [showAddToPackage, setShowAddToPackage] = useState(null); // company id

  // Load companies from Firestore on mount
  useEffect(() => {
    getCompanies().then(setCompanies);
  }, []);

  // If editData is provided (from package page), load it into the form
  useEffect(() => {
    if (editData) {
      setEditId(editData.id);
      let startDate = null;
      if (editData.start) {
        const match = editData.start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
        if (match) {
          startDate = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
        }
      }
      setForm({
        name: editData.name,
        startDate,
        status: editData.status,
      });
      if (clearEdit) clearEdit();
    }
    // eslint-disable-next-line
  }, [editData]);

  useEffect(() => {
    getCompanies().then(setCompanies);
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = date => {
    setForm({ ...form, startDate: date });
  };

  const updatePackages = (updatedCompany) => {
    getPackages().then(packages => {
      const saved = packages ? JSON.stringify(packages) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
      Object.keys(packages).forEach(pkg => {
        packages[pkg] = packages[pkg].map(c => c.id === updatedCompany.id ? updatedCompany : c);
      });
      savePackages(packages);
    });
  };

  const handleAddOrEdit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate) return;
    const start = form.startDate ? `${months[form.startDate.getMonth()]} ${form.startDate.getDate()}, ${form.startDate.getFullYear()}` : '';
    if (editId) {
      const updated = { ...form, start, id: editId };
      await saveCompany(updated);
      setCompanies(await getCompanies());
      setEditId(null);
    } else {
      const newCompany = { ...form, start, id: Date.now() };
      await saveCompany(newCompany);
      setCompanies(await getCompanies());
    }
    setForm({ name: '', startDate: null, status: 'Active' });
  };

  const handleDelete = async id => {
    await deleteCompany(id);
    setCompanies(await getCompanies());
    if (editId === id) {
      setEditId(null);
      setForm({ name: '', startDate: null, status: 'Active' });
    }
    // Remove from all package pages
    getPackages().then(packages => {
      const saved = packages ? JSON.stringify(packages) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
      Object.keys(packages).forEach(pkg => {
        packages[pkg] = packages[pkg].filter(c => c.id !== id);
      });
      savePackages(packages);
    });
  };

  const handleEdit = c => {
    setEditId(c.id);
    let startDate = null;
    if (c.start) {
      const match = c.start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
      if (match) {
        startDate = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
      }
    }
    setForm({
      name: c.name,
      startDate,
      status: c.status,
    });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm({ name: '', startDate: null, status: 'Active' });
  };

  // Add to package pages
  const handleAddToPackage = (company, pkg) => {
    // Remove from CompanyTracker (Firestore and local state)
    deleteCompany(company.id).then(() => {
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      // Add to package
      const updatedPackages = { ...packages };
      if (!updatedPackages[pkg]) updatedPackages[pkg] = [];
      if (!updatedPackages[pkg].some(c => c.id === company.id)) {
        updatedPackages[pkg].push({
          ...company,
          package: pkg,
          tasks: {
            forVSO: 'Pending',
            forRevision: 'Pending',
            ra: 'Pending',
            distribution: 'Pending',
            businessProfileClaiming: 'Ticket',
          },
          reportI: 'Pending',
          reportII: 'Pending',
          bmCreation: 'Pending',
          bmSubmission: 'Pending',
        });
        savePackages(updatedPackages).then(() => {
          setPackages(updatedPackages);
        });
      }
      setShowAddToPackage(null);
    });
  };

  return (
    <section className="company-tracker-page">
      <h1 className="fancy-title">Company Tracker</h1>
      <p className="hero-desc">Add and manage your company names here.</p>
      <form className="company-form" onSubmit={handleAddOrEdit}>
        <input
          name="name"
          type="text"
          placeholder="Company Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <DatePicker
          selected={form.startDate}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          placeholderText="Start Date"
          className="company-form-datepicker"
          required
          style={{ fontSize: '1.1rem', width: '100%' }}
        />
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="OnHold">OnHold</option>
        </select>
        <button type="submit">{editId ? 'Update' : 'Add'}</button>
        {editId && <button type="button" onClick={handleCancel} style={{background:'#eee',color:'#232323',marginLeft:8}}>Cancel</button>}
      </form>
      <div className="table-scroll-container table-responsive">
        <table className="company-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Start Date</th>
              <th>EOC</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies yet.</td></tr>
            )}
            {companies.map(c => (
              <tr key={c.id} style={{ position: 'relative' }}>
                <td className="company-name">{c.name}</td>
                <td>{c.start}</td>
                <td>{getEOC(c.start)}</td>
                <td>
                  <select
                    className={`status-select ${c.status === 'Active' ? 'status-active' : 'status-onhold'}`}
                    value={c.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      getPackages().then(packages => {
                        const updatedCompanies = (packages[pkg] || []).map(row =>
                          row.id === c.id ? { ...row, status: newStatus } : row
                        );
                        packages[pkg] = updatedCompanies;
                        savePackages(packages);
                        setCompanies(updatedCompanies);
                      });
                    }}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="OnHold">🟣 OnHold</option>
                  </select>
                </td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(c.id)}>Delete</button>
                  <button className="delete-btn" style={{marginLeft:8,background:'#e0eaff',color:'#232323'}} onClick={() => handleEdit(c)}>Edit</button>
                  <button className="delete-btn" style={{marginLeft:8,background:'#eaffea',color:'#232323'}} onClick={() => setShowAddToPackage(c.id)}>Add</button>
                  {showAddToPackage === c.id && (
                    <div style={{
                      position: 'absolute',
                      bottom: '48px',
                      right: 0,
                      left: 'auto',
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 8,
                      padding: 8,
                      boxShadow: '0 2px 8px #ececec',
                      zIndex: 2000,
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                      minWidth: 420,
                      justifyContent: 'flex-end',
                    }}>
                      <div style={{marginRight: 8, fontWeight: 600}}>Add to package:</div>
                      <button style={{margin:2}} className="package-basic" onClick={() => handleAddToPackage(c, 'SEO - BASIC')}>SEO - BASIC</button>
                      <button style={{margin:2}} className="package-premium" onClick={() => handleAddToPackage(c, 'SEO - PREMIUM')}>SEO - PREMIUM</button>
                      <button style={{margin:2}} className="package-pro" onClick={() => handleAddToPackage(c, 'SEO - PRO')}>SEO - PRO</button>
                      <button style={{margin:2}} className="package-ultimate" onClick={() => handleAddToPackage(c, 'SEO - ULTIMATE')}>SEO - ULTIMATE</button>
                      <button style={{margin:2,background:'#ffeaea',color:'#c00',borderRadius:8}} onClick={() => setShowAddToPackage(null)}>Cancel</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function parseDisplayDateToInput(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\w+) (\d{1,2}), (\d{4})$/);
  if (!match) return null;
  const [_, month, day, year] = match;
  return new Date(`${month} ${day}, ${year}`);
}

function formatDateToDisplay(dateObj) {
  if (!dateObj) return '';
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
}

function PackagePage({ pkg, packages, setPackages }) {
  const [companies, setCompanies] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState(null);
  const [editEOC, setEditEOC] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVSO, setFilterVSO] = useState('');
  const [filterRevision, setFilterRevision] = useState('');
  const [filterRA, setFilterRA] = useState('');
  const [filterDistribution, setFilterDistribution] = useState('');
  const [filterBusinessProfileClaiming, setFilterBusinessProfileClaiming] = useState('');
  const navigate = useNavigate();

  // Task columns
  const taskKeys = [
    'forVSO',
    'forRevision',
    'ra',
    'distribution',
    'businessProfileClaiming',
  ];
  const taskLabels = [
    'FOR VSO',
    'FOR REVISION',
    'R/A',
    'Distribution',
    'Business Profile Claiming',
  ];
  const taskOptions = [
    { value: 'Pending', label: '🔴 Pending' },
    { value: 'Completed', label: '🟢 Completed' },
  ];
  const businessProfileClaimingOptions = [
    { value: 'Ticket', label: '🔴 Ticket' },
    { value: 'Completed', label: '🟢 Completed' },
  ];

  // Load companies from Firestore and ensure tasks are initialized
  useEffect(() => {
    getPackages().then(packages => {
      let pkgCompanies = (packages[pkg] || []).map(c => ({
        ...c,
        tasks: {
          forVSO: c.tasks?.forVSO || 'Pending',
          forRevision: c.tasks?.forRevision || 'Pending',
          ra: c.tasks?.ra || 'Pending',
          distribution: c.tasks?.distribution || 'Pending',
          businessProfileClaiming: c.tasks?.businessProfileClaiming === 'Pending' || !c.tasks?.businessProfileClaiming ? 'Ticket' : c.tasks?.businessProfileClaiming,
        },
      }));
      setCompanies(pkgCompanies);
      // Save back if any tasks were missing or changed
      if (pkgCompanies.some((c, i) => JSON.stringify(c.tasks) !== JSON.stringify((packages[pkg][i]||{}).tasks))) {
        packages[pkg] = pkgCompanies;
        savePackages(packages);
      }
    });
  }, [pkg]);

  // Handle dropdown change
  const handleTaskChange = (companyId, taskKey, value) => {
    getPackages().then(packages => {
      let pkgCompanies = (packages[pkg] || []).map(c => {
        if (c.id === companyId) {
          return {
            ...c,
            tasks: { ...c.tasks, [taskKey]: value },
          };
        }
        return c;
      });
      packages[pkg] = pkgCompanies;
      savePackages(packages);
      setCompanies(pkgCompanies);
    });
  };

  const handleEdit = (company) => {
    setEditId(company.id);
    setEditName(company.name);
    setEditStart(parseDisplayDateToInput(company.start));
    setEditEOC(parseDisplayDateToInput(company.eoc || getEOC(company.start)));
  };

  const handleEditSave = (company) => {
    getPackages().then(packages => {
      const updatedCompanies = (packages[pkg] || []).map(c =>
        c.id === company.id ? {
          ...c,
          name: editName,
          start: formatDateToDisplay(editStart),
          eoc: formatDateToDisplay(editEOC),
        } : c
      );
      packages[pkg] = updatedCompanies;
      savePackages(packages);
      setCompanies(updatedCompanies);
      setEditId(null);
      setEditName('');
      setEditStart(null);
      setEditEOC(null);
    });
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditName('');
    setEditStart(null);
    setEditEOC(null);
  };

  const handleRemove = (company) => {
    setConfirmRemoveId(company.id);
  };
  const handleRemoveConfirm = () => {
    // Use confirmRemoveId to find the company to remove
    getPackages().then(packages => {
      const companyToRemove = (packages[pkg] || []).find(c => c.id === confirmRemoveId);
      const updatedCompanies = (packages[pkg] || []).filter(c => c.id !== confirmRemoveId);
      packages[pkg] = updatedCompanies;
      savePackages(packages);
      setCompanies(updatedCompanies);
      // Add to trash
      if (companyToRemove) {
        getTrash().then(trash => {
          trash.push({ ...companyToRemove, originalPackage: pkg });
          saveTrash(trash);
        });
      }
      setConfirmRemoveId(null);
    });
  };
  const handleRemoveCancel = () => {
    setConfirmRemoveId(null);
  };

  // Filter companies by search and dropdowns
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || c.status === filterStatus;
    const matchesVSO = !filterVSO || (c.tasks?.forVSO || 'Pending') === filterVSO;
    const matchesRevision = !filterRevision || (c.tasks?.forRevision || 'Pending') === filterRevision;
    const matchesRA = !filterRA || (c.tasks?.ra || 'Pending') === filterRA;
    const matchesDistribution = !filterDistribution || (c.tasks?.distribution || 'Pending') === filterDistribution;
    let matchesBusinessProfileClaiming;
    if (!filterBusinessProfileClaiming) {
      matchesBusinessProfileClaiming = true;
    } else if (filterBusinessProfileClaiming === 'Ticket') {
      matchesBusinessProfileClaiming = c.tasks?.businessProfileClaiming === 'Ticket' || c.tasks?.businessProfileClaiming === 'Pending';
    } else {
      matchesBusinessProfileClaiming = c.tasks?.businessProfileClaiming === filterBusinessProfileClaiming;
    }
    return matchesSearch && matchesStatus && matchesVSO && matchesRevision && matchesRA && matchesDistribution && matchesBusinessProfileClaiming;
  });

  return (
    <section className="company-tracker-page">
      <h2 className="fancy-subtitle">{pkg} Companies</h2>
      <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filteredCompanies.length}</div>
      <div className="table-scroll-container table-responsive">
        <table className="company-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>SEO Package</th>
              <th>Start Date</th>
              <th>EOC</th>
              <th>Status
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ marginTop: 4, width: '100%', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '0.95rem', background: '#faf9f6', color: '#232323' }}
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="OnHold">OnHold</option>
                </select>
              </th>
              {taskLabels.map((label, i) => (
                <th key={label} style={{ minWidth: label === 'Business Profile Claiming' ? 180 : 140 }}>
                  {label}
                  <select
                    value={
                      i === 0 ? filterVSO :
                      i === 1 ? filterRevision :
                      i === 2 ? filterRA :
                      i === 3 ? filterDistribution :
                      i === 4 ? filterBusinessProfileClaiming :
                      ''
                    }
                    onChange={e => {
                      if (i === 0) setFilterVSO(e.target.value);
                      else if (i === 1) setFilterRevision(e.target.value);
                      else if (i === 2) setFilterRA(e.target.value);
                      else if (i === 3) setFilterDistribution(e.target.value);
                      else if (i === 4) setFilterBusinessProfileClaiming(e.target.value);
                    }}
                    style={{ marginTop: 4, width: '100%', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '0.95rem', background: '#faf9f6', color: '#232323' }}
                  >
                    <option value="">All</option>
                    {label === 'Business Profile Claiming' ? (
                      <>
                        <option value="Ticket">🔴 Ticket</option>
                        <option value="Completed">🟢 Completed</option>
                      </>
                    ) : (
                      <>
                        <option value="Pending">🔴 Pending</option>
                        <option value="Completed">🟢 Completed</option>
                      </>
                    )}
                  </select>
                </th>
              ))}
              <th className="package-search-th">
                <input
                  type="text"
                  className="package-search-input"
                  placeholder="Search company..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 && (
              <tr>
                <td className="no-companies" colSpan={6 + taskLabels.length + 2}>No companies found.</td>
              </tr>
            )}
            {filteredCompanies.map(c => (
              <tr key={c.id}>
                <td className="company-name">
                  {editId === c.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{ padding: '0.5em 1em', borderRadius: 8, border: '1.5px solid #b6b6d8', fontSize: '1rem', minWidth: 120 }}
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td>
                  <span className={
                    c.package === 'SEO - BASIC' ? 'package-basic' :
                    c.package === 'SEO - PREMIUM' ? 'package-premium' :
                    c.package === 'SEO - PRO' ? 'package-pro' :
                    c.package === 'SEO - ULTIMATE' ? 'package-ultimate' : ''
                  }>
                    {c.package}
                  </span>
                </td>
                <td>
                  {editId === c.id ? (
                    <DatePicker
                      selected={editStart}
                      onChange={date => setEditStart(date)}
                      dateFormat="MMMM d, yyyy"
                      className="react-datepicker__input"
                      popperPlacement="bottom"
                      placeholderText="Select start date"
                      style={{ padding: '0.5em 1em', borderRadius: 8, border: '1.5px solid #b6b6d8', fontSize: '1rem', minWidth: 120 }}
                    />
                  ) : (
                    c.start
                  )}
                </td>
                <td>
                  {editId === c.id ? (
                    <DatePicker
                      selected={editEOC}
                      onChange={date => setEditEOC(date)}
                      dateFormat="MMMM d, yyyy"
                      className="react-datepicker__input"
                      popperPlacement="bottom"
                      placeholderText="Select EOC date"
                      style={{ padding: '0.5em 1em', borderRadius: 8, border: '1.5px solid #b6b6d8', fontSize: '1rem', minWidth: 120 }}
                    />
                  ) : (
                    c.eoc || getEOC(c.start)
                  )}
                </td>
                <td>
                  <select
                    className={`status-select ${c.status === 'Active' ? 'status-active' : 'status-onhold'}`}
                    value={c.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      // Update in localStorage and state
                      getPackages().then(packages => {
                        const updatedCompanies = (packages[pkg] || []).map(row =>
                          row.id === c.id ? { ...row, status: newStatus } : row
                        );
                        packages[pkg] = updatedCompanies;
                        savePackages(packages);
                        setCompanies(updatedCompanies);
                      });
                    }}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="OnHold">🟣 OnHold</option>
                  </select>
                </td>
                {taskKeys.map((key, i) => (
                  <td key={key} style={{ minWidth: key === 'businessProfileClaiming' ? 180 : 140 }}>
                    <select
                      value={c.tasks?.[key] || (key === 'businessProfileClaiming' ? 'Ticket' : 'Pending')}
                      onChange={e => handleTaskChange(c.id, key, e.target.value)}
                      style={{ minWidth: 120 }}
                    >
                      {(key === 'businessProfileClaiming' ? businessProfileClaimingOptions : taskOptions).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                ))}
                <td>
                  <div className="action-btns">
                    {editId === c.id ? (
                      <>
                        <button className="hero-cta save" onClick={() => handleEditSave(c)}>Save</button>
                        <button className="delete-btn" style={{background:'#eee',color:'#232323'}} onClick={handleEditCancel}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="delete-btn edit-btn" onClick={() => handleEdit(c)}>Edit</button>
                        <button className="remove-btn" onClick={() => handleRemove(c)}>X</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirmRemoveId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Are you sure you want to remove this company?</div>
            <div className="confirm-desc">It will be moved to Trash.</div>
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

function Report({ packages, setPackages }) {
  // Store filters for each package in an object
  const [filterI, setFilterI] = useState({});
  const [filterII, setFilterII] = useState({});
  // Add search state for each package
  const [search, setSearch] = useState({});
  const [confirmRemove, setConfirmRemove] = useState({ pkg: null, companyId: null, companyName: '' });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  useEffect(() => {
    getPackages().then(setPackages);
    // Monthly reset logic
    const today = new Date();
    const firstOfMonth = today.getDate() === 1;
    const thisMonth = today.getFullYear() + '-' + (today.getMonth() + 1);
    const lastReset = localStorage.getItem('report-last-reset');
    if (firstOfMonth && lastReset !== thisMonth) {
      // Reset all reportI and reportII to 'Pending'
      getPackages().then(pkgs => {
        Object.keys(pkgs).forEach(pkg => {
          pkgs[pkg] = (pkgs[pkg] || []).map(c => ({ ...c, reportI: 'Pending', reportII: 'Pending' }));
        });
        savePackages(pkgs);
        setPackages(pkgs);
        localStorage.setItem('report-last-reset', thisMonth);
      });
    }
  }, []);

  const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

  // Helper to update report status in localStorage
  const handleReportStatusChange = (pkg, companyId, reportKey, value) => {
    getPackages().then(packages => {
      packages[pkg] = (packages[pkg] || []).map(c =>
        c.id === companyId ? { ...c, [reportKey]: value } : c
      );
      savePackages(packages);
      setPackages(packages);
    });
  };

  // Helper for dropdown color
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

  // Handlers for per-package filters
  const handleFilterI = (pkg, value) => setFilterI(f => ({ ...f, [pkg]: value }));
  const handleFilterII = (pkg, value) => setFilterII(f => ({ ...f, [pkg]: value }));

  // Remove company from package in Report page
  const handleRemoveFromReport = (pkg, companyId, companyName) => {
    setConfirmRemove({ pkg, companyId, companyName });
  };
  const handleRemoveConfirm = () => {
    const { pkg, companyId } = confirmRemove;
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    // Find the company to remove
    const companyToRemove = (packages[pkg] || []).find(c => c.id === companyId);
    // Remove from package
    packages[pkg] = (packages[pkg] || []).filter(c => c.id !== companyId);
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
    setPackages(packages);
    // Add to trash if found
    if (companyToRemove) {
      const trash = JSON.parse(localStorage.getItem(TRASH_KEY) || '[]');
      trash.push({ ...companyToRemove, originalPackage: pkg });
      localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    }
    setConfirmRemove({ pkg: null, companyId: null, companyName: '' });
  };
  const handleRemoveCancel = () => setConfirmRemove({ pkg: null, companyId: null, companyName: '' });

  return (
    <section className="company-tracker-page" style={{paddingTop: 12}}>
      <h1 className="fancy-title">Report for {currentMonth}</h1>
      <p className="hero-desc" style={{marginBottom: 10}}>All companies, sorted by SEO package.</p>
      {packageNames.map(pkg => {
        // Filter companies by report status for this package
        const filtered = (packages[pkg] || [])
          .filter(c => c.status !== 'OnHold')
          .filter(c => {
            const matchI = !filterI[pkg] || (c.reportI || 'Pending') === filterI[pkg];
            const matchII = !filterII[pkg] || (c.reportII || 'Pending') === filterII[pkg];
            const matchSearch = !search[pkg] || c.name.toLowerCase().includes(search[pkg].toLowerCase());
            return matchI && matchII && matchSearch;
          });
        // Count companies with Report I not completed (excluding OnHold)
        const pendingReportICount = (packages[pkg] || []).filter(c => c.status !== 'OnHold' && c.reportI !== 'Completed').length;
        return (
          <div key={pkg} style={{ marginBottom: 32, width: '100%' }}>
            {pendingReportICount > 0 && (
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
                {pendingReportICount} compan{pendingReportICount === 1 ? 'y' : 'ies'} under the {pkg.replace('SEO - ', '').toUpperCase()} SEO package are still pending for Report I this month.
              </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 0}}>
              <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filtered.length}</div>
              <h2 className="fancy-subtitle">{pkg}</h2>
              <input
                type="text"
                className="package-search-input"
                style={{ minWidth: 180, marginLeft: 16, marginBottom: 0, fontSize: '1em' }}
                placeholder={`Search company...`}
                value={search[pkg] || ''}
                onChange={e => setSearch(s => ({ ...s, [pkg]: e.target.value }))}
              />
            </div>
            <div className="table-scroll-container table-responsive" style={{
              marginBottom: 0, height: 'auto', width: '100%'}}>
              <table className="company-table report-table" style={{marginBottom: 0, width: '100%', tableLayout: 'fixed'}}>
                <thead>
                  <tr>
                    <th className="company-col">Company Name</th>
                    <th className="package-col">SEO Package</th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>Report I</span>
                        <select
                          value={filterI[pkg] || ''}
                          onChange={e => handleFilterI(pkg, e.target.value)}
                          style={{ borderRadius: 8, padding: '0.2em 0.7em', fontSize: '0.98em', marginTop: 2, border: '1.5px solid #b6b6d8', background:'#fff', color:'#232323', fontWeight:600 }}
                        >
                          <option value="">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>Report II</span>
                        <select
                          value={filterII[pkg] || ''}
                          onChange={e => handleFilterII(pkg, e.target.value)}
                          style={{ borderRadius: 8, padding: '0.2em 0.7em', fontSize: '0.98em', marginTop: 2, border: '1.5px solid #b6b6d8', background:'#fff', color:'#232323', fontWeight:600 }}
                        >
                          <option value="">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col" style={{minWidth:120}}>Start Date</th>
                    <th className="report-col" style={{minWidth:60}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa' }}>No companies in this package.</td></tr>
                  )}
                  {filtered.slice(0, 15).map(c => {
                    // Parse start date
                    let readyForReportII = false;
                    let startDateObj = null;
                    if (c.start) {
                      const match = c.start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
                      if (match) {
                        const [_, month, day, year] = match;
                        startDateObj = new Date(`${month} ${day}, ${year}`);
                        const now = new Date();
                        if (startDateObj && !isNaN(startDateObj)) {
                          const diff = Math.floor((now - startDateObj) / (1000 * 60 * 60 * 24));
                          readyForReportII = diff >= 16 && c.reportII !== 'Completed';
                        }
                      }
                    }
                    return (
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
                          <select
                            value={c.reportI || 'Pending'}
                            onChange={e => handleReportStatusChange(pkg, c.id, 'reportI', e.target.value)}
                            style={getDropdownStyle(c.reportI || 'Pending')}
                          >
                            <option value="Pending">🔴 Pending</option>
                            <option value="Completed">🟢 Completed</option>
                          </select>
                        </td>
                        <td className="report-col">
                          {c.reportII === 'Completed' ? (
                            <span style={{
                              display: 'inline-block',
                              background: '#4caf50',
                              color: '#fff',
                              borderRadius: 8,
                              padding: '0.3em 1.2em',
                              fontWeight: 700,
                              fontSize: '1em',
                              letterSpacing: '0.03em',
                              boxShadow: '0 1px 4px #e0ffe0',
                            }}>Completed</span>
                          ) : (
                            <select
                              value={c.reportII || 'Pending'}
                              onChange={e => handleReportStatusChange(pkg, c.id, 'reportII', e.target.value)}
                              style={getDropdownStyle(c.reportII || 'Pending')}
                            >
                              <option value="Pending">🔴 Pending</option>
                              <option value="Completed">🟢 Completed</option>
                            </select>
                          )}
                        </td>
                        <td className="report-col" style={{textAlign:'center', fontWeight:500, fontSize:'1em'}}>
                          {c.start || '-'}
                          {readyForReportII && (
                            <span style={{
                              display: 'inline-block',
                              marginLeft: 8,
                              background: '#fffbe6',
                              color: '#b26a00',
                              borderRadius: 8,
                              padding: '0.2em 0.9em',
                              fontWeight: 700,
                              fontSize: '0.98em',
                              border: '1.5px solid #ffe082',
                              boxShadow: '0 1px 4px #fffbe6',
                              verticalAlign: 'middle',
                            }}>Ready for Report II</span>
                          )}
                        </td>
                        <td className="report-col" style={{textAlign:'center'}}>
                          <button
                            className="remove-btn"
                            style={{ background: '#ffeaea', color: '#c00', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1.2em', cursor: 'pointer', padding: '0.2em 0.8em', marginLeft: 4 }}
                            title="Remove company from report"
                            onClick={() => handleRemoveFromReport(pkg, c.id, c.name)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length > 15 && filtered.slice(15).map((c, i) => (
                    <tr key={c.id} style={{display:'none'}}></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {/* Confirmation Modal for Remove in Report page */}
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

function Bookmarking({ packages, setPackages }) {
  // Store filters for each package in an object
  const [filterCreation, setFilterCreation] = useState({});
  const [filterSubmission, setFilterSubmission] = useState({});
  // Add search state for each package
  const [search, setSearch] = useState({});
  const [confirmRemove, setConfirmRemove] = useState({ pkg: null, companyId: null, companyName: '' });
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];
  const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

  // Helper to update BM status in shared state
  const handleBMStatusChange = (pkg, companyId, bmKey, value) => {
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c =>
      c.id === companyId ? { ...c, [bmKey]: value } : c
    );
    setPackages(updatedPackages);
  };

  // Handlers for per-package filters
  const handleFilterCreation = (pkg, value) => setFilterCreation(f => ({ ...f, [pkg]: value }));
  const handleFilterSubmission = (pkg, value) => setFilterSubmission(f => ({ ...f, [pkg]: value }));

  // Remove company from package in Bookmarking page
  const handleRemoveFromBM = (pkg, companyId, companyName) => {
    setConfirmRemove({ pkg, companyId, companyName });
  };

  const handleRemoveConfirm = () => {
    const { pkg, companyId } = confirmRemove;
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).filter(c => c.id !== companyId);
    setPackages(updatedPackages);
    setConfirmRemove({ pkg: null, companyId: null, companyName: '' });
    setShowDeleteToast(true);
    setTimeout(() => setShowDeleteToast(false), 1800);
  };
  const handleRemoveCancel = () => setConfirmRemove({ pkg: null, companyId: null, companyName: '' });

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

  return (
    <section className="company-tracker-page" style={{paddingTop: 12}}>
      <h1 className="fancy-title">Bookmarking for {currentMonth}</h1>
      <p className="hero-desc" style={{marginBottom: 10}}>All companies, sorted by SEO package.</p>
      {packageNames.map(pkg => {
        // Filter companies by BM status for this package
        const filtered = (packages[pkg] || [])
          .filter(c => c.status !== 'OnHold')
          .filter(c => {
            const matchCreation = !filterCreation[pkg] || (c.bmCreation || 'Pending') === filterCreation[pkg];
            const matchSubmission = !filterSubmission[pkg] || (c.bmSubmission || 'Pending') === filterSubmission[pkg];
            const matchSearch = !search[pkg] || c.name.toLowerCase().includes(search[pkg].toLowerCase());
            return matchCreation && matchSubmission && matchSearch;
          });
        // Count companies with BM Creation not completed (excluding OnHold)
        const pendingBMCreationCount = (packages[pkg] || []).filter(c => c.status !== 'OnHold' && c.bmCreation !== 'Completed').length;
        return (
          <div key={pkg} style={{ marginBottom: 32, width: '100%' }}>
            {pendingBMCreationCount > 0 && (
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
                {pendingBMCreationCount} compan{pendingBMCreationCount === 1 ? 'y' : 'ies'} under the {pkg.replace('SEO - ', '').toUpperCase()} SEO package are still pending for BM Submission this month.
              </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 0}}>
              <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filtered.length}</div>
              <h2 className="fancy-subtitle">{pkg}</h2>
              <input
                type="text"
                className="package-search-input"
                style={{ minWidth: 180, marginLeft: 16, marginBottom: 0, fontSize: '1em' }}
                placeholder={`Search company...`}
                value={search[pkg] || ''}
                onChange={e => setSearch(s => ({ ...s, [pkg]: e.target.value }))}
              />
            </div>
            <div className="table-scroll-container table-responsive" style={{marginBottom: 0, height: 'auto', width: '100%'}}>
              <table className="company-table report-table" style={{marginBottom: 0, width: '100%', tableLayout: 'fixed'}}>
                <thead>
                  <tr>
                    <th className="company-col">Company Name</th>
                    <th className="package-col">SEO Package</th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>BM Submission</span>
                        <select
                          value={filterSubmission[pkg] || ''}
                          onChange={e => handleFilterSubmission(pkg, e.target.value)}
                          style={getDropdownStyle(filterSubmission[pkg] || 'Pending')}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>BM Creation</span>
                        <select
                          value={filterCreation[pkg] || ''}
                          onChange={e => handleFilterCreation(pkg, e.target.value)}
                          style={getDropdownStyle(filterCreation[pkg] || 'Pending')}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col" style={{minWidth:120}}>Start Date</th>
                    <th className="report-col" style={{minWidth:60}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa' }}>No companies in this package.</td></tr>
                  )}
                  {filtered.slice(0, 15).map(c => (
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
                        <select
                          value={c.bmSubmission || 'Pending'}
                          onChange={e => handleBMStatusChange(pkg, c.id, 'bmSubmission', e.target.value)}
                          style={getDropdownStyle(c.bmSubmission || 'Pending')}
                        >
                          <option value="Pending">🔴 Pending</option>
                          <option value="Completed">🟢 Completed</option>
                        </select>
                      </td>
                      <td className="report-col">
                        {c.bmCreation === 'Completed' ? (
                          <span style={{
                            display: 'inline-block',
                            background: '#4caf50',
                            color: '#fff',
                            borderRadius: 8,
                            padding: '0.3em 1.2em',
                            fontWeight: 700,
                            fontSize: '1em',
                            letterSpacing: '0.03em',
                            boxShadow: '0 1px 4px #e0ffe0',
                          }}>Completed</span>
                        ) : (
                          <select
                            value={c.bmCreation || 'Pending'}
                            onChange={e => handleBMStatusChange(pkg, c.id, 'bmCreation', e.target.value)}
                            style={getDropdownStyle(c.bmCreation || 'Pending')}
                          >
                            <option value="Pending">🔴 Pending</option>
                            <option value="Completed">🟢 Completed</option>
                          </select>
                        )}
                      </td>
                      <td className="report-col" style={{textAlign:'center', fontWeight:500, fontSize:'1em'}}>
                        {c.start || '-'}
                      </td>
                      <td className="report-col" style={{textAlign:'center'}}>
                        <button
                          className="remove-btn"
                          style={{ background: '#ffeaea', color: '#c00', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1.2em', cursor: 'pointer', padding: '0.2em 0.8em', marginLeft: 4 }}
                          title="Remove company from bookmarking"
                          onClick={() => handleRemoveFromBM(pkg, c.id, c.name)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length > 15 && filtered.slice(15).map((c, i) => (
                    <tr key={c.id} style={{display:'none'}}></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {/* Confirmation Modal for Remove in Bookmarking page */}
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
      {showDeleteToast && (
        <div className="copy-toast-dialog" style={{zIndex:2002}}>Company moved to Trash.</div>
      )}
    </section>
  );
}

function Templates() {
  return (
    <section className="company-tracker-page">
      <TemplateManager />
    </section>
  );
}

function SocialBookmarking() {
  return (
    <section className="company-tracker-page">
      <h1 className="fancy-title">Bookmarking</h1>
      <p className="hero-desc">This is the Bookmarking page. Add your content here.</p>
    </section>
  );
}

function TrashPage() {
  const [trash, setTrash] = useState([]);
  const [search, setSearch] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  useEffect(() => {
    getTrash().then(setTrash);
  }, []);

  const handleRestore = async (item) => {
    const updatedTrash = trash.filter(c => c.id !== item.id);
    setTrash(updatedTrash);
    await saveTrash(updatedTrash);
    if (item.type === 'template') {
      // Restore to templates in Firestore
      await saveTemplate({ id: item.id, title: item.title, content: item.content });
    } else {
      // Restore to original package in Firestore
      getPackages().then(packages => {
        if (!packages[item.originalPackage].some(c => c.id === item.id)) {
          packages[item.originalPackage].push(item);
          savePackages(packages);
        }
      });
    }
  };
  const handleDeleteForever = async (item) => {
    const updatedTrash = trash.filter(c => c.id !== item.id);
    setTrash(updatedTrash);
    await saveTrash(updatedTrash);
  };
  // Delete all logic
  const handleDeleteAll = () => {
    setShowDeleteAll(true);
  };
  const handleDeleteAllConfirm = async () => {
    setTrash([]);
    await saveTrash([]);
    setShowDeleteAll(false);
  };
  const handleDeleteAllCancel = () => {
    setShowDeleteAll(false);
  };
  // Filtered trash based on search
  const filteredTrash = trash.filter(item =>
    (item.type === 'template'
      ? (item.title && item.title.toLowerCase().includes(search.toLowerCase())) || (item.content && item.content.toLowerCase().includes(search.toLowerCase()))
      : (item.name && item.name.toLowerCase().includes(search.toLowerCase())) || (item.originalPackage || '').toLowerCase().includes(search.toLowerCase()) || (item.status || '').toLowerCase().includes(search.toLowerCase())
    )
  );
  return (
    <section className="company-tracker-page">
      <h1 className="fancy-title trash-header">Trash</h1>
      <div className="table-scroll-container">
        <table className="company-table trash-table">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span>Item</span>
                  <input
                    type="text"
                    className="package-search-input"
                    style={{ minWidth: 180, marginTop: 6 }}
                    placeholder="Search trash..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </th>
              <th>Type</th>
              <th style={{ minWidth: 120, textAlign: 'right' }}>
                {trash.length > 0 && (
                  <button className="trash-action-btn delete" style={{ minWidth: 100, marginLeft: 8 }} onClick={handleDeleteAll}>
                    Delete All
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTrash.length === 0 && (
              <tr><td colSpan={3} className="trash-empty">Trash is empty.</td></tr>
            )}
            {filteredTrash.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700, fontSize: '1.13rem', color: '#232323', background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #4e342e', letterSpacing: '0.02em' }}>
                  {item.type === 'template' ? item.title : item.name}
                  {item.type === 'template' && (
                    <div style={{ fontWeight: 400, fontSize: '0.98em', color: '#888', marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.content}</div>
                  )}
                </td>
                <td style={{ background: '#fff8f8' }}>{item.type === 'template' ? 'Template' : 'Company'}</td>
                <td>
                  <button className="trash-action-btn restore" onClick={() => handleRestore(item)}>Restore</button>
                  <button className="trash-action-btn delete" onClick={() => handleDeleteForever(item)}>Delete Forever</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showDeleteAll && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Are you sure you want to permanently delete all items in the trash?</div>
            <div className="confirm-desc">This action cannot be undone.</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleDeleteAllConfirm}>Yes, Delete All</button>
              <button className="confirm-btn cancel" onClick={handleDeleteAllCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const location = useLocation();
  const [editData, setEditData] = useState(null);
  // Shared packages state
  const [packages, setPackages] = useState({ 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] });
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [ticketsChanged, setTicketsChanged] = useState(0);
  const bellRef = useRef();
  const dropdownRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (location.pathname === '/company-tracker' && location.state && location.state.editData) {
      setEditData(location.state.editData);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line
  }, [location]);

  useEffect(() => {
    getPackages().then(setPackages);
  }, []);

  // Real-time listener for packages
  useEffect(() => {
    if (!user) return;
    const packagesDocRef = collection(db, 'users', user.uid, 'meta');
    // Listen for changes in the 'packages' document
    const unsubscribe = onSnapshot(packagesDocRef, (snapshot) => {
      const pkgDoc = snapshot.docs.find(d => d.id === 'packages');
      if (pkgDoc) {
        const data = pkgDoc.data();
        if (data && data.packages) {
          setPackages(data.packages);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time listener for tickets
  useEffect(() => {
    if (!user) return;
    const ticketsCol = collection(db, 'users', user.uid, 'tickets');
    async function fetchAlerts() {
      let allAlerts = [];
      // Tickets alerts
      const tickets = await getTickets();
      const today = new Date();
      const isToday = d => {
        if (!d) return false;
        const date = new Date(d);
        return date.toDateString() === today.toDateString();
      };
      const isYesterday = d => {
        if (!d) return false;
        const date = new Date(d);
        const yest = new Date(today);
        yest.setDate(today.getDate() - 1);
        return date.toDateString() === yest.toDateString();
      };
      const isOverdue = d => {
        if (!d) return false;
        const date = new Date(d);
        return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      };
      const todayFollowUps = tickets.filter(t => isToday(t.followUpDate));
      const yesterdayFollowUps = tickets.filter(t => isYesterday(t.followUpDate));
      const overdueFollowUps = tickets.filter(t => isOverdue(t.followUpDate));
      if (yesterdayFollowUps.length > 0) {
        allAlerts.push({
          id: 'tickets-yesterday',
          type: 'tickets',
          message: `Missed follow up: ${yesterdayFollowUps.length} ticket${yesterdayFollowUps.length > 1 ? 's' : ''} (yesterday)`,
          link: '/tickets',
          color: '#ff9800',
          icon: '⏰',
        });
      }
      if (todayFollowUps.length > 0) {
        allAlerts.push({
          id: 'tickets-today',
          type: 'tickets',
          message: `Follow up today: ${todayFollowUps.length} ticket${todayFollowUps.length > 1 ? 's' : ''}`,
          link: '/tickets',
          color: '#d32f2f',
          icon: '⏰',
        });
      }
      if (overdueFollowUps.length > 0) {
        allAlerts.push({
          id: 'tickets-overdue',
          type: 'tickets',
          message: `Overdue: ${overdueFollowUps.length} ticket${overdueFollowUps.length > 1 ? 's' : ''}`,
          link: '/tickets',
          color: '#b26a00',
          icon: '⚠️',
        });
      }
      // Summarize Report, Bookmarking, Link Building alerts by type
      const summary = {
        report: {},
        bm: {},
        linkbuilding: {},
      };
      Object.entries(packages).forEach(([pkg, companies]) => {
        // Report
        const pendingReport = (companies || []).filter(c => c.status !== 'OnHold' && c.reportI !== 'Completed').length;
        if (pendingReport > 0) summary.report[pkg] = pendingReport;
        // Bookmarking
        const pendingBM = (companies || []).filter(c => c.status !== 'OnHold' && c.bmSubmission !== 'Completed').length;
        if (pendingBM > 0) summary.bm[pkg] = pendingBM;
        // Link Building
        const pendingLB = (companies || []).filter(c => c.status !== 'OnHold' && c.linkBuildingStatus !== 'Completed').length;
        if (pendingLB > 0) summary.linkbuilding[pkg] = pendingLB;
      });
      // Add summarized alerts
      if (Object.keys(summary.report).length > 0) {
        const total = Object.values(summary.report).reduce((a, b) => a + b, 0);
        allAlerts.push({
          id: 'report-summary',
          type: 'report',
          message: `Report I: ${total} pending (${Object.entries(summary.report).map(([pkg, n]) => `${n} ${pkg.replace('SEO - ', '')}`).join(', ')})`,
          link: '/report',
          color: '#1976d2',
          icon: '📊',
        });
      }
      if (Object.keys(summary.bm).length > 0) {
        const total = Object.values(summary.bm).reduce((a, b) => a + b, 0);
        allAlerts.push({
          id: 'bm-summary',
          type: 'bm',
          message: `BM Submission: ${total} pending (${Object.entries(summary.bm).map(([pkg, n]) => `${n} ${pkg.replace('SEO - ', '')}`).join(', ')})`,
          link: '/social-bookmarking',
          color: '#388e3c',
          icon: '🔖',
        });
      }
      if (Object.keys(summary.linkbuilding).length > 0) {
        const total = Object.values(summary.linkbuilding).reduce((a, b) => a + b, 0);
        allAlerts.push({
          id: 'linkbuilding-summary',
          type: 'linkbuilding',
          message: `Link Building: ${total} pending (${Object.entries(summary.linkbuilding).map(([pkg, n]) => `${n} ${pkg.replace('SEO - ', '')}`).join(', ')})`,
          link: '/link-buildings',
          color: '#ffb300',
          icon: '🔗',
        });
      }
      setAlerts(allAlerts);
    }
    fetchAlerts();
  }, [packages]);

  let sidebarClass = 'sidebar';
  if (windowWidth <= 700) {
    sidebarClass = sidebarOpen ? 'sidebar sidebar--open' : 'sidebar';
  } else {
    sidebarClass = sidebarCollapsed ? 'sidebar sidebar--collapsed' : 'sidebar';
  }

  // Dynamically set margin-left for main content
  let mainContentMarginLeft = 220;
  if (windowWidth <= 700) {
    mainContentMarginLeft = 0;
  } else if (sidebarCollapsed) {
    mainContentMarginLeft = 56;
  }

  // Close alerts dropdown when clicking outside
  useEffect(() => {
    if (!showAlerts) return;
    function handleClick(e) {
      if (
        bellRef.current && bellRef.current.contains(e.target)
      ) {
        // Clicked the bell, let the bell handler toggle
        return;
      }
      if (
        dropdownRef.current && dropdownRef.current.contains(e.target)
      ) {
        // Clicked inside the dropdown
        return;
      }
      setShowAlerts(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAlerts]);

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <button
        onClick={() => signOut(auth)}
        style={{
          position: 'fixed',
          top: 18,
          right: 28,
          zIndex: 2000,
          background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: '1.08em',
          padding: '0.6em 1.5em',
          boxShadow: '0 2px 8px #e0e7ef',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'background 0.18s, color 0.18s',
        }}
        title="Logout"
      >
        Logout
      </button>
      {/* Notification Icon */}
      <div style={{ position: 'fixed', top: 18, right: 170, zIndex: 2000 }}>
        <button
          ref={bellRef}
          onClick={() => setShowAlerts(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            fontSize: '2em',
            color: '#1976d2',
            padding: 0,
            marginRight: 32,
          }}
          title="Notifications"
        >
          <span role="img" aria-label="Notifications">🔔</span>
          {alerts.length > 0 && (
            <span style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: '#c00',
              color: '#fff',
              borderRadius: '50%',
              fontSize: '0.68em',
              fontWeight: 700,
              minWidth: 16,
              minHeight: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px #e0e7ef',
              border: '2px solid #fff',
            }}>{alerts.length}</span>
          )}
        </button>
        {showAlerts && alerts.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 38,
              right: 0,
              background: '#fff',
              border: '1.5px solid #e0e7ef',
              borderRadius: 12,
              boxShadow: '0 4px 24px #e0e7ef',
              minWidth: 320,
              maxWidth: 420,
              padding: '0.7em 0.5em',
              zIndex: 2001,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {alerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  padding: '0.7em 1.2em',
                  margin: '2px 0',
                  borderRadius: 10,
                  fontWeight: 600,
                  color: alert.color,
                  background: '#f7f6f2',
                  cursor: 'pointer',
                  fontSize: '1.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 1px 6px #ececec',
                  borderLeft: `5px solid ${alert.color}`,
                  transition: 'background 0.18s',
                }}
                onClick={() => {
                  setShowAlerts(false);
                  navigate(alert.link);
                }}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') { setShowAlerts(false); navigate(alert.link); } }}
              >
                <span style={{fontSize:'1.3em',marginRight:4}}>{alert.icon}</span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        className="hamburger"
        aria-label="Open sidebar"
        onClick={() => setSidebarOpen((v) => !v)}
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <span />
      </button>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="app-layout">
        <div
          onMouseEnter={() => windowWidth > 700 && setSidebarCollapsed(false)}
          onMouseLeave={() => windowWidth > 700 && setSidebarCollapsed(true)}
          style={{ height: '100vh' }}
        >
          <Sidebar className={sidebarClass} />
        </div>
        <div className="main-content-area" style={{ paddingLeft: mainContentMarginLeft, transition: 'padding-left 0.22s cubic-bezier(.4,0,.2,1)' }}>
          <div className="minimal-bg main-content">
            <header className="minimal-header">
              <div className="header-content">
                <span className="header-title">SEO TRACKER</span>
                <nav>
                  <a href="#projects">Projects</a>
                  <a href="#info">Info</a>
                </nav>
              </div>
            </header>
            <div className="minimalist-divider" />
            <main className="main-seo-content">
              <Routes>
                <Route path="/" element={<HomeHero />} />
                <Route path="/da-pa-checker" element={<DApaChecker />} />
                <Route path="/company-tracker" element={<CompanyTracker editCompany setEditData={setEditData} editData={editData} clearEdit={() => setEditData(null)} packages={packages} setPackages={setPackages} />} />
                <Route path="/seo-basic" element={<PackagePage pkg="SEO - BASIC" packages={packages} setPackages={setPackages} />} />
                <Route path="/seo-premium" element={<PackagePage pkg="SEO - PREMIUM" packages={packages} setPackages={setPackages} />} />
                <Route path="/seo-pro" element={<PackagePage pkg="SEO - PRO" packages={packages} setPackages={setPackages} />} />
                <Route path="/seo-ultimate" element={<PackagePage pkg="SEO - ULTIMATE" packages={packages} setPackages={setPackages} />} />
                <Route path="/report" element={<Report packages={packages} setPackages={setPackages} />} />
                <Route path="/link-buildings" element={<LinkBuildings packages={packages} setPackages={setPackages} />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/social-bookmarking" element={<Bookmarking packages={packages} setPackages={setPackages} />} />
                <Route path="/trash" element={<TrashPage />} />
                <Route path="/tickets" element={<Tickets />} />
              </Routes>
            </main>
            <div className="minimalist-divider" />
            <footer className="minimal-footer">
              <div className="footer-content">
                <span>&copy; 2025 OPPA JEWO</span>
                <span className="footer-tagline">Kung ang bayot ma amnesia, bayot gihapon?</span>
                <a href="https://talhub-smakdat-team.netlify.app/" className="footer-link" target="_blank" rel="noopener noreferrer">TalHub Smak Dat</a>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
