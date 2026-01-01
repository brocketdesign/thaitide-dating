import { Router } from 'express';
import { createCheckoutSession_handler, handleWebhook, getSubscription, cancelSubscription_handler } from '../controllers/subscriptionController';

const router = Router();

router.post('/create-checkout', createCheckoutSession_handler);
router.post('/webhook', handleWebhook);
router.get('/:userId', getSubscription);
router.post('/:userId/cancel', cancelSubscription_handler);

export default router;
