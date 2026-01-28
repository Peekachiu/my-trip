import { Router } from 'express';
import { getAllTrips, getTripsForUser, getTripById, createTrip, addExpense, updatePersonalBudget } from '../controllers/tripController';

const router = Router();

router.get('/', getAllTrips);
router.get('/:id', getTripById);
router.get('/user/:userId', getTripsForUser);
router.post('/', createTrip);
router.post('/:id/expenses', addExpense);
router.patch('/:id/personal-budget', updatePersonalBudget);

export default router;
