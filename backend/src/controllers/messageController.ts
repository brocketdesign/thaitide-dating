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

    const messages = await Message.find({ matchId })
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
