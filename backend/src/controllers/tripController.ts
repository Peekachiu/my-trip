import { Request, Response } from 'express';
import { db } from '../store';
import { Trip, Expense, ItineraryItem } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const getAllTrips = (req: Request, res: Response) => {
    res.json(db.trips);
};

export const getTripsForUser = (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const userTrips = db.trips.filter(t => t.assignedToIds.includes(userId));
    res.json(userTrips);
};

export const getTripById = (req: Request, res: Response) => {
    const trip = db.trips.find(t => t.id === req.params.id);
    if (trip) {
        res.json(trip);
    } else {
        res.status(404).json({ message: 'Trip not found' });
    }
};

export const createTrip = (req: Request, res: Response) => {
    const { title, destination, startDate, endDate, budget, assignedToIds, itinerary } = req.body;

    const newTrip: Trip = {
        id: generateId(),
        title,
        destination,
        startDate,
        endDate,
        budget: Number(budget),
        assignedToIds: assignedToIds || [],
        itinerary: itinerary.map((item: any) => ({ ...item, id: generateId() })) || [],
        expenses: []
    };

    db.trips.push(newTrip);
    res.status(201).json(newTrip);
};

export const addExpense = (req: Request, res: Response) => {
    const tripId = req.params.id;
    const { amount, category, note, date } = req.body;

    const trip = db.trips.find(t => t.id === tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const newExpense: Expense = {
        id: generateId(),
        amount,
        category,
        note,
        date
    };

    trip.expenses.push(newExpense);
    res.status(201).json(newExpense);
};
