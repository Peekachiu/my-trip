"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
// Mock Data
const users = [
    { id: '1', username: 'admin', role: 'admin', password: 'password' },
    { id: '2', username: 'user1', role: 'user', password: 'password' },
];
const trips = [
    {
        id: '1',
        title: 'Summer Vacation',
        destination: 'Japan',
        startDate: '2024-07-01',
        endDate: '2024-07-10',
        budget: 5000,
        assignedToIds: ['2'],
        itinerary: [
            { id: '1', day: 1, time: '10:00', activity: 'Arrive at Tokyo' },
            { id: '2', day: 1, time: '18:00', activity: 'Dinner in Shibuya' },
        ],
        expenses: [
            { id: '1', amount: 50, category: 'Food', note: 'Ramen', date: '2024-07-01' }
        ]
    }
];
exports.db = {
    users,
    trips
};
