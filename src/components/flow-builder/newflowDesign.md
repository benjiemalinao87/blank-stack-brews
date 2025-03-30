Here’s the instruction you can refer  to design this UI with a modern Apple-inspired look:

---

### **Subflow UI Design Instructions (Apple-Inspired)**
**Objective:**  
Create a sleek, modern UI for managing subflows with a clean, minimalist aesthetic inspired by Apple’s design principles. The interface should feel intuitive, smooth, and visually appealing with subtle gradients, soft shadows, and rounded elements.

---

### **Design Principles:**
1. **Minimalist & Clean:** Avoid unnecessary clutter. Keep spacing generous, and use soft colors.
2. **Rounded & Fluid UI:** Use rounded corners for buttons, cards, and input fields (border-radius: 12px+).
3. **Glassmorphism & Soft Shadows:** Apply subtle transparency, gradients, and smooth shadows.
4. **Intuitive Animations:** Use smooth transitions on hover/click for an elegant feel.
5. **Consistent Typography:** Use a balanced font size, favoring Apple's San Francisco (SF Pro) or Inter.

---

### **1. Layout & Structure**
- **Main Container:**
  - Background: Soft gray (`#F5F5F7`) or a light gradient.
  - Card-like sections with `box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 6px`.

- **Top Navigation:**
  - **Title:** `text-3xl font-semibold text-gray-900`
  - **Actions:** Two main buttons:
    - **"Generate Process"** → Gradient background (e.g., `from-purple-500 to-indigo-500`)
    - **"+ New Process"** → Solid color (`bg-blue-600`)

- **Folder Section:**
  - Display folders as rounded rectangular tiles with soft shadows.
  - Folders should have a count badge (blue `bg-blue-600 text-white px-3 py-1 rounded-lg`).
  - Add a "Create Folder" tile with a dashed border and hover effects.

- **Search & View Toggle:**
  - Search bar should have a slight shadow and a `focus:ring-blue-400` effect.
  - Toggle between **list view** and **grid view** with smooth transitions.

---

### **2. Components & Styling**
#### **Folders & Categories**
- Use flexbox/grid for folder arrangement.
- Hover effects: Slight scale-up and shadow increase.
- Default color: `bg-white`, `text-gray-800`, border-radius: `12px`.

#### **Processes List (Cards)**
- **List View:**
  - Left-aligned with name, step count, and last updated date.
  - "View" button on the right (`bg-blue-600 hover:bg-blue-700 text-white rounded-lg`).
  
- **Grid View:**
  - 2-column layout with slightly larger cards.
  - Title, steps, and updated date stacked inside.

---

### **3. Animations & Effects**
- **Hover Effects:** 
  - Buttons: Slight shadow increase, opacity changes on hover.
  - Cards: Slight scale-up (`transform: scale(1.02); transition: all 0.2s ease-in-out`).
- **Click Animations:**  
  - Button clicks should have a soft "press" effect (`transform: scale(0.98) for 100ms`).
- **Loading States:**  
  - Use subtle skeleton loaders or shimmer effects while fetching data.

---

### **4. Responsive Design**
- **Mobile View:**
  - Convert grid view to a single-column scroll.
  - Stack action buttons.
- **Tablet/Desktop:**
  - Maintain multi-column layout with flexible grid adjustments.

---

### **5. Development Notes**
- Use **Tailwind CSS** for rapid styling.
- Use **Framer Motion** for smooth transitions (e.g., folder hover, button clicks).
- Ensure **ARIA accessibility** (labels for buttons, search input, etc.).

---

Code sample

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List, Grid, Plus } from "lucide-react";

const categories = [
  { name: "Automations", count: 12 },
  { name: "Workflows", count: 8 },
  { name: "Notifications", count: 5 },
  { name: "Analytics", count: 4 },
];

const processes = [
  { name: "Lead Qualification", steps: 4, updated: "Feb 23, 2025 4:01 PM" },
  { name: "Customer Onboarding", steps: 7, updated: "Feb 17, 2025 6:15 PM" },
  { name: "Follow-up Sequence", steps: 5, updated: "Feb 15, 2025 5:20 AM" },
];

export default function ProcessManager() {
  const [view, setView] = useState("list");
  return (
    <div className="p-6 bg-gray-100 min-h-screen rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Process Manager</h1>
        <div className="flex gap-3">
          <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-80 flex items-center px-4 py-2 rounded-xl shadow-md transition">
            <Plus className="mr-2" /> Generate Process
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md transition">+ New Process</Button>
        </div>
      </div>
      
      {/* Category Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-6">
        {categories.map((category) => (
          <Card key={category.name} className="p-5 flex justify-between items-center bg-white rounded-xl shadow-md hover:shadow-lg transition">
            <span className="text-gray-800 font-medium">{category.name}</span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold">{category.count}</span>
          </Card>
        ))}
        <Card className="p-5 border-dashed border-2 border-gray-300 text-center cursor-pointer rounded-xl hover:border-gray-500 transition">
          + Add Category
        </Card>
      </div>

      {/* Search & View Toggle */}
      <div className="flex justify-between mb-6">
        <Input placeholder="Search process name..." className="w-1/3 px-4 py-2 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-400" />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setView("list")} className="p-2 rounded-lg shadow-sm hover:bg-gray-200">
            <List />
          </Button>
          <Button variant="outline" onClick={() => setView("grid")} className="p-2 rounded-lg shadow-sm hover:bg-gray-200">
            <Grid />
          </Button>
        </div>
      </div>

      {/* Process List */}
      <div className={view === "list" ? "space-y-4" : "grid grid-cols-2 gap-6"}>
        {processes.map((process) => (
          <Card key={process.name} className="p-5 flex justify-between items-center bg-white rounded-xl shadow-md hover:shadow-lg transition">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{process.name}</h3>
              <p className="text-sm text-gray-500">{process.steps} steps • {process.updated}</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition">View</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
