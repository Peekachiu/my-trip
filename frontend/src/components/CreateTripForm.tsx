'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type User = { id: string; username: string };

export default function CreateTripForm({ onSuccess }: { onSuccess: () => void }) {
    const [users, setUsers] = useState<User[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: 0,
        assignedToIds: [] as string[]
    });
    const [itinerary, setItinerary] = useState([{ day: 1, time: '09:00', activity: '' }]);

    useEffect(() => {
        api.get('/users').then(setUsers);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.post('/trips', { ...formData, itinerary });
        onSuccess();
    };

    const addItineraryItem = () => {
        setItinerary([...itinerary, { day: 1, time: '09:00', activity: '' }]);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-brand-magenta/20 p-6 bg-white/90 backdrop-blur shadow-lg h-[80vh] overflow-y-auto">
            <h3 className="mb-4 font-bold text-gray-800 border-b border-gray-100 pb-2">Create New Trip</h3>
            <div className="space-y-4">
                <input
                    className="w-full rounded-md border border-gray-200 p-2 focus:border-brand-magenta focus:ring-brand-magenta text-gray-900 placeholder-gray-500"
                    placeholder="Trip Title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
                <input
                    className="w-full rounded-md border border-gray-200 p-2 focus:border-brand-magenta focus:ring-brand-magenta text-gray-900 placeholder-gray-500"
                    placeholder="Destination"
                    value={formData.destination}
                    onChange={e => setFormData({ ...formData, destination: e.target.value })}
                />
                <div className="flex gap-2">
                    <input type="date" className="flex-1 rounded-md border border-gray-200 p-2 focus:border-brand-magenta focus:ring-brand-magenta text-gray-900"
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                    <input type="date" className="flex-1 rounded-md border border-gray-200 p-2 focus:border-brand-magenta focus:ring-brand-magenta text-gray-900"
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                <input
                    type="number"
                    className="w-full rounded-md border border-gray-200 p-2 focus:border-brand-magenta focus:ring-brand-magenta text-gray-900 placeholder-gray-500"
                    placeholder="Budget ($)"
                    onChange={e => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                />

                <label className="block text-sm font-medium text-gray-700">Assign to User</label>
                <select
                    className="w-full rounded-md border border-gray-200 p-2 bg-white focus:border-brand-magenta focus:ring-brand-magenta text-gray-900"
                    onChange={e => setFormData({ ...formData, assignedToIds: [e.target.value] })}
                >
                    <option value="">Select User</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>

                <div className="mt-6 border-t border-dashed border-gray-300 pt-4">
                    <h4 className="font-bold text-brand-magenta mb-2">Itinerary</h4>
                    {itinerary.map((item, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                            <input type="number" className="w-16 rounded-md border border-gray-200 p-1 text-gray-900" placeholder="Day" value={item.day} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].day = parseInt(e.target.value); setItinerary(newIt);
                            }} />
                            <input type="time" className="rounded-md border border-gray-200 p-1 text-gray-900" value={item.time} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].time = e.target.value; setItinerary(newIt);
                            }} />
                            <input className="flex-1 rounded-md border border-gray-200 p-1 text-gray-900 placeholder-gray-500" placeholder="Activity" value={item.activity} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].activity = e.target.value; setItinerary(newIt);
                            }} />
                        </div>
                    ))}
                    <button type="button" onClick={addItineraryItem} className="mt-4 text-sm text-brand-cyan font-bold hover:underline">
                        + Add Activity
                    </button>
                </div>

                <button className="mt-6 w-full rounded-md bg-gradient-to-r from-brand-magenta to-brand-pink p-3 text-white font-bold shadow-md hover:opacity-90 transition-all">
                    Create Trip
                </button>
            </div>
        </form>
    );
}
