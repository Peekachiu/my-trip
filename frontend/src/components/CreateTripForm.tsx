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
        <form onSubmit={handleSubmit} className="mt-4 rounded-md border p-4 bg-gray-50 h-[80vh] overflow-y-auto">
            <h3 className="mb-2 font-bold">Create New Trip</h3>
            <div className="space-y-2">
                <input
                    className="w-full rounded border p-2"
                    placeholder="Trip Title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
                <input
                    className="w-full rounded border p-2"
                    placeholder="Destination"
                    value={formData.destination}
                    onChange={e => setFormData({ ...formData, destination: e.target.value })}
                />
                <div className="flex gap-2">
                    <input type="date" className="flex-1 rounded border p-2"
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                    <input type="date" className="flex-1 rounded border p-2"
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                <input
                    type="number"
                    className="w-full rounded border p-2"
                    placeholder="Budget ($)"
                    onChange={e => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                />

                <label className="block text-sm font-medium">Assign to User</label>
                <select
                    className="w-full rounded border p-2 bg-white"
                    onChange={e => setFormData({ ...formData, assignedToIds: [e.target.value] })}
                >
                    <option value="">Select User</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>

                <div className="mt-4 border-t pt-2">
                    <h4 className="font-bold">Itinerary</h4>
                    {itinerary.map((item, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                            <input type="number" className="w-16 rounded border p-1" placeholder="Day" value={item.day} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].day = parseInt(e.target.value); setItinerary(newIt);
                            }} />
                            <input type="time" className="rounded border p-1" value={item.time} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].time = e.target.value; setItinerary(newIt);
                            }} />
                            <input className="flex-1 rounded border p-1" placeholder="Activity" value={item.activity} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].activity = e.target.value; setItinerary(newIt);
                            }} />
                        </div>
                    ))}
                    <button type="button" onClick={addItineraryItem} className="mt-2 text-sm text-blue-600 underline">
                        + Add Activity
                    </button>
                </div>

                <button className="mt-4 w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700">
                    Create Trip
                </button>
            </div>
        </form>
    );
}
