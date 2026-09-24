import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Building2, Cloud, FileText, Globe2, Image, Layers, ScanLine } from 'lucide-react'
import CubeMark from '../CubeMark.jsx'
import { ROLE_LABELS } from '../../constants.js'

/**
 * Application-wide topbar.
 *
 * Props:
 *   session      – current session object ({ name, role }) or null
 *   onLogout     – called when the user clicks Log out
 *   onSwitchRole – called with the new role string when the demo role switcher is used
 *   children     – optional slot for extra content (e.g. registrar search box)
 */
export default function Topbar({ session, onLogout, onSwitchRole, activeLanguage = 'English', onLanguageChange, children }) {
  const isCitizen   = session?.role === 'citizen'
  const isRegistrar = session?.role === 'registrar'
  const isSurveyor  = session?.role === 'surveyor'
  const [q, setQ]   = useState('')
  const navigate    = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/passport/${encodeURIComponent(q.trim())}`)
  }

  const roleName    = ROLE_LABELS[session?.role || 'citizen'] || 'Citizen'
  const displayName = session?.name || (isRegistrar ? 'Registrar 1' : isSurveyor ? 'Surveyor 1' : 'Citizen 1')
  const initials    = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="topbar">
      <div className="brand" onClick={() => navigate('/dashboard')} title="Avani Cadastre Home">
        <div className="brand-mark" aria-label="Avani logo">
          <CubeMark size={22} tint={isCitizen ? '#E0B85C' : isRegistrar ? '#C9A45C' : '#8B93E8'} />
        </div>
        <div className="brand-text">
          <h1>Avani</h1>
          <span className="brand-tag">National 3D Cadastre</span>
        </div>
      </div>

      <nav className="mode-switch">
        {isCitizen ? (
          <>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="Overview & My Properties"
            >
              <Building2 size={14} /> My Properties
            </NavLink>

            <NavLink
              to="/portal/records"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="Browse City Cadastre Records"
            >
              <FileText size={14} /> Records
            </NavLink>
            <NavLink
              to="/ulpin"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="3D unit tree — floors, ULPINs, owners per building"
            >
              <Layers size={14} /> 3D Unit Tree
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title={isRegistrar ? 'Registrar GIS Dashboard & Pending Confirmations' : 'Surveyor Dashboard'}
            >
              <Building2 size={14} /> {isRegistrar ? 'Registrar Dashboard' : 'Dashboard'}
            </NavLink>
            <NavLink
              to="/lidar"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="LiDAR footprint extraction & building edit"
            >
              <ScanLine size={14} /> LiDAR Scan
            </NavLink>
            <NavLink
              to="/pointcloud"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="View PLY point cloud data in 3D"
            >
              <Cloud size={14} /> Point Cloud
            </NavLink>
            <NavLink
              to="/oblique"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="Manage oblique imagery captures"
            >
              <Image size={14} /> Oblique
            </NavLink>
            <NavLink
              to="/ulpin"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="3D unit tree — floors, ULPINs, owners per building"
            >
              <Layers size={14} /> 3D Unit Tree
            </NavLink>
          </>
        )}
      </nav>

      {/* Registrar search box or citizen quick-search are injected via children */}
      {children}
      {isCitizen && !children && (
        <form onSubmit={handleSearch} className="top-search citizen-top-search">
          <input
            className="search"
            placeholder="Search ULPIN / property ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search ULPIN or property ID"
          />
        </form>
      )}

      {isCitizen && (
        <label className="topbar-language" title="Choose language">
          <Globe2 size={15} aria-hidden="true" />
          <span className="sr-only">Language</span>
          <select
            value={activeLanguage}
            onChange={(e) => onLanguageChange?.(e.target.value)}
            aria-label="Language"
          >
            <option value="English">English</option>
            <option value="हिंदी">हिंदी</option>
            <option value="தமிழ்">தமிழ்</option>
          </select>
        </label>
      )}

      {/* Interactive Role Switcher */}
      <div className="role-switcher-wrap" aria-label="Demo Role Switcher">
        <span className="role-label-text">Role:</span>
        <div className="role-pill-group">
          <button
            type="button"
            className={`role-pill-btn role-pill-citizen ${session?.role === 'citizen' ? 'active' : ''}`}
            onClick={() => onSwitchRole?.('citizen')}
            title="Switch to Citizen View"
          >
            👤 Citizen
          </button>
          <button
            type="button"
            className={`role-pill-btn role-pill-registrar ${session?.role === 'registrar' ? 'active' : ''}`}
            onClick={() => onSwitchRole?.('registrar')}
            title="Switch to Registrar View"
          >
            🏛️ Registrar
          </button>
          <button
            type="button"
            className={`role-pill-btn role-pill-surveyor ${session?.role === 'surveyor' ? 'active' : ''}`}
            onClick={() => onSwitchRole?.('surveyor')}
            title="Switch to Surveyor View"
          >
            📐 Surveyor
          </button>
        </div>
      </div>

      {/* Account access stays compact; full actions live in the left sidebar. */}
      <button
        className="avatar-btn"
        onClick={() => navigate('/portal/profile')}
        title="Open profile and settings"
        aria-label={`Open profile for ${displayName}, ${roleName}`}
      >
        {initials}
      </button>
    </header>
  )
}
