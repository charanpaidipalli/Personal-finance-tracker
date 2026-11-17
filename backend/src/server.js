require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:4200,http://127.0.0.1:4200')
  .split(',')
  .map(origin => origin.trim());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true
}));
app.use(express.json());
app.get('/api/health', (req,res)=>res.json({status:'ok'}));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./middleware/requireAuth'));
app.use('/api/income', require('./routes/incomeRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use((err,req,res,next)=>{
  console.error(err);
  const status = err.status || (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500);
  res.status(status).json({message:status < 500 ? err.message : 'Server error. Please try again.'});
});
const port=process.env.PORT||5100;
connectDB().then(()=>app.listen(port,()=>console.log(`API running at http://localhost:${port}`))).catch(err=>{console.error('MongoDB connection failed:',err.message);process.exit(1);});
