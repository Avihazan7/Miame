export interface VehicleModel {
  id: string;
  name: string;
  tagline: string;
  price: number;
  highlights: string[];
}

// Placeholder marketing copy and images are confirmed by the brand owner before launch.
export const MODELS: VehicleModel[] = [
  {
    id: "4x2",
    name: "4×2",
    tagline: "העירוני החכם",
    price: 19900,
    highlights: ["עירוני וזריז", "מנוע 1,800W", "סוללה נשלפת 60V"]
  },
  {
    id: "2x4lr",
    name: "2×4 Long Range",
    tagline: "הטווח המורחב",
    price: 21900,
    highlights: ["טווח מורחב 35Ah", "סוללה נשלפת 60V", "יציבות בכל תוואי"]
  },
  {
    id: "4x4",
    name: "4×4",
    tagline: "הכוח לכל מסלול",
    price: 27900,
    highlights: ["4 מנועים · 1,800W", "הנעה כפולה לשטח", "סוללה נשלפת 60V"]
  }
];

export function getModel(id: string): VehicleModel {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
