import { useState, useEffect } from 'react';
import { adminApiService } from '../../services/api';
import './JobManagement.css';

interface Job {
    id: number;
    title: string;
    company: string;
    division: string;
    type: 'full-time' | 'part-time' | 'contract';
    location: string;
    applications: number;
    status: 'active' | 'closed' | 'draft';
    assessments: string[];
    createdAt: string;
}

interface Division {
    id: number;
    name: string;
    description?: string;
}

interface Assessment {
    id: number;
    title: string;
    division_id: number | null;
}

const mockJobs: Job[] = [
    { id: 1, title: 'Data Annotator - Text', company: 'Autonex AI', division: 'nlp', type: 'full-time', location: 'Remote', applications: 45, status: 'active', assessments: ['nlp_1', 'nlp_2'], createdAt: '2024-01-15' },
    { id: 2, title: 'Image Annotation Specialist', company: 'Autonex AI', division: 'robotics', type: 'contract', location: 'Bangalore', applications: 32, status: 'active', assessments: ['rob_1', 'rob_2'], createdAt: '2024-01-14' },
    { id: 3, title: 'Video Labeling Expert', company: 'Autonex AI', division: 'youtori', type: 'part-time', location: 'Remote', applications: 18, status: 'active', assessments: ['you_1'], createdAt: '2024-01-12' },
    { id: 4, title: 'NLP Data Curator', company: 'Autonex AI', division: 'nlp', type: 'full-time', location: 'Mumbai', applications: 56, status: 'closed', assessments: ['nlp_1'], createdAt: '2024-01-10' },
    { id: 5, title: 'Quality Assurance Annotator', company: 'Autonex AI', division: 'robotics', type: 'contract', location: 'Remote', applications: 0, status: 'draft', assessments: [], createdAt: '2024-01-08' },
];

export default function JobManagement() {
    const [jobs] = useState<Job[]>(mockJobs);
    const [showModal, setShowModal] = useState(false);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [tests, setTests] = useState<Assessment[]>([]);
    const [loadingDivisions, setLoadingDivisions] = useState(true);

    // Form state
    const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
    const [selectedAssessments, setSelectedAssessments] = useState<number[]>([]);

    // Fetch divisions and tests on mount
    useEffect(() => {
        fetchDivisions();
        fetchTests();
    }, []);

    const fetchDivisions = async () => {
        try {
            const data = await adminApiService.getDivisions();
            setDivisions(data);
        } catch (error) {
            console.error('Failed to fetch divisions:', error);
        } finally {
            setLoadingDivisions(false);
        }
    };

    const fetchTests = async () => {
        try {
            const data = await adminApiService.getTests({ is_published: true });
            setTests(data);
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        }
    };

    // Filter tests by selected division
    const filteredAssessments = tests.filter(t => t.division_id === selectedDivision);

    const handleDivisionChange = (divisionId: number | null) => {
        setSelectedDivision(divisionId);
        setSelectedAssessments([]); // Reset assessments when division changes
    };

    const toggleAssessment = (assessmentId: number) => {
        setSelectedAssessments(prev =>
            prev.includes(assessmentId)
                ? prev.filter(id => id !== assessmentId)
                : [...prev, assessmentId]
        );
    };

    const getDivisionName = (divisionId: string | number) => {
        const div = divisions.find(d => d.id === Number(divisionId) || d.name.toLowerCase().includes(String(divisionId).toLowerCase()));
        return div?.name || String(divisionId);
    };

    return (
        <div className="job-management">
            <div className="page-header">
                <div>
                    <h1>Job Management</h1>
                    <p>Create and manage annotation job postings</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    + Create New Job
                </button>
            </div>

            {/* Stats Summary */}
            <div className="job-stats">
                <div className="job-stat-card">
                    <span className="stat-number">5</span>
                    <span className="stat-label">Total Jobs</span>
                </div>
                <div className="job-stat-card">
                    <span className="stat-number green">3</span>
                    <span className="stat-label">Active</span>
                </div>
                <div className="job-stat-card">
                    <span className="stat-number orange">1</span>
                    <span className="stat-label">Drafts</span>
                </div>
                <div className="job-stat-card">
                    <span className="stat-number">151</span>
                    <span className="stat-label">Total Applications</span>
                </div>
            </div>

            {/* Jobs Grid */}
            <div className="jobs-grid">
                {jobs.map(job => (
                    <div key={job.id} className="job-card">
                        <div className="job-card-header">
                            <div className="job-company-logo">
                                {job.company.charAt(0)}
                            </div>
                            <span className={`job-status ${job.status}`}>{job.status}</span>
                        </div>
                        <h3 className="job-title">{job.title}</h3>
                        <p className="job-company">{job.company}</p>
                        <span className="job-division-badge">{getDivisionName(job.division)}</span>

                        <div className="job-meta">
                            <span className="job-meta-item">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                {job.location}
                            </span>
                            <span className="job-meta-item">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                </svg>
                                {job.type}
                            </span>
                        </div>

                        <div className="job-card-footer">
                            <span className="applications-count">
                                <strong>{job.applications}</strong> applications
                            </span>
                            <div className="job-actions">
                                <button className="icon-btn" title="Edit">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                </button>
                                <button className="icon-btn" title="View Candidates">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Job Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Job</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Division Selection - First */}
                            <div className="form-group">
                                <label>Division / Department *</label>
                                <select
                                    value={selectedDivision ?? ''}
                                    onChange={(e) => handleDivisionChange(e.target.value ? Number(e.target.value) : null)}
                                    className="division-dropdown"
                                    disabled={loadingDivisions}
                                >
                                    <option value="">{loadingDivisions ? 'Loading...' : '-- Select Division --'}</option>
                                    {divisions.map(div => (
                                        <option key={div.id} value={div.id}>{div.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Job Title</label>
                                <input type="text" placeholder="e.g., Data Annotator - Text" />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Employment Type</label>
                                    <select>
                                        <option value="full-time">Full-time</option>
                                        <option value="part-time">Part-time</option>
                                        <option value="contract">Contract</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input type="text" placeholder="e.g., Remote, Bangalore" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Job Description</label>
                                <textarea placeholder="Describe the role and responsibilities..." rows={3}></textarea>
                            </div>

                            <div className="form-group">
                                <label>Required Skills</label>
                                <input type="text" placeholder="e.g., Attention to detail, English proficiency" />
                            </div>

                            {/* Assessment Selection - Based on Division */}
                            <div className="form-group">
                                <label>Link Assessments {selectedDivision && `(${getDivisionName(selectedDivision)})`}</label>
                                {!selectedDivision ? (
                                    <div className="assessment-hint">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                        </svg>
                                        Please select a division first to see available assessments
                                    </div>
                                ) : filteredAssessments.length === 0 ? (
                                    <div className="assessment-hint warning">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                        </svg>
                                        No assessments found for this division. Create one in Test Generator.
                                    </div>
                                ) : (
                                    <div className="assessment-list">
                                        {filteredAssessments.map(a => (
                                            <label key={a.id} className={`assessment-item ${selectedAssessments.includes(a.id) ? 'selected' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssessments.includes(a.id)}
                                                    onChange={() => toggleAssessment(a.id)}
                                                />
                                                <span className="assessment-name">{a.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-primary" disabled={!selectedDivision}>Publish Job</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
