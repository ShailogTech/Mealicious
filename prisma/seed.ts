import { PrismaClient } from '@prisma/client'
import { products, categories, blogPosts } from '../src/lib/data'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// ERP seed (Phase 1) — /administrator module. Idempotent upserts.
// Company identity, RBAC matrix, shifts, productivity rules, and the two
// retained admin accounts (CEO + COO). See
// docs/superpowers/specs/2026-07-16-administrator-erp-phase1-design.md
// ---------------------------------------------------------------------------
const ERP_COMPANY = {
  id: 'company',
  companyName: 'MEALICIOUS VENTURES PRIVATE LIMITED',
  address: '1/108, Elappankadu, Uthamasolapuram, Salem – 636010, Tamil Nadu, India',
  phone: '+91 63798 58978',
  email: 'support@mealicious.store',
  website: 'www.mealicious.store',
  gstin: '33AAUCM2609Q1ZT',
  fssai: '22426193000120',
  cin: 'U10799TZ2025PTC037179',
  invoicePrefix: 'MVPL-RETAIL-IN',
  invoiceStart: 10,
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankIFSC: '',
  bankBranch: '',
  upiId: '',
  terms: 'Goods once sold will not be taken back. Interest @18% p.a. will be charged if payment is not made within 15 days.',
  footerText: "Thank you for shopping with us! Nature's Goodness in Every Bite.",
  darkMode: false,
}

const ERP_SHIFTS = [
  { name: 'Office Hours', start: '09:00', end: '18:00', type: 'Standard' },
  { name: 'Factory Shift A', start: '06:00', end: '14:00', type: 'Rotational' },
  { name: 'Factory Shift B', start: '14:00', end: '22:00', type: 'Rotational' },
  { name: 'Night Shift', start: '22:00', end: '06:00', type: 'Rotational' },
  { name: 'Hybrid / Remote', start: 'Flexible', end: 'Flexible', type: 'Remote' },
  { name: 'Flexible Timing', start: 'Flexible', end: 'Flexible', type: 'Flexible' },
]

const ERP_PRODUCTIVITY_RULES = {
  minWorkingHours: 8,
  maxWorkingHours: 10,
  minProductivityPct: 60,
  maxBreakMinutes: 60,
  idleThresholdMinutes: 30,
  lateLoginAfter: '09:15',
  earlyLogoutBefore: '17:45',
}

// Per-module RBAC matrix: which roles can view each module key.
// SUPER_ADMIN always bypasses; adminusers/companysettings hard-locked below.
// Ported verbatim from the ERP's seedDatabase() permission logic.
function buildErpPermissions() {
  const modules = [
    'dashboard', 'employees', 'rbac', 'shifts', 'productivity', 'teams',
    'groups', 'messages', 'mailtickets', 'crm', 'sales', 'billing', 'invoices',
    'companysettings', 'purchase', 'vendors', 'inventory', 'manufacturing',
    'supplychain', 'projects', 'finance', 'analytics', 'reports', 'adminusers',
    'assets', 'franchise', 'distributors', 'retail', 'investors', 'campaigns',
  ]
  const matrix: Record<string, Record<string, boolean>> = {}
  for (const key of modules) {
    matrix[key] = {
      SUPER_ADMIN: true,
      FINANCE: ['dashboard', 'finance', 'invoices', 'billing', 'purchase', 'reports', 'messages', 'mailtickets'].includes(key),
      SALES: ['dashboard', 'crm', 'sales', 'billing', 'invoices', 'customers', 'marketing', 'reports', 'messages', 'mailtickets'].includes(key),
      OPS: ['dashboard', 'inventory', 'manufacturing', 'supplychain', 'assets', 'reports', 'messages', 'mailtickets'].includes(key),
      HR: ['dashboard', 'employees', 'shifts', 'productivity', 'teams', 'groups', 'reports', 'messages', 'mailtickets'].includes(key),
      EMPLOYEE: ['dashboard', 'projects', 'messages', 'mailtickets'].includes(key),
      INTERN: ['dashboard', 'projects', 'messages', 'mailtickets'].includes(key),
    }
  }
  // Hard-locked super-admin-only modules — stripped from the togglable matrix.
  delete matrix['adminusers']
  delete matrix['companysettings']
  return matrix
}

async function seedErp() {
  console.log('Seeding ERP system config…')
  await prisma.erpSystemConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      company: ERP_COMPANY,
      invoiceCounter: ERP_COMPANY.invoiceStart,
      productivityRules: ERP_PRODUCTIVITY_RULES,
      permissions: buildErpPermissions(),
      shifts: ERP_SHIFTS,
    },
  })

  console.log('Seeding ERP employees (CEO + COO)…')
  const leadership = [
    {
      employeeCode: 'MV-EMP-0001',
      name: 'Jeevapriyan Elangovan',
      dept: 'Administration',
      role: 'Founder & CEO',
      officialEmail: 'jeevs@mealicious.store',
      status: 'Active',
    },
    {
      employeeCode: 'MV-EMP-0002',
      name: 'Praveen Shanmugam',
      dept: 'Administration',
      role: 'Co-founder & COO',
      officialEmail: 'praveen@mealicious.store',
      status: 'Active',
    },
  ]

  for (const lead of leadership) {
    await prisma.erpEmployee.upsert({
      where: { employeeCode: lead.employeeCode },
      update: {
        name: lead.name,
        dept: lead.dept,
        role: lead.role,
        officialEmail: lead.officialEmail,
        status: lead.status,
        nationality: 'Indian',
        country: 'India',
        city: 'Salem',
        workLocation: 'Salem — Registered Office',
        monitoring: {
          loginTracking: true,
          idleTracking: true,
          taskTracking: true,
          attendanceTracking: true,
          performanceRating: true,
          overtimeTracking: true,
          readOnly: false,
        },
      },
      create: {
        employeeCode: lead.employeeCode,
        name: lead.name,
        dept: lead.dept,
        role: lead.role,
        officialEmail: lead.officialEmail,
        status: lead.status,
        nationality: 'Indian',
        country: 'India',
        city: 'Salem',
        workLocation: 'Salem — Registered Office',
        shift: 'Office Hours',
        employmentType: 'Full-Time',
        orgLevel: 'Manager',
        joinedAt: new Date(),
        monitoring: {
          loginTracking: true,
          idleTracking: true,
          taskTracking: true,
          attendanceTracking: true,
          performanceRating: true,
          overtimeTracking: true,
          readOnly: false,
        },
      },
    })
  }

  console.log('Seeding ERP admin accounts (CEO + COO)…')
  // These two passwords come from the ERP README. CHANGE ON FIRST LOGIN.
  const accounts = [
    {
      email: 'jeevs@mealicious.store',
      username: 'Mealicious',
      displayName: 'Jeevapriyan Elangovan',
      initials: 'JE',
      password: 'Mealicious@2212',
      employeeCode: 'MV-EMP-0001',
    },
    {
      email: 'praveen@mealicious.store',
      username: 'praveen.coo',
      displayName: 'Praveen Shanmugam',
      initials: 'PS',
      password: 'Praveen@2212',
      employeeCode: 'MV-EMP-0002',
    },
  ]

  for (const acct of accounts) {
    const emp = await prisma.erpEmployee.findUnique({ where: { employeeCode: acct.employeeCode } })
    const existing = await prisma.adminUser.findUnique({ where: { email: acct.email } })
    if (existing) {
      // Keep existing password on re-seed; only relink employee if needed.
      await prisma.adminUser.update({
        where: { email: acct.email },
        data: emp ? { linkedEmployee: { connect: { id: emp.id } } } : {},
      })
      continue
    }
    await prisma.adminUser.create({
      data: {
        email: acct.email,
        username: acct.username,
        displayName: acct.displayName,
        initials: acct.initials,
        hashedPassword: await hashPassword(acct.password),
        role: 'SUPER_ADMIN',
        isActive: true,
        linkedEmployee: emp ? { connect: { id: emp.id } } : undefined,
      },
    })
  }
  console.log('  ERP seed complete.')
}

async function main() {
  console.log('Seeding categories…')
  const slugToId = new Map<string, string>()
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        image: c.image,
        icon: c.icon,
      },
      create: {
        name: c.name,
        slug: c.slug,
        image: c.image,
        icon: c.icon,
        featured: true,
      },
    })
    slugToId.set(c.slug, row.id)
  }
  console.log(`  ${slugToId.size} categories`)

  console.log('Seeding products…')
  let pcount = 0
  for (const p of products) {
    const categoryId = slugToId.get(p.categorySlug)
    if (!categoryId) {
      console.warn(`  skip ${p.slug}: category ${p.categorySlug} not found`)
      continue
    }
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        shortDesc: p.shortDesc,
        price: p.price,
        salePrice: p.salePrice,
        images: JSON.stringify(p.images),
        categoryId,
        variants: JSON.stringify(p.variants ?? []),
        tags: JSON.stringify(p.tags ?? []),
        nutrition: JSON.stringify(p.nutrition ?? {}),
        stock: p.stock,
        sku: p.sku,
        featured: p.featured,
        bestSeller: p.bestSeller,
        isNew: p.isNew,
        rating: p.rating,
        reviewCount: p.reviewCount,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDesc: p.shortDesc,
        price: p.price,
        salePrice: p.salePrice,
        images: JSON.stringify(p.images),
        categoryId,
        variants: JSON.stringify(p.variants ?? []),
        tags: JSON.stringify(p.tags ?? []),
        nutrition: JSON.stringify(p.nutrition ?? {}),
        stock: p.stock,
        sku: p.sku,
        featured: p.featured,
        bestSeller: p.bestSeller,
        isNew: p.isNew,
        rating: p.rating,
        reviewCount: p.reviewCount,
      },
    })
    pcount++
  }
  console.log(`  ${pcount} products`)

  console.log('Seeding blog posts…')
  let bcount = 0
  for (const b of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        excerpt: b.excerpt,
        content: b.content,
        image: b.image,
        author: b.author,
        category: b.category,
        published: true,
      },
      create: {
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        content: b.content,
        image: b.image,
        author: b.author,
        category: b.category,
        published: true,
      },
    })
    bcount++
  }
  console.log(`  ${bcount} blog posts`)

  // Ensure admin user exists for FK on demo orders
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mealicious.com' },
    update: { role: 'admin' },
    create: { email: 'admin@mealicious.com', name: 'Admin', role: 'admin' },
  })
  console.log(`Admin user id=${admin.id}`)

  console.log('Seeding product reviews and updating rating counts...')
  const reviewerNames = [
    'Aarav Sharma', 'Priya Patel', 'Amit Khan', 'Anjali Mehta', 'Rajesh Verma',
    'Siddharth Rao', 'Neha Gupta', 'Vikram Singh', 'Deepa Nair', 'Suresh Iyer'
  ]

  const reviewComments = [
    { rating: 5, title: 'Superb Quality', comment: 'Absolutely premium quality. The freshness is unmatched. Will buy again!' },
    { rating: 5, title: 'Highly Recommended', comment: 'Extremely fresh and delicious. Very clean packaging. Highly recommend!' },
    { rating: 5, title: 'Amazing Taste', comment: 'The flavor is incredible. Best dry fruits I have ordered online.' },
    { rating: 4, title: 'Very Good Product', comment: 'Great taste and texture. Delivery was slightly delayed, but product is excellent.' },
    { rating: 4, title: 'Satisfied', comment: 'Good quality and value for money. Healthy snacking option.' },
    { rating: 5, title: 'Perfect Pack', comment: 'Crispy, crunchy, and tastes natural. 10/10.' }
  ]

  // Clear existing reviews first
  await prisma.review.deleteMany()

  const dbProducts = await prisma.product.findMany()
  for (const p of dbProducts) {
    const reviewQty = 2 + (p.name.length % 3)
    const reviewsToInsert = []

    for (let i = 0; i < reviewQty; i++) {
      const nameIdx = (p.name.charCodeAt(0) + i * 7) % reviewerNames.length
      const commentIdx = (p.name.charCodeAt(p.name.length - 1) + i * 13) % reviewComments.length

      const reviewer = reviewerNames[nameIdx]
      const reviewDetail = reviewComments[commentIdx]

      const date = new Date()
      date.setDate(date.getDate() - (i * 10 + 2))

      reviewsToInsert.push({
        productId: p.id,
        guestName: reviewer,
        guestEmail: `${reviewer.toLowerCase().replace(/ /g, '.')}@example.com`,
        rating: reviewDetail.rating,
        title: reviewDetail.title,
        comment: reviewDetail.comment,
        approved: true,
        createdAt: date,
      })
    }

    await prisma.review.createMany({
      data: reviewsToInsert
    })

    // Update product rating and reviewCount aggregates
    const aggregate = await prisma.review.aggregate({
      where: { productId: p.id, approved: true },
      _avg: { rating: true },
      _count: { id: true }
    })

    const avgRating = aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(1)) : 0
    const count = aggregate._count.id ?? 0

    await prisma.product.update({
      where: { id: p.id },
      data: {
        rating: avgRating,
        reviewCount: count
      }
    })
  }

  await seedErp()

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

