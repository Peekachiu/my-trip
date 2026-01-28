'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type User = { id: string; username: string };
type TripData = {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    assignedToIds: string[];
    itinerary: { day: number, time: string, activity: string, date?: string }[];
};

interface CreateTripFormProps {
    onSuccess: () => void;
    initialData?: TripData;
    tripId?: string;
    onCancel?: () => void;
}

export default function CreateTripForm({ onSuccess, initialData, tripId, onCancel }: CreateTripFormProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: 0,
        assignedToIds: [] as string[]
    });
    // Ensure date is always a string for state
    const [itinerary, setItinerary] = useState<{ day: number; time: string; activity: string; date: string; }[]>([{ day: 1, time: '09:00', activity: '', date: '' }]);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/users').then(setUsers);
        if (initialData) {
            setFormData({
                title: initialData.title,
                destination: initialData.destination,
                startDate: initialData.startDate?.split('T')[0] || '',
                endDate: initialData.endDate?.split('T')[0] || '',
                budget: initialData.budget,
                assignedToIds: initialData.assignedToIds || []
            });
            if (initialData.itinerary && initialData.itinerary.length > 0) {
                // Map to state format, ensuring date is string
                setItinerary(initialData.itinerary.map(i => ({
                    day: i.day,
                    time: i.time,
                    activity: i.activity,
                    date: i.date || ''
                })));
            }
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const payload = { ...formData, itinerary };

        try {
            let res;
            if (tripId) {
                res = await api.put(`/trips/${tripId}`, payload);
            } else {
                res = await api.post('/trips', payload);
            }

            if (res.error) {
                setError(res.error);
                return;
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            setError('Failed to save trip. Please try again.');
        }
    };

    const addItineraryItem = () => {
        setItinerary([...itinerary, { day: 1, time: '09:00', activity: '', date: '' }]);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 glass-card bg-white/80 p-6 shadow-xl h-[80vh] overflow-y-auto relative">
            {onCancel && (
                <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    ✕
                </button>
            )}
            <h3 className="mb-4 font-bold text-gray-800 border-b border-gray-100 pb-2">
                {tripId ? 'Edit Trip' : 'Create New Trip'}
            </h3>
            {error && <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}
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
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                    <input type="date" className="flex-1 rounded-md border border-gray-200 p-2 focus:border-brand-magenta focus:ring-brand-magenta text-gray-900"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                <input
                    type="number"
                    className="w-full rounded-md border border-gray-200 p-2 focus:border-brand-magenta focus:ring-brand-magenta text-gray-900 placeholder-gray-500"
                    placeholder="Budget ($)"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                />

                <label className="block text-sm font-medium text-gray-700">Assign to Users</label>
                <div className="border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto bg-white/50 space-y-2">
                    {users.length === 0 && <p className="text-gray-400 text-xs">No users found.</p>}
                    {users.map(u => (
                        <label key={u.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                                type="checkbox"
                                className="rounded text-brand-magenta focus:ring-brand-magenta"
                                checked={formData.assignedToIds.includes(u.id)}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setFormData(prev => ({
                                        ...prev,
                                        assignedToIds: checked
                                            ? [...prev.assignedToIds, u.id]
                                            : prev.assignedToIds.filter(id => id !== u.id)
                                    }));
                                }}
                            />
                            <span className="text-gray-800 text-sm">{u.username}</span>
                        </label>
                    ))}
                </div>
                {tripId && <p className="text-xs text-brand-magenta font-bold">* You can add more users, but removing users needs care regarding their personal expenses/budget.</p>}

                <div className="mt-6 border-t border-dashed border-gray-300 pt-4">
                    <h4 className="font-bold text-brand-magenta mb-2">Itinerary</h4>
                    {itinerary.map((item, index) => (
                        <div key={index} className="flex gap-2 mt-2 flex-wrap sm:flex-nowrap">
                            <input type="number" className="w-16 rounded-md border border-gray-200 p-1 text-gray-900" placeholder="Day" value={item.day} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].day = parseInt(e.target.value); setItinerary(newIt);
                            }} />
                            <input type="date" className="rounded-md border border-gray-200 p-1 text-gray-900" value={item.date || ''} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].date = e.target.value; setItinerary(newIt);
                            }} />
                            <input type="time" className="rounded-md border border-gray-200 p-1 text-gray-900" value={item.time} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].time = e.target.value; setItinerary(newIt);
                            }} />
                            <input className="flex-1 rounded-md border border-gray-200 p-1 text-gray-900 placeholder-gray-500 min-w-[150px]" placeholder="Activity" value={item.activity} onChange={e => {
                                const newIt = [...itinerary]; newIt[index].activity = e.target.value; setItinerary(newIt);
                            }} />
                            <button type="button" onClick={() => {
                                const newIt = itinerary.filter((_, i) => i !== index);
                                setItinerary(newIt);
                            }} className="text-red-500 font-bold px-2">×</button>
                        </div>
                    ))}
                    <button type="button" onClick={addItineraryItem} className="mt-4 text-sm text-brand-cyan font-bold hover:underline">
                        + Add Activity
                    </button>
                </div>

                <button className="mt-6 w-full rounded-md bg-gradient-to-r from-brand-magenta to-brand-pink p-3 text-white font-bold shadow-md hover:opacity-90 transition-all">
                    {tripId ? 'Update Trip' : 'Create Trip'}
                </button>
            </div>
        </form>
    );
}
