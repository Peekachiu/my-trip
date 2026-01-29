import { User, Trip } from './types';

// Mock Data
const users: User[] = [
    { id: '1', username: 'admin', role: 'admin', password: 'password' },
    { id: '2', username: 'user1', role: 'user', password: 'password' },
];

const trips: Trip[] = [
    {
        id: '1',
        title: 'Summer Vacation',
        destination: 'Japan',
        startDate: '2024-07-01',
        endDate: '2024-07-10',
        budget: 5000,
        assignedToIds: ['2'],
        itinerary: [
            { id: '1', day: 1, time: '10:00', title: 'Arrive at Tokyo' },
            { id: '2', day: 1, time: '18:00', title: 'Dinner in Shibuya' },
        ],
        expenses: [
            { id: '1', amount: 50, category: 'Food', note: 'Ramen', date: '2024-07-01' }
        ]
    }
];

export const db = {
    users,
    trips
};
