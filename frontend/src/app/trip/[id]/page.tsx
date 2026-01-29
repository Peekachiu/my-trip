'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import CreateTripForm from '@/components/CreateTripForm';

type Expense = { id: string; amount: number; category: string; note: string; date: string; type: 'group' | 'individual'; userId: string; };
type ItineraryItem = { id: string; day: number; time: string; activity: string; date?: string; };
type Trip = {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number; // Group Budget
    itinerary: ItineraryItem[];
    expenses: Expense[];
    assignments: { user_id: string; personal_budget: number; username: string }[];
    assignedToIds: string[];
};

export default function TripDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'group_budget' | 'my_budget'>('overview');
    const [isEditingTrip, setIsEditingTrip] = useState(false);

    // Forms
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'Food', note: '', date: '' });
    const [personalBudgetLimit, setPersonalBudgetLimit] = useState<number>(0);
    const [isEditingPersonalBudget, setIsEditingPersonalBudget] = useState(false);

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

        await api.post(`/trips/${trip.id}/expenses`, {
            amount: parseFloat(expenseForm.amount),
            category: expenseForm.category,
            note: expenseForm.note,
            date: expenseForm.date || new Date().toISOString().split('T')[0],
            type,
            userId: user.id
        });
        setExpenseForm({ amount: '', category: 'Food', note: '', date: '' });
        refreshData();
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

    if (!trip || !user) return <div className="p-8 text-center text-brand-magenta font-bold">Loading Trip...</div>;

    const groupExpenses = trip.expenses.filter(e => e.type === 'group' || !e.type);
    const myExpenses = trip.expenses.filter(e => e.type === 'individual' && e.userId === user.id);

    const totalGroupSpent = groupExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPersonalSpent = myExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
            <div className="bg-gradient-to-r from-brand-cyan to-brand-magenta p-6 pb-12 shadow-lg rounded-b-3xl">
                <div className="flex justify-between items-start mb-4">
                    <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="text-white/80 text-sm font-bold hover:text-white">← Back</Link>
                    {user.role === 'admin' && (
                        <button onClick={() => setIsEditingTrip(true)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors">
                            Edit Trip
                        </button>
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
                                {tab.replace('_', ' ').toUpperCase()}
                            </button>
                        ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 mt-2">
                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="glass-card p-6 border-brand-cyan/20">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Group Budget</h3>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <span className="text-3xl font-bold text-gray-800">${totalGroupSpent}</span>
                                    <span className="text-gray-400 font-medium mb-1"> / ${trip.budget}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 uppercase font-bold block">Balance</span>
                                    <span className={`text-xl font-bold ${trip.budget - totalGroupSpent >= 0 ? 'text-brand-cyan' : 'text-red-500'}`}>
                                        ${(trip.budget - totalGroupSpent).toFixed(2)}
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
                                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">My Budget</h3>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-3xl font-bold text-gray-800">${totalPersonalSpent}</span>
                                        <span className="text-gray-400 font-medium mb-1"> / ${personalBudgetLimit}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 uppercase font-bold block">Balance</span>
                                        <span className={`text-xl font-bold ${personalBudgetLimit - totalPersonalSpent >= 0 ? 'text-brand-pink' : 'text-red-500'}`}>
                                            ${(personalBudgetLimit - totalPersonalSpent).toFixed(2)}
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
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Dates</h3>
                            <div className="flex justify-between">
                                <div>
                                    <span className="block text-xs text-gray-400">Start</span>
                                    <span className="text-lg font-bold text-brand-magenta">{new Date(trip.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-400">End</span>
                                    <span className="text-lg font-bold text-brand-cyan">{new Date(trip.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {user.role === 'admin' && (
                            <div className="mt-6">
                                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Assigned Users</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {trip.assignments.map((assignment) => (
                                        <div key={assignment.user_id} className="glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-magenta to-brand-cyan flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
                                                {assignment.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{assignment.username}</p>
                                                <p className="text-xs text-gray-500">Budget: ${assignment.personal_budget}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {trip.assignments.length === 0 && <p className="text-gray-400 text-sm italic">No users assigned.</p>}
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
                                    <div className="text-xs font-bold text-gray-400 uppercase">Day</div>
                                    <div className="text-2xl font-bold text-brand-cyan">{item.day}</div>
                                </div>
                                <div className="flex-grow min-w-0 glass-card p-4 border-l-4 border-brand-magenta">
                                    {item.date && (
                                        <span className="text-xs font-bold text-brand-pink uppercase tracking-wider mb-1 block">
                                            {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                    <p className="font-bold text-gray-800 break-words">{item.activity}</p>
                                    <p className="text-sm text-gray-500 mt-1">⏰ {item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'group_budget' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">Group Expenses (Admin managed)</h3>
                            {user.role === 'admin' && (
                                <button onClick={() => setIsTopUpOpen(true)} className="text-xs bg-brand-cyan text-white px-3 py-1 rounded-full font-bold shadow-sm hover:opacity-90">
                                    + Top Up Budget
                                </button>
                            )}
                        </div>

                        {/* Top Up Modal */}
                        {isTopUpOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md p-4 animate-fadeIn">
                                <form onSubmit={handleTopUp} className="glass-card bg-white/80 p-6 shadow-xl w-full max-w-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Top Up Group Budget</h3>
                                    <p className="text-sm text-gray-500 mb-4">Enter amount to add to the existing budget.</p>
                                    <input
                                        type="number"
                                        autoFocus
                                        placeholder="Amount ($)"
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
                                        <button type="button" onClick={() => setIsTopUpOpen(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-lg">Cancel</button>
                                        <button className="flex-1 py-2 bg-brand-cyan text-white font-bold rounded-lg hover:opacity-90 shadow-md">Confirm</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {user.role === 'admin' && (
                            <form onSubmit={(e) => handleAddExpense(e, 'group')} className="glass-card bg-white/80 p-4 border-gray-100 mb-6">
                                <h4 className="text-sm font-bold text-brand-magenta mb-2">+ Add Group Expense</h4>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input type="number" placeholder="Amount" className="p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-magenta" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                                    <select className="p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-magenta" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                        <option>Food</option><option>Transport</option><option>Stay</option><option>Activity</option><option>Other</option>
                                    </select>
                                </div>
                                <input type="date" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-magenta mb-2" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                                <input type="text" placeholder="Note" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-magenta mb-2" value={expenseForm.note} onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })} required />
                                <button className="w-full bg-brand-cyan text-white font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">Add to Group</button>
                            </form>
                        )}

                        <div className="space-y-3">
                            {groupExpenses.length === 0 && <p className="text-gray-400 text-center">No group expenses yet.</p>}
                            {groupExpenses.slice().reverse().map(exp => (
                                <div key={exp.id} className="flex justify-between items-center glass-card p-3 border-l-4 border-brand-cyan">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-light-cyan flex items-center justify-center text-brand-cyan text-lg">$</div>
                                        <div>
                                            <p className="font-bold text-gray-800">{exp.category}</p>
                                            <div className="text-xs text-gray-500">
                                                <span>{new Date(exp.date).toLocaleDateString()}</span> • <span>{exp.note}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-brand-cyan text-lg">-${exp.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'my_budget' && (
                    <div className="animate-fadeIn">
                        <div className="glass-card p-4 border-brand-pink/20 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-800">My Budget Limit</h3>
                                <button onClick={() => {
                                    if (isEditingPersonalBudget) handleUpdatePersonalBudget();
                                    else setIsEditingPersonalBudget(true);
                                }} className="text-xs bg-brand-pink text-white px-3 py-1 rounded-full font-bold">
                                    {isEditingPersonalBudget ? 'Save' : 'Edit'}
                                </button>
                            </div>
                            {isEditingPersonalBudget ? (
                                <input type="number" className="w-full text-2xl font-bold text-brand-pink border-b border-brand-pink focus:outline-none"
                                    value={personalBudgetLimit} onChange={e => setPersonalBudgetLimit(parseFloat(e.target.value))} />
                            ) : (
                                <p className="text-2xl font-bold text-brand-pink">${personalBudgetLimit}</p>
                            )}
                        </div>

                        <form onSubmit={(e) => handleAddExpense(e, 'individual')} className="glass-card bg-white/80 p-4 border-gray-100 mb-6">
                            <h4 className="text-sm font-bold text-brand-pink mb-2">+ Add Personal Expense</h4>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input type="number" placeholder="Amount" className="p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-pink" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                                <select className="p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-pink" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                    <option>Food</option><option>Transport</option><option>Stay</option><option>Activity</option><option>Other</option>
                                </select>
                            </div>
                            <input type="date" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-pink mb-2" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                            <input type="text" placeholder="Note" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-pink mb-2" value={expenseForm.note} onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })} required />
                            <button className="w-full bg-brand-pink text-white font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">Add to Personal</button>
                        </form>

                        <div className="space-y-3">
                            {myExpenses.length === 0 && <p className="text-gray-400 text-center">No personal expenses yet.</p>}
                            {myExpenses.slice().reverse().map(exp => (
                                <div key={exp.id} className="flex justify-between items-center glass-card p-3 border-l-4 border-brand-pink">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink text-lg">$</div>
                                        <div>
                                            <p className="font-bold text-gray-800">{exp.category}</p>
                                            <div className="text-xs text-gray-500">
                                                <span>{new Date(exp.date).toLocaleDateString()}</span> • <span>{exp.note}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-brand-pink text-lg">-${exp.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
