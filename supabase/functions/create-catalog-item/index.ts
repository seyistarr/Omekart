// supabase/functions/create-catalog-item/index.ts (NO VALIDATION)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const verticalMap: Record<string, string> = {
  'products': 'product',
  'food': 'food',
  'services': 'service'
};

Deno.serve(async (req) => {
  try {
    const { 
      product_type,
      node_id,          // accepted but NOT validated
      name, 
      description, 
      price, 
      images = [],
      prep_time_minutes,
      duration_minutes,
      is_available,
      weight_kg,
      dimensions,
      status = 'draft',
      user_id: providedUserId
    } = await req.json();

    if (images.length > 5) {
      return new Response(JSON.stringify({ error: "Maximum 5 images allowed." }), { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let user_id = providedUserId;
    if (!user_id) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (token === serviceRoleKey) {
          return new Response(JSON.stringify({
            error: "When using service role key, you must provide 'user_id' in the request body."
          }), { status: 400 });
        }
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
      }
      user_id = user.id;
    }

    // Get business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, business_type, setup_progress")
      .eq("owner_id", user_id)
      .single();

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: "No business found" }), { status: 400 });
    }

    const expectedProductType = verticalMap[business.business_type];
    if (!expectedProductType) {
      return new Response(JSON.stringify({ error: "Invalid business type" }), { status: 500 });
    }

    if (product_type !== expectedProductType) {
      return new Response(JSON.stringify({
        error: `Your business is for '${business.business_type}'. You cannot list a '${product_type}' item. Use '${expectedProductType}'.`
      }), { status: 400 });
    }

    // Node validation REMOVED – just store whatever node_id you pass
    // (We trust that the frontend or you will use a correct one.)

    if (!product_type || !name || price === undefined || price === null) {
      return new Response(JSON.stringify({
        error: "Missing required fields: product_type, name, price are required."
      }), { status: 400 });
    }

    // Insert
    const { data: item, error: itemError } = await supabase
      .from("catalog_items")
      .insert({
        business_id: business.id,
        product_type: product_type,
        node_id: node_id || null,   // store it directly
        name: name,
        description: description || "",
        price: price,
        images: images,
        prep_time_minutes: prep_time_minutes || 0,
        duration_minutes: duration_minutes || 0,
        is_available: is_available !== undefined ? is_available : true,
        weight_kg: weight_kg || null,
        dimensions: dimensions || null,
        status: status,
        version: 1
      })
      .select()
      .single();

    if (itemError) throw itemError;

    if (business.setup_progress?.first_item === false) {
      await supabase
        .from("businesses")
        .update({
          setup_progress: { ...business.setup_progress, first_item: true }
        })
        .eq("id", business.id);
    }

    await supabase.from("security_events").insert({
      user_id: user_id,
      event_type: "CATALOG_ITEM_CREATED",
      severity: "info",
      metadata: {
        item_id: item.id,
        product_type,
        name,
        price,
        image_count: images.length,
        node_id: node_id || null
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `${product_type} listing created with ${images.length} images.`,
      item: item,
      vertical: product_type
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});