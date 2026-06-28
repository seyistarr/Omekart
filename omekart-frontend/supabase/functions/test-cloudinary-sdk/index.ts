// supabase/functions/test-cloudinary-sdk/index.ts

// @ts-ignore - Deno specific
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore - Deno specific
Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const CLOUDINARY_CLOUD_NAME = "dhkzfqxwo";
    const CLOUDINARY_UPLOAD_PRESET = "omekart_assets";

    // Extract base64 data
    let base64Data = image;
    if (image && image.includes("base64,")) {
      base64Data = image.split("base64,")[1];
    }

    // Use unsigned upload (same as URL test)
    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "omekart/test");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: "Cloudinary upload failed",
        status: response.status,
        details: result,
      }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
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
    return new Response(JSON.stringify({
      error: "Function error",
      details: error.message,
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
