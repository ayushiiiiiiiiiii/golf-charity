import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app: Express = express()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
import authRoutes from './routes/auth'
import subscriptionRoutes from './routes/subscriptions'
import scoreRoutes from './routes/scores'
import charityRoutes from './routes/charities'
import userRoutes from './routes/user'
import drawRoutes from './routes/draws'
import winnerRoutes from './routes/winners'
import adminRoutes from './routes/admin'

app.use('/api/auth', authRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/scores', scoreRoutes)
app.use('/api/charities', charityRoutes)
app.use('/api/user', userRoutes)
app.use('/api/draws', drawRoutes)
app.use('/api/winners', winnerRoutes)
app.use('/api/admin', adminRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

export default app
