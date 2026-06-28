// supabase/functions/upload-media-index-ts/index.ts

// @ts-ignore - Deno specific
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLOUDINARY_CLOUD_NAME = "dhkzfqxwo";
const CLOUDINARY_UPLOAD_PRESET = "omekart_assets";

// @ts-ignore - Deno specific
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    console.log("=== UPLOAD FUNCTION STARTED ===");
    
    const body = await req.json();
    const { image, type, entity_id } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: "Image data required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!type || !entity_id) {
      return new Response(JSON.stringify({ error: "type and entity_id are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract base64 data
    let base64Data = image;
    if (image.includes("base64,")) {
      base64Data = image.split("base64,")[1];
    }

    // Build Cloudinary upload path
    const path = `omekart/${type}s/${entity_id}`;
    const timestamp = Date.now();
    const fullPath = `${path}/${timestamp}.jpg`;

    console.log("Uploading to Cloudinary - path:", fullPath);

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", fullPath);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Cloudinary upload failed");
    }

    console.log("Upload successful:", result.secure_url);

    return new Response(JSON.stringify({
      success: true,
      url: result.secure_url,
      provider: "cloudinary",
      path: fullPath,
      type: type,
      entity_id: entity_id,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({
      error: "Upload failed",
      details: error.message || "Unknown error",
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});