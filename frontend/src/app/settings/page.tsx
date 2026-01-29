'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useLanguage } from '@/lib/language';

export default function SettingsPage() {
    const { user, login } = useAuth(); // Assuming login updates the user state or we might need a refreshUser method
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const [activeSection, setActiveSection] = useState<'profile' | 'appearance' | 'language'>('profile');

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '' });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({ username: user.username, email: user.email || '' });
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        try {
            const updatedUser = await api.put(`/users/${user.id}`, formData);
            if (updatedUser.error) throw new Error(updatedUser.error);

            setMessage({ type: 'success', text: t('common.success') });
            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            setMessage({ type: 'error', text: t('common.error') });
        }
    };

    const handleChangePassword = async () => {
        if (!user || !newPassword) return;
        try {
            const res = await api.put(`/users/${user.id}`, { password: newPassword });
            if (res.error) throw new Error(res.error);

            setMessage({ type: 'success', text: t('common.success') });
            setIsPasswordModalOpen(false);
            setNewPassword('');
        } catch (error) {
            setMessage({ type: 'error', text: t('common.error') });
        }
    };

    const sections = [
        { id: 'profile', label: `👤 ${t('settings.profile')}`, description: t('settings.subtitle') },
        { id: 'appearance', label: `🎨 ${t('settings.appearance')}`, description: t('settings.subtitle') },
        { id: 'language', label: `🌐 ${t('settings.language')}`, description: t('settings.subtitle') },
    ];

    return (
        <div className="container mx-auto max-w-5xl p-6 relative">
            {message.text && (
                <div className={`fixed top-20 right-6 px-4 py-2 rounded-lg shadow-lg z-50 transition-all ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {message.text}
                    <button onClick={() => setMessage({ type: '', text: '' })} className="ml-2 font-bold">✕</button>
                </div>
            )}

            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-magenta to-brand-cyan mb-2">
                {t('settings.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{t('settings.subtitle')}</p>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0 animate-slideInLeft">
                    <nav className="glass-card p-2 space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id as any)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all flex flex-col gap-1 ${activeSection === section.id
                                    ? 'bg-gradient-to-r from-brand-magenta to-brand-pink text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 hover:text-brand-magenta'
                                    }`}
                            >
                                <span className="font-bold flex items-center gap-2 text-sm md:text-base">
                                    {section.label.split(' ')[0]} {section.label.split(' ')[1]}
                                </span>
                                <span className={`text-xs ${activeSection === section.id ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {section.description}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow animate-fadeIn">
                    <div className="glass-card p-6 md:p-8 min-h-[400px] relative overflow-hidden text-gray-800 dark:text-gray-100">
                        {/* Decorative Background Blob */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none"></div>

                        {activeSection === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                                    <h2 className="text-2xl font-bold">{t('settings.profile')}</h2>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-sm font-bold text-brand-magenta hover:bg-brand-pink/10 px-3 py-1.5 rounded-full transition-colors"
                                        >
                                            ✏️ {t('settings.editProfile')}
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1.5"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                            <button
                                                onClick={handleUpdateProfile}
                                                className="text-sm font-bold text-white bg-brand-magenta px-4 py-1.5 rounded-full shadow-md hover:opacity-90 transition-all"
                                            >
                                                {t('common.save')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-cyan to-brand-light-cyan flex items-center justify-center text-4xl text-white font-bold shadow-inner">
                                        {user?.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-grow space-y-4 w-full">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1">{t('settings.username')}</label>
                                            {isEditing ? (
                                                <input
                                                    className="w-full p-2 bg-white/50 dark:bg-black/20 border border-brand-cyan/50 rounded-lg font-medium focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                                                    value={formData.username}
                                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                />
                                            ) : (
                                                <div className="w-full p-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg font-medium">
                                                    {user?.username}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1">{t('settings.email')}</label>
                                            {isEditing ? (
                                                <input
                                                    className="w-full p-2 bg-white/50 dark:bg-black/20 border border-brand-cyan/50 rounded-lg font-medium focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="Enter your email"
                                                />
                                            ) : (
                                                <div className="w-full p-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg font-medium">
                                                    {user?.email || <span className="text-gray-400 italic">No email provided</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1">{t('settings.role')}</label>
                                            <div className="w-full p-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg font-medium capitalize">
                                                {user?.role}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                                            <button
                                                onClick={() => setIsPasswordModalOpen(true)}
                                                className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
                                            >
                                                🔐 {t('settings.changePassword')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'appearance' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold border-b border-gray-100 dark:border-gray-700 pb-4">{t('settings.appearance')}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass p-4 rounded-xl border border-white/50 dark:border-white/10">
                                        <label className="block text-sm font-bold mb-3">{t('settings.theme')}</label>
                                        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${theme === 'light' ? 'bg-white shadow text-brand-magenta' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                ☀️ {t('settings.light')}
                                            </button>
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${theme === 'dark' ? 'bg-gray-800 shadow text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                🌙 {t('settings.dark')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="glass p-4 rounded-xl border border-white/50 dark:border-white/10">
                                        <label className="block text-sm font-bold mb-3">{t('settings.accentColor')}</label>
                                        <div className="flex gap-3">
                                            {(['magenta', 'cyan', 'purple', 'blue', 'orange', 'teal', 'red'] as const).map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setAccentColor(color)}
                                                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${accentColor === color ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                                                    style={{
                                                        backgroundColor: color === 'magenta' ? '#FF0087' :
                                                            color === 'cyan' ? '#0891B2' :
                                                                color === 'purple' ? '#9333EA' :
                                                                    color === 'blue' ? '#2563EB' :
                                                                        color === 'orange' ? '#EA580C' :
                                                                            color === 'teal' ? '#0D9488' : '#DC2626'
                                                    }}
                                                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-brand-cyan text-sm font-medium">
                                    ✨ Changes are saved automatically and applied instantly.
                                </div>
                            </div>
                        )}

                        {activeSection === 'language' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold border-b border-gray-100 dark:border-gray-700 pb-4">{t('settings.language')}</h2>

                                <div className="space-y-2">
                                    {[
                                        { code: 'en', name: 'English (US)', flag: '🇺🇸' },
                                        { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
                                        { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
                                        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
                                        { code: 'es', name: 'Spanish', flag: '🇪🇸' }
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setLanguage(lang.code as any)}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${language === lang.code
                                                ? 'bg-brand-cyan/5 border-brand-cyan shadow-sm text-brand-cyan font-bold'
                                                : 'bg-white/50 dark:bg-white/5 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{lang.flag}</span>
                                                <span className={`${language === lang.code ? '' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {lang.name}
                                                </span>
                                            </div>
                                            {language === lang.code && (
                                                <span className="text-xl">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Password Modal */}
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div className="glass-card bg-white dark:bg-gray-900 w-full max-w-md p-6 shadow-2xl animate-scaleIn relative">
                            <button
                                onClick={() => { setIsPasswordModalOpen(false); setNewPassword(''); }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                            <h3 className="text-xl font-bold mb-4 dark:text-white">{t('settings.changePassword')}</h3>
                            <input
                                type="password"
                                placeholder="New Password"
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 rounded-lg mb-4 focus:ring-2 focus:ring-brand-magenta focus:outline-none dark:text-white"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                            <button
                                onClick={handleChangePassword}
                                disabled={!newPassword}
                                className="w-full bg-brand-magenta text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('common.update')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
