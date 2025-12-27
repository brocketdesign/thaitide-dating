import { Router } from 'express';
import { createCheckoutSession, handleWebhook } from '../controllers/subscriptionController';

const router = Router();

router.post('/create-checkout', createCheckoutSession);
router.post('/webhook', handleWebhook);

export default router;
