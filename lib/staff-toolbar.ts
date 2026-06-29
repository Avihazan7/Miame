// Gating logic for the Vercel staff toolbar.
//
// Reads only PUBLIC, build-time values (NODE_ENV + NEXT_PUBLIC_*), so it is safe
// to import from the client `StaffToolbar` component — no secret crosses the
// client boundary. It lives under lib/ (outside the components/app client
// secret-boundary lint) exactly like lib/whatsapp.ts and lib/supabase.ts read
// their NEXT_PUBLIC_* configuration.

export function isToolbarEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_ENABLE_STAFF_TOOLBAR === "true"
  );
}

export function isStaffToolbarEnabled(): boolean {
  if (!isToolbarEnvironment()) return false;

  // Production-safe default:
  // - Local development: enabled for the builder.
  // - Preview / production: enabled only when the explicit public flag is true.
  // Replace this with Supabase / NextAuth / Clerk role checks once staff auth
  // is connected, e.g. role === 'admin' || role === 'staff' || role === 'founder'.
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.NEXT_PUBLIC_ENABLE_STAFF_TOOLBAR !== "true") return false;

  return true;
}
