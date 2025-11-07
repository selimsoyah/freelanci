import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ProjectStatus } from '../types';

interface ProjectAttributes {
  id: string;
  client_id: string;
  category_id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  deadline: Date;
  status: ProjectStatus;
  skills_required: string[];
  attachments: string[];
  created_at: Date;
  updated_at: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'status' | 'attachments' | 'created_at' | 'updated_at'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public client_id!: string;
  public category_id!: string;
  public title!: string;
  public description!: string;
  public budget_min!: number;
  public budget_max!: number;
  public deadline!: Date;
  public status!: ProjectStatus;
  public skills_required!: string[];
  public attachments!: string[];
  public created_at!: Date;
  public updated_at!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    budget_min: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    budget_max: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterToday(value: Date) {
          if (value < new Date()) {
            throw new Error('Deadline must be in the future');
          }
        },
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ProjectStatus)),
      allowNull: false,
      defaultValue: ProjectStatus.OPEN,
    },
    skills_required: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['client_id'],
      },
      {
        fields: ['category_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['deadline'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default Project;
