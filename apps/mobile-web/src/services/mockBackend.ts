// Simulates network latency
const DELAY = 800;

// Helper for safe storage access (prevents crashes in restricted environments)
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("LocalStorage access denied", e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("LocalStorage setItem failed", e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("LocalStorage removeItem failed", e);
    }
  },
};

// Helper for safe JSON parsing
const safeJSONParse = (key: string, fallback: any) => {
  try {
    const item = safeStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error parsing ${key} from localStorage`, e);
    return fallback;
  }
};

// Default data seeded in the "database"
const defaultProperties = [
  {
    id: 1,
    name: "Sunrise Apartments, Unit 4B",
    address: "123 Maple St, San Francisco, CA",
    price: 2450,
    beds: 2,
    baths: 2,
    status: "Occupied",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Oakwood Heights, Unit 12",
    address: "456 Oak Ln, Austin, TX",
    price: 1800,
    beds: 1,
    baths: 1,
    status: "Vacant",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Willow Creek Estate",
    address: "789 Willow Dr, Seattle, WA",
    price: 3200,
    beds: 3,
    baths: 2,
    status: "Occupied",
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1965&auto=format&fit=crop",
  },
];

export const backend = {
  auth: {
    login: async (email: string, role: string) => {
      // Simulate API call
      await new Promise((r) => setTimeout(r, DELAY));

      // Store session safely
      safeStorage.setItem("userRole", role);
      safeStorage.setItem("userEmail", email);

      return {
        id: "u_" + Date.now(),
        email,
        role,
        name: role === "landlord" ? "Alex Sterling" : "Alex Thompson",
      };
    },
    logout: async () => {
      await new Promise((r) => setTimeout(r, DELAY / 2));
      safeStorage.removeItem("userRole");
      safeStorage.removeItem("userEmail");
    },
    getCurrentUser: () => {
      const role = safeStorage.getItem("userRole");
      if (!role) return null;
      return {
        role,
        email: safeStorage.getItem("userEmail"),
        name: role === "landlord" ? "Alex Sterling" : "Alex Thompson",
      };
    },
  },
  properties: {
    list: async () => {
      await new Promise((r) => setTimeout(r, DELAY));

      // Get locally created properties safely
      const local = safeJSONParse("customProperties", []);

      // Transform local properties to match the display schema of default ones
      const formattedLocal = Array.isArray(local)
        ? local.map((p: any) => ({
            id: p.id,
            name: p.propertyName || "Untitled Property",
            address: p.address || "No Address",
            price: parseInt(p.rentAmount) || 0,
            beds:
              p.units && Array.isArray(p.units) && p.units.length > 0
                ? p.units[0].bedrooms
                : 0,
            baths:
              p.units && Array.isArray(p.units) && p.units.length > 0
                ? p.units[0].bathrooms
                : 0,
            status: "Vacant",
            image:
              "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop",
            isLocal: true,
          }))
        : [];

      // Combine default seeded data with user created data
      return [...defaultProperties, ...formattedLocal];
    },
    create: async (data: any) => {
      await new Promise((r) => setTimeout(r, DELAY));

      const current = safeJSONParse("customProperties", []);
      const newProp = {
        ...data,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      };

      safeStorage.setItem(
        "customProperties",
        JSON.stringify([...(Array.isArray(current) ? current : []), newProp]),
      );
      return newProp;
    },
    getById: async (id: number | string) => {
      await new Promise((r) => setTimeout(r, DELAY));
      // Check default
      const def = defaultProperties.find((p) => p.id == id);
      if (def) return def;

      // Check local
      const local = safeJSONParse("customProperties", []);
      const loc = Array.isArray(local)
        ? local.find((p: any) => p.id == id)
        : null;
      if (loc) {
        return {
          id: loc.id,
          name: loc.propertyName,
          address: loc.address,
          price: parseInt(loc.rentAmount),
          beds: loc.units?.[0]?.bedrooms,
          baths: loc.units?.[0]?.bathrooms,
          status: "Vacant",
          image:
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop",
        };
      }
      throw new Error("Property not found");
    },
  },
};
