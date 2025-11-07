import { Request, Response } from 'express';
import { Conversation, Message, Project, User, Profile, Proposal } from '../models';
import { Op } from 'sequelize';
import { ProposalStatus } from '../types';
import { getFileUrl, getAbsolutePathFromUrl, deleteUploadedFile } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

/**
 * Create or get existing conversation for a project
 */
export const createConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { project_id } = req.body;

    // Get project with accepted proposal to find freelancer
    const project = await Project.findByPk(project_id, {
      include: [
        {
          model: Proposal,
          as: 'proposals',
          where: { status: ProposalStatus.ACCEPTED },
          required: false,
          limit: 1,
        },
      ],
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    // Get freelancer from accepted proposal
    const acceptedProposal = (project as any).proposals?.[0];
    if (!acceptedProposal) {
      res.status(400).json({
        success: false,
        message: 'No accepted proposal found for this project',
      });
      return;
    }

    const freelancerId = acceptedProposal.freelancer_id;

    // Determine if user is client or freelancer
    const isClient = project.client_id === userId;
    const isFreelancer = freelancerId === userId;

    if (!isClient && !isFreelancer) {
      res.status(403).json({
        success: false,
        message: 'You are not part of this project',
      });
      return;
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      where: {
        project_id,
        client_id: project.client_id,
        freelancer_id: freelancerId,
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title', 'status'] },
        { model: User, as: 'client', attributes: ['id', 'email'], include: [{ model: Profile, as: 'profile', attributes: ['full_name', 'profile_picture_url'] }] },
        { model: User, as: 'freelancer', attributes: ['id', 'email'], include: [{ model: Profile, as: 'profile', attributes: ['full_name', 'profile_picture_url'] }] },
      ],
    });

    if (conversation) {
      res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        data: conversation,
      });
      return;
    }

    // Create new conversation
    conversation = await Conversation.create({
      project_id,
      client_id: project.client_id,
      freelancer_id: freelancerId,
    });

    // Fetch with associations
    conversation = await Conversation.findByPk(conversation.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title', 'status'] },
        { model: User, as: 'client', attributes: ['id', 'email'], include: [{ model: Profile, as: 'profile', attributes: ['full_name', 'profile_picture_url'] }] },
        { model: User, as: 'freelancer', attributes: ['id', 'email'], include: [{ model: Profile, as: 'profile', attributes: ['full_name', 'profile_picture_url'] }] },
      ],
    })!;

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
    });
  }
};

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get conversations where user is either client or freelancer
    const { rows: conversations, count } = await Conversation.findAndCountAll({
      where: {
        [Op.or]: [{ client_id: userId }, { freelancer_id: userId }],
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title', 'status'] },
        { model: User, as: 'client', attributes: ['id', 'email'], include: [{ model: Profile, as: 'profile', attributes: ['full_name', 'profile_picture_url'] }] },
        { model: User, as: 'freelancer', attributes: ['id', 'email'], include: [{ model: Profile, as: 'profile', attributes: ['full_name', 'profile_picture_url'] }] },
      ],
      order: [['last_message_at', 'DESC NULLS LAST'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    // Get unread count for each conversation
    const conversationsWithUnread = conversations.map((conv) => {
      const isClient = conv.client_id === userId;
      const unreadCount = isClient
        ? conv.unread_count_client
        : conv.unread_count_freelancer;
      
      return {
        ...conv.toJSON(),
        unread_count: unreadCount,
      };
    });

    res.status(200).json({
      success: true,
      data: conversationsWithUnread,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
    });
  }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { conversation_id } = req.params;
    const { content, attachments = [] } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
      return;
    }

    // Get conversation
    const conversation = await Conversation.findByPk(conversation_id);
    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    // Check if user is part of conversation
    if (
      conversation.client_id !== userId &&
      conversation.freelancer_id !== userId
    ) {
      res.status(403).json({
        success: false,
        message: 'You are not part of this conversation',
      });
      return;
    }

    // Create message
    const message = await Message.create({
      conversation_id,
      sender_id: userId,
      content: content.trim(),
      attachments,
    });

    // Update conversation
    const isClient = conversation.client_id === userId;
    await conversation.update({
      last_message_at: new Date(),
      unread_count_client: isClient
        ? conversation.unread_count_client
        : conversation.unread_count_client + 1,
      unread_count_freelancer: isClient
        ? conversation.unread_count_freelancer + 1
        : conversation.unread_count_freelancer,
    });

    // Fetch message with sender details
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['full_name', 'profile_picture_url'],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: messageWithSender,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { conversation_id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get conversation
    const conversation = await Conversation.findByPk(conversation_id);
    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    // Check if user is part of conversation
    if (
      conversation.client_id !== userId &&
      conversation.freelancer_id !== userId
    ) {
      res.status(403).json({
        success: false,
        message: 'You are not part of this conversation',
      });
      return;
    }

    // Get messages
    const { rows: messages, count } = await Message.findAndCountAll({
      where: {
        conversation_id,
        deleted_at: { [Op.eq]: null } as any,
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['full_name', 'profile_picture_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { conversation_id } = req.params;

    // Get conversation
    const conversation = await Conversation.findByPk(conversation_id);
    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    // Check if user is part of conversation
    if (
      conversation.client_id !== userId &&
      conversation.freelancer_id !== userId
    ) {
      res.status(403).json({
        success: false,
        message: 'You are not part of this conversation',
      });
      return;
    }

    // Mark all unread messages as read
    await Message.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          conversation_id,
          sender_id: { [Op.ne]: userId },
          is_read: false,
        },
      }
    );

    // Reset unread count
    const isClient = conversation.client_id === userId;
    await conversation.update({
      unread_count_client: isClient ? 0 : conversation.unread_count_client,
      unread_count_freelancer: isClient
        ? conversation.unread_count_freelancer
        : 0,
    });

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
    });
  }
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { message_id } = req.params;

    // Get message
    const message = await Message.findByPk(message_id);
    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found',
      });
      return;
    }

    // Check if user is the sender
    if (message.sender_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
      });
      return;
    }

    // Soft delete
    await message.update({
      deleted_at: new Date(),
      content: '[Message deleted]',
      attachments: [],
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
    });
  }
};

/**
 * Upload files for messages
 */
export const uploadFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
      return;
    }

    // Get file URLs
    const fileUrls = req.files.map((file: Express.Multer.File) => {
      return {
        url: getFileUrl(file.path),
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: fileUrls,
      },
    });
  } catch (error) {
    console.error('Error uploading files:', error);

    // Clean up uploaded files on error
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        deleteUploadedFile(file.path);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
    });
  }
};

/**
 * Download/serve a message file
 */
export const downloadFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { year, month, filename } = req.params;

    // Construct file URL
    const fileUrl = `/uploads/messages/${year}/${month}/${filename}`;
    const filePath = getAbsolutePathFromUrl(fileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // Find message with this attachment
    const message = await Message.findOne({
      where: {
        attachments: {
          [Op.contains]: [fileUrl],
        },
      },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          attributes: ['id', 'client_id', 'freelancer_id'],
        },
      ],
    });

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'File not associated with any message',
      });
      return;
    }

    // Check if user has access to this file
    const conversation = (message as any).conversation;
    if (
      conversation.client_id !== userId &&
      conversation.freelancer_id !== userId
    ) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this file',
      });
      return;
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentType = getContentType(ext);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
    });
  }
};

/**
 * Helper function to determine content type based on file extension
 */
const getContentType = (ext: string): string => {
  const contentTypes: { [key: string]: string } = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    // Videos
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    // Code
    '.js': 'text/javascript',
    '.ts': 'text/typescript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.json': 'application/json',
  };

  return contentTypes[ext] || 'application/octet-stream';
};
