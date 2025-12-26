import { Router } from 'express';
import { sendMessage, getMessages, markAsRead } from '../controllers/messageController';

const router = Router();

router.post('/', sendMessage);
router.get('/:matchId', getMessages);
router.put('/:messageId/read', markAsRead);

export default router;
