import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import slugify from 'slugify';

export type categoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({
    type: String,
    required: true,
    unique: true,
    min: [3, 'Name must be at least 3 characters'],
    max: [30, 'Name must be at most 30 characters'],
  })
  name: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String, unique: true })
  slug: string;

  @Prop([{ type: Types.ObjectId, ref: 'Subcategory' }])
  subcategories: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Reusable logic for name capitalization and slug generation =>
const processNameAndSlug = async (
  doc: Category,
  model: Model<Category>,
): Promise<void> => {
  try {
    if (!doc.name) return;
    doc.name = doc.name
      .trim()
      .toLowerCase()
      .replace(/^\w|\s\w/g, (char: string) => char.toUpperCase());

    let slug = slugify(doc.name, { lower: true, strict: true });
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

// Pre-save hook for creating slug and capitalizing name =>
CategorySchema.pre<categoryDocument>('save', async function (next) {
  // Skip if name is not modified
  if (!this.isModified('name')) return next();

  await processNameAndSlug(this, this.constructor as Model<Category>);

  next();
});

// Pre-findByIdAndUpdate hook
CategorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Category;
  // Skip if name is not in the update
  if (!update.name) return next();

  await processNameAndSlug(update, this.model);
  next();
});
