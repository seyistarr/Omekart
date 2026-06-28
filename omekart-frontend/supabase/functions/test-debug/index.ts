// supabase/functions/test-debug/index.ts

// @ts-ignore - Deno specific
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore - Deno specific
Deno.serve(async (req: Request) => {
  try {
    console.log("=== FUNCTION STARTED ===");
    
    const body = await req.json();
    const { image, type, entity_id } = body;

    // Cloudinary credentials
    const CLOUDINARY_CLOUD_NAME = "dhkzfqxwo";
    const CLOUDINARY_UPLOAD_PRESET = "omekart_assets";

    // Extract base64 data
    let base64Data = image;
    if (image && image.includes("base64,")) {
      base64Data = image.split("base64,")[1];
    }

    if (!base64Data || base64Data.length === 0) {
      throw new Error("No base64 data found");
    }

    // Build upload path
    const path = `omekart/${type}s/${entity_id}`;
    const timestamp = Date.now();
    const fullPath = `${path}/${timestamp}.jpg`;

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", fullPath);

    console.log("Sending to Cloudinary...");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Cloudinary upload failed");
    }

    return new Response(JSON.stringify({
      success: true,
      url: result.secure_url,
      provider: "cloudinary",
      path: fullPath,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    console.error("ERROR:", error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack || "No stack trace",
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
