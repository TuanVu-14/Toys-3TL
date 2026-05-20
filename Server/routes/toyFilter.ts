import express, { Request, Response } from 'express'
import { client } from '../data/DB'

const router = express.Router()

const productSelect = `
  SELECT
    products.productid,
    products.title,
    categories.name AS category,
    categories.maincategory,
    products.price,
    products.discount,
    productparams.stars,
    productparams.isnew,
    productparams.issale,
    productparams.isdiscount
  FROM products
  INNER JOIN categories ON products.categoryid = categories.categoryid
  INNER JOIN productparams ON products.productid = productparams.productid
`

const getImage = async (productID: number) => {
  try {
    const result = await client.query(
      `SELECT imageid, imglink, imgalt
       FROM productimages
       WHERE productid = $1
       ORDER BY COALESCE(isprimary, false) DESC, imageid ASC
       LIMIT 1`,
      [productID],
    )

    return result.rows[0] || { imageid: 0, imglink: '', imgalt: '' }
  } catch {
    return { imageid: 0, imglink: '', imgalt: '' }
  }
}

const getColors = async (productID: number) => {
  try {
    const result = await client.query(`SELECT colorid, colorname, colorclass FROM productcolors WHERE productid = $1`, [productID])
    return result.rows
  } catch {
    return []
  }
}

const getSizes = async (productID: number) => {
  try {
    const result = await client.query(`SELECT sizeid, sizename, instock FROM productsizes WHERE productid = $1`, [productID])
    return result.rows
  } catch {
    return []
  }
}

const getReviewCount = async (productID: number) => {
  try {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM reviews WHERE productid = $1`, [productID])
    return result.rows[0]?.count || 0
  } catch {
    return 0
  }
}

async function enrichProducts(rows: any[]) {
  return Promise.all(
    rows.map(async (product) => {
      const productID = Number(product.productid)
      const [colors, sizes, reviewCount, images] = await Promise.all([
        getColors(productID),
        getSizes(productID),
        getReviewCount(productID),
        getImage(productID),
      ])

      return {
        ...product,
        colors,
        sizes,
        reviewCount,
        images,
      }
    }),
  )
}

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const hasValue = (value: unknown) => value !== undefined && value !== null && String(value).trim() !== ''

function addCatalogFilters(body: any, values: any[], where: string[]) {
  const add = (sql: string, value: unknown) => {
    if (!hasValue(value)) return
    values.push(value)
    where.push(sql.replace('?', `$${values.length}`))
  }

  add('products.age_group = ?', body.age_group)
  add('LOWER(products.gender) = LOWER(?)', body.gender)
  add('LOWER(products.material) = LOWER(?)', body.material)
  add('LOWER(products.skill_type) = LOWER(?)', body.skill_type)
  add('LOWER(products.brand) = LOWER(?)', body.brand)

  if (hasValue(body.collection_id)) {
    values.push(Number(body.collection_id))
    where.push(`EXISTS (
      SELECT 1
      FROM collection_products cp
      WHERE cp.productid = products.productid
        AND cp.collection_id = $${values.length}
    )`)
  }
}

router.post('/toy-filter/search', async (req: Request, res: Response) => {
  const {
    productName = '',
    minPrice = 0,
    maxPrice = 999999999,
    minRating = 0,
  } = req.body

  const values: any[] = [
    `%${String(productName || '').split('-').join(' ').trim()}%`,
    toNumber(minPrice, 0),
    toNumber(maxPrice, 999999999),
    toNumber(minRating, 0),
  ]

  const where: string[] = [
    `products.is_active = true`,
    `products.price >= $2`,
    `products.price <= $3`,
    `COALESCE(productparams.stars, 0) >= $4`,
    `(products.title ILIKE $1 OR products.description ILIKE $1 OR products.tags ILIKE $1 OR products.brand ILIKE $1)`,
  ]

  addCatalogFilters(req.body, values, where)

  try {
    const result = await client.query(
      `${productSelect}
       WHERE ${where.join(' AND ')}
       ORDER BY products.productid DESC`,
      values,
    )

    return res.status(200).json({ data: await enrichProducts(result.rows) })
  } catch (error) {
    console.error('POST /toy-filter/search error:', error)
    return res.status(500).json({ data: [] })
  }
})

router.post('/toy-filter/category', async (req: Request, res: Response) => {
  const {
    categoryName = '',
    categoryID = 0,
    minPrice = 0,
    maxPrice = 999999999,
    minRating = 0,
  } = req.body

  const values: any[] = [toNumber(minPrice, 0), toNumber(maxPrice, 999999999), toNumber(minRating, 0)]

  const where: string[] = [
    `products.is_active = true`,
    `products.price >= $1`,
    `products.price <= $2`,
    `COALESCE(productparams.stars, 0) >= $3`,
  ]

  if (Number(categoryID) > 0) {
    values.push(Number(categoryID))
    where.push(`products.categoryid = $${values.length}`)
  } else if (hasValue(categoryName)) {
    values.push(String(categoryName).toLowerCase())
    where.push(`EXISTS (
      SELECT 1
      FROM categories c
      WHERE c.categoryid = products.categoryid
        AND (LOWER(c.slug) = $${values.length} OR LOWER(REPLACE(c.maincategory, ' ', '-')) = $${values.length})
    )`)
  }

  addCatalogFilters(req.body, values, where)

  try {
    const result = await client.query(
      `${productSelect}
       WHERE ${where.join(' AND ')}
       ORDER BY products.productid DESC`,
      values,
    )

    return res.status(200).json({ data: await enrichProducts(result.rows) })
  } catch (error) {
    console.error('POST /toy-filter/category error:', error)
    return res.status(500).json({ data: [] })
  }
})

router.get('/toy-filter/collection/:slug', async (req: Request, res: Response) => {
  try {
    const collectionResult = await client.query(
      `SELECT collection_id, name, slug, description, imglink
       FROM collections
       WHERE slug = $1 AND COALESCE(is_active, true) = true
       LIMIT 1`,
      [req.params.slug],
    )

    if (!collectionResult.rows.length) {
      return res.status(404).json({ data: null, products: [] })
    }

    const collection = collectionResult.rows[0]

    const products = await client.query(
      `${productSelect}
       INNER JOIN collection_products cp ON cp.productid = products.productid
       WHERE products.is_active = true
         AND cp.collection_id = $1
       ORDER BY products.productid DESC`,
      [collection.collection_id],
    )

    return res.status(200).json({ data: collection, products: await enrichProducts(products.rows) })
  } catch (error) {
    console.error('GET /toy-filter/collection/:slug error:', error)
    return res.status(500).json({ data: null, products: [] })
  }
})

export default router
