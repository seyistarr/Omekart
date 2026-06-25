// supabase/functions/add-to-cart/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to send a JSON response with CORS headers
function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}

// Handle preflight OPTIONS request
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({}, 200);
  }

  try {
    const { catalog_item_id, quantity = 1, user_id: providedUserId } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Authorization header required" }, 401);
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
          return jsonResponse({
            error: "When using service role key, you must provide 'user_id' in the request body."
          }, 400);
        }
        return jsonResponse({ error: "Invalid token" }, 401);
      }
      user_id = user.id;
    }

    // Fetch catalog item
    const { data: item, error: itemError } = await supabase
      .from("catalog_items")
      .select("id, product_type, price, business_id")
      .eq("id", catalog_item_id)
      .single();

    if (itemError || !item) {
      return jsonResponse({ error: "Catalog item not found" }, 404);
    }

    // Map product_type to vertical
    const verticalMap: Record<string, string> = { product: 'products', food: 'food', service: 'services' };
    const vertical = verticalMap[item.product_type];
    if (!vertical) {
      return jsonResponse({ error: "Invalid product type" }, 400);
    }

    // Get or create cart
    let { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("*")
      .eq("buyer_id", user_id)
      .eq("vertical", vertical)
      .maybeSingle();

    if (cartError && cartError.code !== 'PGRST116') throw cartError;

    if (!cart) {
      const { data: newCart, error: newCartError } = await supabase
        .from("carts")
        .insert({ buyer_id: user_id, vertical })
        .select()
        .single();
      if (newCartError) throw newCartError;
      cart = newCart;
    }

    // Add or update cart item
    const unit_price = item.price;
    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cart.id)
      .eq("catalog_item_id", catalog_item_id)
      .maybeSingle();

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: newQty, unit_price })
        .eq("id", existingItem.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("cart_items")
        .insert({
          cart_id: cart.id,
          catalog_item_id: catalog_item_id,
          quantity: quantity,
          unit_price: unit_price,
        });
      if (insertError) throw insertError;
    }

    // Fetch updated cart items
    const { data: items, error: fetchError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id);

    if (fetchError) throw fetchError;

    const itemsWithDetails = await Promise.all(items.map(async (item) => {
      const { data: product } = await supabase
        .from("catalog_items")
        .select("name, product_type, images")
        .eq("id", item.catalog_item_id)
        .single();
      return {
        ...item,
        catalog_items: product
      };
    }));

    return jsonResponse({
      success: true,
      message: "Item added to cart",
      cart: {
        id: cart.id,
        vertical: cart.vertical,
        items: itemsWithDetails,
        total_items: itemsWithDetails.reduce((sum, i) => sum + i.quantity, 0)
      }
    });

  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message }, 500);
  }
});