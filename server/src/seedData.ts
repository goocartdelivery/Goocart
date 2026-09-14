// AUTO-DERIVED from db/catalogSeed.ts by convert-seed.mjs — the same catalog
// the D1 build used, reshaped for MongoDB (categories, offers, variants and
// add-on groups embedded in their parent document).
//
// Images are Unsplash CDN URLs, free for commercial use without attribution.
// Replace any imageUrl with a real photograph when you have one.

export const SERVICES = ["Food","Grocery","Vegetables","Mart","Medicine","Bike Taxi","Parcel"];

export const SEED_ROLES = [
  {
    "id": "CUSTOMER",
    "label": "Customer",
    "description": "Orders food, groceries and books rides or parcels.",
    "permissions": []
  },
  {
    "id": "VENDOR_OWNER",
    "label": "Vendor Owner",
    "description": "Owns and fully manages a store.",
    "permissions": [
      "product.manage_own",
      "order.manage_own_vendor"
    ]
  },
  {
    "id": "VENDOR_MANAGER",
    "label": "Vendor Manager",
    "description": "Manages day-to-day store operations.",
    "permissions": [
      "product.manage_own",
      "order.manage_own_vendor"
    ]
  },
  {
    "id": "DELIVERY_PARTNER",
    "label": "Delivery Partner",
    "description": "Delivers orders, parcels and rides.",
    "permissions": [
      "order.manage_own_partner"
    ]
  },
  {
    "id": "SUPER_ADMIN",
    "label": "Super Admin",
    "description": "Full platform access.",
    "permissions": [
      "*"
    ]
  },
  {
    "id": "OPERATIONS_ADMIN",
    "label": "Operations Admin",
    "description": "Runs live operations.",
    "permissions": [
      "order.manage_all",
      "order.cancel_any",
      "service.manage",
      "vendor.manage",
      "partner.manage",
      "audit.view"
    ]
  },
  {
    "id": "FINANCE_ADMIN",
    "label": "Finance Admin",
    "description": "Pricing, commissions and settlements.",
    "permissions": [
      "pricing.manage",
      "settlement.manage",
      "audit.view"
    ]
  },
  {
    "id": "SUPPORT_ADMIN",
    "label": "Support Admin",
    "description": "Support tickets and disputes.",
    "permissions": [
      "support.manage",
      "order.manage_all",
      "audit.view"
    ]
  },
  {
    "id": "MARKETING_ADMIN",
    "label": "Marketing Admin",
    "description": "Offers, coupons and campaigns.",
    "permissions": [
      "audit.view"
    ]
  },
  {
    "id": "CITY_ADMIN",
    "label": "City Admin",
    "description": "Manages a city service area.",
    "permissions": [
      "service.manage",
      "vendor.manage",
      "partner.manage",
      "audit.view"
    ]
  }
];

export const SEED_RESTAURANTS = [
  {
    "slug": "r1",
    "name": "Paradise Biryani",
    "imageUrl": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=70",
    "rating": 4.5,
    "ratingCount": 3200,
    "cuisines": [
      "Biryani",
      "Indian",
      "Chinese"
    ],
    "deliveryTimeMin": 25,
    "deliveryTimeMax": 30,
    "distanceKm": 2.4,
    "priceForOne": 200,
    "priceForTwo": 400,
    "vegOnly": false,
    "isOpen": true,
    "area": "Main Road, Jangareddigudem",
    "latitude": 17.4368,
    "longitude": 81.2668,
    "offers": [
      {
        "title": "50% OFF up to ₹120",
        "description": "Use code GOO50"
      },
      {
        "title": "FREE DELIVERY",
        "description": "On orders above ₹199"
      }
    ],
    "categories": [
      {
        "key": "r1-recommended",
        "name": "Recommended",
        "sortOrder": 1
      },
      {
        "key": "r1-biryani",
        "name": "Biryani",
        "sortOrder": 2
      },
      {
        "key": "r1-starters",
        "name": "Starters",
        "sortOrder": 3
      },
      {
        "key": "r1-beverages",
        "name": "Beverages",
        "sortOrder": 4
      }
    ]
  },
  {
    "slug": "r2",
    "name": "Sri Kanya Biryani",
    "imageUrl": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=70",
    "rating": 4.4,
    "ratingCount": 2100,
    "cuisines": [
      "Biryani",
      "Andhra"
    ],
    "deliveryTimeMin": 30,
    "deliveryTimeMax": 38,
    "distanceKm": 3,
    "priceForOne": 180,
    "priceForTwo": 360,
    "vegOnly": false,
    "isOpen": true,
    "area": "Bus Stand Road, Jangareddigudem",
    "latitude": 17.4342,
    "longitude": 81.2701,
    "offers": [
      {
        "title": "₹100 OFF above ₹499",
        "description": null
      }
    ],
    "categories": [
      {
        "key": "r2-biryani",
        "name": "Biryani",
        "sortOrder": 1
      },
      {
        "key": "r2-curries",
        "name": "Curries",
        "sortOrder": 2
      },
      {
        "key": "r2-beverages",
        "name": "Beverages",
        "sortOrder": 3
      }
    ]
  },
  {
    "slug": "r3",
    "name": "Spicy Hub",
    "imageUrl": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=70",
    "rating": 4.2,
    "ratingCount": 980,
    "cuisines": [
      "Chinese",
      "Fast Food"
    ],
    "deliveryTimeMin": 28,
    "deliveryTimeMax": 35,
    "distanceKm": 3.4,
    "priceForOne": 220,
    "priceForTwo": 440,
    "vegOnly": false,
    "isOpen": true,
    "area": "Market Street, Jangareddigudem",
    "latitude": 17.439,
    "longitude": 81.263,
    "offers": [],
    "categories": [
      {
        "key": "r3-starters",
        "name": "Starters",
        "sortOrder": 1
      },
      {
        "key": "r3-noodles",
        "name": "Noodles & Rice",
        "sortOrder": 2
      }
    ]
  },
  {
    "slug": "r4",
    "name": "Food Palace",
    "imageUrl": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=70",
    "rating": 4.1,
    "ratingCount": 760,
    "cuisines": [
      "North Indian",
      "Multi-cuisine"
    ],
    "deliveryTimeMin": 32,
    "deliveryTimeMax": 40,
    "distanceKm": 4.1,
    "priceForOne": 240,
    "priceForTwo": 480,
    "vegOnly": false,
    "isOpen": true,
    "area": "Ring Road, Jangareddigudem",
    "latitude": 17.4321,
    "longitude": 81.2588,
    "offers": [
      {
        "title": "20% OFF up to ₹80",
        "description": null
      }
    ],
    "categories": [
      {
        "key": "r4-mains",
        "name": "Main Course",
        "sortOrder": 1
      },
      {
        "key": "r4-breads",
        "name": "Breads",
        "sortOrder": 2
      }
    ]
  },
  {
    "slug": "r5",
    "name": "Village Kitchen",
    "imageUrl": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=70",
    "rating": 4.6,
    "ratingCount": 1500,
    "cuisines": [
      "Andhra",
      "Meals"
    ],
    "deliveryTimeMin": 20,
    "deliveryTimeMax": 28,
    "distanceKm": 1.6,
    "priceForOne": 150,
    "priceForTwo": 280,
    "vegOnly": true,
    "isOpen": true,
    "area": "Temple Street, Jangareddigudem",
    "latitude": 17.4355,
    "longitude": 81.2645,
    "offers": [
      {
        "title": "FREE DELIVERY",
        "description": null
      }
    ],
    "categories": [
      {
        "key": "r5-meals",
        "name": "Meals",
        "sortOrder": 1
      }
    ]
  },
  {
    "slug": "r6",
    "name": "Tiffin House",
    "imageUrl": "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=800&q=70",
    "rating": 4.4,
    "ratingCount": 1900,
    "cuisines": [
      "South Indian",
      "Breakfast"
    ],
    "deliveryTimeMin": 16,
    "deliveryTimeMax": 22,
    "distanceKm": 1.1,
    "priceForOne": 90,
    "priceForTwo": 170,
    "vegOnly": true,
    "isOpen": true,
    "area": "Station Road, Jangareddigudem",
    "latitude": 17.4372,
    "longitude": 81.2612,
    "offers": [],
    "categories": [
      {
        "key": "r6-tiffins",
        "name": "Tiffins",
        "sortOrder": 1
      }
    ]
  },
  {
    "slug": "r7",
    "name": "Pizza Hub",
    "imageUrl": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=70",
    "rating": 4,
    "ratingCount": 640,
    "cuisines": [
      "Pizza",
      "Italian"
    ],
    "deliveryTimeMin": 26,
    "deliveryTimeMax": 34,
    "distanceKm": 2.9,
    "priceForOne": 210,
    "priceForTwo": 420,
    "vegOnly": false,
    "isOpen": true,
    "area": "College Road, Jangareddigudem",
    "latitude": 17.4302,
    "longitude": 81.2661,
    "offers": [
      {
        "title": "Buy 1 Get 1",
        "description": null
      }
    ],
    "categories": [
      {
        "key": "r7-pizza",
        "name": "Pizza",
        "sortOrder": 1
      }
    ]
  },
  {
    "slug": "r8",
    "name": "Burger Point",
    "imageUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=70",
    "rating": 4.1,
    "ratingCount": 520,
    "cuisines": [
      "Burger",
      "Fast Food"
    ],
    "deliveryTimeMin": 18,
    "deliveryTimeMax": 24,
    "distanceKm": 1.9,
    "priceForOne": 140,
    "priceForTwo": 260,
    "vegOnly": false,
    "isOpen": true,
    "area": "Market Street, Jangareddigudem",
    "latitude": 17.4381,
    "longitude": 81.2653,
    "offers": [],
    "categories": [
      {
        "key": "r8-burgers",
        "name": "Burgers",
        "sortOrder": 1
      }
    ]
  },
  {
    "slug": "r9",
    "name": "Andhra Meals",
    "imageUrl": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=70",
    "rating": 4.5,
    "ratingCount": 2300,
    "cuisines": [
      "South Indian",
      "Meals"
    ],
    "deliveryTimeMin": 22,
    "deliveryTimeMax": 28,
    "distanceKm": 1.4,
    "priceForOne": 130,
    "priceForTwo": 250,
    "vegOnly": true,
    "isOpen": false,
    "area": "Old Bus Stand, Jangareddigudem",
    "latitude": 17.4335,
    "longitude": 81.267,
    "offers": [
      {
        "title": "10% OFF",
        "description": null
      }
    ],
    "categories": [
      {
        "key": "r9-meals",
        "name": "Meals",
        "sortOrder": 1
      }
    ]
  },
  {
    "slug": "r10",
    "name": "Sweet Magic",
    "imageUrl": "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=70",
    "rating": 4.3,
    "ratingCount": 410,
    "cuisines": [
      "Desserts",
      "Juices"
    ],
    "deliveryTimeMin": 15,
    "deliveryTimeMax": 20,
    "distanceKm": 0.9,
    "priceForOne": 80,
    "priceForTwo": 150,
    "vegOnly": true,
    "isOpen": true,
    "area": "Temple Street, Jangareddigudem",
    "latitude": 17.436,
    "longitude": 81.264,
    "offers": [],
    "categories": [
      {
        "key": "r10-desserts",
        "name": "Desserts",
        "sortOrder": 1
      },
      {
        "key": "r10-juices",
        "name": "Juices",
        "sortOrder": 2
      }
    ]
  }
];

export const SEED_FOOD_ITEMS = [
  {
    "slug": "f1",
    "restaurantSlug": "r1",
    "categoryKey": "r1-biryani",
    "name": "Chicken Dum Biryani",
    "description": "Aromatic basmati rice slow-cooked with spiced chicken.",
    "imageUrl": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=70",
    "price": 220,
    "veg": false,
    "rating": 4.6,
    "ratingCount": 1200,
    "bestseller": true,
    "available": true,
    "variants": [
      {
        "key": "f1-regular",
        "name": "Regular",
        "price": 220,
        "sortOrder": 1
      },
      {
        "key": "f1-large",
        "name": "Large",
        "price": 340,
        "sortOrder": 2
      }
    ],
    "addonGroups": [
      {
        "key": "f1-extras",
        "name": "Add Extras",
        "required": false,
        "multiSelect": true,
        "maxSelect": null,
        "options": [
          {
            "key": "f1-egg",
            "name": "Boiled Egg",
            "price": 20
          },
          {
            "key": "f1-chicken",
            "name": "Extra Chicken",
            "price": 80
          },
          {
            "key": "f1-gravy",
            "name": "Extra Gravy",
            "price": 30
          }
        ]
      }
    ]
  },
  {
    "slug": "f2",
    "restaurantSlug": "r1",
    "categoryKey": "r1-biryani",
    "name": "Veg Biryani",
    "description": "Basmati rice cooked with fresh garden vegetables.",
    "imageUrl": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=70",
    "price": 180,
    "veg": true,
    "rating": 4.3,
    "ratingCount": 540,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f3",
    "restaurantSlug": "r1",
    "categoryKey": "r1-starters",
    "name": "Chicken 65",
    "description": "Spicy, deep-fried chicken bites tossed with curry leaves.",
    "imageUrl": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=70",
    "price": 190,
    "veg": false,
    "rating": 4.4,
    "ratingCount": 610,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f4",
    "restaurantSlug": "r1",
    "categoryKey": "r1-beverages",
    "name": "Coke",
    "description": "Chilled 300ml soft drink.",
    "imageUrl": "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=70",
    "price": 40,
    "veg": true,
    "rating": 0,
    "ratingCount": 0,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f5",
    "restaurantSlug": "r2",
    "categoryKey": "r2-biryani",
    "name": "Special Chicken Biryani",
    "description": "Sri Kanya's signature slow-cooked chicken biryani.",
    "imageUrl": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=70",
    "price": 210,
    "veg": false,
    "rating": 4.5,
    "ratingCount": 890,
    "bestseller": true,
    "available": true,
    "variants": [
      {
        "key": "f5-regular",
        "name": "Regular",
        "price": 210,
        "sortOrder": 1
      },
      {
        "key": "f5-large",
        "name": "Large",
        "price": 320,
        "sortOrder": 2
      }
    ],
    "addonGroups": [
      {
        "key": "f5-extras",
        "name": "Add Extras",
        "required": false,
        "multiSelect": true,
        "maxSelect": null,
        "options": [
          {
            "key": "f5-egg",
            "name": "Boiled Egg",
            "price": 20
          },
          {
            "key": "f5-raita",
            "name": "Raita",
            "price": 25
          }
        ]
      }
    ]
  },
  {
    "slug": "f6",
    "restaurantSlug": "r2",
    "categoryKey": "r2-curries",
    "name": "Chicken Curry",
    "description": "Home-style Andhra chicken curry served with steamed rice.",
    "imageUrl": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=70",
    "price": 200,
    "veg": false,
    "rating": 4.2,
    "ratingCount": 300,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f7",
    "restaurantSlug": "r2",
    "categoryKey": "r2-beverages",
    "name": "Sweet Lassi",
    "description": "Chilled yogurt-based sweet drink.",
    "imageUrl": "https://images.unsplash.com/photo-1626196340104-2ba1a1b2b0b4?auto=format&fit=crop&w=400&q=70",
    "price": 50,
    "veg": true,
    "rating": 0,
    "ratingCount": 0,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f8",
    "restaurantSlug": "r3",
    "categoryKey": "r3-starters",
    "name": "Chilli Chicken",
    "description": "Indo-Chinese chicken tossed with peppers and onion.",
    "imageUrl": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=70",
    "price": 210,
    "veg": false,
    "rating": 4.3,
    "ratingCount": 420,
    "bestseller": true,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f9",
    "restaurantSlug": "r3",
    "categoryKey": "r3-noodles",
    "name": "Veg Fried Rice",
    "description": "Wok-tossed rice with fresh vegetables.",
    "imageUrl": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=70",
    "price": 160,
    "veg": true,
    "rating": 4,
    "ratingCount": 260,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f10",
    "restaurantSlug": "r4",
    "categoryKey": "r4-mains",
    "name": "Paneer Butter Masala",
    "description": "Cottage cheese in a rich, buttery tomato gravy.",
    "imageUrl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=70",
    "price": 230,
    "veg": true,
    "rating": 4.2,
    "ratingCount": 380,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f11",
    "restaurantSlug": "r4",
    "categoryKey": "r4-breads",
    "name": "Butter Naan",
    "description": "Soft tandoor-baked bread brushed with butter.",
    "imageUrl": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=70",
    "price": 40,
    "veg": true,
    "rating": 0,
    "ratingCount": 0,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f12",
    "restaurantSlug": "r5",
    "categoryKey": "r5-meals",
    "name": "Andhra Veg Meals",
    "description": "Unlimited rice with traditional Andhra curries.",
    "imageUrl": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=70",
    "price": 150,
    "veg": true,
    "rating": 4.6,
    "ratingCount": 900,
    "bestseller": true,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f13",
    "restaurantSlug": "r6",
    "categoryKey": "r6-tiffins",
    "name": "Masala Dosa",
    "description": "Crisp rice crepe filled with spiced potato masala.",
    "imageUrl": "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=400&q=70",
    "price": 70,
    "veg": true,
    "rating": 4.5,
    "ratingCount": 1100,
    "bestseller": true,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f14",
    "restaurantSlug": "r6",
    "categoryKey": "r6-tiffins",
    "name": "Idli Sambar",
    "description": "Steamed rice cakes served with sambar and chutney.",
    "imageUrl": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=70",
    "price": 60,
    "veg": true,
    "rating": 4.4,
    "ratingCount": 780,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f15",
    "restaurantSlug": "r7",
    "categoryKey": "r7-pizza",
    "name": "Farmhouse Pizza",
    "description": "Loaded with onion, capsicum, tomato and mushroom.",
    "imageUrl": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=70",
    "price": 250,
    "veg": true,
    "rating": 4.1,
    "ratingCount": 340,
    "bestseller": false,
    "available": true,
    "variants": [
      {
        "key": "f15-regular",
        "name": "Regular (7\")",
        "price": 250,
        "sortOrder": 1
      },
      {
        "key": "f15-medium",
        "name": "Medium (10\")",
        "price": 380,
        "sortOrder": 2
      },
      {
        "key": "f15-large",
        "name": "Large (13\")",
        "price": 520,
        "sortOrder": 3
      }
    ],
    "addonGroups": []
  },
  {
    "slug": "f16",
    "restaurantSlug": "r8",
    "categoryKey": "r8-burgers",
    "name": "Chicken Zinger Burger",
    "description": "Crispy fried chicken burger with cheese and mayo.",
    "imageUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=70",
    "price": 150,
    "veg": false,
    "rating": 4.2,
    "ratingCount": 290,
    "bestseller": true,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f17",
    "restaurantSlug": "r9",
    "categoryKey": "r9-meals",
    "name": "Full Meals",
    "description": "Rice, sambar, rasam, curry and papad.",
    "imageUrl": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=70",
    "price": 130,
    "veg": true,
    "rating": 4.5,
    "ratingCount": 640,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f18",
    "restaurantSlug": "r10",
    "categoryKey": "r10-desserts",
    "name": "Gulab Jamun (2 pcs)",
    "description": "Soft milk dumplings soaked in rose sugar syrup.",
    "imageUrl": "https://images.unsplash.com/photo-1601303516534-bf0b1eb70e63?auto=format&fit=crop&w=400&q=70",
    "price": 60,
    "veg": true,
    "rating": 4.4,
    "ratingCount": 210,
    "bestseller": false,
    "available": true,
    "variants": [],
    "addonGroups": []
  },
  {
    "slug": "f19",
    "restaurantSlug": "r10",
    "categoryKey": "r10-juices",
    "name": "Fresh Mango Juice",
    "description": "Seasonal mango blended fresh, no added sugar.",
    "imageUrl": "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=70",
    "price": 70,
    "veg": true,
    "rating": 4.3,
    "ratingCount": 150,
    "bestseller": false,
    "available": false,
    "variants": [],
    "addonGroups": []
  }
];

export const SEED_COUPONS = [
  {
    "code": "GOO50",
    "title": "50% OFF up to ₹100",
    "description": "Get 50% off, up to ₹100 off",
    "type": "PERCENT",
    "value": 50,
    "minOrder": 299,
    "maxDiscount": 100,
    "active": true
  },
  {
    "code": "FREEDEL",
    "title": "Free delivery",
    "description": "Free delivery on this order",
    "type": "FREE_DELIVERY",
    "value": 0,
    "minOrder": 199,
    "maxDiscount": null,
    "active": true
  },
  {
    "code": "WELCOME100",
    "title": "₹100 OFF",
    "description": "Flat ₹100 off your order",
    "type": "FLAT",
    "value": 100,
    "minOrder": 499,
    "maxDiscount": null,
    "active": true
  }
];

// Bike Taxi and Parcel fares. Admin-editable from the portal; never hardcoded
// in any client.
export const SEED_PRICING = [
  { service: "Bike Taxi", baseFare: 25, perKm: 8, platformFee: 4, partnerPayoutPercent: 80 },
  { service: "Parcel", baseFare: 35, perKm: 10, platformFee: 5, partnerPayoutPercent: 80 },
];

// Multi-service store catalogs. `category` keys align 1:1 with the customer
// app's HOME_RAW_CATEGORIES (grocery/vegetables/mart subcategory strips), so a
// product lands in exactly one subcategory. `mrp` (when set) drives the
// strikethrough + discount badge; products without one render at list price.
// `unit` is the pack size/quantity shown under the name (1 kg, 1 L, 12 pcs…).
export const SEED_PRODUCTS = [
  // --- Grocery -----------------------------------------------------
  { service: "Grocery", category: "dairy", name: "Amul Full Cream Milk 1L", description: "Fresh pasteurised milk, homogenised", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&h=400&q=60", price: 68, mrp: 74, unit: "1 L", stock: 80, rating: 4.7, eta: "25–35 min" },
  { service: "Grocery", category: "dairy", name: "Fresh Curd 400g", description: "Creamy set curd, ready to eat", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&h=400&q=60", price: 35, mrp: 40, unit: "400 g", stock: 60, rating: 4.5, eta: "25–35 min" },
  { service: "Grocery", category: "dairy", name: "Amul Butter 500g", description: "Salted cooking butter", imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&h=400&q=60", price: 265, mrp: 280, unit: "500 g", stock: 34, rating: 4.6, eta: "25–35 min" },
  { service: "Grocery", category: "dairy", name: "Amul Paneer 200g", description: "Soft fresh paneer block", imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&h=400&q=60", price: 95, mrp: 102, unit: "200 g", stock: 40, rating: 4.4, eta: "25–35 min" },
  { service: "Grocery", category: "fruits", name: "Kashmiri Apples 1kg", description: "Crisp, sweet and juicy", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&h=400&q=60", price: 162, mrp: 180, unit: "1 kg", stock: 42, rating: 4.7, eta: "20–30 min" },
  { service: "Grocery", category: "fruits", name: "Robusta Bananas 1 dozen", description: "Ripe, naturally sweet bananas", imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&h=400&q=60", price: 60, mrp: 70, unit: "12 pcs", stock: 65, rating: 4.6, eta: "20–30 min" },
  { service: "Grocery", category: "fruits", name: "Alphonso Mangoes 1kg", description: "King of mangoes, fibreless pulp", imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&h=400&q=60", price: 145, mrp: 190, unit: "1 kg", stock: 18, rating: 4.8, eta: "20–30 min" },
  { service: "Grocery", category: "fruits", name: "Green Grapes 500g", description: "Seedless, sweet green grapes", imageUrl: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=400&h=400&q=60", price: 62, mrp: 75, unit: "500 g", stock: 50, rating: 4.5, eta: "20–30 min" },
  { service: "Grocery", category: "vegetables", name: "Hybrid Tomatoes 1kg", description: "Firm, farm-fresh local tomatoes", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&h=400&q=60", price: 48, mrp: 55, unit: "1 kg", stock: 70, rating: 4.6, eta: "20–30 min" },
  { service: "Grocery", category: "vegetables", name: "Onions 1kg", description: "Fresh everyday cooking onions", imageUrl: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=400&h=400&q=60", price: 42, mrp: 50, unit: "1 kg", stock: 75, rating: 4.5, eta: "20–30 min" },
  { service: "Grocery", category: "vegetables", name: "Potatoes 1kg", description: "Cleaned, smooth-skinned potatoes", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&h=400&q=60", price: 38, mrp: 45, unit: "1 kg", stock: 72, rating: 4.5, eta: "20–30 min" },
  { service: "Grocery", category: "vegetables", name: "Green Capsicum 500g", description: "Crisp bell peppers", imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=400&h=400&q=60", price: 45, mrp: 55, unit: "500 g", stock: 38, rating: 4.4, eta: "20–30 min" },
  { service: "Grocery", category: "atta", name: "Aashirvaad Atta 5kg", description: "Whole wheat chakki atta", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=400&q=60", price: 265, mrp: 290, unit: "5 kg", stock: 26, rating: 4.7, eta: "25–35 min" },
  { service: "Grocery", category: "rice", name: "India Gate Basmati Rice 1kg", description: "Extra-long grain, aged basmati", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&h=400&q=60", price: 105, mrp: 125, unit: "1 kg", stock: 44, rating: 4.6, eta: "25–35 min" },
  { service: "Grocery", category: "oil", name: "Saffola Gold Oil 1L", description: "Blended refined cooking oil", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&h=400&q=60", price: 155, mrp: 170, unit: "1 L", stock: 52, rating: 4.5, eta: "25–35 min" },
  { service: "Grocery", category: "spices", name: "Tata Salt 1kg", description: "Iodised everyday table salt", imageUrl: "https://images.unsplash.com/photo-1518111962119-67f32b4a66a1?auto=format&fit=crop&w=400&h=400&q=60", price: 28, mrp: 30, unit: "1 kg", stock: 90, rating: 4.8, eta: "25–35 min" },
  { service: "Grocery", category: "snacks", name: "Yellow Chips Pack (x3)", description: "Crispy lightly-salted potato chips", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&h=400&q=60", price: 90, mrp: 105, unit: "3 x 70 g", stock: 55, rating: 4.4, eta: "20–30 min" },
  { service: "Grocery", category: "biscuits", name: "Nice Biscuit Family Pack", description: "Classic sweet biscuits", imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&h=400&q=60", price: 25, mrp: 30, unit: "200 g", stock: 80, rating: 4.3, eta: "20–30 min" },
  { service: "Grocery", category: "beverages", name: "Red Label Tea 250g", description: "Strong, everyday CTC tea", imageUrl: "https://images.unsplash.com/photo-1563826896634-7d65f2d8e4a2?auto=format&fit=crop&w=400&h=400&q=60", price: 145, mrp: 160, unit: "250 g", stock: 47, rating: 4.7, eta: "25–35 min" },
  { service: "Grocery", category: "beverages", name: "Bru Instant Coffee 200g", description: "Rich, aromatic instant coffee", imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=400&h=400&q=60", price: 295, mrp: 330, unit: "200 g", stock: 30, rating: 4.6, eta: "25–35 min" },
  { service: "Grocery", category: "frozen", name: "Vanilla Ice Cream 700ml", description: "Creamy family-pack vanilla", imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&h=400&q=60", price: 210, mrp: 240, unit: "700 ml", stock: 22, rating: 4.7, eta: "25–35 min" },
  { service: "Grocery", category: "bakery", name: "Soft Sandwich Bread 400g", description: "Fresh everyday bread", imageUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&h=400&q=60", price: 45, mrp: 50, unit: "400 g", stock: 46, rating: 4.5, eta: "20–30 min" },
  { service: "Grocery", category: "cleaning", name: "Surf Excel Detergent 1kg", description: "Machine and bucket wash", imageUrl: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&h=400&q=60", price: 185, mrp: 205, unit: "1 kg", stock: 34, rating: 4.4, eta: "25–35 min" },
  { service: "Grocery", category: "personal", name: "Colgate Toothpaste 150g", description: "Complete protection, mint", imageUrl: "https://images.unsplash.com/photo-1593526612750-6d2f2e63d83f?auto=format&fit=crop&w=400&h=400&q=60", price: 89, mrp: 98, unit: "150 g", stock: 48, rating: 4.6, eta: "25–35 min" },
  { service: "Grocery", category: "personal", name: "Dove Soap (3 pack)", description: "Moisturising bath bars", imageUrl: "https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?auto=format&fit=crop&w=400&h=400&q=60", price: 165, mrp: 190, unit: "3 x 100 g", stock: 36, rating: 4.5, eta: "25–35 min" },

  // --- Vegetables --------------------------------------------------
  { service: "Vegetables", category: "leafy", name: "Palak (Spinach) Bunch", description: "Fresh, tender spinach leaves", imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=60", price: 22, mrp: 28, unit: "1 bunch", stock: 40, rating: 4.5, eta: "20–30 min" },
  { service: "Vegetables", category: "leafy", name: "Coriander Bunch", description: "Aromatic fresh coriander", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=60", price: 18, mrp: 25, unit: "1 bunch", stock: 50, rating: 4.4, eta: "20–30 min" },
  { service: "Vegetables", category: "root", name: "New Potatoes 1kg", description: "Cleaned fresh potatoes", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&h=400&q=60", price: 35, mrp: 42, unit: "1 kg", stock: 68, rating: 4.5, eta: "20–30 min" },
  { service: "Vegetables", category: "root", name: "Carrots 500g", description: "Sweet, crunchy orange carrots", imageUrl: "https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=400&h=400&q=60", price: 32, mrp: 40, unit: "500 g", stock: 55, rating: 4.5, eta: "20–30 min" },
  { service: "Vegetables", category: "root", name: "Beetroot 500g", description: "Deep red, farm-fresh beetroot", imageUrl: "https://images.unsplash.com/photo-1592624628591-9a1a6b50e86c?auto=format&fit=crop&w=400&h=400&q=60", price: 28, mrp: 35, unit: "500 g", stock: 38, rating: 4.4, eta: "20–30 min" },
  { service: "Vegetables", category: "root", name: "White Radish 500g", description: "Crisp, mild white radish", imageUrl: "https://images.unsplash.com/photo-1592317891702-c6453a10d7dd?auto=format&fit=crop&w=400&h=400&q=60", price: 24, mrp: 30, unit: "500 g", stock: 42, rating: 4.3, eta: "20–30 min" },
  { service: "Vegetables", category: "fruits", name: "Papaya 1kg", description: "Sweet, ripe papaya", imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&h=400&q=60", price: 55, mrp: 70, unit: "1 kg", stock: 33, rating: 4.5, eta: "20–30 min" },
  { service: "Vegetables", category: "fruits", name: "Nagpur Oranges 1kg", description: "Juicy, tangy-sweet oranges", imageUrl: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=400&h=400&q=60", price: 88, mrp: 110, unit: "1 kg", stock: 45, rating: 4.6, eta: "20–30 min" },
  { service: "Vegetables", category: "exotic", name: "Broccoli 1 pc", description: "Firm green florets", imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&h=400&q=60", price: 75, mrp: 95, unit: "1 pc", stock: 20, rating: 4.5, eta: "20–30 min" },
  { service: "Vegetables", category: "exotic", name: "White Mushrooms 200g", description: "Clean, fresh button mushrooms", imageUrl: "https://images.unsplash.com/photo-1504545102547-36d8d94e3138?auto=format&fit=crop&w=400&h=400&q=60", price: 45, mrp: 55, unit: "200 g", stock: 26, rating: 4.5, eta: "20–30 min" },
  { service: "Vegetables", category: "exotic", name: "Baby Corn 200g", description: "Tender mini corn cobs", imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&h=400&q=60", price: 50, mrp: 60, unit: "200 g", stock: 24, rating: 4.3, eta: "20–30 min" },
  { service: "Vegetables", category: "herbs", name: "Mint Leaves 100g", description: "Fragrant fresh mint", imageUrl: "https://images.unsplash.com/photo-1628556146937-cd535d7e6d0a?auto=format&fit=crop&w=400&h=400&q=60", price: 25, mrp: 35, unit: "100 g", stock: 30, rating: 4.4, eta: "20–30 min" },

  // --- Mart ---------------------------------------------------------
  { service: "Mart", category: "electronics", name: "LED Bulb 9W (Cool White)", description: "Energy-saving b22 bulb", imageUrl: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=400&h=400&q=60", price: 99, mrp: 130, unit: "1 pc", stock: 60, rating: 4.4, eta: "15–25 min" },
  { service: "Mart", category: "electronics", name: "USB Type-C Cable 1m", description: "Fast-charging braided cable", imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&h=400&q=60", price: 149, mrp: 199, unit: "1 m", stock: 42, rating: 4.3, eta: "15–25 min" },
  { service: "Mart", category: "cleaning", name: "Vim Dishwash Gel 500ml", description: "Lemon-scented dish liquid", imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&h=400&q=60", price: 68, mrp: 80, unit: "500 ml", stock: 54, rating: 4.5, eta: "15–25 min" },
  { service: "Mart", category: "cleaning", name: "Domex Floor Cleaner 1L", description: "Disinfectant floor liquid", imageUrl: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&h=400&q=60", price: 98, mrp: 115, unit: "1 L", stock: 46, rating: 4.4, eta: "15–25 min" },
  { service: "Mart", category: "personal", name: "Head & Shoulders Shampoo 100ml", description: "Anti-dandruff shampoo", imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&h=400&q=60", price: 99, mrp: 125, unit: "100 ml", stock: 39, rating: 4.5, eta: "15–25 min" },
  { service: "Mart", category: "beauty", name: "Nivea Creme 100ml", description: "Classic moisturising cream", imageUrl: "https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?auto=format&fit=crop&w=400&h=400&q=60", price: 120, mrp: 140, unit: "100 ml", stock: 35, rating: 4.6, eta: "15–25 min" },
  { service: "Mart", category: "stationery", name: "Notebook A5 (192 pages)", description: "Single-line ruled notebook", imageUrl: "https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?auto=format&fit=crop&w=400&h=400&q=60", price: 35, mrp: 45, unit: "1 pc", stock: 80, rating: 4.4, eta: "15–25 min" },
  { service: "Mart", category: "kitchen", name: "Stainless Kadai 24cm", description: "Deep round cooking kadai with lid", imageUrl: "https://images.unsplash.com/photo-1584990347449-a2bd5faf04ec?auto=format&fit=crop&w=400&h=400&q=60", price: 549, mrp: 699, unit: "24 cm", stock: 14, rating: 4.5, eta: "15–25 min" },
  { service: "Mart", category: "homeEssentials", name: "Cotton Towel Set (2 pc)", description: "Soft absorbent bath towels", imageUrl: "https://images.unsplash.com/photo-1583845112203-29329902332e?auto=format&fit=crop&w=400&h=400&q=60", price: 249, mrp: 320, unit: "2 pc", stock: 28, rating: 4.4, eta: "15–25 min" },
  { service: "Mart", category: "baby", name: "Pampers Pants (M, 30 ct)", description: "Soft diaper pants, size M", imageUrl: "https://images.unsplash.com/photo-1591025216179-8297f335e9a0?auto=format&fit=crop&w=400&h=400&q=60", price: 299, mrp: 359, unit: "30 ct", stock: 26, rating: 4.7, eta: "15–25 min" },
  { service: "Mart", category: "pet", name: "Dog Food Dry 1kg", description: "Complete adult dog nutrition", imageUrl: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=400&h=400&q=60", price: 310, mrp: 350, unit: "1 kg", stock: 22, rating: 4.4, eta: "15–25 min" },

  // --- Medicine ------------------------------------------------------
  // Seeds alongside the store catalog and joins the shared GoCart Store cart.
  // `category` keys align 1:1 with the customer app's medicine subcategory
  // strip; `prescriptionRequired: true` marks Rx-only medicines that the
  // store-order flow delivers only against a valid prescription attestation.
  { service: "Medicine", category: "prescription-medicines", name: "Amoxicillin 500 mg Capsules", description: "Broad-spectrum antibiotic capsules", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=60", price: 86, mrp: 98, unit: "Strip of 10", stock: 45, rating: 4.7, eta: "15–25 min", prescriptionRequired: true },
  { service: "Medicine", category: "prescription-medicines", name: "Azithromycin 500 mg Tablets", description: "One-a-day antibiotic tablets", imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=400&h=400&q=60", price: 112, mrp: 130, unit: "Strip of 5", stock: 40, rating: 4.6, eta: "15–25 min", prescriptionRequired: true },
  { service: "Medicine", category: "prescription-medicines", name: "Diclofenac Sodium 50 mg Tablets", description: "Pain-relief tablets for inflammation", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&h=400&q=60", price: 34, mrp: 40, unit: "Strip of 10", stock: 60, rating: 4.5, eta: "15–25 min", prescriptionRequired: true },
  { service: "Medicine", category: "pain-relief", name: "Paracetamol 500 mg Tablets", description: "Fever and body-pain relief tablets", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=60", price: 32, mrp: 38, unit: "Strip of 15", stock: 90, rating: 4.8, eta: "15–25 min" },
  { service: "Medicine", category: "pain-relief", name: "Ibuprofen 400 mg Tablets", description: "Anti-inflammatory pain tablets", imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=400&h=400&q=60", price: 42, mrp: 50, unit: "Strip of 10", stock: 55, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "pain-relief", name: "Combiflam Tablets (400/325 mg)", description: "Pain and fever relief combination", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&h=400&q=60", price: 38, mrp: 45, unit: "Strip of 10", stock: 62, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "pain-relief", name: "Volini Pain Relief Gel 50g", description: "Fast-acting topical pain-relief gel", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&h=400&q=60", price: 128, mrp: 148, unit: "50 g", stock: 48, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "pain-relief", name: "Moov Pain Relief Spray 60g", description: "Spray-on relief for muscle and joint pain", imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=400&h=400&q=60", price: 145, mrp: 165, unit: "60 g", stock: 32, rating: 4.4, eta: "15–25 min" },
  { service: "Medicine", category: "cold-flu", name: "Cetirizine 10 mg Tablets", description: "Allergy and cold-relief tablets", imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=400&h=400&q=60", price: 22, mrp: 26, unit: "Strip of 10", stock: 75, rating: 4.7, eta: "15–25 min" },
  { service: "Medicine", category: "cold-flu", name: "Cough Relief Syrup 100 ml", description: "Soothing syrup for dry cough", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&h=400&q=60", price: 78, mrp: 92, unit: "100 ml", stock: 40, rating: 4.4, eta: "15–25 min" },
  { service: "Medicine", category: "cold-flu", name: "Vicks VapoRub 50g", description: "Chest rub for cold and blocked nose", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=60", price: 145, mrp: 165, unit: "50 g", stock: 36, rating: 4.7, eta: "15–25 min" },
  { service: "Medicine", category: "cold-flu", name: "Vicks Vaporizer Liquid 100 ml", description: "Room vaporizer refill for easy breathing", imageUrl: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=400&h=400&q=60", price: 95, mrp: 110, unit: "100 ml", stock: 28, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "cold-flu", name: "Sore Throat Lozenges 12s", description: "Menthol lozenges for throat relief", imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=400&h=400&q=60", price: 55, mrp: 65, unit: "12 ct", stock: 50, rating: 4.4, eta: "15–25 min" },
  { service: "Medicine", category: "vitamins-supplements", name: "Limcee Vitamin C 500 mg", description: "Chewable vitamin C tablets", imageUrl: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?auto=format&fit=crop&w=400&h=400&q=60", price: 52, mrp: 60, unit: "15 tablets", stock: 70, rating: 4.7, eta: "15–25 min" },
  { service: "Medicine", category: "vitamins-supplements", name: "Zincovit Multivitamin Tablets", description: "Daily multivitamin plus zinc", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&h=400&q=60", price: 98, mrp: 115, unit: "Strip of 10", stock: 58, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "vitamins-supplements", name: "Neurobion Forte B-Complex", description: "B-vitamin energy support tablets", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&h=400&q=60", price: 75, mrp: 88, unit: "Strip of 10", stock: 44, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "vitamins-supplements", name: "Omega-3 Fish Oil Capsules 30s", description: "Heart-health omega-3 supplement", imageUrl: "https://images.unsplash.com/photo-1584989952231-c89f1713ec9a?auto=format&fit=crop&w=400&h=400&q=60", price: 320, mrp: 380, unit: "30 capsules", stock: 26, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "vitamins-supplements", name: "Calcium + Vitamin D3 Tablets", description: "Bone-health calcium tablets", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&h=400&q=60", price: 108, mrp: 125, unit: "Strip of 15", stock: 38, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "diabetes-care", name: "Accu-Chek Active Test Strips", description: "Blood glucose test strips", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&h=400&q=60", price: 585, mrp: 650, unit: "25 strips", stock: 30, rating: 4.7, eta: "15–25 min" },
  { service: "Medicine", category: "diabetes-care", name: "Metformin 500 mg Tablets", description: "Blood-sugar control tablets", imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=400&h=400&q=60", price: 48, mrp: 58, unit: "Strip of 20", stock: 66, rating: 4.7, eta: "15–25 min", prescriptionRequired: true },
  { service: "Medicine", category: "diabetes-care", name: "Glimepiride 1 mg Tablets", description: "Blood-sugar management tablets", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=60", price: 52, mrp: 60, unit: "Strip of 10", stock: 54, rating: 4.6, eta: "15–25 min", prescriptionRequired: true },
  { service: "Medicine", category: "diabetes-care", name: "One Touch Glucometer Kit", description: "Complete blood-glucose monitoring kit", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&h=400&q=60", price: 799, mrp: 950, unit: "1 kit", stock: 18, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "personal-care", name: "Dettol Antiseptic Liquid 250 ml", description: "Germ-protection antiseptic liquid", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&h=400&q=60", price: 145, mrp: 165, unit: "250 ml", stock: 42, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "personal-care", name: "Savlon Antiseptic Liquid 450 ml", description: "Everyday antiseptic liquid", imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=400&h=400&q=60", price: 185, mrp: 210, unit: "450 ml", stock: 34, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "personal-care", name: "Electral ORS Powder 5 sachets", description: "Oral rehydration salts, lemon flavour", imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=400&h=400&q=60", price: 45, mrp: 52, unit: "5 x 21.8 g", stock: 60, rating: 4.7, eta: "15–25 min" },
  { service: "Medicine", category: "personal-care", name: "Iodex Pain Balm 30g", description: "Warming balm for muscle and joint pain", imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=400&h=400&q=60", price: 68, mrp: 78, unit: "30 g", stock: 38, rating: 4.4, eta: "15–25 min" },
  { service: "Medicine", category: "baby-care", name: "Calamine Lotion 100 ml", description: "Gentle skin-soothing lotion", imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=400&h=400&q=60", price: 95, mrp: 110, unit: "100 ml", stock: 28, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "baby-care", name: "Himalaya Baby Wipes 72 ct", description: "Soft, hypoallergenic baby wipes", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&h=400&q=60", price: 185, mrp: 210, unit: "72 ct", stock: 34, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "baby-care", name: "Gripe Water 100 ml", description: "Digestive comfort for infants", imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=400&h=400&q=60", price: 85, mrp: 98, unit: "100 ml", stock: 26, rating: 4.4, eta: "15–25 min" },
  { service: "Medicine", category: "baby-care", name: "Baby Diaper Pants (M) 28 ct", description: "Soft, leak-proof diaper pants", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=60", price: 349, mrp: 399, unit: "28 ct", stock: 32, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "first-aid", name: "Band-Aid Assorted 20s", description: "Washproof assorted plasters", imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=400&h=400&q=60", price: 58, mrp: 68, unit: "20 ct", stock: 64, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "first-aid", name: "Sterile Gauze Roll 4\" x 4 m", description: "Sterile absorbent gauze for dressing", imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=400&h=400&q=60", price: 42, mrp: 50, unit: "1 roll", stock: 48, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "first-aid", name: "Micropore Tape 1\"", description: "Gentle surgical tape for dressings", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=60", price: 48, mrp: 56, unit: "1 roll", stock: 42, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "first-aid", name: "Betadine Solution 50 ml", description: "Antiseptic solution for wounds", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&h=400&q=60", price: 105, mrp: 120, unit: "50 ml", stock: 30, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "first-aid", name: "Family First Aid Kit", description: "Complete home first-aid box", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&h=400&q=60", price: 399, mrp: 475, unit: "1 kit", stock: 16, rating: 4.5, eta: "15–25 min" },
  { service: "Medicine", category: "healthcare-devices", name: "Digital Thermometer", description: "Fast-read digital thermometer", imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=400&h=400&q=60", price: 145, mrp: 175, unit: "1 pc", stock: 50, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "healthcare-devices", name: "Pulse Oximeter Finger", description: "SpO2 and pulse-rate fingertip monitor", imageUrl: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?auto=format&fit=crop&w=400&h=400&q=60", price: 499, mrp: 650, unit: "1 pc", stock: 24, rating: 4.6, eta: "15–25 min" },
  { service: "Medicine", category: "healthcare-devices", name: "Upper Arm BP Monitor", description: "Accurate blood-pressure monitor", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&h=400&q=60", price: 1490, mrp: 1790, unit: "1 pc", stock: 14, rating: 4.7, eta: "15–25 min" },
  { service: "Medicine", category: "healthcare-devices", name: "Nebulizer Machine with Mask", description: "Kid-safe compressor nebulizer kit", imageUrl: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=400&h=400&q=60", price: 1390, mrp: 1690, unit: "1 kit", stock: 12, rating: 4.6, eta: "15–25 min" },
];
