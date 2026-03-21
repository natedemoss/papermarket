import { useState } from 'react'
import { useAuth } from '../lib/store'
import { apiClient } from '../lib/api'

export default function AccountPage() {
    const { user, setUser } = useAuth()

    const [username, setUsername] = useState(user?.username ?? '')
    const [usernameMsg, setUsernameMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [savingUsername, setSavingUsername] = useState(false)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [savingPassword, setSavingPassword] = useState(false)

    const handleUsernameSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim() || username === user?.username) return
        setSavingUsername(true)
        setUsernameMsg(null)
        try {
            const updated = await apiClient.updateProfile(username.trim())
            setUser(updated)
            setUsernameMsg({ ok: true, text: 'Username updated.' })
        } catch (err: any) {
            setUsernameMsg({ ok: false, text: err?.response?.data?.error ?? 'Failed to update username.' })
        } finally {
            setSavingUsername(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentPassword || !newPassword) return
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ ok: false, text: 'Passwords do not match.' })
            return
        }
        if (newPassword.length < 8) {
            setPasswordMsg({ ok: false, text: 'Password must be at least 8 characters.' })
            return
        }
        setSavingPassword(true)
        setPasswordMsg(null)
        try {
            await apiClient.updatePassword(currentPassword, newPassword)
            setPasswordMsg({ ok: true, text: 'Password updated.' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            setPasswordMsg({ ok: false, text: err?.response?.data?.error ?? 'Failed to update password.' })
        } finally {
            setSavingPassword(false)
        }
    }

    return (
        <div className="min-h-screen bg-pm-bg py-10">
            <div className="max-w-lg mx-auto px-4 space-y-6">
                <h1 className="text-xl font-bold text-pm-text">Account Settings</h1>

                {/* Username */}
                <div className="bg-pm-card border border-pm-border rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-pm-text mb-4">Change Username</h2>
                    <form onSubmit={handleUsernameSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-pm-muted mb-1.5">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                maxLength={20}
                                className="w-full px-3 py-2 bg-pm-surface border border-pm-border rounded-lg text-sm text-pm-text placeholder-pm-subtle focus:outline-none focus:border-pm-blue transition-colors"
                            />
                        </div>
                        {usernameMsg && (
                            <p className={`text-xs ${usernameMsg.ok ? 'text-pm-yes' : 'text-pm-no'}`}>{usernameMsg.text}</p>
                        )}
                        <button
                            type="submit"
                            disabled={savingUsername || !username.trim() || username === user?.username}
                            className="px-4 py-2 bg-pm-blue hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {savingUsername ? 'Saving...' : 'Save Username'}
                        </button>
                    </form>
                </div>

                {/* Password — only show if user has a password (not Google-only) */}
                {user && (
                    <div className="bg-pm-card border border-pm-border rounded-xl p-6">
                        <h2 className="text-sm font-semibold text-pm-text mb-4">Change Password</h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-pm-muted mb-1.5">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-pm-surface border border-pm-border rounded-lg text-sm text-pm-text placeholder-pm-subtle focus:outline-none focus:border-pm-blue transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-pm-muted mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-pm-surface border border-pm-border rounded-lg text-sm text-pm-text placeholder-pm-subtle focus:outline-none focus:border-pm-blue transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-pm-muted mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-pm-surface border border-pm-border rounded-lg text-sm text-pm-text placeholder-pm-subtle focus:outline-none focus:border-pm-blue transition-colors"
                                />
                            </div>
                            {passwordMsg && (
                                <p className={`text-xs ${passwordMsg.ok ? 'text-pm-yes' : 'text-pm-no'}`}>{passwordMsg.text}</p>
                            )}
                            <button
                                type="submit"
                                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                                className="px-4 py-2 bg-pm-blue hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {savingPassword ? 'Saving...' : 'Save Password'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Account info */}
                <div className="bg-pm-card border border-pm-border rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-pm-text mb-4">Account Info</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-pm-muted">Email</span>
                            <span className="text-pm-text">{user?.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-pm-muted">Balance</span>
                            <span className="font-tabular text-pm-yes">${Number(user?.paperBalance).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-pm-muted">Member since</span>
                            <span className="text-pm-text">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
