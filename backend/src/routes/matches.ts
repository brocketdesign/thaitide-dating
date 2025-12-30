import { Router } from 'express';
import { swipeRight, swipeLeft, getMatches, getPotentialMatches, getOrCreateConversation, findMatchBetweenUsers, getLikedProfiles, getWhoLikedMe, getProfileVisitors, recordProfileVisit, getMatchDetails, getInteractionStatus } from '../controllers/matchController';

const router = Router();

router.post('/:userId/swipe-right', swipeRight);
router.post('/:userId/swipe-left', swipeLeft);
router.get('/:userId/matches', getMatches);
router.get('/:userId/potential', getPotentialMatches);
router.post('/:userId/conversation', getOrCreateConversation);
router.get('/:userId/match-with/:targetUserId', findMatchBetweenUsers);
router.get('/:userId/interaction-status/:targetUserId', getInteractionStatus);
router.get('/:userId/liked', getLikedProfiles);
router.get('/:userId/who-liked-me', getWhoLikedMe);
router.get('/:userId/visitors', getProfileVisitors);
router.post('/:userId/record-visit', recordProfileVisit);
router.get('/details/:matchId', getMatchDetails);

export default router;
