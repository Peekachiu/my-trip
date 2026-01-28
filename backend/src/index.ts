import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from './routes/userRoutes';
import { tripRouter } from './routes/tripRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
    res.send('Trip App Backend API is running');
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/trips', tripRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
