import { useState, useMemo, memo } from 'react';
import {
    Maximize2,
    X,
    FileText,
    Globe,
    ChevronRight
} from 'lucide-react';
import './InPageBrowser.css';

interface Document {
    id: string;
    title: string;
    content: string; // URL or HTML content
}

interface InPageBrowserProps {
    htmlContent?: string;
    htmlUrl?: string; // Proxy URL
    documents?: Document[];
}

interface BrowserPanelProps {
    content: string;
    isUrl: boolean;
    title: string;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
}

// 1. Optimized Browser Panel (Memoized)
const BrowserPanel = memo(({ content, isUrl, title, isFullScreen, onToggleFullScreen }: BrowserPanelProps) => {
    // Determine if we render an iframe with src (URL) or srcDoc (Raw HTML)
    const renderIframe = () => {
        if (isUrl) {
            return (
                <iframe
                    key="url-frame"
                    src={content}
                    className="browser-iframe"
                    title={title}

                    loading="lazy"
                />
            );
        } else {
            return (
                <iframe
                    key="html-frame"
                    srcDoc={content}
                    className="browser-iframe"
                    title={title}

                    loading="lazy"
                />
            );
        }
    };

    return (
        <div className={`browser-panel ${isFullScreen ? 'fullscreen-overlay' : ''}`}>
            {/* Header only visible in Fullscreen mode */}
            <div className="browser-header-overlay">
                <span className="overlay-title">{title}</span>
                <div className="browser-header-actions">
                    {isUrl && (
                        <a
                            href={content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-btn"
                            title="Open in New Tab"
                            style={{ color: '#2563eb', marginRight: '8px' }}
                        >
                            <Globe size={18} />
                        </a>
                    )}
                    <button
                        className="close-btn"
                        onClick={onToggleFullScreen}
                        title="Exit Full Screen"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Main Toggle Button (always visible in non-fullscreen, top-right absolute) */}
            {!isFullScreen && (
                <button
                    className="expand-btn"
                    onClick={onToggleFullScreen}
                    title="Full Screen"
                >
                    <Maximize2 size={18} />
                </button>
            )}

            <div className="browser-content">
                {renderIframe()}
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom comparison for React.memo
    // Re-render ONLY if content, url-status, or fullscreen state changes
    // Ignore unrelated parent re-renders
    return (
        prev.content === next.content &&
        prev.isUrl === next.isUrl &&
        prev.isFullScreen === next.isFullScreen &&
        prev.title === next.title
    );
});


export default function InPageBrowser({
    htmlContent,
    htmlUrl,
    documents = [],
}: InPageBrowserProps) {
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Default to Task Instructions
    const defaultTask = useMemo(() => ({
        id: 'task-instructions',
        title: 'Task Instructions',
        content: htmlUrl || htmlContent || '<div style="padding:20px;font-family:sans-serif;">No content available.</div>',
        isUrl: !!htmlUrl
    }), [htmlUrl, htmlContent]);

    // Memoize document list to prevent re-renders (doc caching optimization)
    const memoizedDocs = useMemo(() => documents.map(doc => ({
        ...doc,
        isUrl: doc.content?.startsWith('http') || doc.content?.startsWith('/')
    })), [documents]);

    const [activeResource, setActiveResource] = useState(defaultTask);

    const handleDocSelect = (doc: Document) => {
        setActiveResource({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            isUrl: doc.content.startsWith('http') || doc.content.startsWith('/')
        });
    };

    const handleTaskSelect = () => {
        setActiveResource(defaultTask);
    };

    return (
        <div className="in-page-browser">
            {/* LEFT PANEL: Optimized Browser */}
            <div className="left-panel-container">
                <BrowserPanel
                    content={activeResource.content}
                    isUrl={activeResource.isUrl}
                    title={activeResource.title}
                    isFullScreen={isFullScreen}
                    onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                />
            </div>

            {/* RIGHT PANEL: Docs List */}
            <div className="right-panel-sidebar">
                <div className="sidebar-header">
                    <h3>DOCUMENTS</h3>
                </div>

                <div className="sidebar-list">
                    {/* Primary Task Item */}
                    <div
                        className={`doc-card ${activeResource.id === 'task-instructions' ? 'selected' : ''}`}
                        onClick={handleTaskSelect}
                    >
                        <Globe size={18} className="doc-icon text-blue-600" />
                        <span className="doc-title">Task Instructions</span>
                        {activeResource.id === 'task-instructions' && <div className="active-dot" />}
                    </div>

                    <div className="divider"></div>

                    {/* Document Items */}
                    {memoizedDocs.map(doc => (
                        <div
                            key={doc.id}
                            className={`doc-card ${activeResource.id === doc.id ? 'selected' : ''}`}
                            onClick={() => handleDocSelect(doc)}
                        >
                            <FileText size={18} className="doc-icon text-slate-500" />
                            <span className="doc-title">{doc.title}</span>
                            {activeResource.id === doc.id ? (
                                <div className="active-dot" />
                            ) : (
                                <ChevronRight size={14} className="doc-chevron" />
                            )}
                        </div>
                    ))}

                    {memoizedDocs.length === 0 && (
                        <div className="empty-docs">No attached documents</div>
                    )}
                </div>
            </div>
        </div>
    );
}
