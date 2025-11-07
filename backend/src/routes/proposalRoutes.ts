import express from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import {
  submitProposal,
  getProposalsByProject,
  getMyProposals,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
  getProposalById,
} from '../controllers/proposalController';

const router = express.Router();

/**
 * @route   POST /api/v1/proposals
 * @desc    Submit a proposal on a project (Freelancers only)
 * @access  Private (Freelancer)
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.FREELANCER),
  [
    body('project_id')
      .isUUID()
      .withMessage('Valid project ID is required'),
    body('cover_letter')
      .trim()
      .isLength({ min: 100, max: 2000 })
      .withMessage('Cover letter must be between 100 and 2000 characters'),
    body('proposed_budget')
      .isFloat({ min: 1 })
      .withMessage('Proposed budget must be at least 1'),
    body('delivery_time')
      .isInt({ min: 1, max: 365 })
      .withMessage('Delivery time must be between 1 and 365 days'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
    body('attachments.*')
      .optional()
      .isURL()
      .withMessage('Each attachment must be a valid URL'),
  ],
  submitProposal
);

/**
 * @route   GET /api/v1/proposals/project/:projectId
 * @desc    Get all proposals for a specific project (Project owner only)
 * @access  Private (Client/Admin)
 */
router.get(
  '/project/:projectId',
  authenticate,
  [
    param('projectId')
      .isUUID()
      .withMessage('Valid project ID is required'),
  ],
  getProposalsByProject
);

/**
 * @route   GET /api/v1/proposals/my-proposals
 * @desc    Get all proposals submitted by the logged-in freelancer
 * @access  Private (Freelancer)
 */
router.get(
  '/my-proposals',
  authenticate,
  authorize(UserRole.FREELANCER),
  getMyProposals
);

/**
 * @route   GET /api/v1/proposals/:id
 * @desc    Get a single proposal by ID
 * @access  Private (Proposal owner, Project owner, or Admin)
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Valid proposal ID is required'),
  ],
  getProposalById
);

/**
 * @route   PUT /api/v1/proposals/:id/accept
 * @desc    Accept a proposal (Project owner only)
 * @access  Private (Client)
 */
router.put(
  '/:id/accept',
  authenticate,
  authorize(UserRole.CLIENT, UserRole.ADMIN),
  [
    param('id')
      .isUUID()
      .withMessage('Valid proposal ID is required'),
  ],
  acceptProposal
);

/**
 * @route   PUT /api/v1/proposals/:id/reject
 * @desc    Reject a proposal (Project owner only)
 * @access  Private (Client)
 */
router.put(
  '/:id/reject',
  authenticate,
  authorize(UserRole.CLIENT, UserRole.ADMIN),
  [
    param('id')
      .isUUID()
      .withMessage('Valid proposal ID is required'),
  ],
  rejectProposal
);

/**
 * @route   PUT /api/v1/proposals/:id/withdraw
 * @desc    Withdraw a proposal (Freelancer only - before it's accepted/rejected)
 * @access  Private (Freelancer)
 */
router.put(
  '/:id/withdraw',
  authenticate,
  authorize(UserRole.FREELANCER),
  [
    param('id')
      .isUUID()
      .withMessage('Valid proposal ID is required'),
  ],
  withdrawProposal
);

export default router;
