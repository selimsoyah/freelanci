import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum EscrowStatus {
  PENDING_PAYMENT = 'pending_payment', // Waiting for client to pay
  HELD = 'held', // Funds held in escrow
  RELEASED = 'released', // Funds released to freelancer
  REFUNDED = 'refunded', // Funds refunded to client
  DISPUTED = 'disputed', // Under dispute resolution
}

interface EscrowPaymentAttributes {
  id: string;
  transaction_id: string;
  project_id: string;
  amount_held: number; // Total amount in escrow
  status: EscrowStatus;
  hold_started_at?: Date;
  hold_released_at?: Date;
  dispute_reason?: string;
  dispute_opened_at?: Date;
  dispute_resolved_at?: Date;
  resolution_notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface EscrowPaymentCreationAttributes extends Optional<EscrowPaymentAttributes, 
  'id' | 'hold_started_at' | 'hold_released_at' | 'dispute_reason' | 
  'dispute_opened_at' | 'dispute_resolved_at' | 'resolution_notes' | 
  'created_at' | 'updated_at'> {}

class EscrowPayment extends Model<EscrowPaymentAttributes, EscrowPaymentCreationAttributes> implements EscrowPaymentAttributes {
  public id!: string;
  public transaction_id!: string;
  public project_id!: string;
  public amount_held!: number;
  public status!: EscrowStatus;
  public hold_started_at?: Date;
  public hold_released_at?: Date;
  public dispute_reason?: string;
  public dispute_opened_at?: Date;
  public dispute_resolved_at?: Date;
  public resolution_notes?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public readonly transaction?: any;
  public readonly project?: any;

  /**
   * Check if escrow can be released
   */
  canBeReleased(): boolean {
    return this.status === EscrowStatus.HELD;
  }

  /**
   * Check if escrow can be refunded
   */
  canBeRefunded(): boolean {
    return [EscrowStatus.HELD, EscrowStatus.DISPUTED].includes(this.status);
  }

  /**
   * Open a dispute
   */
  async openDispute(reason: string): Promise<void> {
    if (this.status !== EscrowStatus.HELD) {
      throw new Error('Can only open dispute on held escrow');
    }
    
    await this.update({
      status: EscrowStatus.DISPUTED,
      dispute_reason: reason,
      dispute_opened_at: new Date(),
    });
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(resolution: 'release' | 'refund', notes: string): Promise<void> {
    if (this.status !== EscrowStatus.DISPUTED) {
      throw new Error('Can only resolve disputed escrow');
    }

    const newStatus = resolution === 'release' ? EscrowStatus.RELEASED : EscrowStatus.REFUNDED;
    
    await this.update({
      status: newStatus,
      dispute_resolved_at: new Date(),
      resolution_notes: notes,
    });
  }
}

EscrowPayment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
      onDelete: 'RESTRICT',
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
    amount_held: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Amount held cannot be negative' },
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EscrowStatus)),
      defaultValue: EscrowStatus.PENDING_PAYMENT,
      allowNull: false,
    },
    hold_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hold_released_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dispute_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dispute_opened_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dispute_resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolution_notes: {
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
    tableName: 'escrow_payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['transaction_id'],
        unique: true,
      },
      {
        fields: ['project_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default EscrowPayment;
