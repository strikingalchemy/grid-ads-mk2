
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StoreAttributes {
  id: string;
  storeHash: string;
  accessToken: string | null;
  scope: string | null;
  isActive: boolean;
}

interface StoreCreationAttributes extends Optional<StoreAttributes, 'id'> {}

class Store extends Model<StoreAttributes, StoreCreationAttributes> implements StoreAttributes {
  public id!: string;
  public storeHash!: string;
  public accessToken!: string | null;
  public scope!: string | null;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

(Store as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  storeHash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'store_hash'
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'access_token'
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  sequelize,
  tableName: 'stores',
  underscored: true,
});

export default Store;
