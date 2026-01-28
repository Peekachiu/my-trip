'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

type Expense = { id: string; amount: number; category: string; note: string; date: string; };
type ItineraryItem = { id: string; day: number; time: string; activity: string; };
type Trip = {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    itinerary: ItineraryItem[];
    expenses: Expense[];
};

export default function TripDetailsPage() {
    const { id } = useParams();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'budget'>('overview');
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'Food', note: '', date: '' });

    useEffect(() => {
        if (id) {
            refreshData();
        }
    }, [id]);

    const refreshData = () => {
        api.get(`/trips/${id}`).then(setTrip).catch(console.error);
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trip) return;
        await api.post(`/trips/${trip.id}/expenses`, {
            amount: parseFloat(expenseForm.amount),
            category: expenseForm.category,
            note: expenseForm.note,
            date: expenseForm.date || new Date().toISOString().split('T')[0]
        });
        setExpenseForm({ amount: '', category: 'Food', note: '', date: '' });
        refreshData();
    };

    if (!trip) return <div className="p-8 text-center text-brand-magenta font-bold">Loading Trip...</div>;

    const totalExpenses = trip.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const progress = Math.min((totalExpenses / trip.budget) * 100, 100);

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
            <div className="flex justify-center -mt-6 px-4">
                <div className="bg-white rounded-full p-1 shadow-md flex space-x-1 border border-gray-100">
                    {['overview', 'itinerary', 'budget'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-brand-magenta text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 mt-2">
                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-cyan/20">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Budget</h3>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-3xl font-bold text-gray-800">${totalExpenses}</span>
                                <span className="text-gray-400 font-medium mb-1"> / ${trip.budget}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand-cyan to-brand-magenta transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-right mt-1 text-gray-400">{progress.toFixed(0)}% Used</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-pink/20">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Dates</h3>
                            <div className="flex justify-between">
                                <div>
                                    <span className="block text-xs text-gray-400">Start</span>
                                    <span className="text-lg font-bold text-brand-magenta">{trip.startDate}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-400">End</span>
                                    <span className="text-lg font-bold text-brand-cyan">{trip.endDate}</span>
                                </div>
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

                {activeTab === 'budget' && (
                    <div className="animate-fadeIn">
                        <h3 className="font-bold text-gray-800 mb-4">Add New Expense</h3>
                        <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    className="p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-brand-magenta focus:ring-0 text-gray-900 placeholder-gray-500"
                                    value={expenseForm.amount}
                                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    required
                                />
                                <select
                                    className="p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-brand-magenta focus:ring-0 text-gray-900"
                                    value={expenseForm.category}
                                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                >
                                    <option>Food</option>
                                    <option>Transport</option>
                                    <option>Stay</option>
                                    <option>Activity</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Note (e.g. Taxi to Hotel)"
                                className="w-full p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-brand-magenta focus:ring-0 mb-2 text-gray-900 placeholder-gray-500"
                                value={expenseForm.note}
                                onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })}
                                required
                            />
                            <button className="w-full bg-brand-magenta text-white font-bold py-2 rounded-lg hover:bg-opacity-90 transition-opacity">
                                + Add Expense
                            </button>
                        </form>

                        <h3 className="font-bold text-gray-800 mb-4">Recent Expenses</h3>
                        <div className="space-y-3">
                            {trip.expenses.slice().reverse().map(exp => (
                                <div key={exp.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-light-cyan flex items-center justify-center text-brand-cyan text-lg">
                                            $
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{exp.category}</p>
                                            <p className="text-xs text-gray-500">{exp.note}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-brand-magenta text-lg">-${exp.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
