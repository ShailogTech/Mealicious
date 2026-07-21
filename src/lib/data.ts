export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDesc: string
  price: number
  salePrice?: number
  images: string[]
  category: string
  categorySlug: string
  variants: { type: string; options: string[] }[]
  tags: string[]
  nutrition: { calories: string; protein: string; fat: string; carbs: string; fiber: string }
  stock: number
  sku: string
  gstPct?: number // GST slab % (5/12/18). Prices are GST-inclusive; this drives breakdown display.
  featured: boolean
  bestSeller: boolean
  isNew: boolean
  rating: number
  reviewCount: number
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  icon: string
  description: string
  productCount: number
}

export interface Review {
  id: string
  userName: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  image: string
  author: string
  date: string
  category: string
  readTime: string
}

export interface Testimonial {
  id: string
  name: string
  location: string
  comment: string
  rating: number
  avatar: string
}

export const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Premium Cashews',
    slug: 'cashews',
    image: '/images/products/cashews-premium.png',
    icon: 'Nut',
    description: 'Handpicked premium quality cashews from the finest farms',
    productCount: 8,
  },
  {
    id: 'cat-2',
    name: 'Almonds',
    slug: 'almonds',
    image: '/images/products/almonds-premium.png',
    icon: 'Nut',
    description: 'California grown almonds, roasted to perfection',
    productCount: 6,
  },
  {
    id: 'cat-3',
    name: 'Mixed Trail Mix',
    slug: 'trail-mix',
    image: '/images/products/trail-mix.png',
    icon: 'Soup',
    description: 'Perfect blend of nuts, seeds, and dried fruits',
    productCount: 5,
  },
  {
    id: 'cat-4',
    name: 'Dried Fruits',
    slug: 'dried-fruits',
    image: '/images/products/dried-fruits.png',
    icon: 'Grape',
    description: 'Sun-dried premium fruits with no added sugar',
    productCount: 7,
  },
  {
    id: 'cat-5',
    name: 'Flavored Nuts',
    slug: 'flavored-nuts',
    image: '/images/products/peri-peri-cashews.png',
    icon: 'Flame',
    description: 'Exciting flavors to tickle your taste buds',
    productCount: 6,
  },
  {
    id: 'cat-6',
    name: 'Seeds & Berries',
    slug: 'seeds-berries',
    image: '/images/products/seeds-mix.png',
    icon: 'Cherry',
    description: 'Superfood seeds and antioxidant-rich berries',
    productCount: 5,
  },
  {
    id: 'cat-7',
    name: 'Combo Packs',
    slug: 'combo-packs',
    image: '/images/products/combo-pack.png',
    icon: 'Gift',
    description: 'Curated gift packs and value combos',
    productCount: 4,
  },
  {
    id: 'cat-8',
    name: 'Healthy Snacks',
    slug: 'healthy-snacks',
    image: '/images/products/makhana.png',
    icon: 'Salad',
    description: 'Guilt-free snacking options for health-conscious',
    productCount: 5,
  },
]

export const products: Product[] = [
  // Cashews
  {
    id: 'prod-1',
    name: 'Premium Whole Cashews W240',
    slug: 'premium-whole-cashews-w240',
    description: 'Our flagship product - Premium W240 grade whole cashews, carefully selected for their large size and creamy texture. These cashews are gently roasted to bring out their natural buttery flavor. Perfect for snacking, cooking, or gifting. Sourced directly from the finest farms in Goa and Karnataka, every batch is quality-checked to ensure you get only the best.',
    shortDesc: 'Premium grade W240 whole cashews, roasted to perfection',
    price: 599,
    salePrice: 499,
    images: [
      '/images/products/cashews-premium.png',
      '/images/products/honey-cashews-pistachios.png',
    ],
    category: 'Premium Cashews',
    categorySlug: 'cashews',
    variants: [
      { type: 'Weight', options: ['250g', '500g', '1kg'] },
      { type: 'Flavor', options: ['Plain Roasted', 'Salted', 'Black Pepper', 'Peri Peri'] },
    ],
    tags: ['bestseller', 'premium', 'roasted'],
    nutrition: { calories: '553 kcal', protein: '18g', fat: '44g', carbs: '30g', fiber: '3g' },
    stock: 150,
    sku: 'MC-CW240-001',
    featured: true,
    bestSeller: true,
    isNew: false,
    rating: 4.8,
    reviewCount: 234,
  },
  {
    id: 'prod-2',
    name: 'Cashew Split K 320',
    slug: 'cashew-split-k320',
    description: 'High-quality K320 split cashews, ideal for cooking and making rich gravies. These split cashews blend perfectly into Indian cuisine, adding creaminess and nutrition to your dishes. A staple in every kitchen for making kormas, curries, and desserts.',
    shortDesc: 'K320 split cashews perfect for cooking and gravies',
    price: 499,
    salePrice: 399,
    images: [
      '/images/products/cashews-premium.png',
      '/images/products/honey-cashews-pistachios.png',
    ],
    category: 'Premium Cashews',
    categorySlug: 'cashews',
    variants: [
      { type: 'Weight', options: ['250g', '500g', '1kg'] },
    ],
    tags: ['cooking', 'value-pack'],
    nutrition: { calories: '553 kcal', protein: '18g', fat: '44g', carbs: '30g', fiber: '3g' },
    stock: 200,
    sku: 'MC-CS320-002',
    featured: false,
    bestSeller: false,
    isNew: false,
    rating: 4.5,
    reviewCount: 156,
  },
  {
    id: 'prod-3',
    name: 'Honey Roasted Cashews',
    slug: 'honey-roasted-cashews',
    description: 'A delightful combination of premium cashews coated in pure honey and gently roasted to create a sweet and crunchy snack. The perfect balance of natural sweetness and nutty goodness makes these an irresistible treat for any time of day.',
    shortDesc: 'Sweet honey-coated cashews, crunchy and delicious',
    price: 649,
    salePrice: undefined,
    images: [
      '/images/products/honey-cashews-pistachios.png',
      '/images/products/cashews-premium.png',
    ],
    category: 'Premium Cashews',
    categorySlug: 'cashews',
    variants: [
      { type: 'Weight', options: ['200g', '400g'] },
    ],
    tags: ['sweet', 'snack', 'premium'],
    nutrition: { calories: '580 kcal', protein: '16g', fat: '42g', carbs: '38g', fiber: '2g' },
    stock: 80,
    sku: 'MC-HRC-003',
    featured: true,
    bestSeller: false,
    isNew: true,
    rating: 4.7,
    reviewCount: 89,
  },
  // Almonds
  {
    id: 'prod-4',
    name: 'California Almonds Premium',
    slug: 'california-almonds-premium',
    description: 'Directly sourced from California\'s finest orchards, these premium almonds are known for their large size, crunchy texture, and rich flavor. Packed with vitamin E, healthy fats, and protein, they are the perfect daily snack for a healthy lifestyle.',
    shortDesc: 'Premium California almonds, crunchy and nutritious',
    price: 699,
    salePrice: 599,
    images: [
      '/images/products/almonds-premium.png',
      '/images/products/quinoa-walnuts.png',
    ],
    category: 'Almonds',
    categorySlug: 'almonds',
    variants: [
      { type: 'Weight', options: ['250g', '500g', '1kg'] },
      { type: 'Type', options: ['Whole', 'Sliced', 'Flavored'] },
    ],
    tags: ['premium', 'daily-essentials', 'protein-rich'],
    nutrition: { calories: '579 kcal', protein: '21g', fat: '50g', carbs: '22g', fiber: '12g' },
    stock: 300,
    sku: 'MA-CAP-004',
    featured: true,
    bestSeller: true,
    isNew: false,
    rating: 4.9,
    reviewCount: 312,
  },
  {
    id: 'prod-5',
    name: 'Roasted Salted Almonds',
    slug: 'roasted-salted-almonds',
    description: 'Perfectly roasted and lightly salted almonds that make for an ideal snack. The right amount of salt enhances the natural flavor of these premium almonds without overpowering them. Great for on-the-go snacking or as a party appetizer.',
    shortDesc: 'Lightly salted roasted almonds for perfect snacking',
    price: 549,
    salePrice: undefined,
    images: [
      '/images/products/almonds-premium.png',
      '/images/products/quinoa-walnuts.png',
    ],
    category: 'Almonds',
    categorySlug: 'almonds',
    variants: [
      { type: 'Weight', options: ['200g', '400g', '800g'] },
    ],
    tags: ['snack', 'roasted', 'salted'],
    nutrition: { calories: '590 kcal', protein: '21g', fat: '51g', carbs: '22g', fiber: '11g' },
    stock: 180,
    sku: 'MA-RSA-005',
    featured: false,
    bestSeller: true,
    isNew: false,
    rating: 4.6,
    reviewCount: 198,
  },
  // Trail Mix
  {
    id: 'prod-6',
    name: 'Classic Trail Mix',
    slug: 'classic-trail-mix',
    description: 'A carefully curated blend of premium nuts, seeds, and dried fruits. Our Classic Trail Mix includes almonds, cashews, walnuts, pumpkin seeds, sunflower seeds, raisins, and cranberries. The perfect on-the-go snack packed with energy and nutrition.',
    shortDesc: 'Perfect blend of nuts, seeds & dried fruits',
    price: 449,
    salePrice: 379,
    images: [
      '/images/products/trail-mix.png',
      '/images/products/seeds-mix.png',
    ],
    category: 'Mixed Trail Mix',
    categorySlug: 'trail-mix',
    variants: [
      { type: 'Weight', options: ['200g', '400g', '750g'] },
    ],
    tags: ['energy', 'on-the-go', 'mix'],
    nutrition: { calories: '490 kcal', protein: '15g', fat: '32g', carbs: '38g', fiber: '6g' },
    stock: 220,
    sku: 'MT-CTM-006',
    featured: true,
    bestSeller: true,
    isNew: false,
    rating: 4.7,
    reviewCount: 267,
  },
  {
    id: 'prod-7',
    name: 'Protein Power Mix',
    slug: 'protein-power-mix',
    description: 'Specially formulated for fitness enthusiasts, this protein-rich mix combines almonds, peanuts, pumpkin seeds, chia seeds, and dark chocolate chips. Each serving provides a sustained energy boost with high protein content.',
    shortDesc: 'High-protein mix for fitness enthusiasts',
    price: 549,
    salePrice: undefined,
    images: [
      '/images/products/trail-mix.png',
      '/images/products/quinoa-walnuts.png',
    ],
    category: 'Mixed Trail Mix',
    categorySlug: 'trail-mix',
    variants: [
      { type: 'Weight', options: ['250g', '500g'] },
    ],
    tags: ['protein', 'fitness', 'energy'],
    nutrition: { calories: '520 kcal', protein: '22g', fat: '35g', carbs: '30g', fiber: '8g' },
    stock: 120,
    sku: 'MT-PPM-007',
    featured: false,
    bestSeller: false,
    isNew: true,
    rating: 4.5,
    reviewCount: 67,
  },
  // Dried Fruits
  {
    id: 'prod-8',
    name: 'Premium Afghan Raisins',
    slug: 'premium-afghan-raisins',
    description: 'Sun-dried to perfection in the Afghan sun, these premium green raisins are naturally sweet with no added sugar. Rich in iron, potassium, and antioxidants, they are perfect for snacking, baking, or adding to your morning cereal.',
    shortDesc: 'Naturally sweet Afghan green raisins',
    price: 349,
    salePrice: 299,
    images: [
      '/images/products/dried-fruits.png',
      '/images/products/dates-cranberries.png',
    ],
    category: 'Dried Fruits',
    categorySlug: 'dried-fruits',
    variants: [
      { type: 'Weight', options: ['250g', '500g', '1kg'] },
    ],
    tags: ['no-sugar', 'iron-rich', 'natural'],
    nutrition: { calories: '299 kcal', protein: '3g', fat: '0.5g', carbs: '79g', fiber: '4g' },
    stock: 250,
    sku: 'MD-PAR-008',
    featured: true,
    bestSeller: false,
    isNew: false,
    rating: 4.4,
    reviewCount: 145,
  },
  {
    id: 'prod-9',
    name: 'Turkish Dried Apricots',
    slug: 'turkish-dried-apricots',
    description: 'Imported directly from Turkey, these premium dried apricots are known for their vibrant color and rich, tangy-sweet flavor. Unsulphured and naturally dried, they retain maximum nutrients and taste. A rich source of vitamin A and iron.',
    shortDesc: 'Premium unsulphured Turkish apricots',
    price: 449,
    salePrice: undefined,
    images: [
      '/images/products/dried-fruits.png',
      '/images/products/dates-cranberries.png',
    ],
    category: 'Dried Fruits',
    categorySlug: 'dried-fruits',
    variants: [
      { type: 'Weight', options: ['250g', '500g'] },
    ],
    tags: ['imported', 'unsulphured', 'vitamin-a'],
    nutrition: { calories: '241 kcal', protein: '4g', fat: '0.5g', carbs: '63g', fiber: '7g' },
    stock: 100,
    sku: 'MD-TDA-009',
    featured: false,
    bestSeller: false,
    isNew: true,
    rating: 4.6,
    reviewCount: 78,
  },
  // Flavored Nuts
  {
    id: 'prod-10',
    name: 'Peri Peri Cashews',
    slug: 'peri-peri-cashews',
    description: 'Fiery and flavorful! Our Peri Peri cashews are coated with a special blend of African Peri Peri spices that deliver a zesty kick with every bite. Perfect for those who love their snacks spicy and exciting.',
    shortDesc: 'Spicy Peri Peri coated cashews',
    price: 599,
    salePrice: 499,
    images: [
      '/images/products/peri-peri-cashews.png',
      '/images/products/cashews-premium.png',
    ],
    category: 'Flavored Nuts',
    categorySlug: 'flavored-nuts',
    variants: [
      { type: 'Weight', options: ['200g', '400g'] },
      { type: 'Spice Level', options: ['Mild', 'Medium', 'Hot'] },
    ],
    tags: ['spicy', 'flavored', 'snack'],
    nutrition: { calories: '570 kcal', protein: '17g', fat: '43g', carbs: '32g', fiber: '3g' },
    stock: 90,
    sku: 'MF-PPC-010',
    featured: true,
    bestSeller: true,
    isNew: false,
    rating: 4.8,
    reviewCount: 201,
  },
  {
    id: 'prod-11',
    name: 'Chocolate Almonds',
    slug: 'chocolate-almonds',
    description: 'Premium California almonds enrobed in rich, velvety dark chocolate. The perfect marriage of crunch and cocoa, these treats are ideal for gifting, dessert toppings, or simply indulging yourself. Made with 55% dark chocolate for a sophisticated flavor profile.',
    shortDesc: 'Dark chocolate coated premium almonds',
    price: 699,
    salePrice: undefined,
    images: [
      '/images/products/chocolate-almonds.png',
      '/images/products/almonds-premium.png',
    ],
    category: 'Flavored Nuts',
    categorySlug: 'flavored-nuts',
    variants: [
      { type: 'Weight', options: ['200g', '400g'] },
      { type: 'Chocolate', options: ['Dark 55%', 'Dark 72%', 'Milk Chocolate'] },
    ],
    tags: ['chocolate', 'gifting', 'premium'],
    nutrition: { calories: '610 kcal', protein: '14g', fat: '46g', carbs: '42g', fiber: '6g' },
    stock: 70,
    sku: 'MF-CHA-011',
    featured: false,
    bestSeller: false,
    isNew: true,
    rating: 4.9,
    reviewCount: 134,
  },
  // Seeds & Berries
  {
    id: 'prod-12',
    name: 'Super Seeds Mix',
    slug: 'super-seeds-mix',
    description: 'A powerful blend of chia seeds, flax seeds, pumpkin seeds, sunflower seeds, and hemp seeds. This superfood mix is loaded with omega-3 fatty acids, protein, and fiber. Add to smoothies, salads, or yogurt for a nutritional boost.',
    shortDesc: 'Powerful blend of 5 superfood seeds',
    price: 399,
    salePrice: 349,
    images: [
      '/images/products/seeds-mix.png',
      '/images/products/trail-mix.png',
    ],
    category: 'Seeds & Berries',
    categorySlug: 'seeds-berries',
    variants: [
      { type: 'Weight', options: ['250g', '500g'] },
    ],
    tags: ['superfood', 'omega-3', 'fiber-rich'],
    nutrition: { calories: '490 kcal', protein: '24g', fat: '38g', carbs: '16g', fiber: '14g' },
    stock: 190,
    sku: 'MS-SSM-012',
    featured: false,
    bestSeller: true,
    isNew: false,
    rating: 4.6,
    reviewCount: 189,
  },
  {
    id: 'prod-13',
    name: 'Dried Cranberries',
    slug: 'dried-cranberries',
    description: 'Premium dried cranberries, lightly sweetened to balance their natural tartness. Bursting with antioxidants and vitamin C, they are perfect for salads, baking, trail mixes, or as a healthy snack on their own.',
    shortDesc: 'Antioxidant-rich premium dried cranberries',
    price: 399,
    salePrice: undefined,
    images: [
      '/images/products/dates-cranberries.png',
      '/images/products/seeds-mix.png',
    ],
    category: 'Seeds & Berries',
    categorySlug: 'seeds-berries',
    variants: [
      { type: 'Weight', options: ['200g', '400g'] },
    ],
    tags: ['antioxidant', 'vitamin-c', 'salads'],
    nutrition: { calories: '308 kcal', protein: '0.5g', fat: '1g', carbs: '82g', fiber: '5g' },
    stock: 150,
    sku: 'MS-DC-013',
    featured: false,
    bestSeller: false,
    isNew: false,
    rating: 4.3,
    reviewCount: 92,
  },
  // Combo Packs
  {
    id: 'prod-14',
    name: 'Family Feast Combo',
    slug: 'family-feast-combo',
    description: 'The ultimate family pack! Includes 500g Premium Cashews W240, 500g California Almonds, 400g Classic Trail Mix, and 250g Premium Raisins. All your favorites in one pack at an unbeatable price. Perfect for family snacking or gifting.',
    shortDesc: 'Complete family pack with 4 premium products',
    price: 2199,
    salePrice: 1799,
    images: [
      '/images/products/combo-pack.png',
      '/images/products/trail-mix.png',
    ],
    category: 'Combo Packs',
    categorySlug: 'combo-packs',
    variants: [
      { type: 'Pack', options: ['Standard', 'Premium', 'Deluxe'] },
    ],
    tags: ['combo', 'value-pack', 'gifting'],
    nutrition: { calories: 'Varies', protein: 'Varies', fat: 'Varies', carbs: 'Varies', fiber: 'Varies' },
    stock: 50,
    sku: 'MC-FFC-014',
    featured: true,
    bestSeller: true,
    isNew: false,
    rating: 4.9,
    reviewCount: 156,
  },
  {
    id: 'prod-15',
    name: 'Diwali Gift Hamper',
    slug: 'diwali-gift-hamper',
    description: 'A luxurious Diwali gift hamper featuring Premium Cashews, Almonds, Pistachios, Raisins, and Chocolate Almonds, beautifully packaged in an elegant gift box. The perfect way to celebrate the festival of lights with loved ones.',
    shortDesc: 'Luxurious festive hamper with premium dry fruits',
    price: 2999,
    salePrice: 2499,
    images: [
      '/images/products/combo-pack.png',
      '/images/products/chocolate-almonds.png',
    ],
    category: 'Combo Packs',
    categorySlug: 'combo-packs',
    variants: [
      { type: 'Size', options: ['Small', 'Medium', 'Large'] },
    ],
    tags: ['festival', 'gifting', 'premium', 'diwali'],
    nutrition: { calories: 'Varies', protein: 'Varies', fat: 'Varies', carbs: 'Varies', fiber: 'Varies' },
    stock: 30,
    sku: 'MC-DGH-015',
    featured: true,
    bestSeller: false,
    isNew: true,
    rating: 4.8,
    reviewCount: 67,
  },
  // Healthy Snacks
  {
    id: 'prod-16',
    name: 'Quinoa Crunch Mix',
    slug: 'quinoa-crunch-mix',
    description: 'A revolutionary healthy snacking option combining roasted quinoa, amaranth puffs, pumpkin seeds, and dried cranberries. Gluten-free, high in protein, and incredibly crunchy. The perfect guilt-free snack for health-conscious individuals.',
    shortDesc: 'Gluten-free quinoa-based healthy crunch mix',
    price: 449,
    salePrice: undefined,
    images: [
      '/images/products/quinoa-walnuts.png',
      '/images/products/trail-mix.png',
    ],
    category: 'Healthy Snacks',
    categorySlug: 'healthy-snacks',
    variants: [
      { type: 'Weight', options: ['200g', '400g'] },
      { type: 'Flavor', options: ['Original', 'Herb & Garlic', 'Chili Lime'] },
    ],
    tags: ['gluten-free', 'protein', 'quinoa', 'healthy'],
    nutrition: { calories: '380 kcal', protein: '18g', fat: '16g', carbs: '42g', fiber: '8g' },
    stock: 100,
    sku: 'MH-QCM-016',
    featured: false,
    bestSeller: false,
    isNew: true,
    rating: 4.4,
    reviewCount: 45,
  },
  {
    id: 'prod-17',
    name: 'Pistachios Roasted & Salted',
    slug: 'pistachios-roasted-salted',
    description: 'Premium Iranian pistachios, naturally opened and perfectly roasted with just the right touch of salt. Known as the "green gold," these pistachios are rich in antioxidants, healthy fats, and make for an elegant snacking experience.',
    shortDesc: 'Premium Iranian pistachios, roasted & salted',
    price: 899,
    salePrice: 749,
    images: [
      '/images/products/honey-cashews-pistachios.png',
      '/images/products/cashews-premium.png',
    ],
    category: 'Premium Cashews',
    categorySlug: 'cashews',
    variants: [
      { type: 'Weight', options: ['250g', '500g', '1kg'] },
    ],
    tags: ['premium', 'iranian', 'antioxidant'],
    nutrition: { calories: '562 kcal', protein: '20g', fat: '45g', carbs: '28g', fiber: '10g' },
    stock: 85,
    sku: 'MC-PRS-017',
    featured: true,
    bestSeller: false,
    isNew: false,
    rating: 4.7,
    reviewCount: 178,
  },
  {
    id: 'prod-18',
    name: 'Walnut Halves Premium',
    slug: 'walnut-halves-premium',
    description: 'Premium quality walnut halves from Chile, known for their light color and mild, buttery flavor. Walnuts are the ultimate brain food, rich in omega-3 fatty acids and antioxidants. Perfect for baking, salads, or healthy snacking.',
    shortDesc: 'Premium Chilean walnut halves, brain-boosting nutrition',
    price: 749,
    salePrice: 649,
    images: [
      '/images/products/quinoa-walnuts.png',
      '/images/products/almonds-premium.png',
    ],
    category: 'Almonds',
    categorySlug: 'almonds',
    variants: [
      { type: 'Weight', options: ['250g', '500g', '1kg'] },
    ],
    tags: ['omega-3', 'brain-food', 'baking'],
    nutrition: { calories: '654 kcal', protein: '15g', fat: '65g', carbs: '14g', fiber: '7g' },
    stock: 110,
    sku: 'MA-WHP-018',
    featured: false,
    bestSeller: true,
    isNew: false,
    rating: 4.5,
    reviewCount: 143,
  },
  {
    id: 'prod-19',
    name: 'Makhana (Fox Nuts) Roasted',
    slug: 'makhana-fox-nuts-roasted',
    description: 'Traditional Indian superfood - roasted lotus seeds (Makhana) seasoned with aromatic spices. Low in calories, high in protein, and naturally gluten-free. A beloved Ayurvedic snack that is light, crunchy, and incredibly healthy.',
    shortDesc: 'Traditional roasted Makhana with aromatic spices',
    price: 299,
    salePrice: 249,
    images: [
      '/images/products/makhana.png',
      '/images/products/seeds-mix.png',
    ],
    category: 'Healthy Snacks',
    categorySlug: 'healthy-snacks',
    variants: [
      { type: 'Weight', options: ['150g', '300g'] },
      { type: 'Flavor', options: ['Plain', 'Mint', 'Masala', 'Caramel'] },
    ],
    tags: ['ayurvedic', 'low-calorie', 'gluten-free', 'traditional'],
    nutrition: { calories: '350 kcal', protein: '10g', fat: '0.5g', carbs: '75g', fiber: '14g' },
    stock: 200,
    sku: 'MH-MFR-019',
    featured: false,
    bestSeller: true,
    isNew: false,
    rating: 4.6,
    reviewCount: 212,
  },
  {
    id: 'prod-20',
    name: 'Dates Medjool Premium',
    slug: 'dates-medjool-premium',
    description: 'The king of dates! Premium Medjool dates from Jordan, known for their large size, soft texture, and rich caramel-like sweetness. Nature\'s candy - perfect as a natural sweetener, pre-workout energy boost, or paired with nuts for a nutritious snack.',
    shortDesc: 'Premium Jordanian Medjool dates, nature\'s candy',
    price: 799,
    salePrice: 699,
    images: [
      '/images/products/dates-cranberries.png',
      '/images/products/dried-fruits.png',
    ],
    category: 'Dried Fruits',
    categorySlug: 'dried-fruits',
    variants: [
      { type: 'Weight', options: ['250g', '500g', '1kg'] },
    ],
    tags: ['natural-sweetener', 'energy', 'premium'],
    nutrition: { calories: '277 kcal', protein: '2g', fat: '0.2g', carbs: '75g', fiber: '7g' },
    stock: 60,
    sku: 'MD-DMP-020',
    featured: true,
    bestSeller: false,
    isNew: false,
    rating: 4.8,
    reviewCount: 167,
  },
]

export const reviews: Review[] = [
  { id: 'rev-1', userName: 'Priya Sharma', rating: 5, title: 'Best cashews ever!', comment: 'These are hands down the best cashews I have ever tasted. Fresh, crunchy, and perfectly roasted. Will order again!', date: '2024-12-15', verified: true },
  { id: 'rev-2', userName: 'Rajesh Kumar', rating: 4, title: 'Great quality', comment: 'Very good quality almonds. Fresh and properly packed. Delivery was quick too.', date: '2024-12-10', verified: true },
  { id: 'rev-3', userName: 'Anita Desai', rating: 5, title: 'Perfect gift', comment: 'Bought the Diwali hamper for my family. Everyone loved it! Beautiful packaging and premium quality.', date: '2024-11-25', verified: true },
  { id: 'rev-4', userName: 'Vikram Patel', rating: 4, title: 'Good value', comment: 'The trail mix is excellent for my daily gym routine. Good portion of nuts and dried fruits.', date: '2024-12-01', verified: true },
  { id: 'rev-5', userName: 'Sneha Reddy', rating: 5, title: 'Amazing flavor', comment: 'The Peri Peri cashews are absolutely addictive! Perfect spice level and crunch.', date: '2024-11-30', verified: true },
  { id: 'rev-6', userName: 'Arjun Menon', rating: 5, title: 'Premium quality', comment: 'You can taste the difference. These are genuinely premium quality dry fruits. Worth every rupee.', date: '2024-12-05', verified: true },
  { id: 'rev-7', userName: 'Deepa Nair', rating: 4, title: 'Healthy and tasty', comment: 'The makhana is light and perfectly seasoned. Great for evening snacking without guilt.', date: '2024-12-08', verified: true },
  { id: 'rev-8', userName: 'Suresh Gupta', rating: 5, title: 'Fresh and natural', comment: 'The Medjool dates are incredibly fresh and sweet. Best I have had in India. Natural and no added sugar.', date: '2024-12-12', verified: true },
]

export const testimonials: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Meera Krishnan',
    location: 'Mumbai',
    comment: 'Mealicious has completely changed how our family snacks. The quality is unmatched, and everything arrives fresh. My kids love the trail mix!',
    rating: 5,
    avatar: 'MK',
  },
  {
    id: 'test-2',
    name: 'Arun Joshi',
    location: 'Delhi',
    comment: 'I have been ordering from Mealicious for 6 months now. Consistent quality, great packaging, and fast delivery. The Peri Peri cashews are my favorite!',
    rating: 5,
    avatar: 'AJ',
  },
  {
    id: 'test-3',
    name: 'Lakshmi Iyer',
    location: 'Bangalore',
    comment: 'The Diwali gift hamper was a huge hit! Beautiful presentation and premium quality. Everyone asked where I got it from. Will definitely order again for next festival.',
    rating: 5,
    avatar: 'LI',
  },
  {
    id: 'test-4',
    name: 'Rohan Mehta',
    location: 'Pune',
    comment: 'As a fitness enthusiast, I am always looking for healthy snack options. The Protein Power Mix is exactly what I needed. Great taste and great macros!',
    rating: 4,
    avatar: 'RM',
  },
]

export const blogPosts: BlogPost[] = [
  {
    id: 'blog-1',
    title: '10 Health Benefits of Eating Cashews Daily',
    slug: 'health-benefits-cashews',
    excerpt: 'Discover why adding a handful of cashews to your daily diet can transform your health. From heart health to glowing skin...',
    content: 'Cashews are one of the most popular and nutritious nuts in the world. Rich in healthy fats, vitamins, and minerals, they offer numerous health benefits...',
    image: '/images/products/cashews-premium.png',
    author: 'Dr. Priya Sharma',
    date: '2024-12-01',
    category: 'Health & Nutrition',
    readTime: '5 min read',
  },
  {
    id: 'blog-2',
    title: 'The Ultimate Guide to Choosing Premium Dry Fruits',
    slug: 'guide-choosing-premium-dry-fruits',
    excerpt: 'Not all dry fruits are created equal. Learn how to identify truly premium quality nuts and dried fruits with our comprehensive guide...',
    content: 'When it comes to dry fruits, quality matters immensely. From grading systems to origin tracking, there are many factors that determine the quality...',
    image: '/images/products/trail-mix.png',
    author: 'Mealicious Team',
    date: '2024-11-20',
    category: 'Buying Guide',
    readTime: '7 min read',
  },
  {
    id: 'blog-3',
    title: '5 Delicious Recipes Using Trail Mix',
    slug: 'recipes-using-trail-mix',
    excerpt: 'Trail mix is not just for snacking! Try these creative recipes that use our premium trail mix in exciting new ways...',
    content: 'Trail mix is incredibly versatile. Beyond snacking, it can be used in salads, baked goods, breakfast bowls, and even savory dishes...',
    image: '/images/products/makhana.png',
    author: 'Chef Arjun Mehta',
    date: '2024-11-15',
    category: 'Recipes',
    readTime: '4 min read',
  },
  {
    id: 'blog-4',
    title: 'Why Makhana is the Superfood of 2025',
    slug: 'makhana-superfood-2025',
    excerpt: 'Fox nuts or Makhana have been a part of Ayurvedic medicine for centuries. Here is why they are trending globally as the next superfood...',
    content: 'Makhana, also known as fox nuts or lotus seeds, has been consumed in India for thousands of years. Recently, it has gained international attention...',
    image: '/images/products/dried-fruits.png',
    author: 'Dr. Anita Desai',
    date: '2024-11-10',
    category: 'Health & Nutrition',
    readTime: '6 min read',
  },
]

export const faqData = [
  {
    category: 'Orders & Shipping',
    questions: [
      { q: 'How long does delivery take?', a: 'We deliver across India within 3-7 business days. Metro cities usually receive orders within 2-4 days. You will receive tracking details via email and WhatsApp once your order is shipped.' },
      { q: 'Do you offer free shipping?', a: 'Yes! We offer free shipping on all orders above ₹499. For orders below ₹499, a flat shipping fee of ₹49 applies.' },
      { q: 'Can I track my order?', a: 'Absolutely! Once your order is shipped, you will receive a tracking number via email and WhatsApp. You can also track your order on our Track Order page.' },
      { q: 'Do you deliver internationally?', a: 'Currently, we deliver only within India. International shipping will be available soon!' },
    ],
  },
  {
    category: 'Products & Quality',
    questions: [
      { q: 'Are your products fresh?', a: 'We source our products directly from premium farms and process them in small batches to ensure maximum freshness. Each pack comes with a best-before date, and we guarantee freshness for at least 6 months from the date of purchase.' },
      { q: 'Do you add preservatives?', a: 'Most of our products are 100% natural with no added preservatives, artificial colors, or flavors. Some flavored variants may contain natural seasonings. Always check the ingredient list on the product page.' },
      { q: 'Are your products FSSAI certified?', a: 'Yes! All our products are FSSAI certified and manufactured in FSSAI-licensed facilities following strict hygiene and quality standards.' },
      { q: 'Do you offer organic products?', a: 'We have a growing range of organic products. Look for the "Organic" badge on the product page. We are working towards making our entire range organic certified.' },
    ],
  },
  {
    category: 'Payments & Returns',
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD). All online payments are secured by Cashfree.' },
      { q: 'Is COD available?', a: 'Yes, Cash on Delivery is available for orders up to ₹5,000 with no additional charges.' },
      { q: 'What is your return policy?', a: 'In the interest of food safety and FSSAI guidelines, we do not accept returns on food products. If you receive a wrong, damaged, or incomplete order, please contact us within 24 hours of delivery for a replacement or refund.' },
      { q: 'How do I get a refund?', a: 'Refunds are processed within 5-7 business days. For prepaid orders, the refund is credited to your original payment method. For COD orders, we will transfer the refund to your bank account.' },
    ],
  },
  {
    category: 'Account & Support',
    questions: [
      { q: 'How do I create an account?', a: 'Click on the "Login/Register" button in the top navigation bar. You can sign up with your email address or phone number. It takes less than 30 seconds!' },
      { q: 'I forgot my password. What do I do?', a: 'Click on "Forgot Password" on the login page. Enter your registered email, and we will send you a password reset link.' },
      { q: 'How can I contact customer support?', a: 'You can reach us through: Email: support@mealicious.in, or use the contact form on our website. We are available 10 AM - 8 PM IST, Monday to Saturday.' },
    ],
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function getProductsByCategory(slug: string): Product[] {
  return products.filter(p => p.categorySlug === slug)
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured)
}

export function getBestSellers(): Product[] {
  return products.filter(p => p.bestSeller)
}

export function getNewArrivals(): Product[] {
  return products.filter(p => p.isNew)
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase()
  return products.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
  )
}

export function getRelatedProducts(product: Product): Product[] {
  return products
    .filter(p => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, 4)
}
