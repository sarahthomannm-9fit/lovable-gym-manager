// Legacy bootstrap endpoint is permanently disabled.
// User provisioning is handled by the authenticated manage-users function.
Deno.serve(() =>
  new Response(JSON.stringify({ error: 'setup-users is disabled' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  })
);

