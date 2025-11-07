import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Conversation attributes interface
interface ConversationAttributes {
  id: string;
  project_id: string;
  client_id: string;
  freelancer_id: string;
  last_message_at?: Date;
  unread_count_client: number;
  unread_count_freelancer: number;
  created_at: Date;
  updated_at: Date;
}

// Optional fields for creation
interface ConversationCreationAttributes
  extends Optional<
    ConversationAttributes,
    'id' | 'last_message_at' | 'unread_count_client' | 'unread_count_freelancer' | 'created_at' | 'updated_at'
  > {}

// Conversation model class
class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes {
  public id!: string;
  public project_id!: string;
  public client_id!: string;
  public freelancer_id!: string;
  public last_message_at?: Date;
  public unread_count_client!: number;
  public unread_count_freelancer!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public readonly project?: any;
  public readonly client?: any;
  public readonly freelancer?: any;
  public readonly messages?: any[];
}

// Initialize Conversation model
Conversation.init(
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
      onUpdate: 'CASCADE',
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    freelancer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unread_count_client: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unread_count_freelancer: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id'],
      },
      {
        fields: ['client_id'],
      },
      {
        fields: ['freelancer_id'],
      },
      {
        unique: true,
        fields: ['project_id', 'client_id', 'freelancer_id'],
        name: 'unique_conversation_per_project',
      },
    ],
  }
);

export default Conversation;
