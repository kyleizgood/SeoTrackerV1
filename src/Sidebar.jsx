import React from 'react';
import './Sidebar.css';
import { Link } from 'react-router-dom';

// You can use emoji or replace with SVG/icon components
const navLinks = [
  { icon: '📦', text: 'SEO - BASIC', href: '/seo-basic', aria: 'SEO - BASIC' },
  { icon: '\u2b50', text: 'SEO - PREMIUM', href: '/seo-premium', aria: 'SEO - PREMIUM' },
  { icon: '🚀', text: 'SEO - PRO', href: '/seo-pro', aria: 'SEO - PRO' },
  { icon: '💎', text: 'SEO - ULTIMATE', href: '/seo-ultimate', aria: 'SEO - ULTIMATE' },
  { icon: '📊', text: 'Report', href: '/report', aria: 'Report' },
  { icon: '🔗', text: 'Link Buildings', href: '/link-buildings', aria: 'Link Buildings' },
  { icon: '🔖', text: 'Bookmarking', href: '/social-bookmarking', aria: 'Bookmarking' },
  { icon: '📄', text: 'Templates', href: '/templates', aria: 'Templates' },
  { icon: '🎫', text: 'Tickets', href: '/tickets', aria: 'Tickets' },
<<<<<<< HEAD
=======
  { icon: '🗑️', text: 'Template Trash', href: '/template-trash', aria: 'Template Trash' },
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
  { icon: '🗑️', text: 'Trash', href: '/trash', aria: 'Trash' },
];

const Sidebar = ({ className = 'sidebar' }) => {
  // Determine if collapsed by className
  const isCollapsed = className.includes('sidebar--collapsed');
  return (
    <aside className={className}>
      <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <span className="sidebar-logo-icon" aria-label="Logo">🧭</span>
        <span className="sidebar-logo-text">TRACKER</span>
      </Link>
      <nav className="sidebar-nav">
        {navLinks.map(link => (
          <Link to={link.href} key={link.text} aria-label={link.aria} className="sidebar-link">
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-text">{link.text}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar; 