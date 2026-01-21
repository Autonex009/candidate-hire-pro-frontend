import './ReportsPage.css';

export default function ReportsPage() {
    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p>View insights and export data</p>
                </div>
            </div>

            {/* Report Cards */}
            <div className="reports-grid">
                <div className="report-card">
                    <div className="report-icon blue">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                    </div>
                    <h3>Candidate Report</h3>
                    <p>Export all candidate data with test scores and status</p>
                    <button className="btn-secondary">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        Download CSV
                    </button>
                </div>

                <div className="report-card">
                    <div className="report-icon green">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                        </svg>
                    </div>
                    <h3>Assessment Report</h3>
                    <p>Detailed test performance and pass rates</p>
                    <button className="btn-secondary">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        Download CSV
                    </button>
                </div>

                <div className="report-card">
                    <div className="report-icon purple">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                        </svg>
                    </div>
                    <h3>Job Pipeline Report</h3>
                    <p>Applications per job and hiring funnel metrics</p>
                    <button className="btn-secondary">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        Download CSV
                    </button>
                </div>

                <div className="report-card">
                    <div className="report-icon orange">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                        </svg>
                    </div>
                    <h3>Flagged Attempts</h3>
                    <p>All anti-cheating flags and suspicious activities</p>
                    <button className="btn-secondary">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-section">
                <h2>Quick Stats</h2>
                <div className="quick-stats-grid">
                    <div className="quick-stat">
                        <span className="quick-stat-number">1,234</span>
                        <span className="quick-stat-label">Total Candidates</span>
                    </div>
                    <div className="quick-stat">
                        <span className="quick-stat-number">892</span>
                        <span className="quick-stat-label">Tests Completed</span>
                    </div>
                    <div className="quick-stat">
                        <span className="quick-stat-number">78%</span>
                        <span className="quick-stat-label">Avg Pass Rate</span>
                    </div>
                    <div className="quick-stat">
                        <span className="quick-stat-number">156</span>
                        <span className="quick-stat-label">Hired This Month</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
