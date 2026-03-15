Deno.serve((_request: Request) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
});
