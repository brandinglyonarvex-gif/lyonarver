# Database Migration Required

After updating the Prisma schema, you need to run migrations:

```bash
# Generate migration
npx prisma migrate dev --name add_product_sizes_and_cover_photos

# Or push changes directly (for development)
npx prisma db push
```

## New Features Added:

1. **Product Sizes**: Products now have multiple sizes, each with its own quantity
2. **Featured Products**: Products can be marked as featured to show on landing page
3. **Cover Photos**: Admin can upload and manage hero section images

## AWS S3 Configuration:

Add these environment variables to your `.env` file:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

## Admin Features:

- Add products with multiple images (S3 upload)
- Manage product sizes and quantities
- Mark products as featured
- Upload and manage cover photos for landing page
- Update sizes and quantities for existing products
