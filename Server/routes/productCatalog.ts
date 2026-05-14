import express, { Request, Response } from 'express';
import { client } from '../data/DB';

const router = express.Router();

const toInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// GET /catalog/products?ageGroup=6-8&gender=unisex&material=Nhựa ABS&skillType=Tư duy&brandID=1001&collectionID=3001&page=1&pageSize=12
router.get('/catalog/products', async (req: Request, res: Response) => {
  const {
    ageGroup,
    gender,
    material,
    skillType,
    brandID,
    collectionID,
    search,
    page = '1',
    pageSize = '12',
  } = req.query;

  const values: any[] = [];
  const where: string[] = [];
  let joinCollection = '';

  const addFilter = (sql: string, value: unknown) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      values.push(value);
      where.push(sql.replace('?', `$${values.length}`));
    }
  };

  addFilter('p.age_group = ?', ageGroup);
  addFilter('p.gender = ?', gender);
  addFilter('p.material = ?', material);
  addFilter('p.skill_type = ?', skillType);
  addFilter('p.brandid = ?', brandID);

  if (search && String(search).trim()) {
    values.push(`%${String(search).trim()}%`);
    where.push(`(p.title ILIKE $${values.length} OR p.description ILIKE $${values.length})`);
  }

  if (collectionID) {
    joinCollection = 'INNER JOIN collection_products cp ON cp.productid = p.productid';
    addFilter('cp.collectionid = ?', collectionID);
  }

  const currentPage = toInt(page, 1);
  const limit = Math.min(toInt(pageSize, 12), 60);
  const offset = (currentPage - 1) * limit;

  values.push(limit, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT
      p.productid,
      p.title,
      p.description,
      p.price,
      p.discount,
      p.stock,
      p.age_group,
      p.gender,
      p.material,
      p.skill_type,
      pi.imglink,
      pi.imgalt,
      b.brandid,
      b.name AS brandname,
      b.manufacturer,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'certificateid', bc.certificateid,
          'name', bc.name,
          'certificate_code', bc.certificate_code,
          'issued_by', bc.issued_by
        )) FILTER (WHERE bc.certificateid IS NOT NULL),
        '[]'
      ) AS certificates,
      COUNT(*) OVER() AS totalcount
    FROM products p
    LEFT JOIN productimages pi ON pi.productid = p.productid AND pi.isprimary = true
    LEFT JOIN brands b ON b.brandid = p.brandid
    LEFT JOIN brand_certificates bc ON bc.brandid = b.brandid
    ${joinCollection}
    ${whereSql}
    GROUP BY p.productid, pi.imglink, pi.imgalt, b.brandid, b.name, b.manufacturer
    ORDER BY p.productid DESC
    LIMIT ${limitParam} OFFSET ${offsetParam};
  `;

  try {
    const result = await client.query(sql, values);
    const total = result.rows[0]?.totalcount ? Number(result.rows[0].totalcount) : 0;
    res.status(200).json({
      data: result.rows.map(({ totalcount, ...row }) => row),
      pagination: { page: currentPage, pageSize: limit, total },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/catalog/filters', async (_req: Request, res: Response) => {
  try {
    const [brands, collections] = await Promise.all([
      client.query(`SELECT brandid, name, manufacturer, country, logo FROM brands ORDER BY name`),
      client.query(`SELECT collectionid, name, slug, description, banner FROM collections WHERE isactive = true ORDER BY name`),
    ]);

    res.status(200).json({
      data: {
        ageGroups: ['0-2', '3-5', '6-8', '9-12', '13+'],
        genders: [
          { value: 'unisex', label: 'Unisex' },
          { value: 'boy', label: 'Bé trai' },
          { value: 'girl', label: 'Bé gái' },
        ],
        materials: ['Gỗ', 'Nhựa ABS', 'Vải'],
        skillTypes: ['Tư duy', 'Vận động', 'Ngôn ngữ'],
        brands: brands.rows,
        collections: collections.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/catalog/collections/:collectionID', async (req: Request, res: Response) => {
  try {
    const result = await client.query(
      `SELECT collectionid, name, slug, description, banner, isactive FROM collections WHERE collectionid = $1`,
      [req.params.collectionID]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Collection not found' });
    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
