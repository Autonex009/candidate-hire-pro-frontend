import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { adminApiService, API_HOST } from '../../services/api';
import {
    Video, Image, CheckSquare, Shuffle, BookOpen, Plus, Upload, FileSpreadsheet,
    Trash2, ChevronDown, ChevronRight, X, Eye, Wand2, ClipboardList, Library,
    ToggleLeft, ToggleRight, FileText
} from 'lucide-react';
import './TestManagement.css';

// ===== TYPES =====
interface Test {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    total_questions: number;
    is_published: boolean;
    created_at: string;
}

interface Division { id: number; name: string; }

interface Question {
    id: number;
    question_type: string;
    question_text: string;
    options?: string[];
    correct_answer?: string;
    media_url?: string;
    passage?: string;
    sentences?: string[];
    marks: number;
    difficulty: string;
}

// Question Types Configuration
const QUESTION_TYPES = [
    { id: 'video', name: 'Video Analysis', icon: Video, color: '#8b5cf6', bg: '#ede9fe' },
    { id: 'image', name: 'Image Description', icon: Image, color: '#f59e0b', bg: '#fef3c7' },
    { id: 'reading', name: 'Reading Summary', icon: BookOpen, color: '#ec4899', bg: '#fce7f3' },
    { id: 'jumble', name: 'Jumble Sentences', icon: Shuffle, color: '#3b82f6', bg: '#dbeafe' },
    { id: 'mcq', name: 'MCQ', icon: CheckSquare, color: '#10b981', bg: '#d1fae5' },
];

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
    easy: { bg: '#dcfce7', text: '#16a34a' },
    medium: { bg: '#fef3c7', text: '#d97706' },
    hard: { bg: '#fee2e2', text: '#dc2626' },
};

type TabType = 'tests' | 'generator' | 'question-bank';

// Section Config for Generator
interface SectionConfig {
    enabled: boolean;
    marksEach: number;
    hard: number;
    medium: number;
    easy: number;
}

type SectionsState = Record<string, SectionConfig>;

// ===== MEMOIZED QUESTION CARD =====
const QuestionCard = memo(({ question, onDelete }: { question: Question; onDelete: (id: number) => void }) => {
    const [expanded, setExpanded] = useState(false);
    const typeConfig = QUESTION_TYPES.find(t => t.id === question.question_type) || QUESTION_TYPES[4];
    const IconComponent = typeConfig.icon;
    const diffStyle = DIFFICULTY_COLORS[question.difficulty] || DIFFICULTY_COLORS.medium;

    return (
        <div className={`question-card ${expanded ? 'expanded' : ''}`}>
            <div className="question-card-header" onClick={() => setExpanded(!expanded)}>
                <div className="question-type-badge" style={{ background: typeConfig.bg }}>
                    <IconComponent size={18} color={typeConfig.color} />
                    <span style={{ color: typeConfig.color }}>{typeConfig.name}</span>
                </div>
                <span className="difficulty-pill" style={{ background: diffStyle.bg, color: diffStyle.text }}>
                    {question.difficulty}
                </span>
                <div className="question-card-actions">
                    <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); onDelete(question.id); }}>
                        <Trash2 size={16} />
                    </button>
                    {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
            </div>
            <p className="question-text">{question.question_text}</p>
            {expanded && (
                <div className="question-preview-panel">
                    {question.media_url && (
                        <div className="preview-block">
                            <label><Eye size={14} /> Media Preview</label>
                            {question.question_type === 'image' ? (
                                <img src={question.media_url.startsWith('/') ? `${API_HOST}${question.media_url}` : question.media_url} alt="Question media" className="preview-media-img" />
                            ) : (
                                <video src={question.media_url.startsWith('/') ? `${API_HOST}${question.media_url}` : question.media_url} controls className="preview-media-video" />
                            )}
                        </div>
                    )}
                    {question.options && question.options.length > 0 && (
                        <div className="preview-block">
                            <label>Options</label>
                            <div className="options-grid">
                                {question.options.map((opt, i) => (
                                    <div key={i} className={`option-chip ${opt === question.correct_answer ? 'correct' : ''}`}>
                                        <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                                        <span>{opt}</span>
                                        {opt === question.correct_answer && <CheckSquare size={14} className="check-icon" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

// ===== SECTION TOGGLE CARD =====
const SectionCard = memo(({
    type,
    config,
    onChange,
    questionCounts
}: {
    type: typeof QUESTION_TYPES[0];
    config: SectionConfig;
    onChange: (updates: Partial<SectionConfig>) => void;
    questionCounts: { hard: number; medium: number; easy: number };
}) => {
    const IconComponent = type.icon;
    const totalQuestions = config.hard + config.medium + config.easy;
    const totalMarks = totalQuestions * config.marksEach;

    return (
        <div className={`section-card ${config.enabled ? 'enabled' : 'disabled'}`}>
            <div className="section-header">
                <div className="section-title">
                    <div className="section-icon" style={{ background: type.bg }}>
                        <IconComponent size={20} color={type.color} />
                    </div>
                    <span>{type.name}</span>
                </div>
                <button
                    className={`toggle-btn ${config.enabled ? 'on' : 'off'}`}
                    onClick={() => onChange({ enabled: !config.enabled })}
                >
                    {config.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
            </div>

            {config.enabled && (
                <div className="section-body">
                    <div className="marks-row">
                        <label>Marks per question</label>
                        <input
                            type="number"
                            min="1"
                            value={config.marksEach}
                            onChange={e => onChange({ marksEach: Number(e.target.value) || 1 })}
                        />
                    </div>

                    <div className="difficulty-grid">
                        <div className="diff-input">
                            <label style={{ color: DIFFICULTY_COLORS.hard.text }}>Hard</label>
                            <input
                                type="number"
                                min="0"
                                max={questionCounts.hard}
                                value={config.hard}
                                onChange={e => onChange({ hard: Math.min(Number(e.target.value) || 0, questionCounts.hard) })}
                            />
                            <span className="available">/{questionCounts.hard} available</span>
                        </div>
                        <div className="diff-input">
                            <label style={{ color: DIFFICULTY_COLORS.medium.text }}>Medium</label>
                            <input
                                type="number"
                                min="0"
                                max={questionCounts.medium}
                                value={config.medium}
                                onChange={e => onChange({ medium: Math.min(Number(e.target.value) || 0, questionCounts.medium) })}
                            />
                            <span className="available">/{questionCounts.medium} available</span>
                        </div>
                        <div className="diff-input">
                            <label style={{ color: DIFFICULTY_COLORS.easy.text }}>Easy</label>
                            <input
                                type="number"
                                min="0"
                                max={questionCounts.easy}
                                value={config.easy}
                                onChange={e => onChange({ easy: Math.min(Number(e.target.value) || 0, questionCounts.easy) })}
                            />
                            <span className="available">/{questionCounts.easy} available</span>
                        </div>
                    </div>

                    <div className="section-summary">
                        <span>{totalQuestions} questions</span>
                        <span>•</span>
                        <span>{totalMarks} marks</span>
                    </div>
                </div>
            )}
        </div>
    );
});

// ===== MAIN COMPONENT =====
export default function TestManagement() {
    const [activeTab, setActiveTab] = useState<TabType>('tests');
    const [tests, setTests] = useState<Test[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [selectedDivision, setSelectedDivision] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    // Question Bank State
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadedFileUrl, setUploadedFileUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);
    const [questionForm, setQuestionForm] = useState({
        question_text: '', media_url: '', options: ['', '', '', ''],
        correct_answer: '', passage: '', sentences: ['', '', '', '', ''],
        difficulty: 'medium'
    });

    // Test Generator State
    const [generatorTitle, setGeneratorTitle] = useState('');
    const [generatorDuration, setGeneratorDuration] = useState(60);
    const [sections, setSections] = useState<SectionsState>(() => {
        const initial: SectionsState = {};
        QUESTION_TYPES.forEach(t => {
            initial[t.id] = { enabled: false, marksEach: 10, hard: 0, medium: 0, easy: 0 };
        });
        return initial;
    });

    // Question counts per type and difficulty
    const [questionCounts, setQuestionCounts] = useState<Record<string, { hard: number; medium: number; easy: number }>>({});

    // Load divisions
    useEffect(() => {
        adminApiService.getDivisions()
            .then((data: Division[]) => {
                setDivisions(data);
                if (data.length > 0) setSelectedDivision(data[0].id);
            })
            .catch(console.error);
    }, []);

    // Load data based on tab
    useEffect(() => {
        setLoading(true);
        if (activeTab === 'tests') {
            adminApiService.getTests().then(setTests).catch(console.error).finally(() => setLoading(false));
        } else if ((activeTab === 'question-bank' || activeTab === 'generator') && selectedDivision) {
            adminApiService.getQuestions({ division_id: selectedDivision })
                .then(data => {
                    setQuestions(data);
                    // Calculate counts per type and difficulty
                    const counts: Record<string, { hard: number; medium: number; easy: number }> = {};
                    QUESTION_TYPES.forEach(t => {
                        counts[t.id] = { hard: 0, medium: 0, easy: 0 };
                    });
                    data.forEach((q: Question) => {
                        if (counts[q.question_type]) {
                            counts[q.question_type][q.difficulty as 'hard' | 'medium' | 'easy']++;
                        }
                    });
                    setQuestionCounts(counts);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [activeTab, selectedDivision]);

    // Calculate summary
    const summary = useMemo(() => {
        let totalSections = 0;
        let totalQuestions = 0;
        let totalMarks = 0;

        Object.values(sections).forEach(s => {
            if (s.enabled) {
                totalSections++;
                const qCount = s.hard + s.medium + s.easy;
                totalQuestions += qCount;
                totalMarks += qCount * s.marksEach;
            }
        });

        return { totalSections, totalQuestions, totalMarks };
    }, [sections]);

    // Filtered questions
    const filteredQuestions = useMemo(() => {
        if (filterType === 'all') return questions;
        return questions.filter(q => q.question_type === filterType);
    }, [questions, filterType]);

    // Handlers
    const handlePublishTest = useCallback(async (testId: number) => {
        try {
            await adminApiService.publishTest(testId);
            setTests(prev => prev.map(t => t.id === testId ? { ...t, is_published: true } : t));
        } catch (error) { console.error('Failed to publish:', error); }
    }, []);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileType = selectedType as 'video' | 'image';
            const result = await adminApiService.uploadFile(file, fileType);
            setUploadedFileUrl(result.file_url);
            setQuestionForm(p => ({ ...p, media_url: result.file_url }));
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    }, [selectedType]);

    const handleExcelImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const result = await adminApiService.importQuestionsExcel(file);
            alert(`Imported ${result.imported} questions!`);
            const newQuestions = await adminApiService.getQuestions({ division_id: selectedDivision });
            setQuestions(newQuestions);
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Import failed');
        } finally {
            setLoading(false);
            if (excelInputRef.current) excelInputRef.current.value = '';
        }
    }, [selectedDivision]);

    const handleAddQuestion = useCallback(async () => {
        if (!questionForm.question_text || !selectedType) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            const data: any = {
                question_type: selectedType,
                question_text: questionForm.question_text,
                division_id: selectedDivision,
                difficulty: questionForm.difficulty,
            };
            if (selectedType === 'video' || selectedType === 'image') data.media_url = questionForm.media_url;
            if (selectedType === 'mcq') {
                data.options = questionForm.options.filter(o => o.trim());
                data.correct_answer = questionForm.correct_answer;
            }
            if (selectedType === 'reading') data.passage = questionForm.passage;
            if (selectedType === 'jumble') data.sentences = questionForm.sentences.filter(s => s.trim());

            await adminApiService.createQuestion(data);
            const newQuestions = await adminApiService.getQuestions({ division_id: selectedDivision });
            setQuestions(newQuestions);
            resetForm();
        } catch (error) {
            alert('Failed to add question');
        }
    }, [questionForm, selectedType, selectedDivision]);

    const resetForm = useCallback(() => {
        setShowAddForm(false);
        setSelectedType('');
        setUploadedFileUrl('');
        setQuestionForm({
            question_text: '', media_url: '', options: ['', '', '', ''],
            correct_answer: '', passage: '', sentences: ['', '', '', '', ''],
            difficulty: 'medium'
        });
    }, []);

    const handleDeleteQuestion = useCallback(async (id: number) => {
        if (!confirm('Delete this question?')) return;
        try {
            await adminApiService.deleteQuestion(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (error) { console.error('Failed to delete:', error); }
    }, []);

    const handleSectionChange = useCallback((typeId: string, updates: Partial<SectionConfig>) => {
        setSections(prev => ({
            ...prev,
            [typeId]: { ...prev[typeId], ...updates }
        }));
    }, []);

    const handleGenerateTest = useCallback(async () => {
        if (!generatorTitle.trim()) {
            alert('Please enter a test title');
            return;
        }
        if (summary.totalQuestions === 0) {
            alert('Please add at least one question to the test');
            return;
        }

        try {
            // Build request with difficulty breakdown
            const sectionData: any = {};
            Object.entries(sections).forEach(([typeId, config]) => {
                if (config.enabled && (config.hard + config.medium + config.easy > 0)) {
                    sectionData[typeId] = {
                        enabled: true,
                        marks_per_question: config.marksEach,
                        hard: config.hard,
                        medium: config.medium,
                        easy: config.easy
                    };
                }
            });

            await adminApiService.generateTest({
                title: generatorTitle,
                description: '',
                division_id: selectedDivision,
                duration_minutes: generatorDuration,
                sections: sectionData
            });

            alert('Test generated successfully!');
            setActiveTab('tests');
            const newTests = await adminApiService.getTests();
            setTests(newTests);

            // Reset generator
            setGeneratorTitle('');
            setSections(() => {
                const reset: SectionsState = {};
                QUESTION_TYPES.forEach(t => {
                    reset[t.id] = { enabled: false, marksEach: 10, hard: 0, medium: 0, easy: 0 };
                });
                return reset;
            });
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to generate test');
        }
    }, [generatorTitle, generatorDuration, selectedDivision, sections, summary]);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB');

    return (
        <div className="test-management">
            {/* Header */}
            <div className="page-header">
                <h1>Test Management</h1>
                <p className="page-subtitle">Manage tests, generate new ones, and build question banks</p>
            </div>

            {/* Tab Menu */}
            <div className="tab-menu">
                <button className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
                    <ClipboardList size={18} /> Tests
                </button>
                <button className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`} onClick={() => setActiveTab('generator')}>
                    <Wand2 size={18} /> Test Generator
                </button>
                <button className={`tab-btn ${activeTab === 'question-bank' ? 'active' : ''}`} onClick={() => setActiveTab('question-bank')}>
                    <Library size={18} /> Question Bank
                </button>
            </div>

            {/* ===== TESTS TAB ===== */}
            {activeTab === 'tests' && (
                <div className="tab-content">
                    <div className="content-header">
                        <h2>All Tests</h2>
                        <span className="count-badge">{tests.length} tests</span>
                    </div>
                    {loading ? (
                        <div className="loading-state">Loading tests...</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>TEST NAME</th><th>DURATION</th><th>QUESTIONS</th><th>STATUS</th><th>CREATED</th><th>ACTIONS</th></tr>
                            </thead>
                            <tbody>
                                {tests.length === 0 ? (
                                    <tr><td colSpan={6} className="empty-row">No tests yet. Use Test Generator to create one.</td></tr>
                                ) : tests.map(test => (
                                    <tr key={test.id}>
                                        <td className="test-name">{test.title}</td>
                                        <td>{test.duration_minutes} min</td>
                                        <td>{test.total_questions}</td>
                                        <td><span className={`status-badge ${test.is_published ? 'published' : 'draft'}`}>{test.is_published ? 'Published' : 'Draft'}</span></td>
                                        <td>{formatDate(test.created_at)}</td>
                                        <td>
                                            <button className="action-icon"><Eye size={18} /></button>
                                            {!test.is_published && <button className="publish-btn" onClick={() => handlePublishTest(test.id)}>Publish</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ===== TEST GENERATOR TAB ===== */}
            {activeTab === 'generator' && (
                <div className="generator-layout">
                    <div className="generator-main">
                        {/* Basic Details */}
                        <div className="generator-section">
                            <h3>1. Basic Details</h3>
                            <div className="basic-details-grid">
                                <div className="form-group">
                                    <label>Division</label>
                                    <select value={selectedDivision} onChange={e => setSelectedDivision(Number(e.target.value))}>
                                        {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Test Title</label>
                                    <input placeholder="e.g. Standard English Proficiency Test - Set A" value={generatorTitle} onChange={e => setGeneratorTitle(e.target.value)} />
                                </div>
                                <div className="form-group small">
                                    <label>Duration (mins)</label>
                                    <input type="number" value={generatorDuration} onChange={e => setGeneratorDuration(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>

                        {/* Paper Structure */}
                        <div className="generator-section">
                            <h3>2. Paper Structure</h3>
                            <p className="section-hint">Toggle sections to include, then set difficulty breakdown for each</p>

                            <div className="sections-grid">
                                {QUESTION_TYPES.map(type => (
                                    <SectionCard
                                        key={type.id}
                                        type={type}
                                        config={sections[type.id]}
                                        onChange={updates => handleSectionChange(type.id, updates)}
                                        questionCounts={questionCounts[type.id] || { hard: 0, medium: 0, easy: 0 }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="summary-panel">
                        <h3>Summary</h3>
                        <div className="summary-row">
                            <span>Sections</span>
                            <span className="summary-value">{summary.totalSections}</span>
                        </div>
                        <div className="summary-row">
                            <span>Questions</span>
                            <span className="summary-value">{summary.totalQuestions}</span>
                        </div>
                        <div className="summary-divider" />
                        <div className="summary-row total">
                            <span>Total Marks</span>
                            <span className="summary-value">{summary.totalMarks}</span>
                        </div>

                        <button className="btn-generate" onClick={handleGenerateTest} disabled={summary.totalQuestions === 0}>
                            <FileText size={18} /> Generate Paper
                        </button>

                        <div className="summary-note">
                            <strong>Note:</strong> Questions will be randomly selected from the question bank at the time of generation.
                        </div>
                    </div>
                </div>
            )}

            {/* ===== QUESTION BANK TAB ===== */}
            {activeTab === 'question-bank' && (
                <div className="tab-content">
                    <div className="toolbar">
                        <div className="toolbar-left">
                            <select className="division-select" value={selectedDivision} onChange={e => setSelectedDivision(Number(e.target.value))}>
                                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="toolbar-right">
                            <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.json" hidden onChange={handleExcelImport} />
                            <button className="btn-secondary" onClick={() => excelInputRef.current?.click()}>
                                <FileSpreadsheet size={16} /> Import Excel
                            </button>
                            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                                <Plus size={16} /> Add Question
                            </button>
                        </div>
                    </div>

                    {/* Add Question Modal */}
                    {showAddForm && (
                        <div className="modal-overlay" onClick={resetForm}>
                            <div className="modal" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{selectedType ? `Add ${QUESTION_TYPES.find(t => t.id === selectedType)?.name} Question` : 'Select Question Type'}</h2>
                                    <button className="close-btn" onClick={resetForm}><X size={20} /></button>
                                </div>
                                {!selectedType ? (
                                    <div className="type-grid">
                                        {QUESTION_TYPES.map(type => {
                                            const Icon = type.icon;
                                            return (
                                                <button key={type.id} className="type-card" onClick={() => setSelectedType(type.id)}>
                                                    <div className="type-icon" style={{ background: type.bg }}><Icon size={28} color={type.color} /></div>
                                                    <span>{type.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="question-form">
                                        {(selectedType === 'video' || selectedType === 'image') && (
                                            <div className="form-section">
                                                <label>Upload {selectedType}</label>
                                                <div className="upload-zone">
                                                    <input ref={fileInputRef} type="file" accept={selectedType === 'video' ? 'video/*' : 'image/*'} hidden onChange={handleFileUpload} />
                                                    {uploadedFileUrl ? (
                                                        <div className="upload-preview">
                                                            {selectedType === 'image' ? <img src={`${API_HOST}${uploadedFileUrl}`} alt="Preview" /> : <video src={`${API_HOST}${uploadedFileUrl}`} controls />}
                                                            <button className="remove-btn" onClick={() => { setUploadedFileUrl(''); setQuestionForm(p => ({ ...p, media_url: '' })); }}><Trash2 size={16} /> Remove</button>
                                                        </div>
                                                    ) : (
                                                        <div className="upload-prompt" onClick={() => fileInputRef.current?.click()}>
                                                            <Upload size={32} /><span>{uploading ? 'Uploading...' : `Click to upload ${selectedType}`}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {selectedType === 'reading' && (
                                            <div className="form-section">
                                                <label>Passage</label>
                                                <textarea rows={4} placeholder="Enter reading passage..." value={questionForm.passage} onChange={e => setQuestionForm(p => ({ ...p, passage: e.target.value }))} />
                                            </div>
                                        )}
                                        {selectedType === 'jumble' && (
                                            <div className="form-section">
                                                <label>Sentences (correct order)</label>
                                                {questionForm.sentences.map((s, i) => (
                                                    <input key={i} placeholder={`Sentence ${i + 1}`} value={s} onChange={e => { const u = [...questionForm.sentences]; u[i] = e.target.value; setQuestionForm(p => ({ ...p, sentences: u })); }} />
                                                ))}
                                            </div>
                                        )}
                                        <div className="form-section">
                                            <label>Question *</label>
                                            <textarea rows={2} placeholder="Enter question..." value={questionForm.question_text} onChange={e => setQuestionForm(p => ({ ...p, question_text: e.target.value }))} />
                                        </div>
                                        {selectedType === 'mcq' && (
                                            <>
                                                <div className="form-section">
                                                    <label>Options</label>
                                                    <div className="options-inputs">
                                                        {questionForm.options.map((opt, i) => (
                                                            <div key={i} className="option-row">
                                                                <span className="option-badge">{String.fromCharCode(65 + i)}</span>
                                                                <input placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={e => { const u = [...questionForm.options]; u[i] = e.target.value; setQuestionForm(p => ({ ...p, options: u })); }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="form-section">
                                                    <label>Correct Answer</label>
                                                    <select value={questionForm.correct_answer} onChange={e => setQuestionForm(p => ({ ...p, correct_answer: e.target.value }))}>
                                                        <option value="">Select correct answer</option>
                                                        {questionForm.options.filter(o => o.trim()).map((opt, i) => <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                        <div className="form-section">
                                            <label>Difficulty</label>
                                            <div className="difficulty-btns">
                                                {['easy', 'medium', 'hard'].map(d => (
                                                    <button key={d} className={`diff-btn ${questionForm.difficulty === d ? 'active' : ''}`} style={questionForm.difficulty === d ? { background: DIFFICULTY_COLORS[d].bg, color: DIFFICULTY_COLORS[d].text } : {}} onClick={() => setQuestionForm(p => ({ ...p, difficulty: d }))}>{d.charAt(0).toUpperCase() + d.slice(1)}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="form-actions">
                                            <button className="btn-secondary" onClick={() => setSelectedType('')}>Back</button>
                                            <button className="btn-primary" onClick={handleAddQuestion}>Add Question</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Filter Pills */}
                    <div className="filter-bar">
                        <span className="count">{filteredQuestions.length} Questions</span>
                        <div className="filter-pills">
                            <button className={`filter-pill ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All</button>
                            {QUESTION_TYPES.map(type => {
                                const Icon = type.icon;
                                return (
                                    <button key={type.id} className={`filter-pill ${filterType === type.id ? 'active' : ''}`} style={filterType === type.id ? { background: type.bg, color: type.color } : {}} onClick={() => setFilterType(type.id)}>
                                        <Icon size={14} /> {type.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Questions Grid */}
                    <div className="questions-grid">
                        {loading ? (
                            <div className="loading-state">Loading questions...</div>
                        ) : filteredQuestions.length === 0 ? (
                            <div className="empty-state"><Library size={48} /><p>No questions yet</p></div>
                        ) : (
                            filteredQuestions.map(q => <QuestionCard key={q.id} question={q} onDelete={handleDeleteQuestion} />)
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
