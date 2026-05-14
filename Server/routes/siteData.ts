import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import { categoryFilterSchema, categorySchema, filterSchema, getCategorySchema, getProductNameSchema, MainSubCategorySchema } from '../validators/siteDataValidation';
import { matchedData, validationResult } from 'express-validator';
const router = express.Router();
const articleTable = 'articles';
const categoryTable = 'categories';
const productTable = 'products';
router.get('/articles',async (req:Request,res:Response)=>{
    const query = `SELECT * FROM ${articleTable}`
    try {
        const response = await client.query(query);
        res.status(200).json({data:response.rows});
    } catch (error) {
        res.status(404).json({error:'Server Error'});
    }
});
const fetchProducts = async (categoryid:number) => {
    const query = `SELECT products.productid,products.title,categories.name AS category,products.price,products.discount,productparams.stars,productparams.isnew,productparams.issale,productparams.isdiscount FROM products 
    INNER JOIN categories ON products.categoryid = categories.categoryid 
    INNER JOIN productparams ON products.productid = productparams.productid
    WHERE products.categoryid = $1`;
    try {
        const response = await client.query(query, [categoryid]);
        if (response.rows.length === 0) return [];

        const products = await Promise.all(
            response.rows.map(async (product) => {
                const productID = product.productid;

                const [colors, sizes, reviewCount,images] = await Promise.all([
                    getColors(productID),
                    getSizes(productID),
                    review(productID),
                    getImage(productID)
                ]);

                return {
                    ...product,
                    colors,
                    sizes,
                    reviewCount,
                    images
                };
            })
        );

        return products;
    } catch (error) {
        return [];
    }
};

const review = async (productID:number) => {
    try {
        const result = await client.query(
            `SELECT reviews.reviewid
             FROM reviews 
             INNER JOIN users ON users.userid = reviews.userid 
             WHERE productid = $1 `,
            [productID]
        );
        return result.rowCount === 0 ? 0 : result.rowCount;
    } catch (error) {
        return 0;
    }
};

const getColors = async (productID:number) => {
    try {
        const result = await client.query(
            `SELECT colorid, colorname, colorclass 
             FROM productcolors 
             WHERE productid = $1`,
            [productID]
        );
        return result.rows.length === 0 ? [] : result.rows;
    } catch (error) {
        return [];
    }
};

const getSizes = async (productID:number) => {
    try {
        const result = await client.query(
            `SELECT sizeid, sizename, instock 
             FROM productsizes 
             WHERE productid = $1`,
            [productID]
        );
        return result.rows.length === 0 ? [] : result.rows;
    } catch (error) {
        return [];
    }
};
const getImage = async (productID:number) => {
    try {
        const result = await client.query(
            `SELECT imageid, imglink, imgalt 
             FROM productimages 
             WHERE productid = $1 AND isprimary = true`,
            [productID]
        );
        return result.rows[0];
    } catch (error) {
        return {imageid:0,imglink:'',imgalt:''};
    }
};
router.get('/category/:category',categorySchema,async (req:Request, res:Response) => {
    if(validationResult(req).isEmpty()){
        const { category } = req.params;
        const query = `SELECT categoryid, name FROM ${categoryTable} WHERE maincategory = $1`;
        const value = [category.toUpperCase()];
    
        try {
            const response = await client.query(query, value);
            const productsPromises = response.rows.map(each => fetchProducts(each.categoryid));
            const products = await Promise.all(productsPromises);
    
            const data = {
                categories: response.rows,
                products: products.flat() // Flatten the array of products
            };
    
            res.status(200).json({ data });
        } catch (error) {
            res.status(500).json({ error: 'Server Error' });
        }
    }else res.status(500).json({error:'Validation Error'})
});
const fetchFilteredProducts = async (minPrice:string,maxPrice:string,categoryID:number,minRating:string) => {
    const query = `SELECT products.productid,products.title,categories.name AS category,products.price,products.discount,productparams.stars,productparams.isnew,productparams.issale,productparams.isdiscount FROM products 
    INNER JOIN categories ON products.categoryid = categories.categoryid 
    INNER JOIN productparams ON products.productid = productparams.productid
    WHERE products.categoryid = $1 AND products.discount >= $2 AND products.discount <= $3 AND productparams.stars >= $4`;
    try {
        const response = await client.query(query, [categoryID,minPrice,maxPrice,minRating]);
        if (response.rows.length === 0) return [];

        const products = await Promise.all(
            response.rows.map(async (product) => {
                const productID = product.productid;

                const [colors, sizes, reviewCount,images] = await Promise.all([
                    getColors(productID),
                    getSizes(productID),
                    review(productID),
                    getImage(productID)
                ]);

                return {
                    ...product,
                    colors,
                    sizes,
                    reviewCount,
                    images
                };
            })
        );

        return products;
    } catch (error) {
        return [];
    }
};
async function enrichProducts(rows: any[]) {
  if (rows.length === 0) return [];

  const products = await Promise.all(
    rows.map(async (product) => {
      const productID = product.productid;

      const [colors, sizes, reviewCount, images] = await Promise.all([
        getColors(productID),
        getSizes(productID),
        review(productID),
        getImage(productID),
      ]);

      return {
        ...product,
        colors,
        sizes,
        reviewCount,
        images,
      };
    })
  );

  return products;
}

function buildProductCatalogConditions(
  req: Request,
  params: any[],
  startIndex: number
) {
  let sql = "";
  let index = startIndex;

  const {
    age_group,
    gender,
    material,
    skill_type,
    brand,
    collection_id,
  } = req.query;

  if (age_group) {
    sql += ` AND products.age_group = $${index++}`;
    params.push(age_group);
  }

  if (gender) {
    sql += ` AND products.gender = $${index++}`;
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
    // Hỗ trợ cả cột products.brand (text) hoặc join theo brands.name
    sql += ` AND (products.brand = $${index} OR EXISTS (
      SELECT 1
      FROM brands b
      WHERE b.brandid = products.brandid
        AND b.name = $${index}
    ))`;
    params.push(brand);
    index++;
  }

  if (collection_id) {
    sql += ` AND EXISTS (
      SELECT 1
      FROM collection_products cp
      WHERE cp.product_id = products.productid
        AND cp.collection_id = $${index}
    )`;
    params.push(Number(collection_id));
    index++;
  }

  return { sql, nextIndex: index };
}

// ============================================================
// GET /api/filter/category/:minPrice/:maxPrice/:categoryID/:minRating/:categoryName
// ============================================================
router.get(
  '/filter/category/:minPrice/:maxPrice/:categoryID/:minRating/:categoryName',
  filterSchema,
  async (req: Request, res: Response) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(500).json({ error: 'Validation Error' });
    }

    const {
      minPrice,
      maxPrice,
      categoryID,
      minRating,
      categoryName,
    } = matchedData(req);

    try {
      const baseQuery = `
        SELECT
          products.productid,
          products.title,
          categories.name AS category,
          products.price,
          products.discount,
          productparams.stars,
          productparams.isnew,
          productparams.issale,
          productparams.isdiscount
        FROM products
        INNER JOIN categories
          ON products.categoryid = categories.categoryid
        INNER JOIN productparams
          ON products.productid = productparams.productid
      `;

      if (categoryID != 0) {
        const params: any[] = [
          categoryID,
          minPrice,
          maxPrice,
          minRating,
        ];

        let query = `
          ${baseQuery}
          WHERE products.categoryid = $1
            AND products.price >= $2
            AND products.price <= $3
            AND productparams.stars >= $4
        `;

        const extra = buildProductCatalogConditions(req, params, 5);
        query += extra.sql + ' ORDER BY products.productid DESC';

        const response = await client.query(query, params);
        const products = await enrichProducts(response.rows);

        return res.status(200).json({ data: products });
      }

      // categoryID = 0 => lấy tất cả category thuộc main category
      const categoryResponse = await client.query(
        `SELECT categoryid FROM ${categoryTable} WHERE maincategory = $1`,
        [String(categoryName).toUpperCase()]
      );

      const allProducts: any[] = [];

      for (const row of categoryResponse.rows) {
        const params: any[] = [
          row.categoryid,
          minPrice,
          maxPrice,
          minRating,
        ];

        let query = `
          ${baseQuery}
          WHERE products.categoryid = $1
            AND products.price >= $2
            AND products.price <= $3
            AND productparams.stars >= $4
        `;

        const extra = buildProductCatalogConditions(req, params, 5);
        query += extra.sql;

        const response = await client.query(query, params);
        allProducts.push(...response.rows);
      }

      const products = await enrichProducts(allProducts);
      return res.status(200).json({ data: products });
    } catch (error) {
      console.error('filter/category error:', error);
      return res.status(500).json({ error: 'failed' });
    }
  }
);

// ============================================================
// GET /api/filter/category-only/:categoryID/:categoryName
// ============================================================
router.get(
  '/filter/category-only/:categoryID/:categoryName',
  getCategorySchema,
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(500).json({ error: 'Validation Error' });
    }

    const { categoryID, categoryName } = matchedData(req);

    try {
      const baseQuery = `
        SELECT
          products.productid,
          products.title,
          categories.name AS category,
          products.price,
          products.discount,
          productparams.stars,
          productparams.isnew,
          productparams.issale,
          productparams.isdiscount
        FROM products
        INNER JOIN categories
          ON products.categoryid = categories.categoryid
        INNER JOIN productparams
          ON products.productid = productparams.productid
      `;

      if (categoryID != 0) {
        const params: any[] = [categoryID];

        let query = `
          ${baseQuery}
          WHERE products.categoryid = $1
        `;

        const extra = buildProductCatalogConditions(req, params, 2);
        query += extra.sql + ' ORDER BY products.productid DESC';

        const response = await client.query(query, params);
        const products = await enrichProducts(response.rows);

        return res.status(200).json({ data: products });
      }

      const categoryResponse = await client.query(
        `SELECT categoryid FROM ${categoryTable} WHERE maincategory = $1`,
        [String(categoryName).toUpperCase()]
      );

      const allProducts: any[] = [];

      for (const row of categoryResponse.rows) {
        const params: any[] = [row.categoryid];

        let query = `
          ${baseQuery}
          WHERE products.categoryid = $1
        `;

        const extra = buildProductCatalogConditions(req, params, 2);
        query += extra.sql;

        const response = await client.query(query, params);
        allProducts.push(...response.rows);
      }

      const products = await enrichProducts(allProducts);
      return res.status(200).json({ data: products });
    } catch (error) {
      console.error('filter/category-only error:', error);
      return res.status(500).json({ error: 'Failed' });
    }
  }
);async function searchProducts(productName:string){
    const query = `SELECT products.productid, products.title, categories.name AS category, 
        products.price, products.discount, productparams.stars, 
        productparams.isnew, productparams.issale, productparams.isdiscount 
        FROM products 
        INNER JOIN categories ON products.categoryid = categories.categoryid 
        INNER JOIN productparams ON products.productid = productparams.productid
        WHERE products.title ILIKE '%' || $1 || '%' 
        OR products.description ILIKE '%' || $1 || '%' 
        OR products.tags ILIKE '%' || $1 || '%'`;
    try {
        const response = await client.query(query, [productName]);
        if (response.rows.length === 0) return [];

        const products = await Promise.all(
            response.rows.map(async (product) => {
                const productID = product.productid;

                const [colors, sizes, reviewCount,images] = await Promise.all([
                    getColors(productID),
                    getSizes(productID),
                    review(productID),
                    getImage(productID)
                ]);

                return {
                    ...product,
                    colors,
                    sizes,
                    reviewCount,
                    images
                };
            })
        );

        return products;
    } catch (error) {
        return [];
    }
}
async function searchFilteredProducts(productName:string,minPrice:string,maxPrice:string,rating:string){
    const query = `SELECT products.productid, products.title, categories.name AS category, 
       products.price, products.discount, productparams.stars, 
       productparams.isnew, productparams.issale, productparams.isdiscount 
        FROM products 
        INNER JOIN categories ON products.categoryid = categories.categoryid 
        INNER JOIN productparams ON products.productid = productparams.productid
        WHERE products.discount >= $2 
        AND products.discount <= $3 
        AND productparams.stars >= $4 
        AND (
      products.title ILIKE '%' || $1 || '%' 
      OR products.description ILIKE '%' || $1 || '%' 
      OR products.tags ILIKE '%' || $1 || '%')`;
    try {
        const response = await client.query(query, [productName,minPrice,maxPrice,rating]);
        if (response.rows.length === 0) return [];

        const products = await Promise.all(
            response.rows.map(async (product) => {
                const productID = product.productid;

                const [colors, sizes, reviewCount,images] = await Promise.all([
                    getColors(productID),
                    getSizes(productID),
                    review(productID),
                    getImage(productID)
                ]);

                return {
                    ...product,
                    colors,
                    sizes,
                    reviewCount,
                    images
                };
            })
        );

        return products;
    } catch (error) {
        return [];
    }
}
const removeDuplicates = (products: any[]) => {
    const seen = new Set();
    return products.filter(product => {
      const duplicate = seen.has(product.productid);
      seen.add(product.productid);
      return !duplicate;
    });
};
router.get('/search/product/:productName',getProductNameSchema, async(req:Request,res:Response)=>{
    if(validationResult(req).isEmpty()){
        const {productName} = req.params;
        const filteredProductName = productName.split('-');
        try {
            const productsPromises = filteredProductName.map(each => searchProducts(each));
            const products = await Promise.all(productsPromises);
            const flatProducts = products.flat();
            const uniqueProducts = removeDuplicates(flatProducts);
            res.status(200).json({data:uniqueProducts});
        } catch (error) {
            res.status(500)
        }
    }else res.status(500).json({error:'Validation Error'})
});
router.get('/search/filtered-product/:productName/:minPrice/:maxPrice/:rating',async(req:Request,res:Response)=>{
    if(validationResult(req).isEmpty()){
        const {productName,minPrice,maxPrice,rating} = req.params;
        const filteredProductName = productName.split('-');
        try {
            const productsPromises = filteredProductName.map(each => searchFilteredProducts(each,minPrice,maxPrice,rating));
            const products = await Promise.all(productsPromises);
            const flatProducts = products.flat();
            const uniqueProducts = removeDuplicates(flatProducts);
            return res.status(200).json({data:uniqueProducts});
        } catch (error) {
            return res.sendStatus(500);
        }
    }else res.status(500).json({error:'Validation Error'})
    
});
// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};
  
// Helper function to format subCategory
const formatSubCategory = (string: string) => {
    return string
    .split('-')
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
};
router.get('/sub-category/:mainCategory/:subCategory',MainSubCategorySchema, async (req: Request, res: Response) => {
    if(validationResult(req).isEmpty()){
        const { mainCategory, subCategory } = matchedData(req);
  
        // Capitalize mainCategory
        const formattedMainCategory = mainCategory.toUpperCase();
      
        // Format subCategory
        const formattedSubCategory = formatSubCategory(subCategory);
        const query = `SELECT categoryid FROM categories WHERE maincategory = $1 AND name = $2`;
        try {
          // Assuming you have a function to query the database
          const queryCategory = await client.query(query,[formattedMainCategory,formattedSubCategory]);
          if(queryCategory.rows.length > 0) {
            const categoryID = queryCategory.rows[0].categoryid;
            const products = await fetchProducts(categoryID);
            return res.status(200).json({data:products,categoryid:categoryID});
          }
          res.status(200).json({data:[],categoryid:0});
        } catch (error) {
          console.error('Error fetching data:', error);
          return res.status(500).json({ error: 'Failed to fetch data' });
        }
    }else res.status(500).json({error:'Validation Error'})
});
router.get('/sub-category/filtered-product/:categoryID/:minPrice/:maxPrice/:rating',categoryFilterSchema,async(req:Request,res:Response)=>{
    if(validationResult(req).isEmpty()){
        const {categoryID,minPrice,maxPrice,rating} = matchedData(req);
        try {
            const products = await Promise.all(await fetchFilteredProducts(minPrice,maxPrice,parseInt(categoryID),rating));
            res.status(200).json({data:products});
        } catch (error) {
            res.status(500)
        }
    }else res.status(500).json({error:'Validation Error'})
});
export default router;