import express, { Request, Response } from 'express'
import { client } from '../data/DB'

const router = express.Router()

const PRIMARY_IMAGE_SQL = `
  LEFT JOIN LATERAL (
    SELECT imageid, imglink, imgalt
    FROM productimages pi
    WHERE pi.productid = p.productid
    ORDER BY COALESCE(pi.isprimary, false) DESC, pi.imageid ASC
    LIMIT 1
  ) img ON true
`

const PRODUCT_SELECT_SQL = `
  SELECT
    p.productid,
    p.title,
    c.name AS category,
    c.name AS category_name,
    c.slug AS category_slug,
    c.maincategory,
    p.price,
    p.discount,
    COALESCE(pp.stars, 0) AS stars,
    COALESCE(pp.isnew, false) AS isnew,
    COALESCE(pp.issale, false) AS issale,
    COALESCE(pp.isdiscount, false) AS isdiscount,
    COALESCE(pp.views, 0) AS views,
    COALESCE(pp.sold, 0) AS sold,
    COALESCE(pp.rating, 0) AS rating,
    COALESCE(img.imageid, 0) AS imageid,
    COALESCE(img.imglink, '/images/no-image.png') AS imglink,
    COALESCE(img.imgalt, p.title) AS imgalt
  FROM products p
  LEFT JOIN categories c ON c.categoryid = p.categoryid
  LEFT JOIN productparams pp ON pp.productid = p.productid
  ${PRIMARY_IMAGE_SQL}
  WHERE COALESCE(p.is_active, true) = true
`

const toProductCard = (row: any) => ({
  productid: row.productid,
  title: row.title,
  category: row.category || row.category_name || '',
  category_name: row.category_name || row.category || '',
  category_slug: row.category_slug || '',
  maincategory: row.maincategory || '',
  price: row.price,
  discount: row.discount,
  stars: Number(row.stars || 0),
  isnew: !!row.isnew,
  issale: !!row.issale,
  isdiscount: !!row.isdiscount,
  views: Number(row.views || 0),
  sold: Number(row.sold || 0),
  rating: Number(row.rating || 0),
  images: {
    imageid: Number(row.imageid || 0),
    imglink: row.imglink || '/images/no-image.png',
    imgalt: row.imgalt || row.title || '',
  },
  imglink: row.imglink || '/images/no-image.png',
  imgalt: row.imgalt || row.title || '',
})

async function getColors(productID: number) {
  try {
    const result = await client.query(
      `SELECT colorid, colorname AS name, colorname, colorclass FROM productcolors WHERE productid = $1`,
      [productID],
    )
    return result.rows
  } catch {
    return []
  }
}

async function getSizes(productID: number) {
  try {
    const result = await client.query(
      `SELECT sizeid, sizename AS name, sizename, instock FROM productsizes WHERE productid = $1`,
      [productID],
    )
    return result.rows
  } catch {
    return []
  }
}

async function getReviewCount(productID: number) {
  try {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM reviews WHERE productid = $1`, [productID])
    return result.rows[0]?.count || 0
  } catch {
    return 0
  }
}

async function hydrateProducts(rows: any[]) {
  return Promise.all(
    rows.map(async (row) => {
      const [colors, sizes, reviewCount] = await Promise.all([
        getColors(row.productid),
        getSizes(row.productid),
        getReviewCount(row.productid),
      ])

      return { ...toProductCard(row), colors, sizes, reviewCount }
    }),
  )
}

const uniqueRows = (rows: any[]) => {
  const seen = new Set<number>()
  return rows.filter((row) => {
    const id = Number(row.productid)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

const productIds = (rows: any[]) => rows.map((row) => Number(row.productid)).filter((id) => Number.isFinite(id) && id > 0)

const excludedSql = (ids: number[]) => (ids.length ? ` AND p.productid <> ALL($1::int[]) ` : '')
const excludedParams = (ids: number[]) => (ids.length ? [ids] : [])

router.get('/home/banner', async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT
        bannerid AS id,
        bannerid,
        toptitle,
        middletitle,
        bottomtitle,
        imglink,
        startprice,
        buttontitle,
        redirect_link,
        createdat,
        updatedat
      FROM banners
      ORDER BY bannerid ASC
    `)

    res.status(200).json({ data: response.rows })
  } catch (error) {
    console.error('GET /home/banner error:', error)
    res.status(500).json({ data: [] })
  }
})

router.get('/home/deals', async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT
        d.productid,
        p.title,
        p.description,
        p.price,
        p.discount,
        d.sold,
        d.available,
        d.end_time,
        COALESCE(pp.stars, 0) AS stars,
        COALESCE(pp.rating, 0) AS rating,
        COALESCE(img.imglink, '/images/no-image.png') AS imglink,
        COALESCE(img.imgalt, p.title) AS imgalt
      FROM deals d
      INNER JOIN products p ON p.productid = d.productid
      LEFT JOIN productparams pp ON pp.productid = d.productid
      LEFT JOIN LATERAL (
        SELECT imglink, imgalt
        FROM productimages pi
        WHERE pi.productid = d.productid
        ORDER BY COALESCE(pi.isprimary, false) DESC, pi.imageid ASC
        LIMIT 1
      ) img ON true
      WHERE COALESCE(p.is_active, true) = true
      ORDER BY d.end_time ASC
    `)

    res.status(200).json({ data: response.rows })
  } catch (error) {
    console.error('GET /home/deals error:', error)
    res.status(500).json({ data: [] })
  }
})

router.get('/home/trending', async (_req: Request, res: Response) => {
  try {
    // Tách 3 nhóm sản phẩm để trang chủ không render trùng sản phẩm giữa New Arrivals / Trending / Top Rated.
    // lego9.sql có cột productparams.isnew, views, rating, stars, sold nên dùng đúng các cột này.
    const newArrivalResult = await client.query(`
      ${PRODUCT_SELECT_SQL}
        AND COALESCE(pp.isnew, false) = true
      ORDER BY p.createdat DESC, p.productid DESC
      LIMIT 8
    `)

    const newArrival = uniqueRows(newArrivalResult.rows)
    const newArrivalIds = productIds(newArrival)

    const trendingResult = await client.query(
      `
        ${PRODUCT_SELECT_SQL}
          ${excludedSql(newArrivalIds)}
        ORDER BY COALESCE(pp.views, 0) DESC, COALESCE(pp.sold, 0) DESC, p.productid DESC
        LIMIT 8
      `,
      excludedParams(newArrivalIds),
    )

    const trending = uniqueRows(trendingResult.rows)
    const trendingIds = productIds(trending)
    const excludeTopRatedIds = [...newArrivalIds, ...trendingIds]

    const topRatedResult = await client.query(
      `
        ${PRODUCT_SELECT_SQL}
          ${excludedSql(excludeTopRatedIds)}
        ORDER BY COALESCE(pp.stars, 0) DESC, COALESCE(pp.rating, 0) DESC, COALESCE(pp.sold, 0) DESC, p.productid DESC
        LIMIT 8
      `,
      excludedParams(excludeTopRatedIds),
    )

    let topRated = uniqueRows(topRatedResult.rows)

    // Nếu dữ liệu trong DB quá ít, lấy thêm sản phẩm đánh giá cao để tránh để trống khối Top Rated.
    if (topRated.length === 0) {
      const fallbackTopRated = await client.query(`
        ${PRODUCT_SELECT_SQL}
        ORDER BY COALESCE(pp.stars, 0) DESC, COALESCE(pp.rating, 0) DESC, p.productid DESC
        LIMIT 8
      `)
      topRated = uniqueRows(fallbackTopRated.rows)
    }

    res.status(200).json({
      data: {
        new_arrival: newArrival.map(toProductCard),
        trending: trending.map(toProductCard),
        top_rated: topRated.map(toProductCard),
      },
    })
  } catch (error) {
    console.error('GET /home/trending error:', error)
    res.status(500).json({ data: { trending: [], top_rated: [], new_arrival: [] } })
  }
})

router.get('/home/best-sellers', async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      ${PRODUCT_SELECT_SQL}
        AND COALESCE(pp.sold, 0) > 0
      ORDER BY COALESCE(pp.sold, 0) DESC, COALESCE(pp.rating, 0) DESC, p.productid DESC
      LIMIT 8
    `)

    res.status(200).json({ data: response.rows.map(toProductCard) })
  } catch (error) {
    console.error('GET /home/best-sellers error:', error)
    res.status(500).json({ data: [] })
  }
})

router.get('/home/products', async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      ${PRODUCT_SELECT_SQL}
      ORDER BY COALESCE(pp.stars, 0) DESC, COALESCE(pp.rating, 0) DESC, p.createdat DESC, p.productid DESC
      LIMIT 12
    `)
    const products = await hydrateProducts(uniqueRows(response.rows))

    res.status(200).json({ data: products })
  } catch (error) {
    console.error('GET /home/products error:', error)
    res.status(500).json({ data: [] })
  }
})

export default router
