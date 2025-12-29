import { Router } from 'express';
import { sendMessage, getMessages, markAsRead, getConversations, getUnreadCount, markConversationAsRead } from '../controllers/messageController';

const router = Router();

router.post('/', sendMessage);
router.get('/conversations/:userId', getConversations);
router.get('/unread/:userId', getUnreadCount);
router.get('/:matchId', getMessages);
router.put('/:messageId/read', markAsRead);
router.put('/:matchId/read-all/:userId', markConversationAsRead);

export default router;
