'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

type Expense = { id: string; amount: number; category: string; note: string; date: string; type: 'group' | 'individual'; userId: string; };
type ItineraryItem = { id: string; day: number; time: string; activity: string; };
type Trip = {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number; // Group Budget
    itinerary: ItineraryItem[];
    expenses: Expense[];
    assignments: { user_id: string; personal_budget: number }[];
};

export default function TripDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'group_budget' | 'my_budget'>('overview');

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

    if (!trip || !user) return <div className="p-8 text-center text-brand-magenta font-bold">Loading Trip...</div>;

    // Calculations
    const groupExpenses = trip.expenses.filter(e => e.type === 'group' || !e.type); // Default to group if undefined for legacy? Or strictly 'group'
    const myExpenses = trip.expenses.filter(e => e.type === 'individual' && e.userId === user.id);

    const totalGroupSpent = groupExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPersonalSpent = myExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const groupProgress = Math.min((totalGroupSpent / trip.budget) * 100, 100);
    const personalProgress = personalBudgetLimit > 0 ? Math.min((totalPersonalSpent / personalBudgetLimit) * 100, 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-cyan to-brand-magenta p-6 pb-12 shadow-lg rounded-b-3xl">
                <Link href="/dashboard" className="text-white/80 text-sm font-bold mb-4 block hover:text-white">← Back to Dashboard</Link>
                <h1 className="text-3xl font-bold text-white drop-shadow-md">{trip.title}</h1>
                <p className="text-brand-light-cyan font-medium flex items-center mt-1">
                    📍 {trip.destination}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center -mt-6 px-4 overflow-x-auto pb-2">
                <div className="bg-white rounded-full p-1 shadow-md flex space-x-1 border border-gray-100 flex-nowrap whitespace-nowrap">
                    {['overview', 'itinerary', 'group_budget', 'my_budget'].map((tab) => (
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
                        {/* Group Budget Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-cyan/20">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Group Budget</h3>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-3xl font-bold text-gray-800">${totalGroupSpent}</span>
                                <span className="text-gray-400 font-medium mb-1"> / ${trip.budget}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand-cyan to-brand-magenta transition-all duration-1000"
                                    style={{ width: `${groupProgress}%` }}
                                />
                            </div>
                        </div>

                        {/* Personal Budget Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-pink/20">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">My Budget</h3>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-3xl font-bold text-gray-800">${totalPersonalSpent}</span>
                                <span className="text-gray-400 font-medium mb-1"> / ${personalBudgetLimit}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-pink transition-all duration-1000"
                                    style={{ width: `${personalProgress}%` }}
                                />
                            </div>
                        </div>
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
                                <div className="flex-grow bg-white p-4 rounded-xl shadow-sm border-l-4 border-brand-magenta">
                                    <p className="font-bold text-gray-800">{item.activity}</p>
                                    <p className="text-sm text-gray-500 mt-1">⏰ {item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'group_budget' && (
                    <div className="animate-fadeIn">
                        <h3 className="font-bold text-gray-800 mb-4">Group Expenses (Admin managed)</h3>

                        {user.role === 'admin' && (
                            <form onSubmit={(e) => handleAddExpense(e, 'group')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                                <h4 className="text-sm font-bold text-brand-magenta mb-2">+ Add Group Expense</h4>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input type="number" placeholder="Amount" className="p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-magenta" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                                    <select className="p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-magenta" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                        <option>Food</option><option>Transport</option><option>Stay</option><option>Activity</option><option>Other</option>
                                    </select>
                                </div>
                                <input type="text" placeholder="Note" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-magenta mb-2" value={expenseForm.note} onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })} required />
                                <button className="w-full bg-brand-cyan text-white font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">Add to Group</button>
                            </form>
                        )}

                        <div className="space-y-3">
                            {groupExpenses.length === 0 && <p className="text-gray-400 text-center">No group expenses yet.</p>}
                            {groupExpenses.slice().reverse().map(exp => (
                                <div key={exp.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border-l-4 border-brand-cyan">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-light-cyan flex items-center justify-center text-brand-cyan text-lg">$</div>
                                        <div><p className="font-bold text-gray-800">{exp.category}</p><p className="text-xs text-gray-500">{exp.note}</p></div>
                                    </div>
                                    <span className="font-bold text-brand-cyan text-lg">-${exp.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'my_budget' && (
                    <div className="animate-fadeIn">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-pink/20 mb-6">
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

                        <form onSubmit={(e) => handleAddExpense(e, 'individual')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                            <h4 className="text-sm font-bold text-brand-pink mb-2">+ Add Personal Expense</h4>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input type="number" placeholder="Amount" className="p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-pink" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                                <select className="p-2 bg-gray-50 rounded-lg text-gray-900 border border-transparent focus:bg-white focus:border-brand-pink" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                    <option>Food</option><option>Transport</option><option>Stay</option><option>Activity</option><option>Other</option>
                                </select>
                            </div>
                            <input type="text" placeholder="Note" className="w-full p-2 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 border border-transparent focus:bg-white focus:border-brand-pink mb-2" value={expenseForm.note} onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })} required />
                            <button className="w-full bg-brand-pink text-white font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">Add to Personal</button>
                        </form>

                        <div className="space-y-3">
                            {myExpenses.length === 0 && <p className="text-gray-400 text-center">No personal expenses yet.</p>}
                            {myExpenses.slice().reverse().map(exp => (
                                <div key={exp.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border-l-4 border-brand-pink">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink text-lg">$</div>
                                        <div><p className="font-bold text-gray-800">{exp.category}</p><p className="text-xs text-gray-500">{exp.note}</p></div>
                                    </div>
                                    <span className="font-bold text-brand-pink text-lg">-${exp.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
