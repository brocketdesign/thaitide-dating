import { Router } from 'express';
import { createProfile, getProfile, updateProfile, uploadPhoto } from '../controllers/userController';

const router = Router();

router.post('/', createProfile);
router.get('/:userId', getProfile);
router.put('/:userId', updateProfile);
router.post('/:userId/photos', uploadPhoto);

export default router;
