import { NavLink } from 'react-router-dom';
import smallLogo from '../../assets/small-logo.jpeg';
import './Sidebar.css';

// SVG Icons
const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
    </svg>
);

const CoursesIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3z" />
        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
    </svg>
);

const JobsIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
    </svg>
);

const AssessmentsIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
    </svg>
);

const CompanyTestIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
);

const IDEIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
    </svg>
);

const NerdIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
);

export default function Sidebar() {
    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <img src={smallLogo} alt="Logo" />
            </div>

            <div className="sidebar-nav">
                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <DashboardIcon />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <CoursesIcon />
                    <span>Courses</span>
                </NavLink>

                <NavLink to="/jobs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <JobsIcon />
                    <span>Jobs</span>
                </NavLink>

                <NavLink to="/assessments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <AssessmentsIcon />
                    <span>Assessments</span>
                </NavLink>

                <NavLink to="/company-tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <CompanyTestIcon />
                    <span>Company Specific Test</span>
                </NavLink>

                <NavLink to="/ide" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <IDEIcon />
                    <span>Open IDE</span>
                </NavLink>

                <a href="https://nerd.vit.ac.in" target="_blank" rel="noopener noreferrer" className="nav-item">
                    <NerdIcon />
                    <span>Go to NERD</span>
                </a>
            </div>
        </nav>
    );
}
