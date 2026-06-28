// supabase/functions/test-log-image/index.ts

// @ts-ignore - Deno specific
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore - Deno specific
Deno.serve(async (req: Request) => {
  try {
    console.log("=== LOG IMAGE DATA ===");
    
    const body = await req.json();
    const { image, type, entity_id } = body;

    console.log("Type:", type);
    console.log("Entity ID:", entity_id);
    console.log("Image length:", image?.length || 0);
    console.log("Image starts with:", image?.substring(0, 50) || "empty");
    
    if (image) {
      console.log("Has base64 prefix:", image.startsWith("data:image/"));
      const parts = image.split(",");
      console.log("Parts count:", parts.length);
      if (parts.length === 2) {
        console.log("Base64 data length:", parts[1].length);
        console.log("Base64 starts with:", parts[1].substring(0, 20));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Image data logged",
      image_length: image?.length || 0,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
