import type { User } from '../types';

interface ProfileProps {
    user: User | null;
}

export default function Profile({ user }: ProfileProps) {
    return (
        <div className="dashboard">
            <h1 className="dashboard-title">Profile</h1>

            <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                {/* Left Card */}
                <div className="card" style={{ width: '300px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <img
                            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=100`}
                            alt="Profile"
                            style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '16px' }}
                        />
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{user?.name}</h2>
                        <p className="text-muted" style={{ fontSize: '14px' }}>{user?.email}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Reg. No.</span>
                            <strong>{user?.registration_number}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Degree</span>
                            <strong>{user?.degree}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Branch</span>
                            <strong>{user?.branch}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Batch</span>
                            <strong>{user?.batch}</strong>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div style={{ flex: 1 }}>
                    <div className="tabs">
                        <div className="tab active">Academic Information</div>
                        <div className="tab">Additional Information</div>
                        <div className="tab">Resume</div>
                        <div className="tab">Rewards & Mentor Info</div>
                        <div className="tab">Account Settings</div>
                    </div>

                    <div className="card" style={{ marginTop: '16px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Academic Information</h3>
                        <p className="text-muted">View and manage your academic details here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
