import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import slugify from 'slugify';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ timestamps: true })
export class Brand {
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
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

// Reusable logic for name capitalization and slug generation =>
const processNameAndSlug = async (
  doc: Brand,
  model: Model<Brand>,
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
BrandSchema.pre<BrandDocument>('save', async function (next) {
  // Skip if name is not modified
  if (!this.isModified('name')) return next();

  await processNameAndSlug(this, this.constructor as Model<Brand>);

  next();
});

// Pre-findByIdAndUpdate hook
BrandSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Brand;
  // Skip if name is not in the update
  if (!update.name) return next();

  await processNameAndSlug(update, this.model);
  next();
});
