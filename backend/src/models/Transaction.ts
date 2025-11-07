import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum TransactionStatus {
  PENDING = 'pending',
  ESCROWED = 'escrowed',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum PaymentMethod {
  FLOUCI = 'flouci',
  D17 = 'd17',
  BANK_TRANSFER = 'bank_transfer',
  EDINAR = 'edinar',
}

interface TransactionAttributes {
  id: string;
  project_id: string;
  proposal_id: string;
  client_id: string;
  freelancer_id: string;
  amount: number; // Total project amount
  client_fee: number; // 5% platform fee from client
  freelancer_fee: number; // 2% platform fee from freelancer
  net_amount: number; // Amount freelancer receives after fees
  payment_method: PaymentMethod;
  status: TransactionStatus;
  payment_gateway_reference?: string; // Gateway transaction ID
  payment_gateway_response?: any; // Full gateway response
  escrowed_at?: Date;
  released_at?: Date;
  refunded_at?: Date;
  refund_reason?: string;
  created_at: Date;
  updated_at: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 
  'id' | 'payment_gateway_reference' | 'payment_gateway_response' | 
  'escrowed_at' | 'released_at' | 'refunded_at' | 'refund_reason' | 
  'created_at' | 'updated_at'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public project_id!: string;
  public proposal_id!: string;
  public client_id!: string;
  public freelancer_id!: string;
  public amount!: number;
  public client_fee!: number;
  public freelancer_fee!: number;
  public net_amount!: number;
  public payment_method!: PaymentMethod;
  public status!: TransactionStatus;
  public payment_gateway_reference?: string;
  public payment_gateway_response?: any;
  public escrowed_at?: Date;
  public released_at?: Date;
  public refunded_at?: Date;
  public refund_reason?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public readonly project?: any;
  public readonly proposal?: any;
  public readonly client?: any;
  public readonly freelancer?: any;
  public readonly escrow?: any;

  /**
   * Calculate platform fees
   */
  static calculateFees(projectAmount: number): {
    amount: number;
    clientFee: number;
    freelancerFee: number;
    netAmount: number;
    totalToEscrow: number;
  } {
    const CLIENT_FEE_PERCENT = parseFloat(process.env.CLIENT_COMMISSION_RATE || '5');
    const FREELANCER_FEE_PERCENT = parseFloat(process.env.FREELANCER_COMMISSION_RATE || '2');

    const clientFee = (projectAmount * CLIENT_FEE_PERCENT) / 100;
    const freelancerFee = (projectAmount * FREELANCER_FEE_PERCENT) / 100;
    const netAmount = projectAmount - freelancerFee;
    const totalToEscrow = projectAmount + clientFee;

    return {
      amount: projectAmount,
      clientFee: parseFloat(clientFee.toFixed(2)),
      freelancerFee: parseFloat(freelancerFee.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      totalToEscrow: parseFloat(totalToEscrow.toFixed(2)),
    };
  }
}

Transaction.init(
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
      onDelete: 'RESTRICT',
    },
    proposal_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'proposals',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    freelancer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Amount must be at least 1 TND' },
      },
    },
    client_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    freelancer_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    net_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TransactionStatus)),
      defaultValue: TransactionStatus.PENDING,
      allowNull: false,
    },
    payment_gateway_reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_gateway_response: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    escrowed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    released_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id'],
      },
      {
        fields: ['proposal_id'],
      },
      {
        fields: ['client_id'],
      },
      {
        fields: ['freelancer_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['payment_gateway_reference'],
      },
    ],
  }
);

export default Transaction;
