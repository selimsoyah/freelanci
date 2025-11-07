import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Language } from '../types';
import User from './User';

// Profile attributes interface
interface ProfileAttributes {
  id: string;
  user_id: string;
  full_name: string;
  bio?: string;
  skills?: string[]; // JSON array of skills
  hourly_rate?: number;
  portfolio_links?: string[]; // JSON array of portfolio URLs
  profile_picture_url?: string;
  language_preference: Language;
  address?: string;
  city?: string;
  created_at: Date;
  updated_at: Date;
}

// Optional fields for creation
interface ProfileCreationAttributes extends Optional<ProfileAttributes, 'id' | 'bio' | 'skills' | 'hourly_rate' | 'portfolio_links' | 'profile_picture_url' | 'language_preference' | 'address' | 'city' | 'created_at' | 'updated_at'> {}

// Profile model class
class Profile extends Model<ProfileAttributes, ProfileCreationAttributes> implements ProfileAttributes {
  public id!: string;
  public user_id!: string;
  public full_name!: string;
  public bio?: string;
  public skills?: string[];
  public hourly_rate?: number;
  public portfolio_links?: string[];
  public profile_picture_url?: string;
  public language_preference!: Language;
  public address?: string;
  public city?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// Initialize Profile model
Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    portfolio_links: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    profile_picture_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    language_preference: {
      type: DataTypes.ENUM(...Object.values(Language)),
      allowNull: false,
      defaultValue: Language.FRENCH,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
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
    tableName: 'profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['city'],
      },
    ],
  }
);

export default Profile;
