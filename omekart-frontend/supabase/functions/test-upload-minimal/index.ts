// supabase/functions/test-upload-minimal/index.ts

// @ts-ignore - Deno specific
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    console.log("=== TESTING CLOUDINARY UPLOAD ===");
    
    const body = await req.json();
    const { image, type, entity_id } = body;

    console.log("Type:", type);
    console.log("Entity ID:", entity_id);
    console.log("Image length:", image?.length || 0);
    console.log("Image starts with:", image?.substring(0, 30) || "empty");

    const CLOUDINARY_CLOUD_NAME = "dhkzfqxwo";
    const CLOUDINARY_UPLOAD_PRESET = "omekart_assets";

    // Extract base64 data
    let base64Data = image;
    if (image && image.includes("base64,")) {
      base64Data = image.split("base64,")[1];
    }
    console.log("Base64 data length:", base64Data?.length || 0);

    if (!base64Data || base64Data.length === 0) {
      throw new Error("No base64 data found after splitting");
    }

    const path = `omekart/${type}s/${entity_id}`;
    const timestamp = Date.now();
    const fullPath = `${path}/${timestamp}.jpg`;
    console.log("Upload path:", fullPath);

    // Upload to Cloudinary using FormData
    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", fullPath);

    console.log("Sending to Cloudinary...");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    console.log("Cloudinary status:", response.status);
    const result = await response.json();
    console.log("Cloudinary response:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(result.error?.message || "Cloudinary upload failed");
    }

    console.log("Upload successful:", result.secure_url);

    return new Response(JSON.stringify({
      success: true,
      url: result.secure_url,
      provider: "cloudinary",
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    console.error("ERROR:", error.message);
    console.error("Stack:", error.stack || "No stack trace");
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
