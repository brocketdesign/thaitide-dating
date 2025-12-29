import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { connectDatabase } from './config/database';
import userRoutes from './routes/users';
import matchRoutes from './routes/matches';
import messageRoutes from './routes/messages';
import subscriptionRoutes from './routes/subscriptions';
import uploadRoutes from './routes/uploads';
import adminRoutes from './routes/admin';
import { Message } from './models/Message';
import { User } from './models/User';
import { Match } from './models/Match';

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', `http://${localIP}:3000`],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', `http://${localIP}:3000`]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ThaiTide API is running' });
});

// Socket.io for real-time messaging
const userSockets = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId: string) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('send_message', async (data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
  }) => {
    try {
      const message = new Message({
        matchId: data.matchId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content
      });

      await message.save();

      // Update match's lastMessageAt timestamp so it appears first in conversation list
      await Match.findByIdAndUpdate(
        data.matchId,
        { lastMessageAt: new Date() },
        { new: true }
      );

      // Get sender info for notification
      const sender = await User.findById(data.senderId).select('firstName profilePhoto');
      
      // Get unread count for receiver
      const unreadCount = await Message.countDocuments({
        receiverId: data.receiverId as any,
        read: false
      });

      // Send to receiver if online
      const receiverSocketId = userSockets.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message', {
          message,
          matchId: data.matchId
        });
        
        // Send notification with unread count update
        io.to(receiverSocketId).emit('message_notification', {
          message,
          matchId: data.matchId,
          senderName: sender?.firstName || 'Someone',
          senderPhoto: sender?.profilePhoto,
          unreadCount
        });
        
        // Send unread count update
        io.to(receiverSocketId).emit('unread_count_update', {
          unreadCount
        });
      }

      // Confirm to sender - include matchId at top level for convenience
      socket.emit('message_sent', { message, matchId: data.matchId });
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', (data: { matchId: string; userId: string; receiverId: string }) => {
    const receiverSocketId = userSockets.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        matchId: data.matchId,
        userId: data.userId
      });
    }
  });

  socket.on('mark_as_read', async (data: { matchId: string; userId: string }) => {
    try {
      // Mark all messages in this conversation as read for the user
      const result = await Message.updateMany(
        { matchId: data.matchId as any, receiverId: data.userId as any, read: false },
        { read: true }
      );

      // Get the new unread count for the user
      const unreadCount = await Message.countDocuments({
        receiverId: data.userId as any,
        read: false
      });

      // Send updated unread count back to the user
      socket.emit('unread_count_update', { unreadCount });
      
      // Emit conversation read event so the chat list can update
      socket.emit('conversation_read', { matchId: data.matchId, unreadCount: 0 });
    } catch (error) {
      console.error('Socket mark as read error:', error);
    }
  });

  socket.on('disconnect', () => {
    // Remove user from online users
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 Socket.io is ready for real-time connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
