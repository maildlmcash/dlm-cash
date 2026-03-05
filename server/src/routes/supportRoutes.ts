import { Router } from 'express';
import {
  createTicket,
  createTicketValidation,
  getMyTickets,
  getTicketById,
  getAllTickets,
  updateTicketStatus,
} from '../controllers/supportController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// User routes
router.post('/', authenticate, validate(createTicketValidation), createTicket);
router.get('/my', authenticate, getMyTickets);
router.get('/my/:id', authenticate, getTicketById);

// Admin routes
router.get(
  '/all',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'SUPPORT'),
  getAllTickets
);
router.put(
  '/:id/status',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'SUPPORT'),
  updateTicketStatus
);

export default router;
