import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Schema as MongooseSchema } from 'mongoose';
import slugify from 'slugify';
import { Category } from 'src/category/category.schema';

export type SubCategoryDocument = HydratedDocument<SubCategory>;

@Schema({ timestamps: true })
export class SubCategory {
  @Prop({
    type: String,
    required: true,
    unique: true,
    min: [3, 'Name must be at least 3 characters'],
    max: [30, 'Name must be at most 30 characters'],
  })
  name: string;

  @Prop({ type: String, unique: true })
  slug: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Category.name,
    required: true,
  })
  category: MongooseSchema.Types.ObjectId;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

// Reusable logic for name capitalization and slug generation =>
const processNameAndSlug = async (
  doc: SubCategory,
  model: Model<SubCategory>,
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
SubCategorySchema.pre<SubCategoryDocument>('save', async function (next) {
  // Skip if name is not modified
  if (!this.isModified('name')) return next();

  await processNameAndSlug(this, this.constructor as Model<SubCategory>);

  next();
});

// Pre-findByIdAndUpdate hook
SubCategorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as SubCategory;
  // Skip if name is not in the update
  if (!update.name) return next();

  await processNameAndSlug(update, this.model);
  next();
});
