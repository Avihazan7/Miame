export async function trackVehicleMediaEvent(input: {
  vehicleId: string;
  type: "gallery_view" | "spin360_view" | "model3d_view" | "cta_click";
  payload?: Record<string, unknown>;
}) {
  try {
    await fetch("/api/vehicle-media-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify(input),
    });
  } catch {
    // Analytics should never block the sales flow.
  }
}
