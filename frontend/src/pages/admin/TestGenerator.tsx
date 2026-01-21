import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiService } from '../../services/api';
import './TestGenerator.css';

interface QuestionModule {
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
    count: number;
    marksEach: number;
}

interface Division {
    id: number;
    name: string;
    description?: string;
}

const initialModules: QuestionModule[] = [
    { id: 'video', name: 'Video Analysis', icon: '🎬', enabled: true, count: 1, marksEach: 15 },
    { id: 'image', name: 'Image Description', icon: '🖼️', enabled: true, count: 1, marksEach: 15 },
    { id: 'reading', name: 'Reading Summary', icon: '📖', enabled: true, count: 1, marksEach: 15 },
    { id: 'jumble', name: 'Jumble Sentences', icon: '🔤', enabled: true, count: 20, marksEach: 1 },
    { id: 'mcq_grammar', name: 'MCQ: Grammar', icon: '✓', enabled: true, count: 15, marksEach: 1 },
    { id: 'mcq_context', name: 'MCQ: Context', icon: '📝', enabled: true, count: 19, marksEach: 1 },
    { id: 'text_annotation', name: 'Text Annotation', icon: '📄', enabled: false, count: 5, marksEach: 4 },
    { id: 'bounding_box', name: 'Bounding Box', icon: '⬜', enabled: false, count: 5, marksEach: 4 },
];

export default function TestGenerator() {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
    const [showDivisionModal, setShowDivisionModal] = useState(false);
    const [newDivisionName, setNewDivisionName] = useState('');
    const [loadingDivisions, setLoadingDivisions] = useState(true);

    const [testTitle, setTestTitle] = useState('');
    const [duration, setDuration] = useState(60);
    const [modules, setModules] = useState<QuestionModule[]>(initialModules);

    const [generating, setGenerating] = useState(false);

    // Fetch divisions on mount
    useEffect(() => {
        fetchDivisions();
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

    // Calculate summary
    const enabledModules = modules.filter(m => m.enabled);
    const totalQuestions = enabledModules.reduce((sum, m) => sum + m.count, 0);
    const calculatedMarks = enabledModules.reduce((sum, m) => sum + (m.count * m.marksEach), 0);

    const toggleModule = (id: string) => {
        setModules(prev => prev.map(m =>
            m.id === id ? { ...m, enabled: !m.enabled } : m
        ));
    };

    const updateModule = (id: string, field: 'count' | 'marksEach', value: number) => {
        setModules(prev => prev.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const addDivision = async () => {
        if (newDivisionName.trim()) {
            try {
                const newDivision = await adminApiService.createDivision({
                    name: newDivisionName.trim()
                });
                setDivisions(prev => [...prev, newDivision]);
                setNewDivisionName('');
                setShowDivisionModal(false);
            } catch (error) {
                console.error('Failed to create division:', error);
                alert('Failed to create division');
            }
        }
    };

    const handleGenerate = async () => {
        if (!selectedDivision || !testTitle) {
            alert('Please select a division and enter a test title');
            return;
        }

        setGenerating(true);
        try {
            const enabledMods = modules.filter(m => m.enabled);

            // Map modules to API format
            const mcqModule = enabledMods.find(m => m.id.includes('mcq'));
            const textModule = enabledMods.find(m => m.id === 'text_annotation' || m.id === 'reading');
            const imageModule = enabledMods.find(m => m.id === 'bounding_box' || m.id === 'image');
            const videoModule = enabledMods.find(m => m.id === 'video');

            await adminApiService.generateTest({
                title: testTitle,
                description: `Generated test for ${divisions.find(d => d.id === selectedDivision)?.name}`,
                division_id: selectedDivision,
                duration_minutes: duration,
                mcq: mcqModule ? {
                    enabled: true,
                    count: mcqModule.count,
                    marks_per_question: mcqModule.marksEach
                } : undefined,
                text_annotation: textModule ? {
                    enabled: true,
                    count: textModule.count,
                    marks_per_question: textModule.marksEach
                } : undefined,
                image_annotation: imageModule ? {
                    enabled: true,
                    count: imageModule.count,
                    marks_per_question: imageModule.marksEach
                } : undefined,
                video_annotation: videoModule ? {
                    enabled: true,
                    count: videoModule.count,
                    marks_per_question: videoModule.marksEach
                } : undefined
            });

            alert('Test paper generated successfully!');
            navigate('/admin/tests');
        } catch (error) {
            console.error('Failed to generate test:', error);
            alert('Failed to generate test');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="test-generator">
            <div className="generator-header">
                <div className="header-icon">⚙️</div>
                <div>
                    <h1>Test Generator</h1>
                    <p>Configure the structure and let AI generate the paper.</p>
                </div>
            </div>

            <div className="generator-layout">
                <div className="generator-main">
                    {/* Step 1: Select Division */}
                    <div className="generator-section">
                        <h2>0. Select Division</h2>
                        <p className="section-desc">Choose the department this test is for</p>

                        <div className="division-selector">
                            <select
                                value={selectedDivision || ''}
                                onChange={(e) => setSelectedDivision(e.target.value ? Number(e.target.value) : null)}
                                className="division-select"
                                disabled={loadingDivisions}
                            >
                                <option value="">{loadingDivisions ? 'Loading...' : '-- Select Division --'}</option>
                                {divisions.map(div => (
                                    <option key={div.id} value={div.id}>{div.name}</option>
                                ))}
                            </select>
                            <button
                                className="btn-add-division"
                                onClick={() => setShowDivisionModal(true)}
                            >
                                + Add New
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Basic Details */}
                    <div className="generator-section">
                        <h2>1. Basic Details</h2>

                        <div className="form-group">
                            <label>Test Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Standard English Proficiency Test - Set A"
                                value={testTitle}
                                onChange={(e) => setTestTitle(e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Duration (mins)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Calculated Marks</label>
                                <div className="calculated-value">{calculatedMarks}</div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Paper Structure */}
                    <div className="generator-section">
                        <h2>2. Paper Structure</h2>
                        <p className="section-desc">Toggle modules and configure question counts</p>

                        <div className="modules-grid">
                            {modules.map(module => (
                                <div key={module.id} className={`module-card ${module.enabled ? 'enabled' : 'disabled'}`}>
                                    <div className="module-header">
                                        <div className="module-info">
                                            <span className="module-icon">{module.icon}</span>
                                            <span className="module-name">{module.name}</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={module.enabled}
                                                onChange={() => toggleModule(module.id)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    {module.enabled && (
                                        <div className="module-config">
                                            <div className="config-field">
                                                <label>COUNT</label>
                                                <input
                                                    type="number"
                                                    value={module.count}
                                                    onChange={(e) => updateModule(module.id, 'count', Number(e.target.value))}
                                                    min={1}
                                                />
                                            </div>
                                            <div className="config-field">
                                                <label>MARKS EACH</label>
                                                <input
                                                    type="number"
                                                    value={module.marksEach}
                                                    onChange={(e) => updateModule(module.id, 'marksEach', Number(e.target.value))}
                                                    min={1}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="generator-sidebar">
                    <div className="summary-card">
                        <h3>Summary</h3>
                        <div className="summary-row">
                            <span>Sections</span>
                            <span>{enabledModules.length}</span>
                        </div>
                        <div className="summary-row">
                            <span>Questions</span>
                            <span>{totalQuestions}</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-total">
                            <span>Total Marks</span>
                            <span>{calculatedMarks}</span>
                        </div>

                        <button
                            className="btn-generate"
                            onClick={handleGenerate}
                            disabled={generating || !selectedDivision || !testTitle}
                        >
                            {generating ? (
                                <>
                                    <span className="spinner"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                                    </svg>
                                    Generate Paper
                                </>
                            )}
                        </button>
                    </div>

                    <div className="note-card">
                        <strong>Note:</strong>
                        <p>Questions will be randomly selected from the data banks at the time of generation.</p>
                    </div>
                </div>
            </div>

            {/* Add Division Modal */}
            {showDivisionModal && (
                <div className="modal-overlay" onClick={() => setShowDivisionModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Division</h2>
                            <button className="modal-close" onClick={() => setShowDivisionModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Division Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Computer Vision Annotators"
                                    value={newDivisionName}
                                    onChange={(e) => setNewDivisionName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowDivisionModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={addDivision}>Add Division</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
