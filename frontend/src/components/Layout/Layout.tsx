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
    return (
        <div className="layout">
            <Sidebar />
            <div className="layout-body">
                <Header user={user} onLogout={onLogout} />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
