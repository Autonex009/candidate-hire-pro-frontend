import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TestsList.css';

interface AvailableTest {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    total_questions: number;
    total_marks: number;
    has_attempted: boolean;
    attempt_status: string | null;
    last_score: number | null;
    last_percentage: number | null;
}

export default function TestsList() {
    const navigate = useNavigate();
    const [tests, setTests] = useState<AvailableTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'attempted'>('all');

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/tests/available', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTests(data);
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTests = tests.filter(test => {
        if (filter === 'new') return !test.has_attempted;
        if (filter === 'attempted') return test.has_attempted;
        return true;
    });

    const handleStartTest = (testId: number) => {
        navigate(`/test/${testId}`);
    };

    if (loading) {
        return (
            <div className="tests-loading">
                <div className="spinner"></div>
                <p>Loading available tests...</p>
            </div>
        );
    }

    return (
        <div className="tests-list-page">
            <header className="tests-header">
                <div className="header-content">
                    <h1>Available Assessments</h1>
                    <p>Complete assessments to showcase your skills</p>
                </div>
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ← Dashboard
                </button>
            </header>

            {/* Filters */}
            <div className="tests-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Tests ({tests.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
                    onClick={() => setFilter('new')}
                >
                    New ({tests.filter(t => !t.has_attempted).length})
                </button>
                <button
                    className={`filter-btn ${filter === 'attempted' ? 'active' : ''}`}
                    onClick={() => setFilter('attempted')}
                >
                    Attempted ({tests.filter(t => t.has_attempted).length})
                </button>
            </div>

            {/* Tests Grid */}
            <div className="tests-grid">
                {filteredTests.length === 0 ? (
                    <div className="no-tests">
                        <p>No tests available at the moment.</p>
                    </div>
                ) : (
                    filteredTests.map(test => (
                        <div key={test.id} className={`test-card ${test.has_attempted ? 'attempted' : ''}`}>
                            <div className="test-card-header">
                                <span className="test-type-badge">Assessment</span>
                                {test.has_attempted && (
                                    <span className={`status-badge ${test.attempt_status}`}>
                                        {test.attempt_status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                                    </span>
                                )}
                            </div>

                            <h3 className="test-title">{test.title}</h3>
                            {test.description && (
                                <p className="test-description">{test.description}</p>
                            )}

                            <div className="test-meta">
                                <div className="meta-item">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                                    </svg>
                                    <span>{test.duration_minutes} mins</span>
                                </div>
                                <div className="meta-item">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" />
                                    </svg>
                                    <span>{test.total_questions} questions</span>
                                </div>
                                <div className="meta-item">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                    </svg>
                                    <span>{test.total_marks} marks</span>
                                </div>
                            </div>

                            {test.has_attempted && test.last_percentage !== null && (
                                <div className="last-score">
                                    <span className="score-label">Last Score:</span>
                                    <span className={`score-value ${test.last_percentage >= 50 ? 'pass' : 'fail'}`}>
                                        {Math.round(test.last_percentage)}%
                                    </span>
                                </div>
                            )}

                            <button
                                className="start-test-btn"
                                onClick={() => handleStartTest(test.id)}
                            >
                                {test.has_attempted
                                    ? (test.attempt_status === 'completed' ? 'Retake Test' : 'Continue')
                                    : 'Start Test'
                                }
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
