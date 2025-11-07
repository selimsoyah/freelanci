import { Router } from 'express';
import {
  createConversation,
  getConversations,
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  uploadFiles,
  downloadFile,
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import { uploadMessageFiles, validateFileSizes } from '../middleware/upload';

const router = Router();

/**
 * @route   POST /api/v1/messages/conversations
 * @desc    Create or get conversation for a project
 * @access  Private (Client or Freelancer)
 */
router.post('/conversations', authenticate, createConversation);

/**
 * @route   GET /api/v1/messages/conversations
 * @desc    Get all conversations for authenticated user
 * @access  Private
 */
router.get('/conversations', authenticate, getConversations);

/**
 * @route   POST /api/v1/messages/conversations/:conversation_id/messages
 * @desc    Send a message in a conversation
 * @access  Private (Participants only)
 */
router.post('/conversations/:conversation_id/messages', authenticate, sendMessage);

/**
 * @route   GET /api/v1/messages/conversations/:conversation_id/messages
 * @desc    Get messages for a conversation
 * @access  Private (Participants only)
 */
router.get('/conversations/:conversation_id/messages', authenticate, getMessages);

/**
 * @route   PATCH /api/v1/messages/conversations/:conversation_id/read
 * @desc    Mark all messages in conversation as read
 * @access  Private (Participants only)
 */
router.patch('/conversations/:conversation_id/read', authenticate, markAsRead);

/**
 * @route   DELETE /api/v1/messages/:message_id
 * @desc    Delete a message (soft delete)
 * @access  Private (Sender only)
 */
router.delete('/:message_id', authenticate, deleteMessage);

/**
 * @route   POST /api/v1/messages/upload
 * @desc    Upload files for messages
 * @access  Private
 */
router.post(
  '/upload',
  authenticate,
  uploadMessageFiles.array('files', 5),
  validateFileSizes,
  uploadFiles
);

/**
 * @route   GET /api/v1/messages/files/:year/:month/:filename
 * @desc    Download/serve a message file
 * @access  Private (Participants only)
 */
router.get('/files/:year/:month/:filename', authenticate, downloadFile);

export default router;
