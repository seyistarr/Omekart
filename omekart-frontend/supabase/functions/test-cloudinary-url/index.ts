// supabase/functions/test-cloudinary-url/index.ts

// @ts-ignore - Deno specific
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore - Deno specific
Deno.serve(async (req: Request) => {
  try {
    console.log("=== TESTING CLOUDINARY WITH URL ===");
    
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Image URL:", imageUrl);

    // Cloudinary credentials
    const CLOUDINARY_CLOUD_NAME = "dhkzfqxwo";
    const CLOUDINARY_UPLOAD_PRESET = "omekart_assets";

    // Upload to Cloudinary using URL
    const formData = new FormData();
    formData.append("file", imageUrl);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "omekart/test");

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
