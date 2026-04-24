require('dotenv').config();

const express = require('express');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const townanchorRoutes = require('./modules/townanchor/townanchor.routes');
const newsRoutes = require('./modules/news/news.routes');
const townRoutes = require('./modules/town/town.routes');
const userRoutes = require('./modules/user/user.routes');
const reactionRoutes = require('./modules/reaction/reaction.routes');
const commentRoutes = require('./modules/comment/comment.routes');
const personRoutes = require('./modules/person/person.routes');
const commentReactionRoutes = require('./modules/comment-reaction/comment-reaction.routes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.use('/api/townanchor', townanchorRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/town', townRoutes);
app.use('/api/user', userRoutes);
app.use('/api/reaction', reactionRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/person', personRoutes);
app.use('/api/comment-reaction', commentReactionRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

module.exports = app;
