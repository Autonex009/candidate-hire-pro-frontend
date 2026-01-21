import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/autonex_ai_cover.png';
import './ProfileWizard.css';

interface ProfileData {
    // Step 1: Personal Info
    fullName: string;
    country: string;

    // Step 2: Education
    ugSpecialization: string;
    pgSpecialization: string;

    // Step 3: Experience
    experience: string;
    resume: File | null;

    // Step 4: Interests & Annotation
    interests: string[];
    annotationAwareness: string;
    whyAnnotation: string;
}

const STEPS = [
    { id: 1, title: 'Personal Info', description: 'Tell us about yourself' },
    { id: 2, title: 'Education', description: 'Your academic background' },
    { id: 3, title: 'Experience', description: 'Your work background' },
    { id: 4, title: 'Interests', description: 'What drives you' }
];

const COUNTRIES = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'Singapore', 'UAE', 'Other'
];

const EXPERIENCE_LEVELS = [
    'Fresher (0-1 years)',
    'Junior (1-3 years)',
    'Mid-level (3-5 years)',
    'Senior (5+ years)'
];

const INTEREST_OPTIONS = [
    'Data Annotation', 'Machine Learning', 'AI Research',
    'Image Processing', 'Natural Language Processing',
    'Computer Vision', 'Quality Assurance'
];

export default function ProfileWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState<ProfileData>({
        fullName: '',
        country: '',
        ugSpecialization: '',
        pgSpecialization: '',
        experience: '',
        resume: null,
        interests: [],
        annotationAwareness: '',
        whyAnnotation: ''
    });

    const updateField = (field: keyof ProfileData, value: any) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const toggleInterest = (interest: string) => {
        setProfileData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            updateField('resume', file);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return profileData.fullName && profileData.country;
            case 2:
                return profileData.ugSpecialization;
            case 3:
                return profileData.experience;
            case 4:
                return profileData.annotationAwareness && profileData.whyAnnotation;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // TODO: API call to save profile
            // await profileApi.completeProfile(profileData);
            console.log('Profile data:', profileData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wizard-page">
            <div className="wizard-container">
                {/* Left Side - Progress */}
                <div className="wizard-sidebar">
                    <img src={logoImg} alt="Logo" className="wizard-logo" />
                    <h2 className="wizard-sidebar-title">Complete Your Profile</h2>
                    <p className="wizard-sidebar-subtitle">This helps us personalize your experience</p>

                    <div className="wizard-steps">
                        {STEPS.map((step) => (
                            <div
                                key={step.id}
                                className={`wizard-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                            >
                                <div className="step-indicator">
                                    {currentStep > step.id ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    ) : (
                                        <span>{step.id}</span>
                                    )}
                                </div>
                                <div className="step-content">
                                    <div className="step-title">{step.title}</div>
                                    <div className="step-description">{step.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="wizard-main">
                    <div className="wizard-form-container">
                        {/* Step 1: Personal Info */}
                        {currentStep === 1 && (
                            <div className="wizard-form">
                                <h3 className="form-step-title">Personal Information</h3>
                                <p className="form-step-subtitle">Let's start with the basics</p>

                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter your full name"
                                        value={profileData.fullName}
                                        onChange={(e) => updateField('fullName', e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Country *</label>
                                    <select
                                        className="form-select"
                                        value={profileData.country}
                                        onChange={(e) => updateField('country', e.target.value)}
                                    >
                                        <option value="">Select your country</option>
                                        {COUNTRIES.map(country => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Education */}
                        {currentStep === 2 && (
                            <div className="wizard-form">
                                <h3 className="form-step-title">Educational Background</h3>
                                <p className="form-step-subtitle">Your academic journey matters</p>

                                <div className="form-group">
                                    <label className="form-label">Undergraduate Specialization *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Computer Science, Electronics"
                                        value={profileData.ugSpecialization}
                                        onChange={(e) => updateField('ugSpecialization', e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Postgraduate Specialization (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Data Science, MBA"
                                        value={profileData.pgSpecialization}
                                        onChange={(e) => updateField('pgSpecialization', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Experience */}
                        {currentStep === 3 && (
                            <div className="wizard-form">
                                <h3 className="form-step-title">Professional Experience</h3>
                                <p className="form-step-subtitle">Tell us about your work background</p>

                                <div className="form-group">
                                    <label className="form-label">Experience Level *</label>
                                    <div className="radio-group">
                                        {EXPERIENCE_LEVELS.map(level => (
                                            <label key={level} className="radio-option">
                                                <input
                                                    type="radio"
                                                    name="experience"
                                                    value={level}
                                                    checked={profileData.experience === level}
                                                    onChange={(e) => updateField('experience', e.target.value)}
                                                />
                                                <span className="radio-label">{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Resume (Optional)</label>
                                    <div className="file-upload">
                                        <input
                                            type="file"
                                            id="resume"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="file-input"
                                        />
                                        <label htmlFor="resume" className="file-label">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                                            </svg>
                                            {profileData.resume ? profileData.resume.name : 'Upload your resume'}
                                        </label>
                                    </div>
                                    <span className="form-hint">PDF, DOC, or DOCX (max 5MB)</span>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Interests & Annotation */}
                        {currentStep === 4 && (
                            <div className="wizard-form">
                                <h3 className="form-step-title">Interests & Annotation</h3>
                                <p className="form-step-subtitle">Almost there! Tell us what excites you</p>

                                <div className="form-group">
                                    <label className="form-label">Select Your Interests</label>
                                    <div className="chips-group">
                                        {INTEREST_OPTIONS.map(interest => (
                                            <button
                                                key={interest}
                                                type="button"
                                                className={`chip ${profileData.interests.includes(interest) ? 'selected' : ''}`}
                                                onClick={() => toggleInterest(interest)}
                                            >
                                                {interest}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Are you aware of Data Annotation? *</label>
                                    <div className="radio-group horizontal">
                                        <label className="radio-option">
                                            <input
                                                type="radio"
                                                name="annotationAwareness"
                                                value="yes"
                                                checked={profileData.annotationAwareness === 'yes'}
                                                onChange={(e) => updateField('annotationAwareness', e.target.value)}
                                            />
                                            <span className="radio-label">Yes, I know about it</span>
                                        </label>
                                        <label className="radio-option">
                                            <input
                                                type="radio"
                                                name="annotationAwareness"
                                                value="no"
                                                checked={profileData.annotationAwareness === 'no'}
                                                onChange={(e) => updateField('annotationAwareness', e.target.value)}
                                            />
                                            <span className="radio-label">I'm new to this</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Why do you want to work in Annotation? *</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Share your motivation in a few sentences..."
                                        rows={4}
                                        value={profileData.whyAnnotation}
                                        onChange={(e) => updateField('whyAnnotation', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="wizard-nav">
                            {currentStep > 1 && (
                                <button type="button" className="btn-back" onClick={handleBack}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                    Back
                                </button>
                            )}

                            <button
                                type="button"
                                className="btn-next"
                                onClick={handleNext}
                                disabled={!canProceed() || loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Saving...
                                    </>
                                ) : currentStep === 4 ? (
                                    <>
                                        Complete Profile
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
