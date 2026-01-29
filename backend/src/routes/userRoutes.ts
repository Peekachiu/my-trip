import { Router } from 'express';
import { getUsers, createUser, loginUser, deleteUser, updateUser } from '../controllers/userController';

export const userRouter = Router();

userRouter.get('/', getUsers);
userRouter.post('/', createUser);
userRouter.post('/login', loginUser);
userRouter.delete('/:id', deleteUser);
userRouter.put('/:id', updateUser);
