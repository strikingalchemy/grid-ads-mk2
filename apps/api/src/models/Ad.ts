
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Store from './Store';

interface AdAttributes {
  id: string;
  storeId: string;
  name: string;
  status: string;
  type: string;
  
  mediaUrl: string;
  mediaFit: string;
  showMedia: boolean;
  altText: string;
  destinationUrl: string;
  
  headline: string;
  showHeadline: boolean;
  description: string;
  showDescription: boolean;
  buttonText: string;
  showButton: boolean;
  
  position: number;
  frequency: number;
  gridSelector: string;
  itemSelector: string;
  
  targetCategories: string[];
  excludedCategories: string[];
  
  startDate: Date;
  endDate: Date | null;
  
  styles: any;
}

interface AdCreationAttributes extends Optional<AdAttributes, 'id'> {}

class Ad extends Model<AdAttributes, AdCreationAttributes> implements AdAttributes {
  public id!: string;
  public storeId!: string;
  public name!: string;
  public status!: string;
  public type!: string;
  
  public mediaUrl!: string;
  public mediaFit!: string;
  public showMedia!: boolean;
  public altText!: string;
  public destinationUrl!: string;
  
  public headline!: string;
  public showHeadline!: boolean;
  public description!: string;
  public showDescription!: boolean;
  public buttonText!: string;
  public showButton!: boolean;
  
  public position!: number;
  public frequency!: number;
  public gridSelector!: string;
  public itemSelector!: string;
  
  public targetCategories!: string[];
  public excludedCategories!: string[];
  
  public startDate!: Date;
  public endDate!: Date | null;
  
  public styles!: any;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

(Ad as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  storeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'store_id',
    references: { model: Store, key: 'id' }
  },
  name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'draft' },
  type: { type: DataTypes.STRING, defaultValue: 'image' },
  
  mediaUrl: { type: DataTypes.TEXT, field: 'media_url' },
  mediaFit: { type: DataTypes.STRING, defaultValue: 'cover', field: 'media_fit' },
  showMedia: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'show_media' },
  altText: { type: DataTypes.STRING, field: 'alt_text' },
  destinationUrl: { type: DataTypes.TEXT, field: 'destination_url' },
  
  headline: DataTypes.STRING,
  showHeadline: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'show_headline' },
  description: DataTypes.TEXT,
  showDescription: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'show_description' },
  buttonText: { type: DataTypes.STRING, field: 'button_text' },
  showButton: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'show_button' },
  
  position: { type: DataTypes.INTEGER, defaultValue: 4 },
  frequency: { type: DataTypes.INTEGER, defaultValue: 0 },
  gridSelector: { type: DataTypes.STRING, field: 'grid_selector' },
  itemSelector: { type: DataTypes.STRING, field: 'item_selector' },
  
  targetCategories: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [], field: 'target_categories' },
  excludedCategories: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [], field: 'excluded_categories' },
  
  startDate: { type: DataTypes.DATE, field: 'start_date' },
  endDate: { type: DataTypes.DATE, field: 'end_date' },
  
  styles: { type: DataTypes.JSONB, defaultValue: {} }
}, {
  sequelize,
  tableName: 'ads',
  underscored: true, // This ensures timestamps are created_at/updated_at
});

export default Ad;
