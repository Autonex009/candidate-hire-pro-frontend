import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import type { User } from '../../types';
import './Layout.css';

interface LayoutProps {
    user: User | null;
    onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);
    const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

    return (
        <div className="layout">
            <Sidebar
                mobileOpen={isMobileSidebarOpen}
                onMobileClose={closeMobileSidebar}
            />
            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={closeMobileSidebar}
                    aria-hidden="true"
                />
            )}

            <div className="layout-body">
                <Header
                    user={user}
                    onLogout={onLogout}
                    onMenuClick={toggleMobileSidebar}
                />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
