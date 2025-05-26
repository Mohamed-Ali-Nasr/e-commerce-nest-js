import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Schema as MongooseSchema } from 'mongoose';
import { Brand } from 'src/brand/brand.schema';
import { Category } from 'src/category/category.schema';
import { SubCategory } from 'src/sub-category/sub-category.schema';
import slugify from 'slugify';

export type productDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({
    type: String,
    required: true,
    unique: true,
    min: [3, 'Title must be at least 3 characters'],
  })
  title: string;

  @Prop({ type: String, unique: true })
  slug: string;

  @Prop({
    type: String,
    required: true,
    min: [20, 'Description must be at least 20 characters'],
  })
  description: string;

  @Prop({
    type: Number,
    required: true,
    default: 1,
    min: [1, 'Quantity must be at least 1 product'],
  })
  quantity: number;

  @Prop({ type: String, required: true })
  imageCover: string;

  @Prop({ type: Array })
  images: string[];

  @Prop({ type: Number, default: 0 })
  sold: number;

  @Prop({
    type: Number,
    required: true,
    min: [1, 'Price must be at least 1 L.E'],
    max: [20000, 'Price must be at most 20000 L.E'],
  })
  price: number;

  @Prop({
    type: Number,
    default: 0,
    max: [20000, 'Price must be at least 20000 L.E'],
  })
  priceAfterDiscount: number;

  @Prop({ type: Array })
  colors: string[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: Category.name,
  })
  category: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: SubCategory.name,
  })
  subCategory: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Brand.name,
  })
  brand: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  ratingsAverage: number;

  @Prop({ type: Number, default: 0 })
  ratingsQuantity: number;

  @Prop({ type: Boolean, default: false })
  isNew: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Reusable logic for name capitalization and slug generation =>
const processTitleAndSlug = async (
  doc: Product,
  model: Model<Product>,
): Promise<void> => {
  try {
    if (!doc.title) return;
    doc.title = doc.title
      .trim()
      .toLowerCase()
      .replace(/^\w|\s\w/g, (char: string) => char.toUpperCase());

    let slug = slugify(doc.title, { lower: true, strict: true });
    let existing = await model.findOne({ slug });
    let counter = 1;

    while (existing) {
      slug = `${slug}-${counter}`;
      existing = await model.findOne({ slug });
      counter++;
    }

    doc.slug = slug;
  } catch (error) {
    throw new Error(`Failed to process name and slug: ${error.message}`);
  }
};

// Pre-save hook for creating slug and capitalizing title =>
ProductSchema.pre<productDocument>('save', async function (next) {
  // Skip if title is not modified
  if (!this.isModified('title')) return next();

  await processTitleAndSlug(this, this.constructor as Model<Product>);

  next();
});

// Pre-findByIdAndUpdate hook
ProductSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Product;
  // Skip if title is not in the update
  if (!update.title) return next();

  await processTitleAndSlug(update, this.model);
  next();
});
