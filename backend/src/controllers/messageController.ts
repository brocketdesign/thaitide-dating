import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Match } from '../models/Match';
import { User } from '../models/User';
import { generateAIChatResponse } from '../services/aiProfileGenerator';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { matchId, senderId, receiverId, content } = req.body;

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const message = new Message({
      matchId,
      senderId,
      receiverId,
      content,
      isAIGenerated: false
    });

    await message.save();

    // Update last message time on match
    match.lastMessageAt = new Date();
    await match.save();

    // Check if the receiver is an AI profile
    const receiver = await User.findById(receiverId);
    if (receiver && receiver.isAI) {
      // Get sender info for personalized response
      const sender = await User.findById(senderId);
      
      // Get conversation history for context (last 10 messages)
      const recentMessages = await Message.find({ matchId: matchId as any })
        .sort({ createdAt: -1 })
        .limit(10);
      
      // Build conversation history for OpenAI
      const conversationHistory = recentMessages.reverse().map(msg => ({
        role: msg.senderId.toString() === receiverId.toString() ? 'assistant' as const : 'user' as const,
        content: msg.content
      }));

      try {
        // Calculate sender's age
        let senderAge: number | undefined;
        if (sender?.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(sender.dateOfBirth);
          senderAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            senderAge--;
          }
        }

        // Generate AI response with full user context
        const aiResponse = await generateAIChatResponse(
          {
            username: receiver.username,
            bio: receiver.bio || '',
            interests: receiver.interests,
            gender: receiver.gender
          },
          {
            username: sender?.username || 'friend',
            bio: sender?.bio,
            interests: sender?.interests,
            gender: sender?.gender,
            age: senderAge,
            location: sender?.location?.city
          },
          conversationHistory
        );

        // Add small delay for natural feel (1-3 seconds)
        const delay = 1000 + Math.random() * 2000;
        setTimeout(async () => {
          try {
            // Save AI response
            const aiMessage = new Message({
              matchId,
              senderId: receiverId,
              receiverId: senderId,
              content: aiResponse,
              isAIGenerated: true
            });

            await aiMessage.save();

            // Update last message time
            match.lastMessageAt = new Date();
            await match.save();

            // Emit via socket if available (handled by socket.io in index.ts)
            const io = req.app.get('io');
            if (io) {
              io.emit('new_message', {
                matchId,
                message: {
                  _id: aiMessage._id,
                  matchId,
                  senderId: receiverId,
                  receiverId: senderId,
                  content: aiResponse,
                  read: false,
                  isAIGenerated: true,
                  createdAt: aiMessage.createdAt
                }
              });
            }
          } catch (aiError) {
            console.error('Error saving AI response:', aiError);
          }
        }, delay);
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
        // Continue without AI response - user message was still saved
      }
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ matchId: matchId as any })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('senderId', 'username profilePhoto')
      .populate('receiverId', 'username profilePhoto');

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error marking message as read' });
  }
};

// Get all conversations for a user with unread counts
export const getConversations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get all matches for the user
    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }]
    } as any)
      .populate('user1', 'username profilePhoto location isAI')
      .populate('user2', 'username profilePhoto location isAI')
      .sort({ lastMessageAt: -1, createdAt: -1 });

    // Track seen user IDs to prevent duplicates
    const seenUserIds = new Set<string>();

    // For each match, get the last message and unread count
    const conversations = await Promise.all(
      matches.map(async (match) => {
        const lastMessage = await Message.findOne({ matchId: match._id } as any)
          .sort({ createdAt: -1 })
          .select('content createdAt senderId read');

        const unreadCount = await Message.countDocuments({
          matchId: match._id,
          receiverId: userId,
          read: false
        } as any);

        // Get the other user in the conversation
        const user1 = match.user1 as any;
        const user2 = match.user2 as any;
        const otherUser = (user1._id || user1).toString() === userId ? user2 : user1;
        const otherUserId = (otherUser._id || otherUser).toString();

        // Skip if we've already seen this user (duplicate conversation)
        if (seenUserIds.has(otherUserId)) {
          return null;
        }
        seenUserIds.add(otherUserId);

        return {
          matchId: match._id,
          user: otherUser,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                isFromMe: lastMessage.senderId.toString() === userId,
                read: lastMessage.read
              }
            : null,
          unreadCount,
          createdAt: match.createdAt
        };
      })
    );

    // Filter out null values (duplicates)
    const filteredConversations = conversations.filter(conv => conv !== null);

    res.json({ conversations: filteredConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};

// Get total unread message count for a user
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      read: false
    } as any);

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
};

// Mark all messages in a conversation as read
export const markConversationAsRead = async (req: Request, res: Response) => {
  try {
    const { matchId, userId } = req.params;

    await Message.updateMany(
      { matchId, receiverId: userId, read: false } as any,
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({ message: 'Error marking conversation as read' });
  }
};
