import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAntiCheat, useTestTimer } from '../../hooks/useAntiCheat';
import './TestTaking.css';

interface Question {
    id: number;
    question_type: string;
    question_text: string;
    options?: string[];
    media_url?: string;
    marks: number;
}

interface TestSession {
    attempt_id: number;
    test_id: number;
    test_title: string;
    duration_minutes: number;
    total_questions: number;
    questions: Question[];
    started_at: string;
}

export default function TestTaking() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();

    const [session, setSession] = useState<TestSession | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    // Anti-cheat hook
    const antiCheat = useAntiCheat({
        onViolation: (type, count) => {
            console.log(`Violation: ${type}, count: ${count}`);
            if (type === 'tab_switch') {
                setWarningMessage(`Warning: Tab switch detected (${count}/3). Multiple switches may flag your test.`);
                setShowWarning(true);
                // Report to backend
                reportViolation('tab_switch');
            } else if (type === 'fullscreen_exit') {
                setWarningMessage(`Warning: Fullscreen exit detected (${count}/2). Please stay in fullscreen mode.`);
                setShowWarning(true);
                reportViolation('fullscreen_exit');
            }
        },
        maxTabSwitches: 3,
        maxFullscreenExits: 2,
        enableCopyProtection: true,
        enableFullscreenMode: true
    });

    // Timer hook
    const timer = useTestTimer(session?.duration_minutes || 60, () => {
        // Auto-submit when time is up
        handleSubmitTest();
    });

    // Report violation to backend
    const reportViolation = async (type: string) => {
        if (!session) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:8000/api/tests/flag-violation/${session.attempt_id}?violation_type=${type}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Failed to report violation:', error);
        }
    };

    // Start test session
    useEffect(() => {
        const startTest = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8000/api/tests/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ test_id: parseInt(testId || '0') })
                });

                if (response.ok) {
                    const data = await response.json();
                    setSession(data);
                    timer.start();
                    // Request fullscreen
                    antiCheat.requestFullscreen();
                } else {
                    navigate('/tests');
                }
            } catch (error) {
                console.error('Failed to start test:', error);
                navigate('/tests');
            } finally {
                setLoading(false);
            }
        };

        if (testId) {
            startTest();
        }
    }, [testId]);

    // Submit answer
    const handleSelectAnswer = useCallback((questionId: number, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    }, []);

    // Navigate questions
    const goToQuestion = (index: number) => {
        if (index >= 0 && index < (session?.questions.length || 0)) {
            setCurrentQuestionIndex(index);
        }
    };

    // Submit test
    const handleSubmitTest = async () => {
        if (!session) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');

            // Submit all answers
            for (const [questionId, answerText] of Object.entries(answers)) {
                await fetch(`http://localhost:8000/api/tests/submit-answer?attempt_id=${session.attempt_id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        question_id: parseInt(questionId),
                        answer_text: answerText
                    })
                });
            }

            // Complete test
            const response = await fetch(`http://localhost:8000/api/tests/complete/${session.attempt_id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                antiCheat.exitFullscreen();
                navigate(`/test-result/${session.attempt_id}`, { state: { result } });
            }
        } catch (error) {
            console.error('Failed to submit test:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="test-loading">
                <div className="spinner"></div>
                <p>Loading test...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="test-error">
                <p>Failed to load test. Please try again.</p>
                <button onClick={() => navigate('/tests')}>Back to Tests</button>
            </div>
        );
    }

    const currentQuestion = session.questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / session.total_questions) * 100;

    return (
        <div className="test-taking-page">
            {/* Warning Modal */}
            {showWarning && (
                <div className="warning-overlay">
                    <div className="warning-modal">
                        <div className="warning-icon">⚠️</div>
                        <p>{warningMessage}</p>
                        <button onClick={() => setShowWarning(false)}>I Understand</button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="test-header">
                <div className="test-info">
                    <h1>{session.test_title}</h1>
                    <span className="question-counter">
                        Question {currentQuestionIndex + 1} of {session.total_questions}
                    </span>
                </div>
                <div className="test-timer" data-urgent={timer.timeRemaining < 300}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                    </svg>
                    <span>{timer.formattedTime}</span>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="test-progress">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="progress-text">{answeredCount}/{session.total_questions} answered</span>
            </div>

            {/* Anti-cheat status */}
            {antiCheat.isFlagged && (
                <div className="flagged-banner">
                    ⚠️ Your test has been flagged for review due to suspicious activity
                </div>
            )}

            {/* Main Content */}
            <div className="test-content">
                {/* Question Navigation Sidebar */}
                <aside className="question-nav">
                    <h3>Questions</h3>
                    <div className="question-grid">
                        {session.questions.map((q, idx) => (
                            <button
                                key={q.id}
                                className={`question-btn ${idx === currentQuestionIndex ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
                                onClick={() => goToQuestion(idx)}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                    <div className="nav-legend">
                        <span><span className="dot answered"></span> Answered</span>
                        <span><span className="dot current"></span> Current</span>
                        <span><span className="dot"></span> Not answered</span>
                    </div>
                </aside>

                {/* Question Display */}
                <main className="question-area">
                    <div className="question-card">
                        <div className="question-header">
                            <span className="question-type">{currentQuestion.question_type.toUpperCase()}</span>
                            <span className="question-marks">{currentQuestion.marks} marks</span>
                        </div>

                        <div className="question-text">
                            {currentQuestion.question_text}
                        </div>

                        {/* MCQ Options */}
                        {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                            <div className="options-list">
                                {currentQuestion.options.map((option, idx) => (
                                    <label
                                        key={idx}
                                        className={`option-item ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${currentQuestion.id}`}
                                            value={option}
                                            checked={answers[currentQuestion.id] === option}
                                            onChange={() => handleSelectAnswer(currentQuestion.id, option)}
                                        />
                                        <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                                        <span className="option-text">{option}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Text Annotation */}
                        {currentQuestion.question_type === 'text_annotation' && (
                            <div className="text-annotation-area">
                                <textarea
                                    placeholder="Enter your annotation..."
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleSelectAnswer(currentQuestion.id, e.target.value)}
                                    rows={6}
                                />
                            </div>
                        )}

                        {/* Image Annotation */}
                        {currentQuestion.question_type === 'image_annotation' && currentQuestion.media_url && (
                            <div className="image-annotation-area">
                                <img src={currentQuestion.media_url} alt="Annotation target" />
                                <p className="annotation-hint">Image annotation tool would be here</p>
                                <textarea
                                    placeholder="Describe your annotations..."
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleSelectAnswer(currentQuestion.id, e.target.value)}
                                    rows={4}
                                />
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="question-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => goToQuestion(currentQuestionIndex - 1)}
                            disabled={currentQuestionIndex === 0}
                        >
                            ← Previous
                        </button>

                        {currentQuestionIndex === session.questions.length - 1 ? (
                            <button
                                className="btn-submit"
                                onClick={handleSubmitTest}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Test'}
                            </button>
                        ) : (
                            <button
                                className="btn-primary"
                                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                            >
                                Next →
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
