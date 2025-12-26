import { Router } from 'express';
import { swipeRight, swipeLeft, getMatches, getPotentialMatches } from '../controllers/matchController';

const router = Router();

router.post('/:userId/swipe-right', swipeRight);
router.post('/:userId/swipe-left', swipeLeft);
router.get('/:userId/matches', getMatches);
router.get('/:userId/potential', getPotentialMatches);

export default router;
