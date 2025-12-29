import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Match } from '../models/Match';

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
      content
    });

    await message.save();

    // Update last message time on match
    match.lastMessageAt = new Date();
    await match.save();

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
      .populate('senderId', 'firstName lastName profilePhoto')
      .populate('receiverId', 'firstName lastName profilePhoto');

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
      .populate('user1', 'firstName lastName profilePhoto location')
      .populate('user2', 'firstName lastName profilePhoto location')
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
