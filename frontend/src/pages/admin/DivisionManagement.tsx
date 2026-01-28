import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Check, X, Layers, FileText, Upload } from 'lucide-react';
import { adminApiService, API_HOST } from '../../services/api';
import './DivisionManagement.css';

interface Document {
    id: string;
    title: string;
    content: string; // Can be text or file URL
}

interface Division {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    documents?: Document[];
    created_at: string;
    test_count: number;
}

export default function DivisionManagement() {
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Documents modal state
    const [docsModalOpen, setDocsModalOpen] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [savingDocs, setSavingDocs] = useState(false);
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        try {
            setLoading(true);
            const data = await adminApiService.getDivisions();
            setDivisions(data);
        } catch (err) {
            console.error('Failed to fetch divisions:', err);
            setError('Failed to load divisions');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Division name is required');
            return;
        }

        try {
            setError(null);
            if (editingId) {
                await adminApiService.updateDivision(editingId, {
                    name: formData.name,
                    description: formData.description || undefined
                });
                setSuccess('Division updated successfully');
            } else {
                await adminApiService.createDivision({
                    name: formData.name,
                    description: formData.description || undefined
                });
                setSuccess('Division created successfully');
            }
            setFormData({ name: '', description: '' });
            setShowForm(false);
            setEditingId(null);
            fetchDivisions();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Failed to save division:', err);
            setError('Failed to save division');
        }
    };

    const handleEdit = (division: Division) => {
        setEditingId(division.id);
        setFormData({
            name: division.name,
            description: division.description || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

        try {
            await adminApiService.deleteDivision(id);
            setDivisions(prev => prev.filter(d => d.id !== id));
            setSuccess('Division deleted successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Failed to delete division:', err);
            setError(err.response?.data?.detail || 'Failed to delete division');
        }
    };

    const handleToggleActive = async (division: Division) => {
        try {
            await adminApiService.updateDivision(division.id, {
                is_active: !division.is_active
            });
            setDivisions(prev => prev.map(d =>
                d.id === division.id ? { ...d, is_active: !d.is_active } : d
            ));
        } catch (err) {
            console.error('Failed to toggle division:', err);
        }
    };

    const cancelEdit = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', description: '' });
    };

    // Documents management
    const openDocsModal = (division: Division) => {
        setSelectedDivision(division);

        // Always pad to 4 documents
        const existingDocs = division.documents || [];
        const paddedDocs = [...existingDocs];
        while (paddedDocs.length < 4) {
            paddedDocs.push({
                id: `new-${Date.now()}-${paddedDocs.length}`,
                title: '',
                content: ''
            });
        }

        setDocuments(paddedDocs);
        setDocsModalOpen(true);
    };

    const closeDocsModal = () => {
        setDocsModalOpen(false);
        setSelectedDivision(null);
        setDocuments([]);
    };

    const handleDocChange = (index: number, field: 'title' | 'content', value: string) => {
        setDocuments(prev => prev.map((doc, i) =>
            i === index ? { ...doc, [field]: value } : doc
        ));
    };

    const handleFileUpload = async (index: number, file: File) => {
        // Upload the file and get URL
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'document');

        try {
            const response = await fetch(`${API_HOST}/api/admin/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                handleDocChange(index, 'content', data.url);
                setSuccess('File uploaded successfully');
                setTimeout(() => setSuccess(null), 2000);
            } else {
                setError('Failed to upload file');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload file');
        }
    };

    const handleSaveDocs = async () => {
        if (!selectedDivision) return;

        setSavingDocs(true);
        try {
            // Filter out empty documents
            const validDocs = documents.filter(d => d.title.trim() || d.content.trim());
            await adminApiService.updateDivisionDocuments(selectedDivision.id, validDocs);

            // Update local state
            setDivisions(prev => prev.map(d =>
                d.id === selectedDivision.id ? { ...d, documents: validDocs } : d
            ));

            setSuccess('Documents saved successfully');
            closeDocsModal();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Failed to save documents:', err);
            setError('Failed to save documents');
        } finally {
            setSavingDocs(false);
        }
    };

    return (
        <div className="division-management">
            <div className="division-header">
                <div>
                    <h1>
                        <Layers className="header-icon" />
                        Division Management
                    </h1>
                    <p className="subtitle">Create and manage test divisions/categories</p>
                </div>
                <button
                    className="add-btn"
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '' }); }}
                >
                    <Plus size={20} />
                    Add Division
                </button>
            </div>

            {error && (
                <div className="message error">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {success && (
                <div className="message success">
                    <span>✅ {success}</span>
                </div>
            )}

            {showForm && (
                <div className="division-form-card">
                    <h3>{editingId ? 'Edit Division' : 'Create New Division'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Data Annotation, QA Testing"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description of this division..."
                                rows={3}
                            />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={cancelEdit}>
                                <X size={18} />
                                Cancel
                            </button>
                            <button type="submit" className="submit-btn">
                                <Check size={18} />
                                {editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="divisions-grid">
                {loading ? (
                    <div className="loading">Loading divisions...</div>
                ) : divisions.length === 0 ? (
                    <div className="empty-state">
                        <Layers size={48} className="empty-icon" />
                        <h3>No Divisions Yet</h3>
                        <p>Create your first division to organize tests</p>
                        <button
                            className="add-btn"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={20} />
                            Create First Division
                        </button>
                    </div>
                ) : (
                    divisions.map(division => (
                        <div
                            key={division.id}
                            className={`division-card ${!division.is_active ? 'inactive' : ''}`}
                        >
                            <div className="division-info">
                                <h4>{division.name}</h4>
                                {division.description && (
                                    <p className="description">{division.description}</p>
                                )}
                                <div className="meta">
                                    <span className="test-count">
                                        📋 {division.test_count} {division.test_count === 1 ? 'test' : 'tests'}
                                    </span>
                                    <span className="doc-count">
                                        📄 {(division.documents || []).filter(d => d.title).length} docs
                                    </span>
                                    <span className={`status ${division.is_active ? 'active' : 'inactive'}`}>
                                        {division.is_active ? '✓ Active' : '○ Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="division-actions">
                                <button
                                    className="action-btn docs"
                                    onClick={() => openDocsModal(division)}
                                    title="Manage Shared Documents"
                                >
                                    <FileText size={16} />
                                </button>
                                <button
                                    className="action-btn toggle"
                                    onClick={() => handleToggleActive(division)}
                                    title={division.is_active ? 'Deactivate' : 'Activate'}
                                >
                                    {division.is_active ? '🔓' : '🔒'}
                                </button>
                                <button
                                    className="action-btn edit"
                                    onClick={() => handleEdit(division)}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDelete(division.id, division.name)}
                                    title="Delete"
                                    disabled={division.test_count > 0}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Documents Modal */}
            {docsModalOpen && selectedDivision && (
                <div className="modal-overlay" onClick={closeDocsModal}>
                    <div className="modal docs-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><FileText size={20} /> Shared Documents for "{selectedDivision.name}"</h2>
                            <button className="close-btn" onClick={closeDocsModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="docs-info">
                                These documents will be available to all Agent Analysis questions in this division.
                            </p>
                            <div className="docs-list">
                                {documents.map((doc, index) => (
                                    <div key={doc.id} className="doc-item">
                                        <div className="doc-header">
                                            <span className="doc-number">Document {index + 1}</span>
                                            {(doc.title || doc.content) && (
                                                <button
                                                    className="remove-doc-btn"
                                                    onClick={() => {
                                                        handleDocChange(index, 'title', '');
                                                        handleDocChange(index, 'content', '');
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Trash2 size={12} /> Clear
                                                </button>
                                            )}
                                        </div>
                                        <div className="doc-fields">
                                            <input
                                                type="text"
                                                placeholder="Document Title"
                                                value={doc.title}
                                                onChange={e => handleDocChange(index, 'title', e.target.value)}
                                            />
                                            <div className="content-field">
                                                <textarea
                                                    placeholder="Document content or paste URL..."
                                                    value={doc.content}
                                                    onChange={e => handleDocChange(index, 'content', e.target.value)}
                                                    rows={4}
                                                />
                                                <div className="upload-section">
                                                    <input
                                                        type="file"
                                                        ref={el => { fileInputRefs.current[index] = el; }}
                                                        onChange={e => e.target.files?.[0] && handleFileUpload(index, e.target.files[0])}
                                                        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                                                        style={{ display: 'none' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="upload-btn"
                                                        onClick={() => fileInputRefs.current[index]?.click()}
                                                    >
                                                        <Upload size={14} /> Upload File
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeDocsModal}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveDocs} disabled={savingDocs}>
                                {savingDocs ? 'Saving...' : 'Save Documents'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
