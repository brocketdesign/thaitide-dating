import { Router } from 'express';
import { createProfile, getProfile, getProfileByClerkId, checkProfileExists, updateProfile, addPhoto, setProfilePhoto, removePhoto } from '../controllers/userController';

const router = Router();

router.post('/', createProfile);
router.get('/clerk/:clerkId', getProfileByClerkId);
router.get('/clerk/:clerkId/exists', checkProfileExists);
router.get('/:userId', getProfile);
router.put('/:userId', updateProfile);
router.post('/:userId/photos', addPhoto);
router.put('/:userId/photos/profile', setProfilePhoto);
router.delete('/:userId/photos', removePhoto);

export default router;
