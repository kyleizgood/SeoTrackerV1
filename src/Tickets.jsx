<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getTickets, saveTicket, deleteTicket } from './firestoreHelpers';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
=======
import React, { useState } from 'react';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Tickets = () => {
  const [tickets, setTickets] = useState(() => {
    // Persist tickets in localStorage
    const saved = localStorage.getItem('tickets-list');
    return saved ? JSON.parse(saved) : [];
  });
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', subject: '', ticketId: '', followUpDate: null });
  const [editId, setEditId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showAlert, setShowAlert] = useState(true);
<<<<<<< HEAD
  const [search, setSearch] = useState('');

  useEffect(() => {
    getTickets().then(setTickets);
  }, []);
=======
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = date => {
    setForm({ ...form, followUpDate: date });
  };

<<<<<<< HEAD
  const handleAdd = async e => {
    e.preventDefault();
    if (!form.company.trim() || !form.subject.trim() || !form.ticketId.trim() || !form.followUpDate) return;
    const followUpDateISO = form.followUpDate instanceof Date ? form.followUpDate.toISOString() : form.followUpDate;
    if (editId) {
      await saveTicket({ ...form, followUpDate: followUpDateISO, id: editId });
      setTickets(await getTickets());
      setEditId(null);
    } else {
      const newTicket = { ...form, followUpDate: followUpDateISO, id: Date.now() };
      await saveTicket(newTicket);
      setTickets(await getTickets());
=======
  const handleAdd = e => {
    e.preventDefault();
    if (!form.company.trim() || !form.subject.trim() || !form.ticketId.trim() || !form.followUpDate) return;
    if (editId) {
      const updated = tickets.map(t => t.id === editId ? { ...form, id: editId } : t);
      setTickets(updated);
      localStorage.setItem('tickets-list', JSON.stringify(updated));
      setEditId(null);
    } else {
      const newTickets = [...tickets, { ...form, id: Date.now() }];
      setTickets(newTickets);
      localStorage.setItem('tickets-list', JSON.stringify(newTickets));
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
    }
    setForm({ company: '', subject: '', ticketId: '', followUpDate: null });
    setShowForm(false);
  };

  const handleEdit = t => {
<<<<<<< HEAD
    setForm({
      company: t.company,
      subject: t.subject,
      ticketId: t.ticketId,
      followUpDate: t.followUpDate ? new Date(t.followUpDate) : null
    });
=======
    setForm({ company: t.company, subject: t.subject, ticketId: t.ticketId, followUpDate: t.followUpDate ? new Date(t.followUpDate) : null });
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
    setEditId(t.id);
    setShowForm(true);
  };

<<<<<<< HEAD
  const handleDelete = async id => {
    await deleteTicket(id);
    setTickets(await getTickets());
=======
  const handleDelete = id => {
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    localStorage.setItem('tickets-list', JSON.stringify(updated));
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
  };

  const handleCancel = () => {
    setForm({ company: '', subject: '', ticketId: '', followUpDate: null });
    setEditId(null);
    setShowForm(false);
  };

  const handleCopy = (ticketId) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedId(ticketId);
    setTimeout(() => setCopiedId(null), 1200);
  };

<<<<<<< HEAD
  // Filtered tickets based on search
  const filteredTickets = tickets.filter(t => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.company.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

=======
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
  // Find tickets that need follow up today
  const todayFollowUps = tickets.filter(t => isToday(t.followUpDate));
  // Find tickets that were due yesterday and not followed up
  const yesterdayFollowUps = tickets.filter(t => isYesterday(t.followUpDate));
  // Find tickets that were due before today (not today or future)
  const overdueFollowUps = tickets.filter(t => {
    if (!t.followUpDate) return false;
    const today = new Date();
    const d = new Date(t.followUpDate);
    // Only count if before today (not today)
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  // Helper to check if a date is overdue (before today)
  function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const d = new Date(dateStr);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  return (
    <div className="main-content">
      {yesterdayFollowUps.length > 0 && showAlert && (
        <div style={{
          background: 'linear-gradient(90deg, #fff3e0 0%, #ffeaea 100%)',
          color: '#b26a00',
          border: '1.5px solid #ffd6d6',
          borderRadius: 12,
          padding: '1.1em 2em',
          margin: '0 auto 1.2em auto',
          maxWidth: 700,
          fontWeight: 600,
          fontSize: '1.13em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px #ffeaea',
        }}>
          <span>⚠️ You missed {yesterdayFollowUps.length} ticket{yesterdayFollowUps.length > 1 ? 's' : ''} that needed follow up yesterday!</span>
          <button onClick={() => setShowAlert(false)} style={{
            background: 'none',
            border: 'none',
            color: '#b26a00',
            fontWeight: 700,
            fontSize: '1.3em',
            marginLeft: 18,
            cursor: 'pointer',
            borderRadius: 6,
            padding: '0.1em 0.7em',
            transition: 'background 0.18s',
          }} title="Dismiss">×</button>
        </div>
      )}
      {todayFollowUps.length > 0 && showAlert && (
        <div style={{
          background: 'linear-gradient(90deg, #ffeaea 0%, #fffbe6 100%)',
          color: '#c00',
          border: '1.5px solid #ffd6d6',
          borderRadius: 12,
          padding: '1.1em 2em',
          margin: '0 auto 1.5em auto',
          maxWidth: 700,
          fontWeight: 600,
          fontSize: '1.13em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px #ffeaea',
        }}>
          <span>⏰ You have {todayFollowUps.length} ticket{todayFollowUps.length > 1 ? 's' : ''} that need{todayFollowUps.length > 1 ? '' : 's'} follow up today!</span>
          <button onClick={() => setShowAlert(false)} style={{
            background: 'none',
            border: 'none',
            color: '#c00',
            fontWeight: 700,
            fontSize: '1.3em',
            marginLeft: 18,
            cursor: 'pointer',
            borderRadius: 6,
            padding: '0.1em 0.7em',
            transition: 'background 0.18s',
          }} title="Dismiss">×</button>
        </div>
      )}
      {overdueFollowUps.length > 0 && showAlert && (
        <div style={{
          background: 'linear-gradient(90deg, #fff3e0 0%, #ffeaea 100%)',
          color: '#b26a00',
          border: '1.5px solid #ffd6d6',
          borderRadius: 12,
          padding: '1.1em 2em',
          margin: '0 auto 1.2em auto',
          maxWidth: 700,
          fontWeight: 600,
          fontSize: '1.13em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px #ffeaea',
        }}>
          <span>⚠️ You have {overdueFollowUps.length} ticket{overdueFollowUps.length > 1 ? 's' : ''} that needed follow up in previous days!</span>
          <button onClick={() => setShowAlert(false)} style={{
            background: 'none',
            border: 'none',
            color: '#b26a00',
            fontWeight: 700,
            fontSize: '1.3em',
            marginLeft: 18,
            cursor: 'pointer',
            borderRadius: 6,
            padding: '0.1em 0.7em',
            transition: 'background 0.18s',
          }} title="Dismiss">×</button>
        </div>
      )}
      <div className="responsive-table-wrapper">
        <h1 style={{ textAlign: 'center', marginBottom: 28, marginTop: 0 }}>Tickets</h1>
        <button className="hero-cta" style={{ marginBottom: 18 }} onClick={() => setShowForm(true)}>
          Add Tickets
        </button>
<<<<<<< HEAD
        <div style={{ maxWidth: 400, margin: '0 auto 18px auto', display: 'flex', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6em 1em', borderRadius: 8, border: '1.5px solid #e0e7ef', fontSize: '1.05em', marginBottom: 0 }}
          />
        </div>
=======
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
        {showForm && (
          <form className="company-form" onSubmit={handleAdd} style={{
            width: '100%',
            maxWidth: 900,
            marginBottom: 24,
            marginLeft: 0,
            marginRight: 0,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 18,
            boxShadow: '0 2px 16px #ececec',
            padding: '2rem 2.5rem 1.5rem 2.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.2rem 2.5rem',
            alignItems: 'center',
          }}>
            <input
              name="company"
              type="text"
              placeholder="Company Name"
              value={form.company}
              onChange={handleChange}
              required
              style={{ fontSize: '1.1rem' }}
            />
            <input
              name="subject"
              type="text"
              placeholder="Subject"
              value={form.subject}
              onChange={handleChange}
              required
              style={{ fontSize: '1.1rem' }}
            />
            <input
              name="ticketId"
              type="text"
              placeholder="Ticket ID"
              value={form.ticketId}
              onChange={handleChange}
              required
              style={{ fontSize: '1.1rem' }}
            />
            <DatePicker
<<<<<<< HEAD
              selected={form.followUpDate instanceof Date ? form.followUpDate : (form.followUpDate ? new Date(form.followUpDate) : null)}
=======
              selected={form.followUpDate}
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
              onChange={handleDateChange}
              dateFormat="yyyy-MM-dd"
              placeholderText="Follow Up Date"
              className="company-form-datepicker"
              required
              style={{ fontSize: '1.1rem', width: '100%' }}
            />
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              <button type="submit" className="hero-cta save" style={{ minWidth: 100 }}>{editId ? 'Update' : 'Add'}</button>
              <button type="button" className="delete-btn" style={{ background: '#f5f5f5', color: '#232323', minWidth: 100 }} onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        )}
        <div className="table-scroll-container table-responsive" style={{ width: '100%', maxWidth: 1800, margin: '0 auto', overflowX: 'auto' }}>
          <table className="company-table tickets-table" style={{ width: '100%', minWidth: 600, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Company Name</th>
                <th style={{ width: '35%' }}>Subject</th>
                <th style={{ width: '30%' }}>Ticket ID</th>
                <th style={{ width: '20%' }}>Follow Up Date</th>
                <th style={{ width: '10%', minWidth: 90 }}></th>
              </tr>
            </thead>
            <tbody>
<<<<<<< HEAD
              {filteredTickets.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa' }}>No tickets found.</td></tr>
              )}
              {filteredTickets.map(t => (
=======
              {tickets.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa' }}>No tickets yet.</td></tr>
              )}
              {tickets.map(t => (
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', letterSpacing: '0.01em' }}>{t.company}</td>
                  <td style={{ color: '#4e5d6c', fontSize: '1.05em', fontWeight: 500, fontFamily: 'Nunito, Segoe UI, Arial, sans-serif', letterSpacing: '0.01em' }}>{t.subject}</td>
                  <td style={{ fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap', maxWidth: 0 }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#e0e7ef',
                      color: '#1976d2',
                      borderRadius: '8px',
                      padding: '0.18em 0.7em',
                      fontWeight: 700,
                      fontSize: '1.08em',
                      letterSpacing: '0.03em',
                      marginRight: 2,
                      maxWidth: 320,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      verticalAlign: 'middle',
                    }} title={t.ticketId}>{t.ticketId}</span>
                    <button
                      onClick={() => handleCopy(t.ticketId)}
                      title="Copy Ticket ID"
                      style={{
                        marginLeft: 2,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '1.1em',
                        verticalAlign: 'middle',
                        color: '#888',
                      }}
                    >
                      📋
                    </button>
                    {copiedId === t.ticketId && (
                      <span style={{ marginLeft: 6, color: '#4caf50', fontSize: '0.98em' }}>Copied!</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '1.05em', color: '#1976d2', position: 'relative' }}>
                    {t.followUpDate ? formatFullDate(t.followUpDate) : ''}
                    {isToday(t.followUpDate) && (
                      <span
                        className="flashing-reminder"
                        title="Follow up today!"
                        style={{ marginLeft: 8, fontSize: '1.2em', verticalAlign: 'middle', color: '#c00' }}
                      >
                        ⏰
                      </span>
                    )}
                    {isYesterday(t.followUpDate) && (
                      <span
                        title="Missed follow up!"
                        style={{ marginLeft: 8, fontSize: '1.2em', verticalAlign: 'middle', color: '#b26a00' }}
                      >
                        ⚠️
                      </span>
                    )}
                    {isOverdue(t.followUpDate) && !isToday(t.followUpDate) && !isYesterday(t.followUpDate) && (
                      <span
                        title="Overdue follow up!"
                        style={{ marginLeft: 8, fontSize: '1.2em', verticalAlign: 'middle', color: '#b26a00' }}
                      >
                        ⚠️
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', gap: 8, background: '#f7f7fa', borderRadius: 8, padding: '0.2em 0.5em', border: '1.5px solid #ececec' }}>
<<<<<<< HEAD
                      <button className="edit-btn" style={{ marginRight: 0, background: '#1976d2', color: '#fff', fontWeight: 700, borderRadius: '5px', padding: '0.18em 0.6em', fontSize: '0.89em', border: 'none' }} onClick={() => handleEdit(t)}>Edit</button>
                      <button className="remove-btn" style={{ background: '#ffeaea', color: '#c00', fontWeight: 700, borderRadius: '5px', padding: '0.18em 0.6em', fontSize: '0.89em', border: 'none', marginLeft: 2 }} onClick={() => handleDelete(t.id)}>×</button>
=======
                      <button className="edit-btn" style={{ marginRight: 0 }} onClick={() => handleEdit(t)}>Edit</button>
                      <button className="remove-btn" onClick={() => handleDelete(t.id)}>×</button>
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper function to check if a date is today
function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

// Helper function to check if a date is yesterday
function isYesterday(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
}

// Helper to format date as 'Month Day, Year'
function formatFullDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default Tickets; 