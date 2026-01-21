import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import PasswordStrength, { validatePassword } from '../components/PasswordStrength';
import logoImg from '../assets/autonex_ai_cover.png';
import './Signup.css';

export default function Signup() {
    const [formData, setFormData] = useState({
        email: '',
        confirmEmail: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // Email confirmation check
        if (formData.email !== formData.confirmEmail) {
            setError('Email addresses do not match');
            return;
        }

        // Password confirmation check
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Password strength validation
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            setError('Password does not meet requirements: ' + passwordValidation.errors[0]);
            return;
        }

        // Phone validation
        if (!/^\d{10}$/.test(formData.phone)) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);

        try {
            await authApi.register({
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
            // Redirect to OTP verification page
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Check if emails match
    const emailsMatch = formData.confirmEmail === '' || formData.email === formData.confirmEmail;
    // Check if passwords match
    const passwordsMatch = formData.confirmPassword === '' || formData.password === formData.confirmPassword;

    return (
        <div className="signup-page">
            <div className="signup-card">
                <div className="signup-header">
                    <img src={logoImg} alt="Logo" className="signup-logo" />
                    <h1 className="signup-title">Create Your Account</h1>
                    <p className="signup-subtitle">Join thousands of professionals on their journey</p>
                </div>

                {error && (
                    <div className="signup-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form className="signup-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Email Address</label>
                        <div className={`input-wrapper ${!emailsMatch ? 'input-error' : ''}`}>
                            <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                            <input
                                type="email"
                                name="confirmEmail"
                                className="form-input"
                                placeholder="Confirm your email"
                                value={formData.confirmEmail}
                                onChange={handleChange}
                                required
                            />
                            {formData.confirmEmail && (
                                <span className={`match-indicator ${emailsMatch ? 'match' : 'no-match'}`}>
                                    {emailsMatch ? '✓' : '✗'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                            </svg>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                placeholder="10-digit phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <PasswordStrength password={formData.password} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div className={`input-wrapper ${!passwordsMatch ? 'input-error' : ''}`}>
                            <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            {formData.confirmPassword && (
                                <span className={`match-indicator ${passwordsMatch ? 'match' : 'no-match'}`}>
                                    {passwordsMatch ? '✓' : '✗'}
                                </span>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="signup-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                <span>Creating account...</span>
                            </>
                        ) : (
                            <>
                                <span>Create Account</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                                </svg>
                            </>
                        )}
                    </button>

                    <p className="signup-terms">
                        By signing up, you agree to our{' '}
                        <a href="#">Terms of Service</a> and{' '}
                        <a href="#">Privacy Policy</a>
                    </p>
                </form>

                <div className="signup-footer">
                    <span>Already have an account?</span>
                    <Link to="/" className="footer-link">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
