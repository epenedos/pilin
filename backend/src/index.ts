import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/categories.routes';
import entryRoutes from './routes/entries.routes';
import budgetRoutes from './routes/budgets.routes';
import dashboardRoutes from './routes/dashboard.routes';
import chartRoutes from './routes/charts.routes';
import forecastRoutes from './routes/forecast.routes';

const app = express();

app.use(cors({
  origin: env.nodeEnv === 'production' ? false : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/forecast', forecastRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Pilin API running on port ${env.port}`);
});
