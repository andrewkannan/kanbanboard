import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kanban?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-kanban-key';

app.use(cors());
app.use(express.json());

// Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    // Create a default board for the new user
    const board = await prisma.board.create({
      data: {
        title: 'My Workspace',
        userId: user.id,
        columns: {
          create: [
            { title: 'To-do', order: 0 },
            { title: 'In progress', order: 1, wipLimit: 3 },
            { title: 'Done', order: 2 }
          ]
        }
      }
    });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get User Boards
app.get('/api/boards', authenticateToken, async (req: any, res: any) => {
  try {
    const boards = await prisma.board.findMany({
      where: { userId: req.user.userId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: { checklists: true }
            }
          }
        }
      }
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// Update Card Position (Drag and Drop)
app.put('/api/cards/reorder', authenticateToken, async (req: any, res: any) => {
  try {
    const { items } = req.body; // Array of { id, columnId, order }
    
    // Use a transaction to perform bulk updates
    await prisma.$transaction(
      items.map((item: any) => 
        prisma.card.update({
          where: { id: item.id },
          data: { 
            columnId: item.columnId,
            order: item.order 
          }
        })
      )
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder cards' });
  }
});

// Create Board
app.post('/api/boards', authenticateToken, async (req: any, res: any) => {
  try {
    const { title } = req.body;
    const board = await prisma.board.create({
      data: { title, userId: req.user.userId }
    });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// Create Column
app.post('/api/boards/:boardId/columns', authenticateToken, async (req: any, res: any) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;
    
    // Get highest order
    const maxOrderCol = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' }
    });
    const order = maxOrderCol ? maxOrderCol.order + 1 : 0;

    const column = await prisma.column.create({
      data: { title, boardId, order }
    });
    res.json(column);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create column' });
  }
});

// Create Card
app.post('/api/columns/:columnId/cards', authenticateToken, async (req: any, res: any) => {
  try {
    const { columnId } = req.params;
    const { title } = req.body;

    const maxOrderCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' }
    });
    const order = maxOrderCard ? maxOrderCard.order + 1 : 0;

    const card = await prisma.card.create({
      data: { title, columnId, order }
    });
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// Update Card
app.put('/api/cards/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, description, color, dueDate } = req.body;
    
    const card = await prisma.card.update({
      where: { id },
      data: { title, description, color, dueDate }
    });
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// Delete Card
app.delete('/api/cards/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.card.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
