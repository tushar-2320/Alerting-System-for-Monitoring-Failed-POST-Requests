import express from 'express';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);
mongoClient.connect().then(() => {
  console.log('Connected to MongoDB');
  db = mongoClient.db('alerting_system');
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // This may be required for self-signed certificates
  },
  logger: true, // Enable debug logging
  debug: true, 
});

// Middleware to check for invalid headers or incorrect access token
const validateRequest = (req, res, next) => {
  const accessToken = req.headers['x-access-token'];
  if (!accessToken || accessToken !== process.env.VALID_ACCESS_TOKEN) 
{
    return res.status(401).json({ error: 'Invalid access token' });
  }
  next();
};

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 failed attempts
  message: 'Too many failed attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: async (req, res) => {
    const logEntry = {
      ip: req.ip,
      timestamp: new Date(),
      reason: 'Rate limit exceeded',
    };
    
    await db.collection('failed_requests').insertOne(logEntry);
    
    // Send alert email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: 'Alert: Rate Limit Exceeded',
      text: `Rate limit exceeded for IP: ${req.ip}`,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
    
    res.status(429).json({ error: 'Too many failed attempts, please try again later.' });
  },
});

// Apply rate limiter to all routes
app.use(limiter);

// POST endpoint
app.post('/api/submit', validateRequest, (req, res) => {
  res.json({ message: 'Request successful' });
});

// GET endpoint to fetch metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await db.collection('failed_requests').find().toArray();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching metrics' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

