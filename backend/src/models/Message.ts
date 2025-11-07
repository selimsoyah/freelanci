import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Message attributes interface
interface MessageAttributes {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at?: Date;
  attachments: string[];
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Optional fields for creation
interface MessageCreationAttributes
  extends Optional<
    MessageAttributes,
    'id' | 'is_read' | 'read_at' | 'attachments' | 'deleted_at' | 'created_at' | 'updated_at'
  > {}

// Message model class
class Message extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes {
  public id!: string;
  public conversation_id!: string;
  public sender_id!: string;
  public content!: string;
  public is_read!: boolean;
  public read_at?: Date;
  public attachments!: string[];
  public deleted_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public readonly conversation?: any;
  public readonly sender?: any;
}

// Initialize Message model
Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Message content cannot be empty',
        },
        len: {
          args: [1, 5000],
          msg: 'Message must be between 1 and 5000 characters',
        },
      },
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      comment: 'Array of file URLs/paths for attachments',
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    paranoid: false, // We use soft delete with deleted_at
    indexes: [
      {
        fields: ['conversation_id'],
      },
      {
        fields: ['sender_id'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['is_read'],
      },
    ],
  }
);

export default Message;
