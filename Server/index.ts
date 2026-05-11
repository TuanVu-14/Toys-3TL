import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes';
import 'dotenv/config';
import helmet from 'helmet';
import { connectDB } from './data/DB';
import rateLimiterMiddleware from './middleware/rateLimit';
import authenticateToken from './middleware/header_auth';

const app: Express = express();
app.set('trust proxy', true);

const port = process.env.PORT || 3500;

const origin_url = process.env.FRONTEND_SERVER_ORIGIN;
if (!origin_url) throw new Error('Missing FRONTEND_SERVER_ORIGIN in .env');

const corsOptions = {
  origin: origin_url,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(rateLimiterMiddleware);
app.use(helmet());
app.use(bodyParser.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(authenticateToken);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Success' });
});

app.use('/api', routes);

const startServer = async () => {
  try {
    await connectDB(); // ✅ DB trước
    app.listen(port, () => {
      console.log(`[server]: Server is running at Port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();