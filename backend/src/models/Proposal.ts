import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProposalAttributes {
  id: string;
  project_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_budget: number;
  delivery_time: number; // in days
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  attachments?: string[]; // URLs to attachments
  created_at?: Date;
  updated_at?: Date;
}

interface ProposalCreationAttributes extends Optional<ProposalAttributes, 'id' | 'status' | 'attachments' | 'created_at' | 'updated_at'> {}

class Proposal extends Model<ProposalAttributes, ProposalCreationAttributes> implements ProposalAttributes {
  public id!: string;
  public project_id!: string;
  public freelancer_id!: string;
  public cover_letter!: string;
  public proposed_budget!: number;
  public delivery_time!: number;
  public status!: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  public attachments?: string[];
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public readonly project?: any;
  public readonly freelancer?: any;
}

Proposal.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    freelancer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    cover_letter: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Cover letter is required' },
        len: {
          args: [100, 2000],
          msg: 'Cover letter must be between 100 and 2000 characters',
        },
      },
    },
    proposed_budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Proposed budget must be at least 1' },
      },
    },
    delivery_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Delivery time must be at least 1 day' },
        max: { args: [365], msg: 'Delivery time cannot exceed 365 days' },
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'withdrawn'),
      defaultValue: 'pending',
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'proposals',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id'],
      },
      {
        fields: ['freelancer_id'],
      },
      {
        fields: ['status'],
      },
      {
        // Prevent duplicate proposals from same freelancer on same project
        unique: true,
        fields: ['project_id', 'freelancer_id'],
        name: 'unique_project_freelancer_proposal',
      },
    ],
  }
);

export default Proposal;
