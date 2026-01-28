import { Router } from 'express';
import { getUsers, createUser, loginUser } from '../controllers/userController';

export const userRouter = Router();

userRouter.get('/', getUsers);
userRouter.post('/', createUser);
userRouter.post('/login', loginUser);
