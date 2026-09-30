export interface MenuItem {
  id: string;
  name: string;
  detail?: string;
  price: number;
  section: string;
  venue: "bistro" | "lounge";
}

export const MENU: MenuItem[] = [
  { id: "oysters", name: "Oysters", detail: "mignonette (half dozen)", price: 21, section: "To begin", venue: "bistro" },
  { id: "olives", name: "Warm olives & almonds", price: 11, section: "To begin", venue: "bistro" },
  { id: "tartare", name: "Steak tartare", price: 19, section: "To begin", venue: "bistro" },
  { id: "charcuterie", name: "Charcuterie board", price: 32, section: "The table", venue: "bistro" },
  { id: "shrimp", name: "Gulf shrimp & grits", price: 28, section: "The table", venue: "bistro" },
  { id: "shortrib", name: "Braised short rib", price: 36, section: "The table", venue: "bistro" },
  { id: "redfish", name: "Blackened redfish", price: 31, section: "The table", venue: "bistro" },
  { id: "burger", name: "Bistro burger", price: 19, section: "Late, served through the second set", venue: "bistro" },
  { id: "beignets", name: "Warm beignets", price: 12, section: "Late, served through the second set", venue: "bistro" },
  { id: "blue", name: "Blue in Green", detail: "gin, dry vermouth, celery, sea salt", price: 16, section: "The standards", venue: "lounge" },
  { id: "midnight", name: "Round Midnight", detail: "rye, amaro, black walnut", price: 17, section: "The standards", venue: "lounge" },
  { id: "grand", name: "Grand & Washington", detail: "bourbon, demerara, bitters", price: 16, section: "The standards", venue: "lounge" },
  { id: "steward", name: "The Steward", detail: "cognac, sherry, cacao", price: 19, section: "The standards", venue: "lounge" },
  { id: "second", name: "Second Set", detail: "non-alcoholic, grapefruit, tonic, thyme", price: 12, section: "Low & no", venue: "lounge" },
  { id: "chicory", name: "Chicory soda", price: 9, section: "Low & no", venue: "lounge" },
];
