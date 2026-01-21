import { useState, useEffect } from 'react';
import { assessmentsApi } from '../services/api';
import type { AssessmentStats } from '../types';
import './Assessments.css';

export default function Assessments() {
    const [stats, setStats] = useState<AssessmentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await assessmentsApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="assessments-page">
            <h1 className="jobs-title">My Tests</h1>

            <div className="assessments-content">
                <div className="assessments-main">
                    <div className="assessments-controls">
                        <select className="jobs-sort">
                            <option>Sort By</option>
                            <option>Recent</option>
                            <option>Name</option>
                        </select>
                        <button className="btn">Filters</button>
                    </div>

                    <div className="empty-state">
                        <svg className="empty-state-icon" viewBox="0 0 100 100" fill="currentColor">
                            <rect x="20" y="20" width="60" height="70" rx="5" fill="#e5e5e5" />
                            <rect x="30" y="30" width="40" height="5" rx="2" fill="#ccc" />
                            <rect x="30" y="40" width="30" height="5" rx="2" fill="#ccc" />
                            <rect x="30" y="50" width="35" height="5" rx="2" fill="#ccc" />
                        </svg>
                        <p className="empty-state-text">No data found</p>
                    </div>
                </div>

                <div className="assessments-sidebar">
                    <div className="sidebar-card">
                        <h3 className="sidebar-title">Tests & Badges</h3>

                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <div className="stats-list">
                                <div className="stats-item">
                                    <div className="stats-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                                        </svg>
                                    </div>
                                    <div className="stats-info">
                                        <div className="stats-label">Tests Enrolled</div>
                                    </div>
                                    <div className="stats-value">{stats?.tests_enrolled || 0}</div>
                                </div>

                                <div className="stats-item">
                                    <div className="stats-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </div>
                                    <div className="stats-info">
                                        <div className="stats-label">Tests Completed</div>
                                    </div>
                                    <div className="stats-value">{stats?.tests_completed || 0}</div>
                                </div>

                                <div className="stats-item">
                                    <div className="stats-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                    <div className="stats-info">
                                        <div className="stats-label">Badges</div>
                                    </div>
                                    <div className="stats-value">{stats?.badges || 0}</div>
                                </div>

                                <div className="stats-item">
                                    <div className="stats-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                                        <svg viewBox="0 0 24 24" fill="#8B5CF6">
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    </div>
                                    <div className="stats-info">
                                        <div className="stats-label">Super Badges</div>
                                    </div>
                                    <div className="stats-value">{stats?.super_badges || 0}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
