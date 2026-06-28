// supabase/functions/upload-media/index.ts
/// <reference path="../_shared/deno-env.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

type UploadType = "avatar" | "product" | "category" | "banner" | "business" | "video";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function toUploadFile(image: string, type: UploadType) {
  if (image.startsWith("data:")) return image;
  const mimeType = type === "video" ? "video/mp4" : "image/jpeg";
  return `data:${mimeType};base64,${image.replace(/^base64,/, "")}`;
}

function uploadFolder(type: UploadType, entityId: string) {
  const folders: Record<UploadType, string> = {
    avatar: "avatars",
    product: "products",
    category: "categories",
    banner: "banners",
    business: "businesses",
    video: "videos",
  };

  return `omekart/${folders[type]}/${entityId}`;
}

async function uploadToCloudinary(params: {
  image: string;
  type: UploadType;
  entityId: string;
  index: number;
}) {
  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "dhkzfqxwo";
  const uploadPreset = Deno.env.get("CLOUDINARY_UPLOAD_PRESET") || "omekart_assets";
  const resourceType = params.type === "video" ? "video" : "image";
  const folder = uploadFolder(params.type, params.entityId);
  const publicId = `${Date.now()}-${params.index}`;

  const formData = new FormData();
  formData.append("file", toUploadFile(params.image, params.type));
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);
  formData.append("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData },
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Unknown Cloudinary error");
  }

  return {
    success: true,
    url: result.secure_url,
    provider: "cloudinary",
    path: result.public_id || `${folder}/${publicId}`,
    type: params.type,
    entity_id: params.entityId,
  };
}

async function uploadToImageKit(params: {
  image: string;
  type: UploadType;
  entityId: string;
  index: number;
}) {
  const privateKey = Deno.env.get("IMAGEKIT_PRIVATE_KEY");
  const urlEndpoint = Deno.env.get("IMAGEKIT_URL_ENDPOINT");

  if (!privateKey || !urlEndpoint) {
    throw new Error("ImageKit is not configured.");
  }

  const folder = uploadFolder(params.type, params.entityId);
  const fileName = `${Date.now()}-${params.index}.${params.type === "video" ? "mp4" : "jpg"}`;
  const formData = new FormData();
  formData.append("file", toUploadFile(params.image, params.type));
  formData.append("fileName", fileName);
  formData.append("folder", `/${folder}`);
  formData.append("useUniqueFileName", "true");

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${privateKey}:`)}`,
    },
    body: formData,
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unknown ImageKit error");
  }

  return {
    success: true,
    url: result.url || `${urlEndpoint}/${folder}/${fileName}`,
    provider: "imagekit",
    path: result.filePath || `${folder}/${fileName}`,
    type: params.type,
    entity_id: params.entityId,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({});
  }

  try {
    const { image, type, entity_id, index = 0 } = await req.json() as {
      image?: string;
      type?: UploadType;
      entity_id?: string;
      index?: number;
    };

    if (!image) {
      return jsonResponse({ error: "Image data required" }, 400);
    }

    if (!type || !entity_id) {
      return jsonResponse({ error: "type and entity_id are required" }, 400);
    }

    let cloudinaryDetails = "";
    try {
      return jsonResponse(await uploadToCloudinary({ image, type, entityId: entity_id, index }));
    } catch (cloudinaryError) {
      cloudinaryDetails = cloudinaryError instanceof Error ? cloudinaryError.message : "Unknown Cloudinary error";
      console.warn("Cloudinary upload failed, trying ImageKit:", cloudinaryError);
    }

    try {
      return jsonResponse(await uploadToImageKit({ image, type, entityId: entity_id, index }));
    } catch (imageKitError) {
      const imageKitDetails = imageKitError instanceof Error ? imageKitError.message : "Unknown ImageKit error";
      return jsonResponse({
        error: "Upload failed",
        details: `Cloudinary: ${cloudinaryDetails}. ImageKit: ${imageKitDetails}`,
      }, 502);
    }
  } catch (error) {
    console.error(error);
    return jsonResponse({
      error: "Upload failed",
      details: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
