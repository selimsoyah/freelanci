import { Request, Response } from 'express';
import { Proposal, Project, User, Profile } from '../models';
import { Op } from 'sequelize';
import { ProjectStatus } from '../types';

/**
 * Submit a proposal on a project (Freelancers only)
 * POST /api/v1/proposals
 */
export const submitProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const freelancer_id = req.user?.userId;
    
    if (!freelancer_id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }
    
    const { project_id, cover_letter, proposed_budget, delivery_time, attachments } = req.body;

    // Check if project exists and is open
    const project = await Project.findByPk(project_id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    if (project.status !== 'open') {
      res.status(400).json({ 
        success: false, 
        message: `Cannot submit proposal on a ${project.status} project` 
      });
      return;
    }

    // Prevent clients from submitting proposals on their own projects
    if (project.client_id === freelancer_id) {
      res.status(403).json({ 
        success: false, 
        message: 'You cannot submit a proposal on your own project' 
      });
      return;
    }

    // Check if freelancer already submitted a proposal for this project
    const existingProposal = await Proposal.findOne({
      where: { project_id, freelancer_id },
    });

    if (existingProposal) {
      res.status(400).json({ 
        success: false, 
        message: 'You have already submitted a proposal for this project' 
      });
      return;
    }

    // Create the proposal
    const proposal = await Proposal.create({
      project_id,
      freelancer_id,
      cover_letter,
      proposed_budget,
      delivery_time,
      attachments: attachments || [],
    });

    // Fetch the created proposal with associations
    const createdProposal = await Proposal.findByPk(proposal.id, {
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['full_name', 'bio', 'skills', 'hourly_rate', 'profile_picture_url'],
            },
          ],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: createdProposal,
    });
  } catch (error: any) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Get all proposals for a specific project (Project owner only)
 * GET /api/v1/proposals/project/:projectId
 */
export const getProposalsByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const user_id = req.user?.userId;

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Only project owner or admin can view proposals
    if (project.client_id !== user_id && req.user?.role !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to view proposals for this project' 
      });
      return;
    }

    const proposals = await Proposal.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['full_name', 'bio', 'skills', 'hourly_rate', 'avatar_url', 'portfolio_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Get all proposals submitted by the logged-in freelancer
 * GET /api/v1/proposals/my-proposals
 */
export const getMyProposals = async (req: Request, res: Response): Promise<void> => {
  try {
    const freelancer_id = req.user?.userId;
    const { status } = req.query;

    const whereClause: any = { freelancer_id };
    
    if (status && ['pending', 'accepted', 'rejected', 'withdrawn'].includes(status as string)) {
      whereClause.status = status;
    }

    const proposals = await Proposal.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'description', 'budget_min', 'budget_max', 'status', 'deadline'],
          include: [
            {
              model: User,
              as: 'client',
              attributes: ['id', 'email'],
              include: [
                {
                  model: Profile,
                  as: 'profile',
                  attributes: ['full_name', 'avatar_url'],
                },
              ],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error: any) {
    console.error('Error fetching my proposals:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Accept a proposal (Project owner only)
 * PUT /api/v1/proposals/:id/accept
 */
export const acceptProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = req.user?.userId;

    const proposal = await Proposal.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
        },
      ],
    });

    if (!proposal) {
      res.status(404).json({ success: false, message: 'Proposal not found' });
      return;
    }

    const project = proposal.project as Project;

    // Only project owner can accept proposals
    if (project.client_id !== user_id) {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to accept this proposal' 
      });
      return;
    }

    // Check if proposal is in pending status
    if (proposal.status !== 'pending') {
      res.status(400).json({ 
        success: false, 
        message: `Cannot accept a ${proposal.status} proposal` 
      });
      return;
    }

    // Check if project is still open
    if (project.status !== 'open') {
      res.status(400).json({ 
        success: false, 
        message: 'Project is no longer open for proposals' 
      });
      return;
    }

    // Update proposal status
    await proposal.update({ status: 'accepted' });

    // Update project status to in_progress
    await project.update({ status: ProjectStatus.IN_PROGRESS });

    // Reject all other pending proposals for this project
    await Proposal.update(
      { status: 'rejected' },
      {
        where: {
          project_id: project.id,
          id: { [Op.ne]: proposal.id },
          status: 'pending',
        },
      }
    );

    const updatedProposal = await Proposal.findByPk(id, {
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['full_name', 'bio', 'skills'],
            },
          ],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Proposal accepted successfully. Project status updated to in_progress.',
      data: updatedProposal,
    });
  } catch (error: any) {
    console.error('Error accepting proposal:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Reject a proposal (Project owner only)
 * PUT /api/v1/proposals/:id/reject
 */
export const rejectProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = req.user?.userId;

    const proposal = await Proposal.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
        },
      ],
    });

    if (!proposal) {
      res.status(404).json({ success: false, message: 'Proposal not found' });
      return;
    }

    const project = proposal.project as Project;

    // Only project owner can reject proposals
    if (project.client_id !== user_id) {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to reject this proposal' 
      });
      return;
    }

    // Check if proposal is in pending status
    if (proposal.status !== 'pending') {
      res.status(400).json({ 
        success: false, 
        message: `Cannot reject a ${proposal.status} proposal` 
      });
      return;
    }

    // Update proposal status
    await proposal.update({ status: 'rejected' });

    const updatedProposal = await Proposal.findByPk(id, {
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['full_name'],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Proposal rejected successfully',
      data: updatedProposal,
    });
  } catch (error: any) {
    console.error('Error rejecting proposal:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Withdraw a proposal (Freelancer only - before it's accepted/rejected)
 * PUT /api/v1/proposals/:id/withdraw
 */
export const withdrawProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = req.user?.userId;

    const proposal = await Proposal.findByPk(id);

    if (!proposal) {
      res.status(404).json({ success: false, message: 'Proposal not found' });
      return;
    }

    // Only the freelancer who created the proposal can withdraw it
    if (proposal.freelancer_id !== user_id) {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to withdraw this proposal' 
      });
      return;
    }

    // Can only withdraw pending proposals
    if (proposal.status !== 'pending') {
      res.status(400).json({ 
        success: false, 
        message: `Cannot withdraw a ${proposal.status} proposal` 
      });
      return;
    }

    // Update proposal status
    await proposal.update({ status: 'withdrawn' });

    res.status(200).json({
      success: true,
      message: 'Proposal withdrawn successfully',
      data: proposal,
    });
  } catch (error: any) {
    console.error('Error withdrawing proposal:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Get a single proposal by ID
 * GET /api/v1/proposals/:id
 */
export const getProposalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = req.user?.userId;

    const proposal = await Proposal.findByPk(id, {
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['full_name', 'bio', 'skills', 'hourly_rate', 'avatar_url', 'portfolio_url'],
            },
          ],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'description', 'budget_min', 'budget_max', 'status', 'deadline', 'client_id'],
        },
      ],
    });

    if (!proposal) {
      res.status(404).json({ success: false, message: 'Proposal not found' });
      return;
    }

    const project = proposal.project as Project;

    // Only freelancer who created it, project owner, or admin can view
    if (
      proposal.freelancer_id !== user_id &&
      project.client_id !== user_id &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to view this proposal' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
