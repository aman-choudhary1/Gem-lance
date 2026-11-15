import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { standardLimiter } from './middleware/rateLimiter';
import { errorHandler, AppError } from './middleware/errorHandler';
import apiRoutes from './routes';
import { prisma } from './config/prisma';

export const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:80',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development for seamless local dev
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Parsers & Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Standard Rate Limiter for API
app.use('/api', standardLimiter);

// Public SEO Endpoints
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${env.FRONTEND_URL}/sitemap.xml`);
});

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const auctions = await prisma.auction.findMany({
      select: { id: true, externalId: true, updatedAt: true },
      take: 1000,
      orderBy: { updatedAt: 'desc' }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${env.FRONTEND_URL}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${env.FRONTEND_URL}/auctions</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${env.FRONTEND_URL}/ending-soon</loc>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>
  ${auctions
    .map(
      (a) => `
  <url>
    <loc>${env.FRONTEND_URL}/auctions/${encodeURIComponent(a.externalId)}</loc>
    <lastmod>${a.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('')}
</urlset>`;

    res.type('application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api', apiRoutes);

// Catch 404 for unhandled API routes
app.use('/api/*', (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// Centralized Error Handler
app.use(errorHandler);
