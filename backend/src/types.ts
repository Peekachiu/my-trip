export type Role = 'admin' | 'user';

export interface User {
    id: string;
    username: string;
    email?: string;
    password?: string; // In a real app, this would be hashed.
    role: Role;
}

export interface Expense {
    id: string;
    amount: number;
    category: string;
    note: string;
    date: string;
}

export interface ItineraryItem {
    id: string;
    day: number;
    time: string;
    date?: string; // Optional for implementation ease, but effectively required
    activity: string;
}

export interface Trip {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    assignedToIds: string[]; // User IDs
    itinerary: ItineraryItem[];
    expenses: Expense[];
}
