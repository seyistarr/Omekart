// supabase/functions/hello/index.ts
Deno.serve(() => {
  return new Response(JSON.stringify({ message: "Hello from Supabase!" }), {
    headers: { "Content-Type": "application/json" },
  });
});
