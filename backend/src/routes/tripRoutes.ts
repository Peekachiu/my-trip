import { Router } from 'express';
import { getAllTrips, createTrip, getTripsForUser, getTripById, addExpense } from '../controllers/tripController';

export const tripRouter = Router();

tripRouter.get('/', getAllTrips);
tripRouter.get('/:id', getTripById);
tripRouter.post('/', createTrip);
tripRouter.get('/user/:userId', getTripsForUser); // Get trips assigned to a specific user
tripRouter.post('/:id/expenses', addExpense);
