import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import {
  categoryFilterSchema,
  categorySchema,
  filterSchema,
  getCategorySchema,
  getProductNameSchema,
  MainSubCategorySchema,
} from '../validators/siteDataValidation';
import { matchedData, validationResult } from 'express-validator';

const router = express.Router();
const articleTable = 'articles';
const categoryTable = 'categories';

const slugify = (value: string) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getImage = async (productID: number) => {
  try {
    const result = await client.query(
      `SELECT imageid, imglink, imgalt FROM productimages WHERE productid = $1 AND isprimary = true LIMIT 1`,
      [productID]
    );
    return result.rows[0] || { imageid: 0, imglink: '', imgalt: '' };
  } catch {
    return { imageid: 0, imglink: '', imgalt: '' };
  }
};

const review = async (productID: number) => {
  try {
    const result = await client.query(`SELECT reviewid FROM reviews WHERE productid = $1`, [productID]);
    return result.rowCount || 0;
  } catch {
    return 0;
  }
};

const getColors = async (productID: number) => {
  try {
    const result = await client.query(`SELECT colorid, colorname, colorclass FROM productcolors WHERE productid = $1`, [productID]);
    return result.rows;
  } catch {
    return [];
  }
};

const getSizes = async (productID: number) => {
  try {
    const result = await client.query(`SELECT sizeid, sizename, instock FROM productsizes WHERE productid = $1`, [productID]);
    return result.rows;
  } catch {
    return [];
  }
};

async function enrichProducts(rows: any[]) {
  const products = await Promise.all(
    rows.map(async (product) => {
      const productID = Number(product.productid);
      const [colors, sizes, reviewCount, images] = await Promise.all([
        getColors(productID),
        getSizes(productID),
        review(productID),
        getImage(productID),
      ]);
      return { ...product, colors, sizes, reviewCount, images };
    })
  );
  return products;
}

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
`;

async function fetchProductsByCategory(categoryid: number) {
  const response = await client.query(
    `${productSelect} WHERE products.categoryid = $1 AND products.is_active = true ORDER BY products.productid DESC`,
    [categoryid]
  );
  return enrichProducts(response.rows);
}

async function getAllCategories() {
  const response = await client.query(`SELECT categoryid, name, slug, maincategory FROM ${categoryTable} ORDER BY categoryid`);
  return response.rows;
}

function buildProductCatalogConditions(req: Request, params: any[], startIndex: number) {
  let sql = '';
  let index = startIndex;
  const { age_group, gender, material, skill_type, brand, collection_id } = req.query;

  if (age_group) {
    sql += ` AND products.age_group = $${index++}`;
    params.push(age_group);
  }
  if (gender) {
    sql += ` AND LOWER(products.gender) = LOWER($${index++})`;
    params.push(gender);
  }
  if (material) {
    sql += ` AND products.material = $${index++}`;
    params.push(material);
  }
  if (skill_type) {
    sql += ` AND products.skill_type = $${index++}`;
    params.push(skill_type);
  }
  if (brand) {
    sql += ` AND LOWER(products.brand) = LOWER($${index++})`;
    params.push(brand);
  }
  if (collection_id) {
    sql += ` AND EXISTS (
      SELECT 1 FROM collection_products cp
      WHERE cp.productid = products.productid AND cp.collection_id = $${index++}
    )`;
    params.push(Number(collection_id));
  }
  return sql;
}

router.get('/articles', async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`SELECT * FROM ${articleTable}`);
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/category/:category', categorySchema, async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) return res.status(500).json({ error: 'Validation Error' });

  const categoryParam = String(req.params.category || '').toLowerCase();

  try {
    const allCategories = await getAllCategories();

    if (categoryParam === 'new-arrival') {
      const response = await client.query(
        `${productSelect}
         WHERE products.is_active = true AND productparams.isnew = true
         ORDER BY products.createdat DESC, products.productid DESC
         LIMIT 48`
      );
      return res.status(200).json({ data: { categories: allCategories, products: await enrichProducts(response.rows) } });
    }

    if (categoryParam === 'best-sellers') {
      const response = await client.query(
        `${productSelect}
         WHERE products.is_active = true
         ORDER BY productparams.sold DESC, productparams.rating DESC, productparams.views DESC
         LIMIT 48`
      );
      return res.status(200).json({ data: { categories: allCategories, products: await enrichProducts(response.rows) } });
    }

    if (categoryParam === 'sale') {
      const response = await client.query(
        `${productSelect}
         WHERE products.is_active = true
           AND (productparams.issale = true OR productparams.isdiscount = true OR COALESCE(products.discount, 0) > 0)
         ORDER BY COALESCE(products.discount, 0) DESC, products.productid DESC
         LIMIT 48`
      );
      return res.status(200).json({ data: { categories: allCategories, products: await enrichProducts(response.rows) } });
    }

    const matchedCategory = allCategories.find(
      (c: any) => slugify(c.slug) === categoryParam || slugify(c.name) === categoryParam || slugify(c.maincategory) === categoryParam
    );

    if (!matchedCategory) {
      return res.status(200).json({ data: { categories: allCategories, products: [] } });
    }

    const siblingCategories = allCategories.filter((c: any) => c.maincategory === matchedCategory.maincategory);
    const products = await fetchProductsByCategory(Number(matchedCategory.categoryid));
    return res.status(200).json({ data: { categories: siblingCategories.length ? siblingCategories : allCategories, products } });
  } catch (error) {
    console.error('/category/:category error:', error);
    return res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/filter/category/:minPrice/:maxPrice/:categoryID/:minRating/:categoryName', filterSchema, async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) return res.status(500).json({ error: 'Validation Error' });

  const { minPrice, maxPrice, categoryID, minRating, categoryName } = matchedData(req);
  const categoryParam = String(categoryName || '').toLowerCase();

  try {
    const params: any[] = [minPrice, maxPrice, minRating];
    let where = `WHERE products.is_active = true AND products.price >= $1 AND products.price <= $2 AND productparams.stars >= $3`;

    if (Number(categoryID) !== 0) {
      params.push(Number(categoryID));
      where += ` AND products.categoryid = $${params.length}`;
    } else if (categoryParam === 'new-arrival') {
      where += ` AND productparams.isnew = true`;
    } else if (categoryParam === 'best-sellers') {
      // không thêm điều kiện, chỉ sắp xếp theo bán chạy ở dưới
    } else if (categoryParam === 'sale') {
      where += ` AND (productparams.issale = true OR productparams.isdiscount = true OR COALESCE(products.discount, 0) > 0)`;
    } else {
      params.push(categoryParam);
      where += ` AND EXISTS (
        SELECT 1 FROM categories c
        WHERE c.categoryid = products.categoryid
          AND (LOWER(c.slug) = $${params.length} OR LOWER(REPLACE(c.maincategory, ' ', '-')) = $${params.length})
      )`;
    }

    const extra = buildProductCatalogConditions(req, params, params.length + 1);
    const orderBy = categoryParam === 'best-sellers'
      ? 'ORDER BY productparams.sold DESC, productparams.rating DESC, productparams.views DESC'
      : categoryParam === 'sale'
        ? 'ORDER BY COALESCE(products.discount, 0) DESC, products.productid DESC'
        : 'ORDER BY products.productid DESC';

    const response = await client.query(`${productSelect} ${where} ${extra} ${orderBy}`, params);
    return res.status(200).json({ data: await enrichProducts(response.rows) });
  } catch (error) {
    console.error('filter/category error:', error);
    return res.status(500).json({ error: 'failed' });
  }
});

router.get('/filter/category-only/:categoryID/:categoryName', getCategorySchema, async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) return res.status(500).json({ error: 'Validation Error' });

  const { categoryID, categoryName } = matchedData(req);
  const categoryParam = String(categoryName || '').toLowerCase();

  try {
    const params: any[] = [];
    let where = `WHERE products.is_active = true`;

    if (Number(categoryID) !== 0) {
      params.push(Number(categoryID));
      where += ` AND products.categoryid = $${params.length}`;
    } else if (categoryParam === 'new-arrival') {
      where += ` AND productparams.isnew = true`;
    } else if (categoryParam === 'best-sellers') {
      // không thêm điều kiện, chỉ sắp xếp theo bán chạy ở dưới
    } else if (categoryParam === 'sale') {
      where += ` AND (productparams.issale = true OR productparams.isdiscount = true OR COALESCE(products.discount, 0) > 0)`;
    } else {
      params.push(categoryParam);
      where += ` AND EXISTS (
        SELECT 1 FROM categories c
        WHERE c.categoryid = products.categoryid
          AND (LOWER(c.slug) = $${params.length} OR LOWER(REPLACE(c.maincategory, ' ', '-')) = $${params.length})
      )`;
    }

    const extra = buildProductCatalogConditions(req, params, params.length + 1);
    const orderBy = categoryParam === 'best-sellers'
      ? 'ORDER BY productparams.sold DESC, productparams.rating DESC, productparams.views DESC'
      : categoryParam === 'sale'
        ? 'ORDER BY COALESCE(products.discount, 0) DESC, products.productid DESC'
        : categoryParam === 'new-arrival'
          ? 'ORDER BY products.createdat DESC, products.productid DESC'
          : 'ORDER BY products.productid DESC';

    const response = await client.query(`${productSelect} ${where} ${extra} ${orderBy}`, params);
    return res.status(200).json({ data: await enrichProducts(response.rows) });
  } catch (error) {
    console.error('filter/category-only error:', error);
    return res.status(500).json({ error: 'Failed' });
  }
});

async function searchProducts(productName: string) {
  const query = `${productSelect}
    WHERE products.is_active = true AND (
      products.title ILIKE '%' || $1 || '%'
      OR products.description ILIKE '%' || $1 || '%'
      OR products.tags ILIKE '%' || $1 || '%'
    )`;
  const response = await client.query(query, [productName]);
  return enrichProducts(response.rows);
}

async function searchFilteredProducts(productName: string, minPrice: string, maxPrice: string, rating: string) {
  const query = `${productSelect}
    WHERE products.is_active = true
      AND products.price >= $2
      AND products.price <= $3
      AND productparams.stars >= $4
      AND (
        products.title ILIKE '%' || $1 || '%'
        OR products.description ILIKE '%' || $1 || '%'
        OR products.tags ILIKE '%' || $1 || '%'
      )`;
  const response = await client.query(query, [productName, minPrice, maxPrice, rating]);
  return enrichProducts(response.rows);
}

const removeDuplicates = (products: any[]) => {
  const seen = new Set();
  return products.filter((product) => {
    const duplicate = seen.has(product.productid);
    seen.add(product.productid);
    return !duplicate;
  });
};

router.get('/search/product/:productName', getProductNameSchema, async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) return res.status(500).json({ error: 'Validation Error' });

  const { productName } = req.params;
  try {
    const products = await Promise.all(productName.split('-').map((each) => searchProducts(each)));
    return res.status(200).json({ data: removeDuplicates(products.flat()) });
  } catch {
    return res.sendStatus(500);
  }
});

router.get('/search/filtered-product/:productName/:minPrice/:maxPrice/:rating', async (req: Request, res: Response) => {
  const { productName, minPrice, maxPrice, rating } = req.params;
  try {
    const products = await Promise.all(productName.split('-').map((each) => searchFilteredProducts(each, minPrice, maxPrice, rating)));
    return res.status(200).json({ data: removeDuplicates(products.flat()) });
  } catch {
    return res.sendStatus(500);
  }
});

const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);
const formatSubCategory = (string: string) => string.split('-').map((word) => capitalizeFirstLetter(word)).join(' ');

router.get('/sub-category/:mainCategory/:subCategory', MainSubCategorySchema, async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) return res.status(500).json({ error: 'Validation Error' });

  const { mainCategory, subCategory } = matchedData(req);
  const formattedSubCategory = formatSubCategory(subCategory);

  try {
    const queryCategory = await client.query(
      `SELECT categoryid FROM categories WHERE LOWER(slug) = LOWER($1) OR LOWER(name) = LOWER($2) LIMIT 1`,
      [subCategory, formattedSubCategory]
    );
    if (queryCategory.rows.length > 0) {
      const categoryID = Number(queryCategory.rows[0].categoryid);
      const products = await fetchProductsByCategory(categoryID);
      return res.status(200).json({ data: products, categoryid: categoryID });
    }
    return res.status(200).json({ data: [], categoryid: 0 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.get('/sub-category/filtered-product/:categoryID/:minPrice/:maxPrice/:rating', categoryFilterSchema, async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) return res.status(500).json({ error: 'Validation Error' });

  const { categoryID, minPrice, maxPrice, rating } = matchedData(req);
  try {
    const response = await client.query(
      `${productSelect}
       WHERE products.is_active = true
         AND products.categoryid = $1
         AND products.price >= $2
         AND products.price <= $3
         AND productparams.stars >= $4
       ORDER BY products.productid DESC`,
      [Number(categoryID), minPrice, maxPrice, rating]
    );
    return res.status(200).json({ data: await enrichProducts(response.rows) });
  } catch {
    return res.sendStatus(500);
  }
});

export default router;
