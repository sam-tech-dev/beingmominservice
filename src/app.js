require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const townanchorRoutes = require('./modules/townanchor/townanchor.routes');
const newsRoutes = require('./modules/news/news.routes');
const townRoutes = require('./modules/town/town.routes');
const userRoutes = require('./modules/user/user.routes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/townanchor', townanchorRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/town', townRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

module.exports = app;
