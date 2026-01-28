import { Router } from 'express';
import { getAllTrips, getTripsForUser, getTripById, createTrip, updateTrip, addExpense, updatePersonalBudget, updateGroupBudget } from '../controllers/tripController';

const router = Router();

router.get('/', getAllTrips);
router.get('/:id', getTripById);
router.get('/user/:userId', getTripsForUser);
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.post('/:id/expenses', addExpense);
router.patch('/:id/personal-budget', updatePersonalBudget);
router.patch('/:id/group-budget', updateGroupBudget);

export default router;
