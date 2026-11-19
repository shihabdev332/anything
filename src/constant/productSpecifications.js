export const productCategories = [
  "Smartphones", "Laptops", "Tablets", "Monitors", "Processors",
  "RAM", "Motherboards", "Graphics Cards", "SSD & HDD", "Power Supply",
  "Casing", "Airbuds", "Over-Ear Headphones", "Smart Watches", "Keyboards",
  "Mouse", "Speakers", "Cameras", "Gaming Console", "Lights & Studio",
];

export const categorySpecificationSuggestions = {
  Smartphones: ["Display", "Processor", "RAM", "Storage", "Rear Camera", "Front Camera", "Battery", "Operating System", "Network", "Connectivity"],
  Laptops: ["Display", "Processor", "RAM", "Storage", "Graphics", "Operating System", "Battery", "Weight"],
  Tablets: ["Display", "Processor", "RAM", "Storage", "Camera", "Battery", "Operating System", "Connectivity"],
  Monitors: ["Screen Size", "Resolution", "Panel Type", "Refresh Rate", "Response Time", "Brightness", "Ports", "Adjustability"],
  Processors: ["Socket", "Cores", "Threads", "Base Clock", "Boost Clock", "Cache", "TDP", "Integrated Graphics"],
  RAM: ["Capacity", "Memory Type", "Speed", "CAS Latency", "Voltage", "Module Count", "Compatibility"],
  Motherboards: ["Socket", "Form Factor", "Chipset", "Memory Support", "Memory Slots", "Expansion Slots", "Storage Interfaces", "Connectivity"],
  "Graphics Cards": ["GPU", "Memory", "Memory Type", "Core Clock", "Boost Clock", "Interface", "Recommended PSU", "Ports"],
  "SSD & HDD": ["Drive Type", "Capacity", "Form Factor", "Interface", "Read Speed", "Write Speed", "Cache"],
  "Power Supply": ["Wattage", "Efficiency Rating", "Modular Type", "Form Factor", "Connectors", "Cooling"],
  Casing: ["Form Factor", "Motherboard Support", "Dimensions", "Expansion Slots", "Included Fans", "Radiator Support", "Front I/O"],
  Airbuds: ["Driver Size", "Connectivity", "Battery Life", "Charging Case", "Microphone", "Noise Cancellation", "Water Resistance"],
  "Over-Ear Headphones": ["Driver Size", "Connectivity", "Frequency Response", "Battery Life", "Microphone", "Noise Cancellation", "Weight"],
  "Smart Watches": ["Display", "Compatibility", "Battery Life", "Sensors", "Water Resistance", "Connectivity", "Strap Material"],
  Keyboards: ["Layout", "Switch Type", "Connectivity", "Key Count", "Backlight", "Battery", "Compatibility"],
  Mouse: ["Sensor", "DPI", "Buttons", "Connectivity", "Polling Rate", "Battery", "Weight"],
  Speakers: ["Speaker Type", "Power Output", "Connectivity", "Frequency Response", "Channels", "Battery", "Dimensions"],
  Cameras: ["Sensor", "Resolution", "Lens Mount", "Video Resolution", "ISO Range", "Autofocus", "Connectivity"],
  "Gaming Console": ["Processor", "Graphics", "Storage", "Resolution", "Frame Rate", "Connectivity", "Included Accessories"],
  "Lights & Studio": ["Light Type", "Power", "Color Temperature", "Brightness", "Color Rendering", "Power Source", "Mount Type"],
};

const valueToText = (value) => {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return value == null ? "" : String(value);
};

export const toSpecificationRows = (specifications) => {
  if (!specifications || typeof specifications !== "object" || Array.isArray(specifications)) return [];
  return Object.entries(specifications).map(([key, value]) => ({ key, value: valueToText(value) }));
};

export const addCategorySuggestions = (rows, category) => {
  const allSuggestedKeys = new Set(Object.values(categorySpecificationSuggestions).flat().map((key) => key.toLowerCase()));
  const preservedRows = rows.filter(({ key, value }) => value.trim() || !allSuggestedKeys.has(key.trim().toLowerCase()));
  const existingKeys = new Set(preservedRows.map(({ key }) => key.trim().toLowerCase()).filter(Boolean));
  const suggestions = (categorySpecificationSuggestions[category] || [])
    .filter((key) => !existingKeys.has(key.toLowerCase()))
    .map((key) => ({ key, value: "" }));
  return [...preservedRows, ...suggestions];
};

export const rowsToSpecifications = (rows) => rows.reduce((specifications, row) => {
  const key = row.key.trim();
  const value = row.value.trim();
  if (key && value) specifications[key] = value;
  return specifications;
}, {});
