import { Request, Response } from 'express';
import { Project, Category, User, Profile } from '../models';
import { ProjectStatus, UserRole } from '../types';
import { Op } from 'sequelize';

/**
 * Create a new project (clients only)
 */
export const createProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      title,
      description,
      budget_min,
      budget_max,
      deadline,
      skills_required,
      category_id,
      attachments,
    } = req.body;

    // Validate budget
    if (budget_min > budget_max) {
      res.status(400).json({
        status: 'error',
        message: 'Minimum budget cannot be greater than maximum budget',
      });
      return;
    }

    // Validate category exists
    const category = await Category.findByPk(category_id);
    if (!category) {
      res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
      return;
    }

    // Create project
    const project = await Project.create({
      client_id: userId,
      title,
      description,
      budget_min,
      budget_max,
      deadline: new Date(deadline),
      skills_required: skills_required || [],
      category_id,
      attachments: attachments || [],
      status: ProjectStatus.OPEN,
    });

    res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create project',
    });
  }
};

/**
 * Get all projects with filters and pagination
 */
export const getAllProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      category_id,
      min_budget,
      max_budget,
      search,
      sort_by = 'created_at',
      order = 'DESC',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build filters
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category_id) {
      where.category_id = category_id;
    }

    if (min_budget) {
      where.budget_max = { [Op.gte]: parseFloat(min_budget as string) };
    }

    if (max_budget) {
      where.budget_min = { [Op.lte]: parseFloat(max_budget as string) };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Get projects with pagination
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [[sort_by as string, order as string]],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon'],
        },
        {
          model: User,
          as: 'client',
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

    res.status(200).json({
      status: 'success',
      data: {
        projects,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          total_pages: Math.ceil(count / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch projects',
    });
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description', 'icon'],
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['full_name', 'profile_picture_url', 'city'],
            },
          ],
        },
      ],
    });

    if (!project) {
      res.status(404).json({
        status: 'error',
        message: 'Project not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project',
    });
  }
};

/**
 * Update project (owner or admin only)
 */
export const updateProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const project = await Project.findByPk(id);

    if (!project) {
      res.status(404).json({
        status: 'error',
        message: 'Project not found',
      });
      return;
    }

    // Check authorization (owner or admin)
    if (project.client_id !== userId && userRole !== UserRole.ADMIN) {
      res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this project',
      });
      return;
    }

    const {
      title,
      description,
      budget_min,
      budget_max,
      deadline,
      skills_required,
      category_id,
      attachments,
      status,
    } = req.body;

    // Update fields
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (budget_min !== undefined) project.budget_min = budget_min;
    if (budget_max !== undefined) project.budget_max = budget_max;
    if (deadline !== undefined) project.deadline = new Date(deadline);
    if (skills_required !== undefined) project.skills_required = skills_required;
    if (category_id !== undefined) {
      // Validate category exists
      const category = await Category.findByPk(category_id);
      if (!category) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }
      project.category_id = category_id;
    }
    if (attachments !== undefined) project.attachments = attachments;
    if (status !== undefined) project.status = status;

    await project.save();

    res.status(200).json({
      status: 'success',
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update project',
    });
  }
};

/**
 * Delete project (owner or admin only)
 */
export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const project = await Project.findByPk(id);

    if (!project) {
      res.status(404).json({
        status: 'error',
        message: 'Project not found',
      });
      return;
    }

    // Check authorization (owner or admin)
    if (project.client_id !== userId && userRole !== UserRole.ADMIN) {
      res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this project',
      });
      return;
    }

    // Only allow deletion if project is in OPEN status
    if (project.status !== ProjectStatus.OPEN && userRole !== UserRole.ADMIN) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot delete project that is not in OPEN status',
      });
      return;
    }

    await project.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete project',
    });
  }
};

/**
 * Get my projects (for logged-in client)
 */
export const getMyProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;

    const where: any = { client_id: userId };
    if (status) {
      where.status = status;
    }

    const projects = await Project.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon'],
        },
      ],
    });

    res.status(200).json({
      status: 'success',
      data: { projects },
    });
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your projects',
    });
  }
};
