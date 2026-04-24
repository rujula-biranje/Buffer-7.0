import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';
import ordersRoutes from './routes/orders.js';
import pollsRoutes from './routes/polls.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/items', itemsRoutes);
app.use('/orders', ordersRoutes);
app.use('/polls', pollsRoutes);
app.use('/admin', adminRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Canteen API listening on :${port}`);
});
