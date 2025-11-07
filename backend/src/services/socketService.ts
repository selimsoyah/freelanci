import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Conversation, Message, User, Profile } from '../models';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'client' | 'freelancer';
}

interface SocketUser {
  socketId: string;
  userId: string;
  userRole: 'client' | 'freelancer';
}

// Store online users and their socket IDs
const onlineUsers = new Map<string, SocketUser>();

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { 
        id: string; 
        role: 'client' | 'freelancer' 
      };

      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userRole = socket.userRole!;

    console.log(`✅ User connected: ${userId} (${userRole}) - Socket: ${socket.id}`);

    // Store user as online
    onlineUsers.set(userId, {
      socketId: socket.id,
      userId,
      userRole
    });

    // Broadcast online status to relevant users
    socket.broadcast.emit('user-online', { userId });

    // Join conversation rooms
    socket.on('join-conversation', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            [userRole === 'client' ? 'client_id' : 'freelancer_id']: userId
          }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }

        socket.join(`conversation-${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);

        socket.emit('conversation-joined', { conversationId });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Leave conversation room
    socket.on('leave-conversation', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.leave(`conversation-${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on('send-message', async (data: {
      conversationId: string;
      content: string;
      attachments?: string[];
    }) => {
      try {
        const { conversationId, content, attachments } = data;

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            [userRole === 'client' ? 'client_id' : 'freelancer_id']: userId
          }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Not authorized to send message' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversation_id: conversationId,
          sender_id: userId,
          content,
          attachments: attachments || [],
          is_read: false
        });

        // Update conversation
        const recipientField = userRole === 'client' ? 'unread_count_freelancer' : 'unread_count_client';
        await conversation.update({
          last_message_at: new Date(),
          [recipientField]: (conversation as any)[recipientField] + 1
        });

        // Fetch full message with sender details
        const fullMessage = await Message.findByPk(message.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'email', 'role'],
              include: [{
                model: Profile,
                as: 'profile',
                attributes: ['first_name', 'last_name', 'avatar']
              }]
            }
          ]
        });

        // Broadcast to conversation room
        io.to(`conversation-${conversationId}`).emit('new-message', {
          message: fullMessage,
          conversationId
        });

        console.log(`Message sent in conversation ${conversationId} by user ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing-start', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.to(`conversation-${conversationId}`).emit('user-typing', {
        userId,
        conversationId
      });
    });

    socket.on('typing-stop', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.to(`conversation-${conversationId}`).emit('user-stopped-typing', {
        userId,
        conversationId
      });
    });

    // Mark messages as read
    socket.on('mark-as-read', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            [userRole === 'client' ? 'client_id' : 'freelancer_id']: userId
          }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Mark all unread messages as read
        await Message.update(
          {
            is_read: true,
            read_at: new Date()
          },
          {
            where: {
              conversation_id: conversationId,
              sender_id: { [require('sequelize').Op.ne]: userId },
              is_read: false
            }
          }
        );

        // Reset unread count
        const unreadField = userRole === 'client' ? 'unread_count_client' : 'unread_count_freelancer';
        await conversation.update({ [unreadField]: 0 });

        // Notify other user
        socket.to(`conversation-${conversationId}`).emit('messages-read', {
          conversationId,
          readBy: userId
        });

        console.log(`Messages marked as read in conversation ${conversationId} by user ${userId}`);
      } catch (error) {
        console.error('Error marking as read:', error);
        socket.emit('error', { message: 'Failed to mark as read' });
      }
    });

    // Disconnection handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId} - Socket: ${socket.id}`);
      
      // Remove from online users
      onlineUsers.delete(userId);

      // Broadcast offline status
      socket.broadcast.emit('user-offline', { userId });
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  console.log('✅ Socket.IO server initialized');

  return io;
};

// Helper function to get online users
export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers.keys());
};

// Helper function to check if user is online
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

// Helper function to get user's socket ID
export const getUserSocketId = (userId: string): string | undefined => {
  return onlineUsers.get(userId)?.socketId;
};
