import sequelize, { testConnection } from '../config/database';
import User from './User';
import Profile from './Profile';
import Category from './Category';
import Project from './Project';
import Proposal from './Proposal';
import Transaction from './Transaction';
import EscrowPayment from './EscrowPayment';
import Conversation from './Conversation';
import Message from './Message';

// Define model associations
User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Project, { foreignKey: 'client_id', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

Category.hasMany(Project, { foreignKey: 'category_id', as: 'projects' });
Project.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Proposal associations
Project.hasMany(Proposal, { foreignKey: 'project_id', as: 'proposals' });
Proposal.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

User.hasMany(Proposal, { foreignKey: 'freelancer_id', as: 'proposals' });
Proposal.belongsTo(User, { foreignKey: 'freelancer_id', as: 'freelancer' });

// Transaction associations
Project.hasMany(Transaction, { foreignKey: 'project_id', as: 'transactions' });
Transaction.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

Proposal.hasMany(Transaction, { foreignKey: 'proposal_id', as: 'transactions' });
Transaction.belongsTo(Proposal, { foreignKey: 'proposal_id', as: 'proposal' });

User.hasMany(Transaction, { foreignKey: 'client_id', as: 'client_transactions' });
Transaction.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

User.hasMany(Transaction, { foreignKey: 'freelancer_id', as: 'freelancer_transactions' });
Transaction.belongsTo(User, { foreignKey: 'freelancer_id', as: 'freelancer' });

// Escrow associations
Transaction.hasOne(EscrowPayment, { foreignKey: 'transaction_id', as: 'escrow' });
EscrowPayment.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });

Project.hasMany(EscrowPayment, { foreignKey: 'project_id', as: 'escrows' });
EscrowPayment.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Conversation associations
Project.hasMany(Conversation, { foreignKey: 'project_id', as: 'conversations' });
Conversation.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

User.hasMany(Conversation, { foreignKey: 'client_id', as: 'client_conversations' });
Conversation.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

User.hasMany(Conversation, { foreignKey: 'freelancer_id', as: 'freelancer_conversations' });
Conversation.belongsTo(User, { foreignKey: 'freelancer_id', as: 'freelancer' });

// Message associations
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'sent_messages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Export all models
export { User, Profile, Category, Project, Proposal, Transaction, EscrowPayment, Conversation, Message };

// Initialize database
export const initDatabase = async (): Promise<void> => {
  try {
    // Test connection
    await testConnection();

    // Sync all models
    // In production, use migrations instead of sync()
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  await sequelize.close();
  console.log('🔌 Database connection closed');
};

export default {
  User,
  Profile,
  Category,
  Project,
  Proposal,
  Transaction,
  EscrowPayment,
  Conversation,
  Message,
  initDatabase,
  closeDatabase,
};
