'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useLanguage } from '@/lib/language';
import { useCurrency } from '@/lib/currency';
import CreateTripForm from '@/components/CreateTripForm';
import { useRouter } from 'next/navigation';

type Expense = { id: string; amount: number; category: string; note: string; date: string; type: 'group' | 'individual'; userId: string; currency?: string; exchangeRate?: number; };
type ItineraryItem = { id: string; day: number; time: string; title: string; description: string; url: string; date?: string; duration?: number; };
type Trip = {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number; // Group Budget
    baseCurrency?: string;
    itinerary: ItineraryItem[];
    expenses: Expense[];
    assignments: { user_id: string; personal_budget: number; username: string }[];
    assignedToIds: string[];
    budgetLogs?: { id: string; amount: number; date: string; }[];
    isCompleted?: boolean;
    completedAt?: string | null;
    deletedAt?: string | null;
};

const formatTime = (time: string, durationMinutes: number = 0) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    const startTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (durationMinutes > 0) {
        date.setMinutes(date.getMinutes() + durationMinutes);
        const endTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return `${startTime} - ${endTime}`;
    }
    return startTime;
};

export default function TripDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { format } = useCurrency();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'group_budget' | 'my_budget'>('overview');
    const [isEditingTrip, setIsEditingTrip] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Forms
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'Food', note: '', date: '', currency: 'MYR' });
    const [personalBudgetLimit, setPersonalBudgetLimit] = useState<number>(0);
    const [isEditingPersonalBudget, setIsEditingPersonalBudget] = useState(false);
    const [isAddingGroupExpense, setIsAddingGroupExpense] = useState(false);
    const [isAddingPersonalExpense, setIsAddingPersonalExpense] = useState(false);

    useEffect(() => {
        if (id && user) refreshData();
    }, [id, user]);

    const refreshData = () => {
        api.get(`/trips/${id}`).then(data => {
            setTrip(data);
            const myAssignment = data.assignments?.find((a: any) => a.user_id === user?.id);
            if (myAssignment) setPersonalBudgetLimit(Number(myAssignment.personal_budget));
        }).catch(console.error);
    };

    const handleAddExpense = async (e: React.FormEvent, type: 'group' | 'individual') => {
        e.preventDefault();
        if (!trip || !user) return;

        try {
            await api.post(`/trips/${trip.id}/expenses`, {
                amount: parseFloat(expenseForm.amount),
                category: expenseForm.category,
                note: expenseForm.note,
                date: expenseForm.date || new Date().toISOString().split('T')[0],
                type,
                userId: user.id,
                currency: expenseForm.currency
            });

            setExpenseForm({ amount: '', category: 'Food', note: '', date: '', currency: trip.baseCurrency || 'MYR' });
            setIsAddingGroupExpense(false);
            setIsAddingPersonalExpense(false);
            refreshData();
        } catch (error) {
            console.error('Failed to add expense:', error);
            alert(t('common.error'));
        }
    };

    const handleUpdatePersonalBudget = async () => {
        if (!trip || !user) return;
        await api.patch(`/trips/${trip.id}/personal-budget`, { userId: user.id, budget: personalBudgetLimit });
        setIsEditingPersonalBudget(false);
        refreshData();
    };

    // Top Up State
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [topUpDate, setTopUpDate] = useState('');

    // === Lifecycle handlers ===
    const handleMarkCompleted = async () => {
        if (!trip) return;
        if (!confirm(t('trip.actions.confirmComplete'))) return;
        setActionLoading(true);
        await api.patch(`/trips/${trip.id}/complete`, {});
        setActionLoading(false);
        refreshData();
    };

    const handleReopen = async () => {
        if (!trip) return;
        if (!confirm(t('trip.actions.confirmReopen'))) return;
        setActionLoading(true);
        await api.patch(`/trips/${trip.id}/uncomplete`, {});
        setActionLoading(false);
        refreshData();
    };

    const handleDelete = async () => {
        if (!trip) return;
        if (!confirm(t('trip.actions.confirmDelete'))) return;
        setActionLoading(true);
        await api.delete(`/trips/${trip.id}`);
        setActionLoading(false);
        router.push('/dashboard');
    };

    const handleRestore = async () => {
        if (!trip) return;
        if (!confirm(t('trip.actions.confirmRestore'))) return;
        setActionLoading(true);
        await api.patch(`/trips/${trip.id}/restore`, {});
        setActionLoading(false);
        refreshData();
    };

    const handlePermanentDelete = async () => {
        if (!trip) return;
        if (!confirm(t('trip.actions.confirmPermanent'))) return;
        setActionLoading(true);
        await api.delete(`/trips/${trip.id}/permanent`);
        setActionLoading(false);
        router.push('/dashboard');
    };

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trip || !topUpAmount) return;

        await api.patch(`/trips/${trip.id}/group-budget`, {
            amount: parseFloat(topUpAmount),
            date: topUpDate
        });
        setTopUpAmount('');
        setTopUpDate('');
        setIsTopUpOpen(false);
        refreshData();
    };

    if (!trip || !user) return <div className="p-8 text-center text-brand-magenta font-bold">{t('common.loading')}</div>;

    const groupExpenses = trip.expenses.filter(e => e.type === 'group' || !e.type);
    const myExpenses = trip.expenses.filter(e => e.type === 'individual' && e.userId === user.id);

    const totalGroupSpent = groupExpenses.reduce((sum, e) => sum + (Number(e.amount) * (Number(e.exchangeRate) || 1)), 0);
    const totalPersonalSpent = myExpenses.reduce((sum, e) => sum + (Number(e.amount) * (Number(e.exchangeRate) || 1)), 0);

    const groupProgress = Math.min((totalGroupSpent / trip.budget) * 100, 100);
    const personalProgress = personalBudgetLimit > 0 ? Math.min((totalPersonalSpent / personalBudgetLimit) * 100, 100) : 0;

    return (
        <div className="min-h-screen bg-transparent pb-20 relative">
            {isEditingTrip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="w-full max-w-2xl">
                        <CreateTripForm
                            tripId={trip.id}
                            initialData={trip}
                            onSuccess={() => { setIsEditingTrip(false); refreshData(); }}
                            onCancel={() => setIsEditingTrip(false)}
                        />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`p-6 pb-12 shadow-lg rounded-b-3xl ${trip.deletedAt ? 'bg-gradient-to-r from-gray-500 to-gray-700' : trip.isCompleted ? 'bg-gradient-to-r from-gray-400 to-brand-magenta/70' : 'bg-gradient-to-r from-brand-cyan to-brand-magenta'}`}>
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                    <Link href="/dashboard" className="text-white/80 text-sm font-bold hover:text-white">← {t('trip.back')}</Link>
                    {user.role === 'admin' && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Status badge */}
                            {trip.deletedAt && (
                                <span className="bg-red-500/30 text-white px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                                    🗑️ {t('trip.status.deleted')}
                                </span>
                            )}
                            {!trip.deletedAt && trip.isCompleted && (
                                
                                <span className="bg-white/30 text-white px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                                    ✅ {t('trip.status.completed')}
                                </span>
                            )}

                            {/* Action buttons */}
                            {!trip.deletedAt && (
                                <button onClick={() => setIsEditingTrip(true)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors">
                                    {t('trip.editTrip')}
                                </button>
                            )}
                            {!trip.deletedAt && !trip.isCompleted && (
                                <button disabled={actionLoading} onClick={handleMarkCompleted} className="bg-green-500/80 hover:bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors disabled:opacity-50">
                                    ✅ {t('trip.actions.markCompleted')}
                                </button>
                            )}
                            {!trip.deletedAt && trip.isCompleted && (
                                <button disabled={actionLoading} onClick={handleReopen} className="bg-brand-cyan/80 hover:bg-brand-cyan text-white px-3 py-1 rounded-full text-xs font-bold transition-colors disabled:opacity-50">
                                    ↻ {t('trip.actions.reopen')}
                                </button>
                            )}
                            {!trip.deletedAt && (
                                <button disabled={actionLoading} onClick={handleDelete} className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors disabled:opacity-50">
                                    🗑️ {t('trip.actions.delete')}
                                </button>
                            )}
                            {trip.deletedAt && (
                                <>
                                    <button disabled={actionLoading} onClick={handleRestore} className="bg-green-500/80 hover:bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors disabled:opacity-50">
                                        ↻ {t('trip.actions.restore')}
                                    </button>
                                    <button disabled={actionLoading} onClick={handlePermanentDelete} className="bg-red-700/80 hover:bg-red-700 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors disabled:opacity-50">
                                        ⚠️ {t('trip.actions.permanentDelete')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <h1 className="text-3xl font-bold text-white drop-shadow-md">{trip.title}</h1>
                <p className="text-brand-light-cyan font-medium flex items-center mt-1">
                    📍 {trip.destination}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center -mt-6 px-4 overflow-x-auto pb-2">
                <div className="bg-white rounded-full p-1 shadow-md flex space-x-1 border border-gray-100 flex-nowrap whitespace-nowrap">
                    {['overview', 'itinerary', 'group_budget', 'my_budget']
                        .filter(tab => tab !== 'my_budget' || user.role !== 'admin')
                        .map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === tab
                                    ? 'bg-brand-magenta text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {tab === 'group_budget' ? t('trip.groupBudget') :
                                    tab === 'my_budget' ? t('trip.myBudget') :
                                        t(`trip.${tab}` as any)}
                            </button>
                        ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 mt-2">
                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="glass-card p-6 border-brand-cyan/20">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">{t('trip.groupBudget')}</h3>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <span className="text-3xl font-bold text-gray-800">{format(totalGroupSpent, trip.baseCurrency || 'MYR')}</span>
                                    <span className="text-gray-400 font-medium mb-1"> / {format(trip.budget, trip.baseCurrency || 'MYR')}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 uppercase font-bold block">{t('trip.balance')}</span>
                                    <span className={`text-xl font-bold ${trip.budget - totalGroupSpent >= 0 ? 'text-brand-cyan' : 'text-red-500'}`}>
                                        {format(trip.budget - totalGroupSpent, trip.baseCurrency || 'MYR')}
                                    </span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand-cyan to-brand-magenta transition-all duration-1000"
                                    style={{ width: `${groupProgress}%` }}
                                />
                            </div>
                        </div>

                        {user.role !== 'admin' && (
                            <div className="glass-card p-6 border-brand-pink/20">
                                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">{t('trip.myBudget')}</h3>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-3xl font-bold text-gray-800">{format(totalPersonalSpent, trip.baseCurrency || 'MYR')}</span>
                                        <span className="text-gray-400 font-medium mb-1"> / {format(personalBudgetLimit, trip.baseCurrency || 'MYR')}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 uppercase font-bold block">{t('trip.balance')}</span>
                                        <span className={`text-xl font-bold ${personalBudgetLimit - totalPersonalSpent >= 0 ? 'text-brand-pink' : 'text-red-500'}`}>
                                            {format(personalBudgetLimit - totalPersonalSpent, trip.baseCurrency || 'MYR')}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-pink transition-all duration-1000"
                                        style={{ width: `${personalProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="glass-card p-6 border-white/40">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">{t('trip.dates')}</h3>
                            <div className="flex justify-between">
                                <div>
                                    <span className="block text-xs text-gray-400">{t('trip.start')}</span>
                                    <span className="text-lg font-bold text-brand-magenta">{new Date(trip.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-400">{t('trip.end')}</span>
                                    <span className="text-lg font-bold text-brand-cyan">{new Date(trip.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {user.role === 'admin' && (
                            <div className="mt-6">
                                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">{t('trip.assignedUsers')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {trip.assignments.map((assignment) => (
                                        <div key={assignment.user_id} className="glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-magenta to-brand-cyan flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
                                                {assignment.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{assignment.username}</p>
                                                <p className="text-xs text-gray-500">{t('trip.budget')}: {format(assignment.personal_budget, trip.baseCurrency || 'MYR')}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {trip.assignments.length === 0 && <p className="text-gray-400 text-sm italic">{t('trip.noUsers')}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'itinerary' && (
                    <div className="space-y-4 animate-fadeIn">
                        {trip.itinerary.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)).map((item) => (
                            <div key={item.id} className="flex gap-4 items-start">
                                <div className="flex-shrink-0 w-16 text-center">
                                    <div className="text-xs font-bold text-gray-400 uppercase">{t('trip.day')}</div>
                                    <div className="text-2xl font-bold text-brand-cyan">{item.day}</div>
                                </div>
                                <div className="flex-grow min-w-0 glass-card p-4 border-l-4 border-brand-magenta relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <div className="w-16 h-16 rounded-full bg-brand-magenta blur-xl"></div>
                                    </div>
                                    {item.date && (
                                        <span className="text-xs font-bold text-brand-pink uppercase tracking-wider mb-2 block border-b border-gray-100 pb-1">
                                            {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                    <h4 className="font-bold text-lg text-gray-800 break-words mb-1">{item.title}</h4>
                                    {item.description && <p className="text-sm text-gray-600 mb-3 break-words whitespace-pre-wrap leading-relaxed">{item.description}</p>}

                                    <div className="flex flex-wrap items-center gap-3 mt-auto">
                                        <span className="text-xs font-bold text-brand-magenta bg-brand-pink/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                                            ⏰ {formatTime(item.time, item.duration)}
                                        </span>
                                        {item.url && (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white bg-brand-cyan px-3 py-1 rounded-full hover:bg-brand-cyan/80 transition-colors flex items-center gap-1 shadow-sm">
                                                <span>📍 {t('trip.location')}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'group_budget' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">{t('trip.groupExpensesTitle')}</h3>
                            {user.role === 'admin' && (
                                <button onClick={() => setIsTopUpOpen(true)} className="text-xs bg-brand-cyan text-white px-3 py-1 rounded-full font-bold shadow-sm hover:opacity-90">
                                    + {t('trip.topUpBudget')}
                                </button>
                            )}
                        </div>

                        {/* Top Up Modal */}
                        {isTopUpOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md p-4 animate-fadeIn">
                                <form onSubmit={handleTopUp} className="glass-card bg-white/80 p-6 shadow-xl w-full max-w-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">{t('trip.topUpTitle')}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{t('trip.topUpDesc')}</p>
                                    <input
                                        type="number"
                                        autoFocus
                                        placeholder={t('trip.amountPlaceholder')}
                                        className="w-full text-2xl font-bold p-2 border-b-2 border-brand-cyan focus:outline-none mb-4 text-gray-800"
                                        value={topUpAmount}
                                        onChange={e => setTopUpAmount(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="date"
                                        className="w-full text-sm p-2 border border-gray-200 rounded-lg mb-6 text-gray-800"
                                        value={topUpDate}
                                        onChange={e => setTopUpDate(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setIsTopUpOpen(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-lg">{t('trip.cancel')}</button>
                                        <button className="flex-1 py-2 bg-brand-cyan text-white font-bold rounded-lg hover:opacity-90 shadow-md">{t('trip.confirm')}</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {trip.budgetLogs && trip.budgetLogs.length > 0 && (
                            <div className="glass-card p-4 border-gray-100 mb-6 bg-white/40">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('trip.budgetHistory')}</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {trip.budgetLogs.map(log => (
                                        <div key={log.id} className="flex justify-between items-center bg-white/60 p-2 rounded-lg border border-white/50 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">{t('trip.topUp')}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-bold text-green-600">+{format(log.amount, trip.baseCurrency || 'MYR')}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{new Date(log.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {user.role === 'admin' && (
                            !isAddingGroupExpense ? (
                                <button
                                    onClick={() => setIsAddingGroupExpense(true)}
                                    className="w-full py-3 mb-6 flex items-center justify-center gap-2 bg-white/50 border border-brand-cyan/30 text-brand-cyan font-bold rounded-xl hover:bg-brand-cyan hover:text-white transition-all shadow-sm"
                                >
                                    <span>+ {t('trip.addGroupExpense')}</span>
                                </button>
                            ) : (
                                <form onSubmit={(e) => handleAddExpense(e, 'group')} className="glass-card bg-white/80 p-4 border-gray-100 mb-6 animate-fadeIn">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-brand-magenta">{t('trip.newGroupExpense')}</h4>
                                        <button type="button" onClick={() => setIsAddingGroupExpense(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">{t('trip.cancel')}</button>
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                        <input type="number" placeholder={t('trip.amountPlaceholder')} className="w-1/2 p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-magenta" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                                        <select className="w-1/2 p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-magenta" value={expenseForm.currency} onChange={e => setExpenseForm({ ...expenseForm, currency: e.target.value })}>
                                            {['USD', 'EUR', 'GBP', 'JPY', 'MYR', 'SGD', 'CNY', 'AUD', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <select className="w-full p-2 mb-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-magenta" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                        <option>{t('trip.category.food')}</option>
                                        <option>{t('trip.category.transport')}</option>
                                        <option>{t('trip.category.stay')}</option>
                                        <option>{t('trip.category.activity')}</option>
                                        <option>{t('trip.category.other')}</option>
                                    </select>
                                    <input type="date" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-magenta mb-2" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                                    <input type="text" placeholder="Note" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-magenta mb-2" value={expenseForm.note} onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })} required />
                                    <button className="w-full bg-brand-cyan text-white font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">{t('trip.addToGroup')}</button>
                                </form>
                            )
                        )}

                        <div className="space-y-3">
                            {groupExpenses.length === 0 && <p className="text-gray-400 text-center">{t('trip.noGroupExpenses')}</p>}
                            {groupExpenses.slice().reverse().map(exp => (
                                <div key={exp.id} className="flex justify-between items-center glass-card p-3 border-l-4 border-brand-cyan">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-light-cyan flex items-center justify-center text-brand-cyan text-sm font-bold">RM</div>
                                        <div>
                                            <p className="font-bold text-gray-800">{exp.category}</p>
                                            <div className="text-xs text-gray-500">
                                                <span>{new Date(exp.date).toLocaleDateString()}</span> • <span>{exp.note}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-brand-cyan text-lg block">-{format(Number(exp.amount), exp.currency || 'MYR')}</span>
                                        {exp.currency !== (trip.baseCurrency || 'MYR') && (
                                            <span className="text-xs text-gray-400">Original: {exp.amount} {exp.currency}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'my_budget' && (
                    <div className="animate-fadeIn">
                        <div className="glass-card p-4 border-brand-pink/20 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-800">{t('trip.myBudgetLimit')}</h3>
                                <button onClick={() => {
                                    if (isEditingPersonalBudget) handleUpdatePersonalBudget();
                                    else setIsEditingPersonalBudget(true);
                                }} className="text-xs bg-brand-pink text-white px-3 py-1 rounded-full font-bold">
                                    {isEditingPersonalBudget ? t('common.save') : t('common.edit')}
                                </button>
                            </div>
                            {isEditingPersonalBudget ? (
                                <input type="number" className="w-full text-2xl font-bold text-brand-pink border-b border-brand-pink focus:outline-none"
                                    value={personalBudgetLimit} onChange={e => setPersonalBudgetLimit(parseFloat(e.target.value))} />
                            ) : (
                                <p className="text-2xl font-bold text-brand-pink">{format(personalBudgetLimit, trip.baseCurrency || 'MYR')}</p>
                            )}
                        </div>

                        {!isAddingPersonalExpense ? (
                            <button
                                onClick={() => setIsAddingPersonalExpense(true)}
                                className="w-full py-3 mb-6 flex items-center justify-center gap-2 bg-white/50 border border-brand-pink/30 text-brand-pink font-bold rounded-xl hover:bg-brand-pink hover:text-white transition-all shadow-sm"
                            >
                                <span>+ {t('trip.addPersonalExpense')}</span>
                            </button>
                        ) : (
                            <form onSubmit={(e) => handleAddExpense(e, 'individual')} className="glass-card bg-white/80 p-4 border-gray-100 mb-6 animate-fadeIn">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-brand-pink">{t('trip.newPersonalExpense')}</h4>
                                    <button type="button" onClick={() => setIsAddingPersonalExpense(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">{t('trip.cancel')}</button>
                                </div>
                                <div className="flex gap-2 mb-2">
                                    <input type="number" placeholder={t('trip.amountPlaceholder')} className="w-1/2 p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-pink" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                                    <select className="w-1/2 p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-pink" value={expenseForm.currency} onChange={e => setExpenseForm({ ...expenseForm, currency: e.target.value })}>
                                        {['USD', 'EUR', 'GBP', 'JPY', 'MYR', 'SGD', 'CNY', 'AUD', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <select className="w-full p-2 mb-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-pink" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                    <option>{t('trip.category.food')}</option>
                                    <option>{t('trip.category.transport')}</option>
                                    <option>{t('trip.category.stay')}</option>
                                    <option>{t('trip.category.activity')}</option>
                                    <option>{t('trip.category.other')}</option>
                                </select>
                                <input type="date" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-pink mb-2" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                                <input type="text" placeholder="Note" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-pink mb-2" value={expenseForm.note} onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })} required />
                                <button className="w-full bg-brand-pink text-white font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">{t('trip.addToPersonal')}</button>
                            </form>
                        )}

                        <div className="space-y-3">
                            {myExpenses.length === 0 && <p className="text-gray-400 text-center">{t('trip.noPersonalExpenses')}</p>}
                            {myExpenses.slice().reverse().map(exp => (
                                <div key={exp.id} className="flex justify-between items-center glass-card p-3 border-l-4 border-brand-pink">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink text-sm font-bold">RM</div>
                                        <div>
                                            <p className="font-bold text-gray-800">{exp.category}</p>
                                            <div className="text-xs text-gray-500">
                                                <span>{new Date(exp.date).toLocaleDateString()}</span> • <span>{exp.note}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-brand-pink text-lg block">-{format(Number(exp.amount), exp.currency || 'MYR')}</span>
                                        {exp.currency !== (trip.baseCurrency || 'MYR') && (
                                            <span className="text-xs text-gray-400">Original: {exp.amount} {exp.currency}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
