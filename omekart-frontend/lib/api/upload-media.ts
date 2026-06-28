// lib/api/upload-media.ts
import { createClient } from '@/lib/supabase/client'

export type UploadType = 'avatar' | 'product' | 'category' | 'banner' | 'business' | 'video';

export interface UploadMediaParams {
  image: string;
  type: UploadType;
  entity_id: string;
  vertical?: 'product' | 'food' | 'service';
  index?: number;
}

export interface UploadMediaResponse {
  success: boolean;
  url: string;
  provider: 'imagekit' | 'cloudinary';
  path: string;
  type: UploadType;
  entity_id: string;
}

export async function uploadMedia(params: UploadMediaParams): Promise<UploadMediaResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const functionsUrl = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL?.replace(/\/$/, '');

  if (!session) {
    throw new Error('Authentication required. Please log in.');
  }

  if (!functionsUrl) {
    throw new Error('NEXT_PUBLIC_EDGE_FUNCTIONS_URL is not configured.');
  }

  const response = await fetch(
    `${functionsUrl}/upload-media`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.details || error.error || 'Upload failed');
  }

  return response.json();
}
