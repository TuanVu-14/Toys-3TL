import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import jwt from 'jsonwebtoken';
import { AddressInsertSchema, cartActionSchema, cartItemSchema, orderSchema, userIDSchema, userTokenSchema, wishlistActionSchema, wishlistRemoveSchema } from '../validators/userDetailsValidation';
import { matchedData, validationResult } from 'express-validator';
const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;
const IDGenerator = ()=>{
    const ID = Math.round(Math.random() * 1000 * 1000 * 100);
    return ID;
}
interface JwtPayload {
    userID: number;
    iat: number;
    exp: number;
}
const fetchAddresses = async (userID: number) => {
    const query = `
        SELECT addressID, userID, addressType, userName, contactNumber, addressLine1, addressLine2, city, state, country, postalCode, is_default
        FROM Addresses
        WHERE userID = $1;
    `;
    const values = [userID];
    const result = await client.query(query, values);
    return result.rows;
};


const fetchCartItems = async (userID: number) => {
  const cartQuery = `
    SELECT
      cartitems.cartitemid AS "cartItemID",
      cartitems.productid AS "productID",
      cartitems.quantity,
      products.title AS "productName",
      products.price AS "productPrice",
      products.stock AS "productStock",
      productimages.imglink AS "productImg",
      productimages.imgalt AS "productAlt"
    FROM cartitems
    INNER JOIN products ON cartitems.productid = products.productid
    LEFT JOIN productimages ON cartitems.productid = productimages.productid AND productimages.isprimary = true
    WHERE cartitems.userid = $1;
  `;
  const cartValues = [userID];
  const cartResult = await client.query(cartQuery, cartValues);
  return cartResult.rows;
};

const fetchWishlistItems = async (userID: number) => {
  const query = `
    SELECT
      wishlistitems.wishlistitemid AS "wishlistItemID",
      wishlistitems.productid AS "productID",
      products.title AS "productName",
      products.price AS "productPrice",
      productimages.imglink AS "productImg",
      productimages.imgalt AS "productAlt"
    FROM wishlistitems
    INNER JOIN products ON wishlistitems.productid = products.productid
    LEFT JOIN productimages ON products.productid = productimages.productid AND productimages.isprimary = true
    WHERE wishlistitems.userid = $1;
  `;
  const values = [userID];
  const result = await client.query(query, values);
  return result.rows;
};

const fetchCoupons = async (userID: number) => {
    const query = `SELECT usercoupons.couponid,coupons.code,coupons.description,coupons.discountpercentage,coupons.maxdiscountamount,coupons.minpurchaseamount,coupons.validuntil 
    FROM usercoupons 
    INNER JOIN coupons ON usercoupons.couponid = coupons.couponid 
    WHERE usercoupons.userid = $1 ORDER BY usercoupons.createdat DESC`;
    const values = [userID];
    const result = await client.query(query, values);
    return result.rows;
};
const fetchGiftCards = async (email:string)=>{
    const query = `SELECT cardid,cardname,cardcode,description,balance,currency,expirydate,sendername,message,status FROM giftcards WHERE recipientemail = $1`
    const values = [email];
    const result = await client.query(query,values);
    return result.rows;
}
router.post('/user/addresses',userIDSchema, async (req: Request, res: Response) => {
    const result = validationResult(req);
    if(result.isEmpty()){
        const { userID } = matchedData(req);
        try {
            // Query to fetch addresses by userID, excluding createdAt and updatedAt
              
            const query = `
                SELECT addressID, addressType, contactNumber, addressLine1, addressLine2, city, state, country, postalCode, userName, is_default
                FROM Addresses
                WHERE userID = $1;
            `;
            const values = [userID];
    
            const result = await client.query(query, values);
    
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No addresses found for this user' });
            }
            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }else
    {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
    
});
router.post('/user/cart-items',userIDSchema, async (req: Request, res: Response) => {
    const result = validationResult(req);
    if(result.isEmpty()){
        const { userID } = matchedData(req);
        try {
            // Query to fetch cart items by userID
            const query = `
  SELECT
    cartitems.cartitemid AS "cartItemID",
    cartitems.productid AS "productID",
    cartitems.quantity,
    products.title AS "productName",
    products.price AS "productPrice",
    products.stock AS "productStock",
    productimages.imglink AS "productImg",
    productimages.imgalt AS "productAlt"
  FROM cartitems
  INNER JOIN products ON cartitems.productid = products.productid
  LEFT JOIN productimages ON cartitems.productid = productimages.productid AND productimages.isprimary = true
  WHERE cartitems.userid = $1;
`;


            const values = [userID];
    
            const result = await client.query(query, values);
    
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No cart items found for this user' });
            }
            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }else
    {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
    
});

router.post('/user/wishlist-items', userIDSchema, async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
        const { userID } = matchedData(req);
        const query = `
            SELECT
                wishlistitems.wishlistitemid AS "wishlistItemID",
                wishlistitems.productid AS "productID",
                products.title AS "productName",
                products.price AS "productPrice",
                productimages.imglink AS "productImg",
                productimages.imgalt AS "productAlt"
            FROM wishlistitems
            INNER JOIN products ON wishlistitems.productid = products.productid
            LEFT JOIN productimages ON products.productid = productimages.productid AND productimages.isprimary = true
            WHERE wishlistitems.userid = $1;
        `;
        const values = [userID];
        try {
            const result = await client.query(query, values);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No wishlist items found for this user' });
            }
            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
});

router.post('/user/coupons',userIDSchema, async (req: Request, res: Response) => {
    const result = validationResult(req);
    if(result.isEmpty()){
        const { userID } = matchedData(req);
        const query = `SELECT usercoupons.couponid,coupons.code,coupons.description,coupons.discountpercentage,coupons.maxdiscountamount,coupons.minpurchaseamount,coupons.validuntil FROM usercoupons INNER JOIN coupons ON usercoupons.couponid = coupons.couponid WHERE usercoupons.userid = $1 ORDER BY usercoupons.createdat DESC`
        try {
            const values = [userID];
            const result = await client.query(query,values);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No coupons found for this user' });
            }
            res.status(200).json(
                {data:result.rows}
            );
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }else
    {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
});
router.post('/user/all-data',userTokenSchema, async (req: Request, res: Response) => {
    const result = validationResult(req);
    if(result.isEmpty()){
        const { userIDToken } = matchedData(req);
        try {
            const userID = jwt.verify(userIDToken,JWT_SECRET) as JwtPayload;
            const [addresses, cartItems, wishlistItems,coupons] = await Promise.all([
                fetchAddresses(userID.userID),
                fetchCartItems(userID.userID),
                fetchWishlistItems(userID.userID),
                fetchCoupons(userID.userID),
            ]);
            const getEmail = await client.query(`SELECT email FROM users WHERE userid = $1`,[userID.userID]);
            const giftcards = await fetchGiftCards(getEmail.rows[0].email);
            res.status(200).json({
                addresses,
                cartItems,
                wishlistItems,
                coupons,
                giftcards
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }else
    {
        res.status(500).json({ message: 'Validation error' });
    }
});
router.post('/user/insert/address',AddressInsertSchema,async(req:Request,res:Response)=>{
    const result = validationResult(req);
    if(result.isEmpty()){
        const {userID,addressType,userName,contactNumber,addressLine1,addressLine2,city,state,country,postalCode} = matchedData(req);
        const addressID = IDGenerator();
        const query = `INSERT INTO addresses(addressid,userid,addresstype,username,contactnumber,addressline1,addressline2,city,state,country,postalcode,is_default)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false)`
        const values = [addressID,userID,addressType,userName,contactNumber,addressLine1,addressLine2,city,state,country,postalCode];
        try {
            await client.query(query,values);
            res.status(200).json({message:'Address added Successfully'})
        } catch (error) {
            res.status(500).json({message:'Internal Server Error'})
        }
    }else
    {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
    
});
router.post('/user/orders',userTokenSchema,async (req: Request, res: Response) => {
    const result = validationResult(req);
    if(result.isEmpty()){
        const { userIDToken } = matchedData(req);
        const query = `SELECT orders.orderid,orders.totalamount,orders.orderstatus,orders.createdat,shipping.deliveredat,products.title,productimages.imglink,productimages.imgalt,products.description,products.discount,orders.order_code,products.productid 
        FROM orders
         INNER JOIN orderitems on orders.orderid = orderitems.orderid INNER JOIN products ON products.productid = orderitems.productid
          INNER JOIN productimages ON products.productid = productimages.productid 
          INNER JOIN shipping on orderitems.shippingid = shipping.shippingid
          WHERE orders.userid = $1 AND productimages.isprimary = true ORDER BY orders.createdat DESC`
        try {
            const userID = jwt.verify(userIDToken,JWT_SECRET) as JwtPayload;
            const values = [userID.userID];
            const result = await client.query(query,values);
            res.status(200).json(
                {data:result.rows}
            );
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }else
    {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
    
});
router.post('/user/insert/cartitem', cartItemSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    const { userID, productID, quantity } = matchedData(req);
    const cartItemID = IDGenerator();

    const checkQuery = `
      SELECT cartitemid, quantity
      FROM cartitems
      WHERE userid = $1 AND productid = $2
    `;

    const checkValues = [userID, productID];

    const insertQuery = `
      INSERT INTO cartitems (cartitemid, userid, productid, quantity)
      VALUES ($1, $2, $3, $4)
    `;

    const insertValues = [cartItemID, userID, productID, quantity];

    const updateQuery = `
      UPDATE cartitems
      SET quantity = quantity + $1
      WHERE cartitemid = $2
    `;

    try {
      const productResult = await client.query(
        `SELECT stock FROM products WHERE productid = $1 AND COALESCE(is_active, true) = true`,
        [productID],
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const stock = Number(productResult.rows[0].stock || 0);
      const checkResult = await client.query(checkQuery, checkValues);

      const currentQuantity =
        checkResult.rows.length > 0 ? Number(checkResult.rows[0].quantity || 0) : 0;

      if (currentQuantity + Number(quantity) > stock) {
        return res.status(409).json({ message: "Not enough stock" });
      }

      if (checkResult.rows.length > 0) {
        const existingCartItemID = checkResult.rows[0].cartitemid;
        await client.query(updateQuery, [quantity, existingCartItemID]);
      } else {
        await client.query(insertQuery, insertValues);
      }

      res.status(200).json({ message: 'CartItem added or updated successfully' });
    } catch (error) {
      console.error("Insert cart item error:", error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    console.log(result);
    res.status(400).json({ message: 'Validation error', errors: result.array() });
  }
});
router.delete('/user/delete/cartitem',cartActionSchema,async(req:Request,res:Response)=>{
    const result = validationResult(req);
    if(result.isEmpty()){
        const {userID,cartItemID} = matchedData(req);
        const query = `DELETE FROM cartitems WHERE userid = $1 AND cartitemid = $2`
        const values = [userID,cartItemID];
        try {
            await client.query(query,values);
            res.status(200).json({message:'Item deleted Successfully'})
        } catch (error) {
            res.status(500).json({message:'Internal Server Error'})
        }
    }else
    {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
});
router.post('/user/insert/wishlistitem',wishlistActionSchema,async(req:Request,res:Response)=>{
    const result = validationResult(req);
    if(result.isEmpty()){
        const { userID, wishlistItemID, productID } = matchedData(req);
    
        const checkQuery = `
            SELECT wishlistitemid 
            FROM wishlistitems 
            WHERE userid = $1 AND productid = $2
        `;
        const checkValues = [userID, productID];
    
        const insertQuery = `
            INSERT INTO wishlistitems (wishlistitemid, userid, productid) 
            VALUES ($1, $2, $3)
        `;
        const insertValues = [wishlistItemID, userID, productID];
    
        try {
            const checkResult = await client.query(checkQuery, checkValues);
    
            if (checkResult.rows.length > 0) {
                // Item already exists, do not insert again
                res.status(200).json({ message: 'Item already exists in wishlist' });
            } else {
                // Item does not exist, insert a new row
                await client.query(insertQuery, insertValues);
                res.status(200).json({ message: 'Item added Successfully' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
    else res.status(500).json({ message: 'Internal Server Error' });
});
router.delete('/user/delete/wishlistitem',wishlistRemoveSchema,async(req:Request,res:Response)=>{
    const result = validationResult(req);
    if(result.isEmpty()){
        const {userID,wishlistItemID} = matchedData(req);
        const query = `DELETE FROM wishlistitems WHERE wishlistitemid = $1 AND userid = $2`
        const values = [wishlistItemID,userID];
        try {
            await client.query(query,values);
            res.status(200).json({message:'Item deleted Successfully'})
        } catch (error) {
            res.status(500).json({message:'Internal Server Error'})
        }
    }else
    {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
});

const fetchOrderAddresses = async (userID: number,addressID:number) => {
    const query = `
        SELECT userName, contactNumber, addressLine1, addressLine2, city, state, country, postalCode
        FROM Addresses
        WHERE userid = $1 AND addressid = $2;
    `;
    const values = [userID,addressID];
    const result = await client.query(query, values);
    return result.rows[0];
};

router.get('/user/order-detail/:userIDToken/:orderID',orderSchema,async (req:Request,res:Response)=>{
    const result = validationResult(req);
    if(result.isEmpty()){
        const { userIDToken,orderID } = matchedData(req);
        const query = `SELECT 
        orders.orderid,
        orders.createdat,
        shipping.deliveredat,
        orders.orderstatus,
        payments.paymentstatus,
        payments.paymentmethod,
        users.username,
        users.email,
        users.mobile_number,
        products.title,
        products.discount,
        products.price,
        shipping.shippingcost,
        orderitems.quantity,
        productimages.imglink,
        productimages.imgalt,
        payments.billingaddress,
        shipping.addressid,
        orderitems.productid,
        orders.order_code,
        orders.totalamount
        FROM orders
        INNER JOIN users ON orders.userid = users.userid
        INNER JOIN orderitems ON orders.orderid = orderitems.orderid
        INNER JOIN shipping ON orderitems.shippingid = shipping.shippingid
        INNER JOIN payments ON orderitems.paymentid = payments.paymentid
        INNER JOIN products ON orderitems.productid = products.productid
        INNER JOIN productimages ON products.productid = productimages.productid AND productimages.isprimary = true
        WHERE orders.orderid = $1 AND orders.userid = $2;`
        try {
            const userID = jwt.verify(userIDToken,JWT_SECRET) as JwtPayload;
            const values = [orderID,userID.userID];
            const result = await client.query(query,values);
            
            if(result.rows.length === 0){
                return res.status(404).json({message:'Data not Found'});
            }
            
            const [shippingAddress,billingAddress] = await Promise.all([
                fetchOrderAddresses(userID.userID,result.rows[0].addressid),
                fetchOrderAddresses(userID.userID,result.rows[0].billingaddress)
            ]);
            const data = {
                ...result.rows[0],
                shippingaddress:{...shippingAddress},
                billingaddress:{...billingAddress}
            }
            
            res.status(200).json(
                {data}
            );
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }
    else
    {
        console.log(result);
        res.status(500).json({ message: 'Validation error' });
    }
})
export default router;