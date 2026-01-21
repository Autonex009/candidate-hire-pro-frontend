import { useState, useEffect } from 'react';
import { jobsApi } from '../services/api';
import type { Job, JobStats } from '../types';
import './Jobs.css';

type TabType = 'my' | 'all';

export default function Jobs() {
    const [activeTab, setActiveTab] = useState<TabType>('my');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState<JobStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadJobs();
        loadStats();
    }, [activeTab]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const data = activeTab === 'my' ? await jobsApi.getMy() : await jobsApi.getAll();
            setJobs(data);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await jobsApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const getOfferTypeClass = (type: string) => {
        switch (type) {
            case 'dream_core': return 'dream-core';
            case 'super_dream': return 'super-dream';
            default: return 'regular';
        }
    };

    const formatOfferType = (type: string) => {
        switch (type) {
            case 'dream_core': return 'Dream core offer';
            case 'super_dream': return 'Super Dream offer';
            default: return 'Regular offer';
        }
    };

    return (
        <div className="jobs-page">
            <h1 className="jobs-title">My Jobs</h1>

            <div className="jobs-tabs">
                <button
                    className={`jobs-tab ${activeTab === 'my' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my')}
                >
                    My Jobs
                </button>
                <button
                    className={`jobs-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Jobs
                </button>
            </div>

            <div className="jobs-content">
                <div className="jobs-list">
                    <div className="jobs-controls">
                        <select className="jobs-sort">
                            <option>Sort By</option>
                            <option>Recent</option>
                            <option>CTC: High to Low</option>
                            <option>CTC: Low to High</option>
                        </select>
                        <button className="btn">Filters</button>
                    </div>

                    {loading ? (
                        <p>Loading jobs...</p>
                    ) : jobs.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                            <p className="text-muted">No jobs found</p>
                        </div>
                    ) : (
                        <div className="jobs-grid">
                            {jobs.map(job => (
                                <div key={job.id} className="job-card">
                                    <div className="job-card-header">
                                        <div>
                                            <div className="job-company">{job.role}</div>
                                            <div className="job-role">{job.company_name}</div>
                                        </div>
                                        <span className={`job-status-badge ${job.application_status === 'applied' ? 'applied' : 'not-applied'}`}>
                                            {job.application_status === 'applied' ? 'Applied' : 'Not Applied'}
                                        </span>
                                    </div>

                                    <div className="job-details">
                                        {job.location && (
                                            <div className="job-detail">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg>
                                                {job.location}
                                            </div>
                                        )}
                                        <div className="job-detail">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                            </svg>
                                            {job.job_type}
                                        </div>
                                    </div>

                                    <div className="job-footer">
                                        <div className="job-ctc">
                                            {job.ctc ? (
                                                <>₹ <strong>{job.ctc}</strong> LPA</>
                                            ) : (
                                                <span className="text-muted">CTC Not Provided</span>
                                            )}
                                        </div>
                                        <span className={`job-offer-type ${getOfferTypeClass(job.offer_type)}`}>
                                            {formatOfferType(job.offer_type)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="jobs-sidebar">
                    <div className="sidebar-card">
                        <h3 className="sidebar-title">Summary</h3>
                        <div className="summary-item">
                            <div className="summary-icon" style={{ background: 'rgba(52, 86, 255, 0.1)' }}>
                                <svg viewBox="0 0 24 24" fill="#3456FF">
                                    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                                </svg>
                            </div>
                            <span className="summary-label">No. of Jobs</span>
                            <span className="summary-value">{stats?.total_jobs || 0}</span>
                        </div>
                        <div className="summary-item">
                            <div className="summary-icon" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                                <svg viewBox="0 0 24 24" fill="#22C55E">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                            </div>
                            <span className="summary-label">Placed</span>
                            <span className="summary-value">{stats?.placed || 0}</span>
                        </div>
                        <div className="summary-item">
                            <div className="summary-icon" style={{ background: 'rgba(255, 173, 58, 0.1)' }}>
                                <svg viewBox="0 0 24 24" fill="#FFAD3A">
                                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                                </svg>
                            </div>
                            <span className="summary-label">Waiting</span>
                            <span className="summary-value">{stats?.waiting || 0}</span>
                        </div>
                        <div className="summary-item">
                            <div className="summary-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <svg viewBox="0 0 24 24" fill="#EF4444">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </div>
                            <span className="summary-label">Rejected</span>
                            <span className="summary-value">{stats?.rejected || 0}</span>
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h3 className="sidebar-title">Recently Consumed</h3>
                        <p className="text-sm text-muted">No recent activity</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
