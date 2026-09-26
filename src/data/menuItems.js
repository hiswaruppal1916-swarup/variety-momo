export const menuItems = [
  // CHICKEN MOMOS
  {
    id: "steam-chicken-momos",
    name: "Steam Chicken Momos",
    category: "chicken-momos",
    isVeg: false,
    rating: 4.9,
    ratingCount: 384,
    description: "Classic Himalayan-style tender dumplings packed with finely minced juicy chicken, fresh ginger, spring onions, and served with house fiery red chutney & clear soup.",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
    tags: ["Bestseller", "Steamed", "Hot"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 70 },
      { id: "full", name: "Full (10 Pcs)", price: 120 }
    ],
    defaultVariant: "half",
    badge: "Bestseller",
    isFeatured: true,
    isPopular: true
  },
  {
    id: "chicken-fried-momos",
    name: "Chicken Fried Momos",
    category: "chicken-momos",
    isVeg: false,
    rating: 4.8,
    ratingCount: 290,
    description: "Crispy golden-fried chicken momos with a crunchy exterior and succulent, steaming hot interior. Accompanied by zesty mayo and spicy garlic dips.",
    image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80",
    tags: ["Crispy", "Customer Favourite"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 80 },
      { id: "full", name: "Full (10 Pcs)", price: 140 }
    ],
    defaultVariant: "half",
    isFeatured: true,
    isPopular: true
  },
  {
    id: "chicken-crunchy-momos",
    name: "Chicken Crunchy Momos",
    category: "crunchy-momos",
    isVeg: false,
    rating: 4.9,
    ratingCount: 312,
    description: "Double-coated with chef's special spiced crispy crumb flake crust and deep-fried to golden perfection. Extra crunch in every single bite!",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    tags: ["Super Crunchy", "Most Ordered"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 90 },
      { id: "full", name: "Full (10 Pcs)", price: 160 }
    ],
    defaultVariant: "half",
    badge: "Super Crunchy",
    isFeatured: true,
    isPopular: true
  },
  {
    id: "chicken-afghani-momos",
    name: "Chicken Afghani Momos",
    category: "afghani-momos",
    isVeg: false,
    rating: 4.9,
    ratingCount: 245,
    description: "Tandoori grilled chicken momos smothered in rich velvety cashew cream, butter, roasted herbs, and mild black pepper.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    tags: ["Creamy", "Royal"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 110 },
      { id: "full", name: "Full (10 Pcs)", price: 190 }
    ],
    defaultVariant: "half",
    badge: "Royal Rich",
    isFeatured: true
  },
  {
    id: "chicken-achari-momos",
    name: "Chicken Achari Momos",
    category: "achari-momos",
    isVeg: false,
    rating: 4.7,
    ratingCount: 182,
    description: "Infused with tangy and zesty pickled Indian achari spices, mustard oil hint, and slow-roasted for a bold street flavor punch.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    tags: ["Spicy", "Tangy"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 100 },
      { id: "full", name: "Full (10 Pcs)", price: 180 }
    ],
    defaultVariant: "half"
  },
  {
    id: "chicken-amlet-momos",
    name: "Chicken Amlet Momos",
    category: "chicken-momos",
    isVeg: false,
    rating: 4.8,
    ratingCount: 165,
    description: "Innovative fusion special: juicy steamed chicken momos wrapped in a seasoned fluffy golden egg omelette, topped with melted cheese drizzle.",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
    tags: ["Fusion", "Chef Signature"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 90 },
      { id: "full", name: "Full (10 Pcs)", price: 160 }
    ],
    defaultVariant: "half",
    badge: "Unique Fusion"
  },
  {
    id: "chicken-pizza-momos",
    name: "Chicken Pizza Momos",
    category: "special-momos",
    isVeg: false,
    rating: 4.9,
    ratingCount: 278,
    description: "Baked with rich Italian marinara, loaded mozzarella cheese pull, oregano, chilli flakes, and tender chicken momo fillings inside.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    tags: ["Cheesy", "Kids Love"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 120 },
      { id: "full", name: "Full (10 Pcs)", price: 210 }
    ],
    defaultVariant: "half",
    badge: "Cheese Burst",
    isFeatured: true
  },
  {
    id: "chilli-gravy-pan-fried-momos",
    name: "Chilli Gravy Pan Fried Momos",
    category: "pan-fried",
    isVeg: false,
    rating: 4.9,
    ratingCount: 350,
    description: "Pan-crisped chicken momos drenched in a thick Indo-Chinese chilli garlic gravy with diced bell peppers, onion petals, and scallions.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    tags: ["Saucy & Spicy", "Hot Selling"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 110 },
      { id: "full", name: "Full (10 Pcs)", price: 190 }
    ],
    defaultVariant: "half",
    badge: "Indo-Chinese Gravy",
    isPopular: true
  },

  // SPECIAL MOMOS
  {
    id: "gondhoraj-momo",
    name: "Gondhoraj Momo",
    category: "special-momos",
    isVeg: false,
    rating: 5.0,
    ratingCount: 420,
    description: "Variety Momo's legendary Bengal specialty! Steamed dumplings infused with aromatic Bengal Gondhoraj lime zest and fragrant herbs. Refreshing, vibrant, and bursting with citrus aromatics.",
    image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80",
    tags: ["Mecheda Famous", "Signature"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 90 },
      { id: "full", name: "Full (10 Pcs)", price: 160 }
    ],
    defaultVariant: "half",
    badge: "Signature Must-Try",
    isFeatured: true,
    isPopular: true
  },
  {
    id: "chocolate-momo",
    name: "Chocolate Momo",
    category: "special-momos",
    isVeg: true,
    rating: 4.8,
    ratingCount: 195,
    description: "Decadent dessert dumplings stuffed with molten dark chocolate and roasted almond slivers, served warm with rich chocolate fudge drizzle.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    tags: ["Dessert", "Sweet Tooth"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 80 },
      { id: "full", name: "Full (10 Pcs)", price: 150 }
    ],
    defaultVariant: "half",
    badge: "Sweet Delight"
  },
  {
    id: "kabul-malai-momos",
    name: "Kabul Malai Momos",
    category: "special-momos",
    isVeg: false,
    rating: 4.9,
    ratingCount: 260,
    description: "Afghani-Kabuli inspired specialty coated in thick cream, roasted saffron, crushed cardamom, and butter gravy with charred garlic notes.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    tags: ["Royal Taste", "Creamy"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 120 },
      { id: "full", name: "Full (10 Pcs)", price: 210 }
    ],
    defaultVariant: "half",
    badge: "Kabuli Special"
  },
  {
    id: "pan-fried-momos-dry",
    name: "Pan Fried Momos (Tossed)",
    category: "pan-fried",
    isVeg: false,
    rating: 4.8,
    ratingCount: 230,
    description: "Shallow-fried on an iron griddle until bottom is blistered and crunchy, tossed with roasted sesame seeds, dark soy, and house chilli sauce.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    tags: ["Crisp Bottom", "Sesame Wok"],
    variants: [
      { id: "half", name: "Half (5 Pcs)", price: 90 },
      { id: "full", name: "Full (10 Pcs)", price: 160 }
    ],
    defaultVariant: "half"
  },

  // TIKKA
  {
    id: "paneer-tikka",
    name: "Paneer Tikka",
    category: "tikka",
    isVeg: true,
    rating: 4.8,
    ratingCount: 210,
    description: "Soft fresh malai paneer cubes marinated in spiced yoghurt, Kashmiri degi mirch, and ajwain, skewered with bell peppers and roasted on charcoal.",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    tags: ["Clay Oven", "Pure Veg"],
    variants: [
      { id: "half", name: "Half (6 Pcs)", price: 130 },
      { id: "full", name: "Full (12 Pcs)", price: 230 }
    ],
    defaultVariant: "half",
    badge: "Pure Veg Hit"
  },
  {
    id: "chicken-tikka",
    name: "Chicken Tikka",
    category: "tikka",
    isVeg: false,
    rating: 4.9,
    ratingCount: 340,
    description: "Boneless chicken chunks marinated in mustard oil, tandoori masala, and Greek yoghurt, roasted with smoky char edges and lemon butter basting.",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    tags: ["Charcoal Smoked", "Juicy"],
    variants: [
      { id: "half", name: "Half (6 Pcs)", price: 150 },
      { id: "full", name: "Full (12 Pcs)", price: 260 }
    ],
    defaultVariant: "half",
    badge: "Smoky Charcoal",
    isPopular: true
  },

  // RICE
  {
    id: "veg-fried-rice",
    name: "Veg Fried Rice",
    category: "rice",
    isVeg: true,
    rating: 4.7,
    ratingCount: 175,
    description: "Aromatic long-grain basmati rice wok-tossed on high flame with finely chopped carrots, French beans, bell peppers, and fresh scallions.",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    tags: ["Wok Fried", "Basmati"],
    variants: [
      { id: "half", name: "Half Plate", price: 90 },
      { id: "full", name: "Full Plate", price: 160 }
    ],
    defaultVariant: "half"
  },
  {
    id: "chicken-fried-rice",
    name: "Chicken Fried Rice",
    category: "rice",
    isVeg: false,
    rating: 4.8,
    ratingCount: 295,
    description: "Fluffy basmati rice tossed with shredded juicy chicken, scrambled farm egg, garlic, light soya sauce, and crushed black peppercorns.",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    tags: ["Egg & Chicken", "Flavourful"],
    variants: [
      { id: "half", name: "Half Plate", price: 120 },
      { id: "full", name: "Full Plate", price: 210 }
    ],
    defaultVariant: "half",
    isPopular: true
  },

  // FAST FOOD / CHOWMEIN
  {
    id: "veg-chowmein",
    name: "Veg Chowmein",
    category: "chowmein",
    isVeg: true,
    rating: 4.7,
    ratingCount: 215,
    description: "Classic Kolkata roadside street-style noodles tossed with crunchy shredded cabbage, julienned carrots, capsicum, and tangy chilli sauces.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    tags: ["Street Style", "Veg Treat"],
    variants: [
      { id: "half", name: "Half Plate", price: 70 },
      { id: "full", name: "Full Plate", price: 120 }
    ],
    defaultVariant: "half"
  },
  {
    id: "paneer-chowmein",
    name: "Paneer Chowmein",
    category: "chowmein",
    isVeg: true,
    rating: 4.8,
    ratingCount: 188,
    description: "Wok-tossed noodles generously tossed with pan-seared fresh cottage cheese cubes, crunchy onions, and spicy dark soya sauce glaze.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    tags: ["Paneer Loaded", "Street Noodles"],
    variants: [
      { id: "half", name: "Half Plate", price: 90 },
      { id: "full", name: "Full Plate", price: 160 }
    ],
    defaultVariant: "half"
  },
  {
    id: "chicken-chowmein",
    name: "Chicken Chowmein",
    category: "chowmein",
    isVeg: false,
    rating: 4.9,
    ratingCount: 360,
    description: "Signature Bengal-style chicken chowmein loaded with tender chicken shreds, scrambled eggs, green chillies, garlic, and special wok seasoning.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    tags: ["Bestseller Noodles", "Kolkata Style"],
    variants: [
      { id: "half", name: "Half Plate", price: 100 },
      { id: "full", name: "Full Plate", price: 180 }
    ],
    defaultVariant: "half",
    badge: "Local Favourite",
    isFeatured: true,
    isPopular: true
  }
];
