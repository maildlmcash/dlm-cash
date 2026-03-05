import { Router } from 'express';
import {
  uploadKyc,
  uploadKycValidation,
  getMyKyc,
  getKycStatus,
} from '../controllers/kycController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { upload } from '../utils/upload';

const router = Router();

router.use(authenticate);

router.post(
  '/upload',
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  validate(uploadKycValidation),
  uploadKyc
);
router.get('/my', getMyKyc);
router.get('/status', getKycStatus);

export default router;
