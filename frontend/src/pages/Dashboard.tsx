import { useState } from 'react';
import type { User } from '../types';
import './Dashboard.css';

interface DashboardProps {
    user: User | null;
}

type TabType = 'skill' | 'course' | 'jobs';

export default function Dashboard({ user }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('skill');

    const solvedEasy = user?.solved_easy || 1245;
    const solvedMedium = user?.solved_medium || 1754;
    const solvedHard = user?.solved_hard || 514;
    const totalSolved = solvedEasy + solvedMedium + solvedHard;
    const totalQuestions = 4616;
    const percentage = (totalSolved / totalQuestions) * 100;

    // Calculate stroke dasharray for the donut chart
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = (percentage / 100) * circumference;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                <div className="dashboard-date">
                    Last Updated on {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })} {new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>

            {/* User Card */}
            <div className="user-card">
                <div className="user-card-banner" />
                <div className="user-card-content">
                    <div className="user-avatar-wrapper">
                        <img
                            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=120&background=4361EE&color=fff`}
                            alt="Profile"
                            className="user-avatar"
                        />
                    </div>
                    <div className="user-info">
                        <h2 className="user-name">{user?.name || 'User'}</h2>
                        <p className="user-email">{user?.email}</p>

                        <div className="user-details">
                            <div className="user-detail">
                                <span className="user-detail-label">Register Number</span>
                                <span className="user-detail-value">{user?.registration_number || '21BCE7920'}</span>
                            </div>
                            <div className="user-detail">
                                <span className="user-detail-label">Degree</span>
                                <span className="user-detail-value">{user?.degree || 'B.Tech'} - {user?.branch || 'CSE'}</span>
                            </div>
                            <div className="user-detail">
                                <span className="user-detail-label">Batch</span>
                                <span className="user-detail-value">{user?.batch || '2021-2025'}</span>
                            </div>
                            <div className="user-detail">
                                <span className="user-detail-label">College</span>
                                <span className="user-detail-value">{user?.college || 'VIT Vellore'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="dashboard-tabs">
                <button
                    className={`dashboard-tab ${activeTab === 'skill' ? 'active' : ''}`}
                    onClick={() => setActiveTab('skill')}
                >
                    Skill
                </button>
                <button
                    className={`dashboard-tab ${activeTab === 'course' ? 'active' : ''}`}
                    onClick={() => setActiveTab('course')}
                >
                    Course
                </button>
                <button
                    className={`dashboard-tab ${activeTab === 'jobs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('jobs')}
                >
                    Jobs
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'skill' && (
                <div className="stats-section">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <h3 className="stat-card-title">Neo-PAT</h3>
                            <span className="stat-card-badge">Score</span>
                        </div>
                        <div className="stat-value">{user?.neo_pat_score || 1324}</div>
                        <div className="stat-label">Your Assessment Score</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <h3 className="stat-card-title">Solved Questions</h3>
                        </div>
                        <div className="solved-questions">
                            <div className="solved-chart">
                                <svg viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke="#e5e7eb"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke="#4361EE"
                                        strokeWidth="8"
                                        strokeDasharray={`${strokeDasharray} ${circumference}`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="solved-chart-center">
                                    <span className="solved-total">{totalSolved}</span>
                                    <span className="solved-label">Solved</span>
                                </div>
                            </div>

                            <div className="solved-breakdown">
                                <div className="solved-item">
                                    <div className="solved-dot easy"></div>
                                    <div className="solved-item-info">
                                        <span className="solved-item-label">Easy</span>
                                        <span className="solved-item-value">{solvedEasy}/1639</span>
                                    </div>
                                </div>
                                <div className="solved-item">
                                    <div className="solved-dot medium"></div>
                                    <div className="solved-item-info">
                                        <span className="solved-item-label">Medium</span>
                                        <span className="solved-item-value">{solvedMedium}/2366</span>
                                    </div>
                                </div>
                                <div className="solved-item">
                                    <div className="solved-dot hard"></div>
                                    <div className="solved-item-info">
                                        <span className="solved-item-label">Hard</span>
                                        <span className="solved-item-value">{solvedHard}/611</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <h3 className="stat-card-title">Neo-Colab</h3>
                        </div>
                        <div className="quick-stats">
                            <div className="quick-stat">
                                <div className="quick-stat-value">{user?.total_badges || 3}</div>
                                <div className="quick-stat-label">Badges Earned</div>
                            </div>
                            <div className="quick-stat">
                                <div className="quick-stat-value">{user?.total_certificates || 2}</div>
                                <div className="quick-stat-label">Certificates</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'course' && (
                <div className="stats-section">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <h3 className="stat-card-title">Enrolled Courses</h3>
                        </div>
                        <div className="stat-value">5</div>
                        <div className="stat-label">Active Courses</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <h3 className="stat-card-title">Completed Courses</h3>
                        </div>
                        <div className="stat-value">12</div>
                        <div className="stat-label">Courses Finished</div>
                    </div>
                </div>
            )}

            {activeTab === 'jobs' && (
                <div className="stats-section">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <h3 className="stat-card-title">Job Applications</h3>
                        </div>
                        <div className="stat-value">8</div>
                        <div className="stat-label">Applications Submitted</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <h3 className="stat-card-title">Interview Scheduled</h3>
                        </div>
                        <div className="stat-value">2</div>
                        <div className="stat-label">Upcoming Interviews</div>
                    </div>
                </div>
            )}
        </div>
    );
}
