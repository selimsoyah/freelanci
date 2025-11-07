import { Router } from 'express';
import { body } from 'express-validator';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects,
} from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private (clients only)
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.CLIENT, UserRole.ADMIN),
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must not exceed 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 50 })
      .withMessage('Description must be at least 50 characters'),
    body('budget_min')
      .notEmpty()
      .withMessage('Minimum budget is required')
      .isFloat({ min: 0 })
      .withMessage('Minimum budget must be a positive number'),
    body('budget_max')
      .notEmpty()
      .withMessage('Maximum budget is required')
      .isFloat({ min: 0 })
      .withMessage('Maximum budget must be a positive number'),
    body('deadline')
      .notEmpty()
      .withMessage('Deadline is required')
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
    body('category_id')
      .notEmpty()
      .withMessage('Category is required')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    body('skills_required')
      .optional()
      .isArray()
      .withMessage('Skills required must be an array'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
  ],
  createProject
);

/**
 * @route   GET /api/v1/projects
 * @desc    Get all projects with filters
 * @access  Public
 */
router.get('/', getAllProjects);

/**
 * @route   GET /api/v1/projects/my-projects
 * @desc    Get logged-in user's projects
 * @access  Private (clients only)
 */
router.get(
  '/my-projects',
  authenticate,
  authorize(UserRole.CLIENT, UserRole.ADMIN),
  getMyProjects
);

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get project by ID
 * @access  Public
 */
router.get('/:id', getProjectById);

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    Update project
 * @access  Private (owner or admin)
 */
router.put(
  '/:id',
  authenticate,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must not exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 50 })
      .withMessage('Description must be at least 50 characters'),
    body('budget_min')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum budget must be a positive number'),
    body('budget_max')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum budget must be a positive number'),
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
    body('category_id')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    body('skills_required')
      .optional()
      .isArray()
      .withMessage('Skills required must be an array'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
    body('status')
      .optional()
      .isIn(['open', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Invalid status value'),
  ],
  updateProject
);

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Delete project
 * @access  Private (owner or admin)
 */
router.delete('/:id', authenticate, deleteProject);

export default router;
