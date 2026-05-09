const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets, phones, laptops, TVs and smart home devices',
    icon: '💻',
    color: '#1d4ed8',
    image: '',
    sortOrder: 1,
    isActive: true,
    subcategories: [
      {
        name: 'Mobile',
        slug: 'mobile',
        subSubcategories: [
          { name: 'Smartphones', slug: 'smartphones' },
          { name: 'Feature Phones', slug: 'feature-phones' },
        ],
      },
      {
        name: 'Laptops & Computers',
        slug: 'laptops-computers',
        subSubcategories: [
          { name: 'Laptops', slug: 'laptops' },
          { name: 'Desktops', slug: 'desktops' },
        ],
      },
      {
        name: 'TV & Audio',
        slug: 'tv-audio',
        subSubcategories: [
          { name: 'Smart TVs', slug: 'smart-tvs' },
          { name: 'Speakers & Soundbars', slug: 'speakers-soundbars' },
        ],
      },
      {
        name: 'Cameras',
        slug: 'cameras',
        subSubcategories: [
          { name: 'DSLR & Mirrorless', slug: 'dslr-mirrorless' },
          { name: 'Action Cameras', slug: 'action-cameras' },
        ],
      },
    ],
  },

  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Shoes, sandals and boots for every occasion',
    icon: '👟',
    color: '#7c3aed',
    image: '',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      {
        name: "Men's Shoes",
        slug: 'mens-shoes',
        subSubcategories: [
          { name: 'Formal', slug: 'formal' },
          { name: 'Casual', slug: 'casual' },
        ],
      },
      {
        name: "Women's Shoes",
        slug: 'womens-shoes',
        subSubcategories: [
          { name: 'Heels', slug: 'heels' },
          { name: 'Flats', slug: 'flats' },
        ],
      },
      {
        name: "Kids' Shoes",
        slug: 'kids-shoes',
        subSubcategories: [
          { name: 'Boys', slug: 'boys-shoes' },
          { name: 'Girls', slug: 'girls-shoes' },
        ],
      },
      {
        name: 'Sports Shoes',
        slug: 'sports-shoes',
        subSubcategories: [
          { name: 'Running', slug: 'running' },
          { name: 'Training', slug: 'training' },
        ],
      },
    ],
  },

  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion for men, women and kids — everyday wear to formal',
    icon: '👗',
    color: '#be185d',
    image: '',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      {
        name: 'Men',
        slug: 'men',
        subSubcategories: [
          { name: 'T-Shirts & Polos', slug: 't-shirts-polos' },
          { name: 'Shirts', slug: 'shirts' },
        ],
      },
      {
        name: 'Women',
        slug: 'women',
        subSubcategories: [
          { name: 'Lawn Suits', slug: 'lawn-suits' },
          { name: 'Dresses', slug: 'dresses' },
        ],
      },
      {
        name: 'Kids',
        slug: 'kids',
        subSubcategories: [
          { name: 'Boys', slug: 'boys-clothing' },
          { name: 'Girls', slug: 'girls-clothing' },
        ],
      },
      {
        name: 'Traditional Wear',
        slug: 'traditional-wear',
        subSubcategories: [
          { name: 'Shalwar Kameez', slug: 'shalwar-kameez' },
          { name: 'Sherwani', slug: 'sherwani' },
        ],
      },
    ],
  },

  {
    name: 'Household',
    slug: 'household',
    description: 'Everything for your home — kitchen, bedroom and living spaces',
    icon: '🏠',
    color: '#d97706',
    image: '',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      {
        name: 'Kitchen & Dining',
        slug: 'kitchen-dining',
        subSubcategories: [
          { name: 'Cookware', slug: 'cookware' },
          { name: 'Storage & Containers', slug: 'storage-containers' },
        ],
      },
      {
        name: 'Bedroom',
        slug: 'bedroom',
        subSubcategories: [
          { name: 'Pillows & Mattresses', slug: 'pillows-mattresses' },
          { name: 'Bedsheets & Covers', slug: 'bedsheets-covers' },
        ],
      },
      {
        name: 'Living Room',
        slug: 'living-room',
        subSubcategories: [
          { name: 'Decor', slug: 'decor' },
          { name: 'Curtains & Blinds', slug: 'curtains-blinds' },
        ],
      },
      {
        name: 'Bathroom',
        slug: 'bathroom',
        subSubcategories: [
          { name: 'Towels & Mats', slug: 'towels-mats' },
          { name: 'Accessories', slug: 'bathroom-accessories' },
        ],
      },
    ],
  },

  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    description: 'Skincare, haircare, cosmetics and wellness supplements',
    icon: '💊',
    color: '#059669',
    image: '',
    sortOrder: 5,
    isActive: true,
    subcategories: [
      {
        name: 'Skincare',
        slug: 'skincare',
        subSubcategories: [
          { name: 'Face Wash & Cleanser', slug: 'face-wash' },
          { name: 'Moisturizer & Serum', slug: 'moisturizer-serum' },
        ],
      },
      {
        name: 'Haircare',
        slug: 'haircare',
        subSubcategories: [
          { name: 'Shampoo & Conditioner', slug: 'shampoo-conditioner' },
          { name: 'Hair Treatments', slug: 'hair-treatments' },
        ],
      },
      {
        name: 'Makeup & Cosmetics',
        slug: 'makeup-cosmetics',
        subSubcategories: [
          { name: 'Foundation & Concealer', slug: 'foundation-concealer' },
          { name: 'Lipstick & Gloss', slug: 'lipstick-gloss' },
        ],
      },
      {
        name: 'Vitamins & Supplements',
        slug: 'vitamins-supplements',
        subSubcategories: [
          { name: 'Multivitamins', slug: 'multivitamins' },
          { name: 'Protein & Fitness', slug: 'protein-fitness' },
        ],
      },
    ],
  },

  {
    name: 'Groceries',
    slug: 'groceries',
    description: 'Fresh produce, dairy, beverages and pantry essentials',
    icon: '🛒',
    color: '#16a34a',
    image: '',
    sortOrder: 6,
    isActive: true,
    subcategories: [
      {
        name: 'Fruits & Vegetables',
        slug: 'fruits-vegetables',
        subSubcategories: [
          { name: 'Fresh Fruits', slug: 'fresh-fruits' },
          { name: 'Fresh Vegetables', slug: 'fresh-vegetables' },
        ],
      },
      {
        name: 'Dairy & Eggs',
        slug: 'dairy-eggs',
        subSubcategories: [
          { name: 'Milk & Cream', slug: 'milk-cream' },
          { name: 'Cheese & Butter', slug: 'cheese-butter' },
        ],
      },
      {
        name: 'Beverages',
        slug: 'beverages',
        subSubcategories: [
          { name: 'Juices & Drinks', slug: 'juices-drinks' },
          { name: 'Tea & Coffee', slug: 'tea-coffee' },
        ],
      },
      {
        name: 'Snacks & Bakery',
        slug: 'snacks-bakery',
        subSubcategories: [
          { name: 'Chips & Crackers', slug: 'chips-crackers' },
          { name: 'Rice, Wheat & Grains', slug: 'rice-wheat-grains' },
        ],
      },
    ],
  },

  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Fitness equipment, camping gear, cycling and outdoor sports',
    icon: '⚽',
    color: '#0891b2',
    image: '',
    sortOrder: 7,
    isActive: true,
    subcategories: [
      {
        name: 'Fitness Equipment',
        slug: 'fitness-equipment',
        subSubcategories: [
          { name: 'Weights & Dumbbells', slug: 'weights-dumbbells' },
          { name: 'Cardio Machines', slug: 'cardio-machines' },
        ],
      },
      {
        name: 'Camping & Hiking',
        slug: 'camping-hiking',
        subSubcategories: [
          { name: 'Tents & Sleeping Bags', slug: 'tents-sleeping-bags' },
          { name: 'Backpacks & Gear', slug: 'backpacks-gear' },
        ],
      },
      {
        name: 'Cycling',
        slug: 'cycling',
        subSubcategories: [
          { name: 'Bicycles', slug: 'bicycles' },
          { name: 'Accessories', slug: 'cycling-accessories' },
        ],
      },
      {
        name: 'Water Sports',
        slug: 'water-sports',
        subSubcategories: [
          { name: 'Swimming', slug: 'swimming' },
          { name: 'Water Polo', slug: 'water-polo' },
        ],
      },
    ],
  },

  {
    name: 'Toys & Kids',
    slug: 'toys-kids',
    description: 'Educational toys, games and baby essentials for little ones',
    icon: '🧸',
    color: '#f59e0b',
    image: '',
    sortOrder: 8,
    isActive: true,
    subcategories: [
      {
        name: 'Educational Toys',
        slug: 'educational-toys',
        subSubcategories: [
          { name: 'STEM & Science', slug: 'stem-science' },
          { name: 'Puzzles', slug: 'puzzles' },
        ],
      },
      {
        name: 'Action Figures',
        slug: 'action-figures',
        subSubcategories: [
          { name: 'Cars & Vehicles', slug: 'cars-vehicles' },
          { name: 'Superheroes', slug: 'superheroes' },
        ],
      },
      {
        name: 'Board Games',
        slug: 'board-games',
        subSubcategories: [
          { name: 'Strategy Games', slug: 'strategy-games' },
          { name: 'Family Games', slug: 'family-games' },
        ],
      },
      {
        name: 'Baby Essentials',
        slug: 'baby-essentials',
        subSubcategories: [
          { name: 'Feeding & Nursing', slug: 'feeding-nursing' },
          { name: 'Baby Gear', slug: 'baby-gear' },
        ],
      },
    ],
  },

  {
    name: 'Books & Stationery',
    slug: 'books-stationery',
    description: 'Books, office supplies, art materials and school essentials',
    icon: '📚',
    color: '#6d28d9',
    image: '',
    sortOrder: 9,
    isActive: true,
    subcategories: [
      {
        name: 'Books',
        slug: 'books',
        subSubcategories: [
          { name: 'Fiction', slug: 'fiction' },
          { name: 'Non-Fiction', slug: 'non-fiction' },
        ],
      },
      {
        name: 'Office Supplies',
        slug: 'office-supplies',
        subSubcategories: [
          { name: 'Pens & Markers', slug: 'pens-markers' },
          { name: 'Notebooks & Diaries', slug: 'notebooks-diaries' },
        ],
      },
      {
        name: 'Art Materials',
        slug: 'art-materials',
        subSubcategories: [
          { name: 'Colour Pencils & Paints', slug: 'colour-pencils-paints' },
          { name: 'Canvases & Brushes', slug: 'canvases-brushes' },
        ],
      },
      {
        name: 'School Supplies',
        slug: 'school-supplies',
        subSubcategories: [
          { name: 'Bags & Backpacks', slug: 'bags-backpacks' },
          { name: 'Geometry & Instruments', slug: 'geometry-instruments' },
        ],
      },
    ],
  },

  {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car accessories, tools, care products and spare parts',
    icon: '🚗',
    color: '#374151',
    image: '',
    sortOrder: 10,
    isActive: true,
    subcategories: [
      {
        name: 'Car Electronics',
        slug: 'car-electronics',
        subSubcategories: [
          { name: 'Dash Cameras', slug: 'dash-cameras' },
          { name: 'Car Audio', slug: 'car-audio' },
        ],
      },
      {
        name: 'Car Care',
        slug: 'car-care',
        subSubcategories: [
          { name: 'Cleaners & Polish', slug: 'cleaners-polish' },
          { name: 'Vacuum Cleaners', slug: 'vacuum-cleaners' },
        ],
      },
      {
        name: 'Tools & Equipment',
        slug: 'tools-equipment',
        subSubcategories: [
          { name: 'Hand Tools', slug: 'hand-tools' },
          { name: 'Power Tools', slug: 'power-tools' },
        ],
      },
      {
        name: 'Spare Parts',
        slug: 'spare-parts',
        subSubcategories: [
          { name: 'Filters & Fluids', slug: 'filters-fluids' },
          { name: 'Tyres & Rims', slug: 'tyres-rims' },
        ],
      },
    ],
  },
];

export default categories;
