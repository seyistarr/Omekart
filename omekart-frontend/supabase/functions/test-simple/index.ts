// supabase/functions/test-simple/index.ts

// @ts-ignore - Deno specific
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore - Deno specific
Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    console.log("Received:", JSON.stringify(body, null, 2));
    
    return new Response(JSON.stringify({
      success: true,
      received: {
        type: body.type,
        entity_id: body.entity_id,
        image_length: body.image?.length || 0,
      }
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
