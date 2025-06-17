import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/authMiddleware';
import { cloudinary } from '@/lib/cloudinary';
import { z } from 'zod';

const schema = z.object({
  file: z.string(), // base64 encoded file
  fileName: z.string(),
  fileType: z.string().refine((type) => 
    ['image/jpeg', 'image/png', 'application/pdf'].includes(type),
    'Only JPEG, PNG and PDF files are allowed'
  ),
});

export async function POST(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(parsed.data.file, {
      resource_type: 'auto',
      folder: 'family-expense',
      public_id: `${user.id}/${Date.now()}-${parsed.data.fileName}`,
    });

    return NextResponse.json({ 
      url: result.secure_url,
      publicId: result.public_id 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 