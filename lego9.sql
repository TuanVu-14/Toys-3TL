--
-- PostgreSQL database dump
--

\restrict PNwA6aqroovVk93uhp0Mu99YiQlmKsrBzfCZ87eQJUuENrAAS9RZSl5yAOPoxKP

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-18 15:31:31

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5595 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 319 (class 1255 OID 44115)
-- Name: fn_calculate_coupon_discount(character varying, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_calculate_coupon_discount(p_coupon_code character varying, p_order_amount numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_coupon record;
    v_discount numeric(10,2);
BEGIN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(p_coupon_code)
      AND CURRENT_TIMESTAMP BETWEEN validfrom AND validuntil
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    IF p_order_amount < COALESCE(v_coupon.minpurchaseamount, 0) THEN
        RETURN 0;
    END IF;

    v_discount := p_order_amount * COALESCE(v_coupon.discountpercentage, 0) / 100.0;
    v_discount := LEAST(v_discount, COALESCE(v_coupon.maxdiscountamount, v_discount));

    RETURN ROUND(v_discount, 2);
END;
$$;


ALTER FUNCTION public.fn_calculate_coupon_discount(p_coupon_code character varying, p_order_amount numeric) OWNER TO postgres;

--
-- TOC entry 299 (class 1255 OID 44100)
-- Name: fn_product_final_price(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_product_final_price(p_productid integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_price numeric(10,2);
    v_discount numeric(5,2);
BEGIN
    SELECT price, COALESCE(discount, 0)
    INTO v_price, v_discount
    FROM public.products
    WHERE productid = p_productid;

    IF v_price IS NULL THEN
        RETURN 0;
    END IF;

    RETURN ROUND(v_price * (1 - LEAST(GREATEST(v_discount, 0), 100) / 100.0), 2);
END;
$$;


ALTER FUNCTION public.fn_product_final_price(p_productid integer) OWNER TO postgres;

--
-- TOC entry 300 (class 1255 OID 44101)
-- Name: fn_recalculate_order_total(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_recalculate_order_total(p_orderid integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_items_total numeric(10,2);
    v_shipping_total numeric(10,2);
BEGIN
    SELECT COALESCE(SUM(oi.quantity * public.fn_product_final_price(oi.productid)), 0)
    INTO v_items_total
    FROM public.orderitems oi
    WHERE oi.orderid = p_orderid;

    SELECT COALESCE(SUM(shippingcost), 0)
    INTO v_shipping_total
    FROM public.shipping
    WHERE orderid = p_orderid;

    UPDATE public.orders
    SET totalamount = COALESCE(v_items_total, 0) + COALESCE(v_shipping_total, 0)
    WHERE orderid = p_orderid;
END;
$$;


ALTER FUNCTION public.fn_recalculate_order_total(p_orderid integer) OWNER TO postgres;

--
-- TOC entry 321 (class 1255 OID 44120)
-- Name: fn_recommend_products(integer, character varying, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_recommend_products(p_age integer DEFAULT NULL::integer, p_skill character varying DEFAULT NULL::character varying, p_gender character varying DEFAULT NULL::character varying, p_limit integer DEFAULT 10) RETURNS TABLE(productid integer, title character varying, price numeric, discount numeric, final_price numeric, stock integer, age_group character varying, gender character varying, skill_type character varying, brand character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT p.productid,
           p.title,
           p.price,
           p.discount,
           public.fn_product_final_price(p.productid) AS final_price,
           p.stock,
           p.age_group,
           p.gender,
           p.skill_type,
           p.brand
    FROM public.products p
    WHERE p.stock > 0
      AND (p_skill IS NULL OR p.skill_type ILIKE '%' || p_skill || '%' OR p.tags ILIKE '%' || p_skill || '%')
      AND (p_gender IS NULL OR p.gender ILIKE p_gender OR p.gender ILIKE 'Unisex')
      AND (
          p_age IS NULL
          OR p.age_group ILIKE '%' || p_age::text || '%'
          OR p.age_group ILIKE '%All%'
          OR p.age_group ILIKE '%+%'
      )
    ORDER BY p.discount DESC NULLS LAST, p.stock DESC, p.createdat DESC
    LIMIT COALESCE(p_limit, 10);
END;
$$;


ALTER FUNCTION public.fn_recommend_products(p_age integer, p_skill character varying, p_gender character varying, p_limit integer) OWNER TO postgres;

--
-- TOC entry 298 (class 1255 OID 44087)
-- Name: fn_set_updatedat(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_set_updatedat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Dùng dynamic SQL để hỗ trợ cả updatedat và updated_at nếu bảng có cột đó
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = TG_TABLE_SCHEMA
              AND table_name = TG_TABLE_NAME
              AND column_name = 'updatedat'
        ) THEN
            NEW.updatedat = CURRENT_TIMESTAMP;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = TG_TABLE_SCHEMA
              AND table_name = TG_TABLE_NAME
              AND column_name = 'updated_at'
        ) THEN
            NEW.updated_at = CURRENT_TIMESTAMP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_set_updatedat() OWNER TO postgres;

--
-- TOC entry 316 (class 1255 OID 44109)
-- Name: trg_apply_inventory_transaction(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_apply_inventory_transaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_delta integer;
    v_stock_after integer;
BEGIN
    IF NEW.product_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF UPPER(NEW.transaction_type) IN ('IN', 'IMPORT', 'RESTOCK', 'PURCHASE') THEN
        v_delta := ABS(NEW.quantity);
    ELSIF UPPER(NEW.transaction_type) IN ('OUT', 'EXPORT', 'DAMAGE', 'LOSS') THEN
        v_delta := -ABS(NEW.quantity);
    ELSIF UPPER(NEW.transaction_type) = 'ADJUSTMENT' THEN
        v_delta := NEW.quantity;
    ELSE
        v_delta := NEW.quantity;
    END IF;

    UPDATE public.products
    SET stock = stock + v_delta
    WHERE productid = NEW.product_id
    RETURNING stock INTO v_stock_after;

    IF v_stock_after < 0 THEN
        RAISE EXCEPTION 'Stock cannot be negative for product %', NEW.product_id;
    END IF;

    INSERT INTO public.inventory_logs(productid, change_type, quantity_change, stock_after, batch_code, note, created_by, created_at)
    VALUES (NEW.product_id, NEW.transaction_type, v_delta, v_stock_after, NEW.batch_number, NEW.notes, NEW.created_by, CURRENT_TIMESTAMP);

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_apply_inventory_transaction() OWNER TO postgres;

--
-- TOC entry 307 (class 1255 OID 44105)
-- Name: trg_check_stock_before_orderitem(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_check_stock_before_orderitem() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_stock integer;
  v_needed integer;
BEGIN
  IF NEW.productid IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT stock INTO v_stock
  FROM public.products
  WHERE productid = NEW.productid
  FOR UPDATE;

  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'Product % does not exist', NEW.productid;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_needed := COALESCE(NEW.quantity, 0);
  ELSE
    IF NEW.productid = OLD.productid THEN
      v_needed := COALESCE(NEW.quantity, 0) - COALESCE(OLD.quantity, 0);
    ELSE
      v_needed := COALESCE(NEW.quantity, 0);
    END IF;
  END IF;

  IF v_needed > v_stock THEN
    RAISE EXCEPTION 'Not enough stock for product %. Current stock: %, needed: %', NEW.productid, v_stock, v_needed;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_check_stock_before_orderitem() OWNER TO postgres;

--
-- TOC entry 301 (class 1255 OID 44102)
-- Name: trg_recalculate_order_total(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_recalculate_order_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_orderid integer;
BEGIN
  v_orderid := COALESCE(NEW.orderid, OLD.orderid);

  UPDATE public.orders o
  SET totalamount = COALESCE((
    SELECT SUM(
      ROUND((p.price * (100 - COALESCE(p.discount, 0)) / 100)) * COALESCE(oi.quantity, 0)
    )
    FROM public.orderitems oi
    JOIN public.products p ON p.productid = oi.productid
    WHERE oi.orderid = v_orderid
  ), 0)
  + COALESCE((
    SELECT SUM(COALESCE(s.shippingcost, 0))
    FROM public.shipping s
    WHERE s.orderid = v_orderid
  ), 0)
  WHERE o.orderid = v_orderid;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.trg_recalculate_order_total() OWNER TO postgres;

--
-- TOC entry 302 (class 1255 OID 44118)
-- Name: trg_return_restore_stock(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_return_restore_stock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_stock_after integer;
BEGIN
  IF LOWER(COALESCE(NEW.status, '')) IN ('approved', 'completed', 'refunded')
     AND (TG_OP = 'INSERT' OR LOWER(COALESCE(OLD.status, '')) NOT IN ('approved', 'completed', 'refunded')) THEN
    UPDATE public.products
    SET stock = stock + COALESCE(NEW.quantity, 0)
    WHERE productid = NEW.productid
    RETURNING stock INTO v_stock_after;

    INSERT INTO public.inventory_logs(productid, change_type, quantity_change, stock_after, note, created_by, created_at)
    VALUES (NEW.productid, 'RETURN', COALESCE(NEW.quantity, 0), v_stock_after, 'Restore stock from return #' || NEW.return_id, NEW.handled_by, CURRENT_TIMESTAMP);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_return_restore_stock() OWNER TO postgres;

--
-- TOC entry 317 (class 1255 OID 44111)
-- Name: trg_update_order_after_payment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_update_order_after_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.orderid IS NULL THEN
        RETURN NEW;
    END IF;

    IF LOWER(COALESCE(NEW.paymentstatus, '')) IN ('paid', 'completed', 'success', 'successful') THEN
        UPDATE public.orders
        SET orderstatus = 'Confirmed',
            order_status = 'Confirmed'
        WHERE orderid = NEW.orderid;
    ELSIF LOWER(COALESCE(NEW.paymentstatus, '')) IN ('failed', 'cancelled', 'canceled') THEN
        UPDATE public.orders
        SET orderstatus = 'Payment Failed',
            order_status = 'Payment Failed'
        WHERE orderid = NEW.orderid;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_update_order_after_payment() OWNER TO postgres;

--
-- TOC entry 318 (class 1255 OID 44113)
-- Name: trg_update_order_after_shipping(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_update_order_after_shipping() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.orderid IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.shippedat IS NOT NULL OR NEW.shipped_at IS NOT NULL THEN
        UPDATE public.orders
        SET orderstatus = 'Shipped',
            order_status = 'Shipped',
            delivery_status = 'Shipped',
            shipped_at = COALESCE(NEW.shipped_at, NEW.shippedat)
        WHERE orderid = NEW.orderid;
    END IF;

    IF NEW.deliveredat IS NOT NULL OR NEW.delivered_at IS NOT NULL THEN
        UPDATE public.orders
        SET orderstatus = 'Delivered',
            order_status = 'Delivered',
            delivery_status = 'Delivered',
            delivered_at = COALESCE(NEW.delivered_at, NEW.deliveredat)
        WHERE orderid = NEW.orderid;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_update_order_after_shipping() OWNER TO postgres;

--
-- TOC entry 314 (class 1255 OID 44107)
-- Name: trg_update_stock_after_orderitem(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_update_stock_after_orderitem() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_delta integer;
  v_stock_after integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_delta := -COALESCE(NEW.quantity, 0);
    UPDATE public.products
    SET stock = stock + v_delta
    WHERE productid = NEW.productid
    RETURNING stock INTO v_stock_after;

    INSERT INTO public.inventory_logs(productid, change_type, quantity_change, stock_after, note, created_at)
    VALUES (NEW.productid, 'SALE', v_delta, v_stock_after, 'Auto stock decrease from order #' || NEW.orderid, CURRENT_TIMESTAMP);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.productid = OLD.productid THEN
      v_delta := COALESCE(OLD.quantity, 0) - COALESCE(NEW.quantity, 0);
      UPDATE public.products
      SET stock = stock + v_delta
      WHERE productid = NEW.productid
      RETURNING stock INTO v_stock_after;

      INSERT INTO public.inventory_logs(productid, change_type, quantity_change, stock_after, note, created_at)
      VALUES (NEW.productid, 'ORDER_UPDATE', v_delta, v_stock_after, 'Auto stock update from order #' || NEW.orderid, CURRENT_TIMESTAMP);
    ELSE
      UPDATE public.products
      SET stock = stock + COALESCE(OLD.quantity, 0)
      WHERE productid = OLD.productid;

      UPDATE public.products
      SET stock = stock - COALESCE(NEW.quantity, 0)
      WHERE productid = NEW.productid
      RETURNING stock INTO v_stock_after;

      INSERT INTO public.inventory_logs(productid, change_type, quantity_change, stock_after, note, created_at)
      VALUES (NEW.productid, 'ORDER_PRODUCT_CHANGE', -COALESCE(NEW.quantity, 0), v_stock_after, 'Order item changed product #' || NEW.orderid, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_delta := COALESCE(OLD.quantity, 0);
    UPDATE public.products
    SET stock = stock + v_delta
    WHERE productid = OLD.productid
    RETURNING stock INTO v_stock_after;

    INSERT INTO public.inventory_logs(productid, change_type, quantity_change, stock_after, note, created_at)
    VALUES (OLD.productid, 'ORDER_DELETE', v_delta, v_stock_after, 'Restore stock from deleted order item #' || OLD.orderid, CURRENT_TIMESTAMP);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION public.trg_update_stock_after_orderitem() OWNER TO postgres;

--
-- TOC entry 320 (class 1255 OID 44116)
-- Name: trg_validate_review_purchase(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_validate_review_purchase() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.orderitems oi ON oi.orderid = o.orderid
        WHERE o.userid = NEW.userid
          AND oi.productid = NEW.productid
          AND LOWER(COALESCE(o.orderstatus, o.order_status, '')) IN ('delivered', 'completed')
    ) INTO v_exists;

    IF NOT v_exists THEN
        RAISE EXCEPTION 'User % can review product % only after delivered/completed purchase', NEW.userid, NEW.productid;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_validate_review_purchase() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 42710)
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    addressid integer NOT NULL,
    userid integer NOT NULL,
    addresstype character varying(4) NOT NULL,
    username character varying(64) NOT NULL,
    contactnumber character varying(10) NOT NULL,
    addressline1 character varying(128) NOT NULL,
    addressline2 character varying(128),
    city character varying(60) NOT NULL,
    state character varying(16) NOT NULL,
    country character varying(56) NOT NULL,
    postalcode character varying(8) NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_default boolean NOT NULL
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 42726)
-- Name: addresses_addressid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addresses_addressid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addresses_addressid_seq OWNER TO postgres;

--
-- TOC entry 5597 (class 0 OID 0)
-- Dependencies: 220
-- Name: addresses_addressid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_addressid_seq OWNED BY public.addresses.addressid;


--
-- TOC entry 221 (class 1259 OID 42727)
-- Name: articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.articles (
    article_id integer NOT NULL,
    category character varying(24),
    title character varying(255) NOT NULL,
    imglink character varying(255),
    imgalt character varying(255),
    author character varying(100) NOT NULL,
    published_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    content text
);


ALTER TABLE public.articles OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 42736)
-- Name: articles_article_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.articles_article_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.articles_article_id_seq OWNER TO postgres;

--
-- TOC entry 5598 (class 0 OID 0)
-- Dependencies: 222
-- Name: articles_article_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.articles_article_id_seq OWNED BY public.articles.article_id;


--
-- TOC entry 223 (class 1259 OID 42737)
-- Name: banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banners (
    bannerid integer NOT NULL,
    toptitle character varying(255) NOT NULL,
    middletitle character varying(255) NOT NULL,
    bottomtitle character varying(255) NOT NULL,
    imglink character varying(255) NOT NULL,
    startprice numeric(10,2) NOT NULL,
    buttontitle character varying(255) NOT NULL,
    redirect_link character varying(255) DEFAULT ''::character varying,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.banners OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 42752)
-- Name: banners_bannerid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.banners_bannerid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banners_bannerid_seq OWNER TO postgres;

--
-- TOC entry 5599 (class 0 OID 0)
-- Dependencies: 224
-- Name: banners_bannerid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.banners_bannerid_seq OWNED BY public.banners.bannerid;


--
-- TOC entry 225 (class 1259 OID 42753)
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    brand_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    manufacturer character varying(150),
    country character varying(100),
    description text,
    safety_certificates text,
    website character varying(255),
    logo_url character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 42764)
-- Name: brands_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brands_brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brands_brand_id_seq OWNER TO postgres;

--
-- TOC entry 5600 (class 0 OID 0)
-- Dependencies: 226
-- Name: brands_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brands_brand_id_seq OWNED BY public.brands.brand_id;


--
-- TOC entry 227 (class 1259 OID 42765)
-- Name: cartitems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cartitems (
    cartitemid integer NOT NULL,
    userid integer,
    productid integer,
    quantity integer NOT NULL,
    sizeid integer,
    colorid integer,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cartitems OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 42772)
-- Name: cartitems_cartitemid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cartitems_cartitemid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cartitems_cartitemid_seq OWNER TO postgres;

--
-- TOC entry 5601 (class 0 OID 0)
-- Dependencies: 228
-- Name: cartitems_cartitemid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cartitems_cartitemid_seq OWNED BY public.cartitems.cartitemid;


--
-- TOC entry 229 (class 1259 OID 42773)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    categoryid integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(100) NOT NULL,
    maincategory character varying(15)
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 42779)
-- Name: categories_categoryid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_categoryid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_categoryid_seq OWNER TO postgres;

--
-- TOC entry 5602 (class 0 OID 0)
-- Dependencies: 230
-- Name: categories_categoryid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_categoryid_seq OWNED BY public.categories.categoryid;


--
-- TOC entry 231 (class 1259 OID 42780)
-- Name: child_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_profiles (
    child_id integer NOT NULL,
    user_id integer,
    child_name character varying(100),
    birth_date date,
    gender character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.child_profiles OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 42785)
-- Name: child_profiles_child_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_profiles_child_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_profiles_child_id_seq OWNER TO postgres;

--
-- TOC entry 5603 (class 0 OID 0)
-- Dependencies: 232
-- Name: child_profiles_child_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_profiles_child_id_seq OWNED BY public.child_profiles.child_id;


--
-- TOC entry 233 (class 1259 OID 42786)
-- Name: collection_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_products (
    collection_id integer NOT NULL,
    productid integer NOT NULL,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.collection_products OWNER TO postgres;

--
-- TOC entry 5604 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE collection_products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.collection_products IS 'Ánh xạ sản phẩm vào bộ sưu tập (many-to-many)';


--
-- TOC entry 234 (class 1259 OID 42792)
-- Name: collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collections (
    collection_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    imglink character varying(255),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.collections OWNER TO postgres;

--
-- TOC entry 5605 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE collections; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.collections IS 'Bộ sưu tập sản phẩm theo chủ đề: STEM, Mô hình, Nhà bếp...';


--
-- TOC entry 235 (class 1259 OID 42803)
-- Name: collections_collection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.collections_collection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collections_collection_id_seq OWNER TO postgres;

--
-- TOC entry 5606 (class 0 OID 0)
-- Dependencies: 235
-- Name: collections_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.collections_collection_id_seq OWNED BY public.collections.collection_id;


--
-- TOC entry 236 (class 1259 OID 42804)
-- Name: contact_queries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_queries (
    queryid integer NOT NULL,
    name character varying(255),
    email character varying(255),
    number character varying(10),
    method character varying(10),
    message text
);


ALTER TABLE public.contact_queries OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 42810)
-- Name: contact_queries_queryid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contact_queries_queryid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_queries_queryid_seq OWNER TO postgres;

--
-- TOC entry 5607 (class 0 OID 0)
-- Dependencies: 237
-- Name: contact_queries_queryid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contact_queries_queryid_seq OWNED BY public.contact_queries.queryid;


--
-- TOC entry 238 (class 1259 OID 42811)
-- Name: content_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_items (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    location character varying(100) NOT NULL,
    content_data jsonb,
    status boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.content_items OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 42822)
-- Name: content_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.content_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_items_id_seq OWNER TO postgres;

--
-- TOC entry 5608 (class 0 OID 0)
-- Dependencies: 239
-- Name: content_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.content_items_id_seq OWNED BY public.content_items.id;


--
-- TOC entry 240 (class 1259 OID 42823)
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    couponid integer NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    discountpercentage numeric(5,2),
    maxdiscountamount numeric(10,2),
    minpurchaseamount numeric(10,2),
    validfrom timestamp without time zone,
    validuntil timestamp without time zone,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 42832)
-- Name: coupons_couponid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coupons_couponid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coupons_couponid_seq OWNER TO postgres;

--
-- TOC entry 5609 (class 0 OID 0)
-- Dependencies: 241
-- Name: coupons_couponid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coupons_couponid_seq OWNED BY public.coupons.couponid;


--
-- TOC entry 242 (class 1259 OID 42833)
-- Name: deals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deals (
    dealid integer NOT NULL,
    productid integer NOT NULL,
    end_time timestamp without time zone NOT NULL,
    sold integer,
    available integer
);


ALTER TABLE public.deals OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 42839)
-- Name: deals_dealid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deals_dealid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deals_dealid_seq OWNER TO postgres;

--
-- TOC entry 5610 (class 0 OID 0)
-- Dependencies: 243
-- Name: deals_dealid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deals_dealid_seq OWNED BY public.deals.dealid;


--
-- TOC entry 244 (class 1259 OID 42840)
-- Name: gift_message_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gift_message_templates (
    template_id integer NOT NULL,
    occasion character varying(50) NOT NULL,
    title character varying(100) NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.gift_message_templates OWNER TO postgres;

--
-- TOC entry 5611 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE gift_message_templates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gift_message_templates IS 'Mẫu lời nhắn thiệp quà có sẵn để khách chọn nhanh';


--
-- TOC entry 245 (class 1259 OID 42851)
-- Name: gift_message_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gift_message_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gift_message_templates_template_id_seq OWNER TO postgres;

--
-- TOC entry 5612 (class 0 OID 0)
-- Dependencies: 245
-- Name: gift_message_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gift_message_templates_template_id_seq OWNED BY public.gift_message_templates.template_id;


--
-- TOC entry 246 (class 1259 OID 42852)
-- Name: giftcards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.giftcards (
    cardid integer NOT NULL,
    cardname character varying(255) NOT NULL,
    cardcode character varying(100) NOT NULL,
    description text,
    balance numeric(10,2) NOT NULL,
    currency character varying(10) NOT NULL,
    expirydate date NOT NULL,
    recipientname character varying(100),
    recipientemail character varying(100),
    sendername character varying(100),
    senderemail character varying(100),
    message text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'Active'::character varying
);


ALTER TABLE public.giftcards OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 42866)
-- Name: giftcards_cardid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.giftcards_cardid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.giftcards_cardid_seq OWNER TO postgres;

--
-- TOC entry 5613 (class 0 OID 0)
-- Dependencies: 247
-- Name: giftcards_cardid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.giftcards_cardid_seq OWNED BY public.giftcards.cardid;


--
-- TOC entry 248 (class 1259 OID 42867)
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_logs (
    log_id integer NOT NULL,
    productid integer NOT NULL,
    change_type character varying(20) NOT NULL,
    quantity_change integer NOT NULL,
    stock_after integer,
    batch_code character varying(50),
    supplier_id integer,
    note text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_logs OWNER TO postgres;

--
-- TOC entry 5614 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE inventory_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.inventory_logs IS 'Lịch sử nhập/xuất kho theo lô, phục vụ quản trị kho';


--
-- TOC entry 5615 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN inventory_logs.change_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inventory_logs.change_type IS 'Loại thay đổi: import, export, return, adjustment, damage';


--
-- TOC entry 5616 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN inventory_logs.batch_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inventory_logs.batch_code IS 'Mã lô hàng nhập, ví dụ: LOT-2025-001';


--
-- TOC entry 249 (class 1259 OID 42877)
-- Name: inventory_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_logs_log_id_seq OWNER TO postgres;

--
-- TOC entry 5617 (class 0 OID 0)
-- Dependencies: 249
-- Name: inventory_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_logs_log_id_seq OWNED BY public.inventory_logs.log_id;


--
-- TOC entry 250 (class 1259 OID 42878)
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_transactions (
    transaction_id integer NOT NULL,
    product_id integer,
    transaction_type character varying(20) NOT NULL,
    quantity integer NOT NULL,
    batch_number character varying(100),
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_transactions OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 42887)
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_transaction_id_seq OWNER TO postgres;

--
-- TOC entry 5618 (class 0 OID 0)
-- Dependencies: 251
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_transactions_transaction_id_seq OWNED BY public.inventory_transactions.transaction_id;


--
-- TOC entry 252 (class 1259 OID 42888)
-- Name: orderitems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orderitems (
    orderitemid integer NOT NULL,
    orderid integer,
    productid integer,
    quantity integer,
    shippingid integer,
    paymentid integer,
    colorid integer,
    sizeid integer,
    gift_wrapping boolean DEFAULT false,
    gift_wrap_style character varying(100),
    gift_message text
);


ALTER TABLE public.orderitems OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 42895)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    orderid integer NOT NULL,
    userid integer,
    totalamount numeric(10,2) NOT NULL,
    orderstatus character varying(50) DEFAULT 'Pending'::character varying,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    order_code character varying(4),
    is_gift boolean DEFAULT false,
    gift_message text,
    gift_wrapping_type character varying(50),
    order_status character varying(50) DEFAULT 'Pending'::character varying,
    tracking_number character varying(100),
    shipped_at timestamp without time zone,
    delivered_at timestamp without time zone,
    delivery_status character varying(50) DEFAULT 'Confirmed'::character varying
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 5619 (class 0 OID 0)
-- Dependencies: 253
-- Name: COLUMN orders.is_gift; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.is_gift IS 'Đánh dấu đây là đơn hàng quà tặng';


--
-- TOC entry 5620 (class 0 OID 0)
-- Dependencies: 253
-- Name: COLUMN orders.gift_message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.gift_message IS 'Nội dung lời nhắn viết trên thiệp';


--
-- TOC entry 5621 (class 0 OID 0)
-- Dependencies: 253
-- Name: COLUMN orders.gift_wrapping_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.gift_wrapping_type IS 'Loại gói quà: none, standard, premium, birthday, holiday';


--
-- TOC entry 254 (class 1259 OID 42908)
-- Name: orders_orderid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_orderid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_orderid_seq OWNER TO postgres;

--
-- TOC entry 5622 (class 0 OID 0)
-- Dependencies: 254
-- Name: orders_orderid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_orderid_seq OWNED BY public.orders.orderid;


--
-- TOC entry 255 (class 1259 OID 42909)
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    status boolean DEFAULT true,
    config jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 42919)
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_id_seq OWNER TO postgres;

--
-- TOC entry 5623 (class 0 OID 0)
-- Dependencies: 256
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- TOC entry 257 (class 1259 OID 42920)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    paymentid integer NOT NULL,
    orderid integer,
    paymentmethod character varying(100),
    paymentstatus character varying(50) DEFAULT 'Pending'::character varying,
    amount numeric(10,2) NOT NULL,
    transactionid character varying(100),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    billingaddress integer,
    paymentgateway_id character varying(255)
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 42930)
-- Name: payments_paymentid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_paymentid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_paymentid_seq OWNER TO postgres;

--
-- TOC entry 5624 (class 0 OID 0)
-- Dependencies: 258
-- Name: payments_paymentid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_paymentid_seq OWNED BY public.payments.paymentid;


--
-- TOC entry 259 (class 1259 OID 42931)
-- Name: product_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_batches (
    batch_id integer NOT NULL,
    product_id integer,
    batch_number character varying(100) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    manufacture_date date,
    expiry_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_batches OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 42939)
-- Name: product_batches_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_batches_batch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_batches_batch_id_seq OWNER TO postgres;

--
-- TOC entry 5625 (class 0 OID 0)
-- Dependencies: 260
-- Name: product_batches_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_batches_batch_id_seq OWNED BY public.product_batches.batch_id;


--
-- TOC entry 261 (class 1259 OID 42940)
-- Name: productcolors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productcolors (
    colorid integer NOT NULL,
    productid integer,
    colorname character varying(50) NOT NULL,
    colorclass character varying(50)
);


ALTER TABLE public.productcolors OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 42945)
-- Name: productcolors_colorid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productcolors_colorid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productcolors_colorid_seq OWNER TO postgres;

--
-- TOC entry 5626 (class 0 OID 0)
-- Dependencies: 262
-- Name: productcolors_colorid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productcolors_colorid_seq OWNED BY public.productcolors.colorid;


--
-- TOC entry 263 (class 1259 OID 42946)
-- Name: productimages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productimages (
    imageid integer NOT NULL,
    productid integer,
    imglink character varying(255) NOT NULL,
    imgalt character varying(255),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isprimary boolean
);


ALTER TABLE public.productimages OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 42954)
-- Name: productimages_imageid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productimages_imageid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productimages_imageid_seq OWNER TO postgres;

--
-- TOC entry 5627 (class 0 OID 0)
-- Dependencies: 264
-- Name: productimages_imageid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productimages_imageid_seq OWNED BY public.productimages.imageid;


--
-- TOC entry 265 (class 1259 OID 42955)
-- Name: productparams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productparams (
    productid integer NOT NULL,
    issale boolean,
    isnew boolean,
    isdiscount boolean,
    stars double precision,
    views integer DEFAULT 0,
    sold integer DEFAULT 0,
    rating integer DEFAULT 0
);


ALTER TABLE public.productparams OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 42962)
-- Name: productparams_productid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productparams_productid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productparams_productid_seq OWNER TO postgres;

--
-- TOC entry 5628 (class 0 OID 0)
-- Dependencies: 266
-- Name: productparams_productid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productparams_productid_seq OWNED BY public.productparams.productid;


--
-- TOC entry 267 (class 1259 OID 42963)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    productid integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    categoryid integer,
    price numeric(10,2) NOT NULL,
    discount numeric(5,2),
    stock integer NOT NULL,
    tags character varying(255),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    imgid character varying(50),
    seller_id integer,
    age_group character varying(20),
    gender character varying(10),
    material character varying(50),
    skill_type character varying(100),
    brand character varying(100),
    safety_certificates text,
    low_stock_threshold integer DEFAULT 10,
    supplier_id integer,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 5629 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN products.age_group; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.age_group IS 'Độ tuổi phù hợp: 0-2, 3-5, 6-8, 9-12, 12+';


--
-- TOC entry 5630 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN products.gender; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.gender IS 'Giới tính: boy, girl, unisex';


--
-- TOC entry 5631 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN products.material; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.material IS 'Chất liệu: wood, abs_plastic, fabric, metal, mixed';


--
-- TOC entry 5632 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN products.skill_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.skill_type IS 'Kỹ năng phát triển: cognitive, motor, language, social, stem';


--
-- TOC entry 5633 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN products.safety_certificates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.safety_certificates IS 'Các chứng chỉ an toàn: CE, TCVN, ASTM, EN71';


--
-- TOC entry 5634 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN products.low_stock_threshold; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.low_stock_threshold IS 'Ngưỡng tồn kho thấp để kích hoạt cảnh báo nhập hàng';


--
-- TOC entry 268 (class 1259 OID 42975)
-- Name: products_productid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_productid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_productid_seq OWNER TO postgres;

--
-- TOC entry 5635 (class 0 OID 0)
-- Dependencies: 268
-- Name: products_productid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_productid_seq OWNED BY public.products.productid;


--
-- TOC entry 269 (class 1259 OID 42976)
-- Name: productsizes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productsizes (
    sizeid integer NOT NULL,
    productid integer,
    sizename character varying(10) NOT NULL,
    instock boolean NOT NULL
);


ALTER TABLE public.productsizes OWNER TO postgres;

--
-- TOC entry 270 (class 1259 OID 42982)
-- Name: productsizes_sizeid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productsizes_sizeid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productsizes_sizeid_seq OWNER TO postgres;

--
-- TOC entry 5636 (class 0 OID 0)
-- Dependencies: 270
-- Name: productsizes_sizeid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productsizes_sizeid_seq OWNED BY public.productsizes.sizeid;


--
-- TOC entry 271 (class 1259 OID 42983)
-- Name: promotions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotions (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    discount numeric(10,2) NOT NULL,
    expiration_date timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    event_name character varying(100),
    applicable_age_group character varying(20),
    season character varying(20),
    min_child_age integer,
    max_child_age integer
);


ALTER TABLE public.promotions OWNER TO postgres;

--
-- TOC entry 5637 (class 0 OID 0)
-- Dependencies: 271
-- Name: COLUMN promotions.event_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.promotions.event_name IS 'Tên sự kiện: Quốc tế thiếu nhi, Trung thu, Giáng sinh...';


--
-- TOC entry 5638 (class 0 OID 0)
-- Dependencies: 271
-- Name: COLUMN promotions.season; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.promotions.season IS 'Mùa áp dụng: spring, summer, autumn, winter';


--
-- TOC entry 272 (class 1259 OID 42992)
-- Name: promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promotions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promotions_id_seq OWNER TO postgres;

--
-- TOC entry 5639 (class 0 OID 0)
-- Dependencies: 272
-- Name: promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promotions_id_seq OWNED BY public.promotions.id;


--
-- TOC entry 273 (class 1259 OID 42993)
-- Name: returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.returns (
    return_id integer NOT NULL,
    orderid integer NOT NULL,
    productid integer NOT NULL,
    userid integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    reason character varying(100) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    refund_amount numeric(10,2),
    handled_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.returns OWNER TO postgres;

--
-- TOC entry 5640 (class 0 OID 0)
-- Dependencies: 273
-- Name: TABLE returns; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.returns IS 'Quản lý đơn hàng trả lại từ khách';


--
-- TOC entry 5641 (class 0 OID 0)
-- Dependencies: 273
-- Name: COLUMN returns.reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.returns.reason IS 'Lý do trả: defective, wrong_item, not_as_described, child_disliked, other';


--
-- TOC entry 5642 (class 0 OID 0)
-- Dependencies: 273
-- Name: COLUMN returns.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.returns.status IS 'Trạng thái: pending, approved, rejected, refunded, exchanged';


--
-- TOC entry 274 (class 1259 OID 43008)
-- Name: returns_return_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.returns_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.returns_return_id_seq OWNER TO postgres;

--
-- TOC entry 5643 (class 0 OID 0)
-- Dependencies: 274
-- Name: returns_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.returns_return_id_seq OWNED BY public.returns.return_id;


--
-- TOC entry 275 (class 1259 OID 43009)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    reviewid integer NOT NULL,
    userid integer NOT NULL,
    productid integer NOT NULL,
    rating double precision NOT NULL,
    comment text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    title character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'approved'::character varying,
    durability_rating smallint,
    safety_rating smallint,
    child_enjoyment_rating smallint,
    age_at_review character varying(10),
    enjoyment_rating integer,
    CONSTRAINT reviews_child_enjoyment_rating_check CHECK (((child_enjoyment_rating >= 1) AND (child_enjoyment_rating <= 5))),
    CONSTRAINT reviews_durability_rating_check CHECK (((durability_rating >= 1) AND (durability_rating <= 5))),
    CONSTRAINT reviews_rating_check CHECK (((rating >= (1)::double precision) AND (rating <= (5)::double precision))),
    CONSTRAINT reviews_safety_rating_check CHECK (((safety_rating >= 1) AND (safety_rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 5644 (class 0 OID 0)
-- Dependencies: 275
-- Name: COLUMN reviews.durability_rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reviews.durability_rating IS 'Đánh giá độ bền sản phẩm (1-5)';


--
-- TOC entry 5645 (class 0 OID 0)
-- Dependencies: 275
-- Name: COLUMN reviews.safety_rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reviews.safety_rating IS 'Đánh giá tính an toàn (1-5)';


--
-- TOC entry 5646 (class 0 OID 0)
-- Dependencies: 275
-- Name: COLUMN reviews.child_enjoyment_rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reviews.child_enjoyment_rating IS 'Mức độ bé thích sản phẩm (1-5)';


--
-- TOC entry 5647 (class 0 OID 0)
-- Dependencies: 275
-- Name: COLUMN reviews.age_at_review; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reviews.age_at_review IS 'Tuổi của bé khi đánh giá, ví dụ: 3 tuổi';


--
-- TOC entry 276 (class 1259 OID 43028)
-- Name: reviews_reviewid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_reviewid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_reviewid_seq OWNER TO postgres;

--
-- TOC entry 5648 (class 0 OID 0)
-- Dependencies: 276
-- Name: reviews_reviewid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_reviewid_seq OWNED BY public.reviews.reviewid;


--
-- TOC entry 277 (class 1259 OID 43029)
-- Name: savedpaymentcards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.savedpaymentcards (
    cardid integer NOT NULL,
    userid integer NOT NULL,
    cardnumber character varying(16) NOT NULL,
    cardholdername character varying(100) NOT NULL,
    expirymonth integer NOT NULL,
    expiryyear integer NOT NULL,
    cardtype character varying(50),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.savedpaymentcards OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 43040)
-- Name: savedpaymentcards_cardid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.savedpaymentcards_cardid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.savedpaymentcards_cardid_seq OWNER TO postgres;

--
-- TOC entry 5649 (class 0 OID 0)
-- Dependencies: 278
-- Name: savedpaymentcards_cardid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.savedpaymentcards_cardid_seq OWNED BY public.savedpaymentcards.cardid;


--
-- TOC entry 279 (class 1259 OID 43041)
-- Name: sellers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sellers (
    seller_id integer NOT NULL,
    name character varying(100),
    email character varying(100),
    password character varying(255),
    phone_number character varying(20),
    company_name character varying(255),
    tax_id character varying(50),
    registration_number character varying(50),
    store_url character varying(255),
    business_description text,
    profile_image_url character varying(255),
    join_date date,
    rating numeric(3,2),
    addressline1 character varying(255),
    addressline2 character varying(255),
    city character varying(100),
    state character varying(100),
    country character varying(100),
    postalcode character varying(20)
);


ALTER TABLE public.sellers OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 43047)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    key character varying(100) NOT NULL,
    value jsonb NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 43054)
-- Name: shipping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping (
    shippingid integer NOT NULL,
    orderid integer,
    addressid integer,
    shippingmethod character varying(100),
    shippingcost numeric(10,2),
    trackingnumber character varying(100),
    shippedat timestamp without time zone,
    deliveredat timestamp without time zone,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shipped_at timestamp without time zone,
    delivered_at timestamp without time zone
);


ALTER TABLE public.shipping OWNER TO postgres;

--
-- TOC entry 282 (class 1259 OID 43060)
-- Name: shipping_shippingid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shipping_shippingid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shipping_shippingid_seq OWNER TO postgres;

--
-- TOC entry 5650 (class 0 OID 0)
-- Dependencies: 282
-- Name: shipping_shippingid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipping_shippingid_seq OWNED BY public.shipping.shippingid;


--
-- TOC entry 283 (class 1259 OID 43061)
-- Name: shipping_zones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_zones (
    id integer NOT NULL,
    zone_name character varying(100) NOT NULL,
    delivery_time character varying(50) NOT NULL,
    shipping_cost numeric(10,2) NOT NULL,
    status boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shipping_zones OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 43070)
-- Name: shipping_zones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shipping_zones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shipping_zones_id_seq OWNER TO postgres;

--
-- TOC entry 5651 (class 0 OID 0)
-- Dependencies: 284
-- Name: shipping_zones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipping_zones_id_seq OWNED BY public.shipping_zones.id;


--
-- TOC entry 285 (class 1259 OID 43071)
-- Name: staff_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_notes (
    note_id integer NOT NULL,
    staff_id integer,
    customer_id integer,
    note text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.staff_notes OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 43079)
-- Name: staff_notes_note_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_notes_note_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_notes_note_id_seq OWNER TO postgres;

--
-- TOC entry 5652 (class 0 OID 0)
-- Dependencies: 286
-- Name: staff_notes_note_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_notes_note_id_seq OWNED BY public.staff_notes.note_id;


--
-- TOC entry 287 (class 1259 OID 43080)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    supplier_id integer NOT NULL,
    supplier_name character varying(200) NOT NULL,
    contact_name character varying(150),
    phone character varying(50),
    email character varying(150),
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 288 (class 1259 OID 43088)
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_supplier_id_seq OWNER TO postgres;

--
-- TOC entry 5653 (class 0 OID 0)
-- Dependencies: 288
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_supplier_id_seq OWNED BY public.suppliers.supplier_id;


--
-- TOC entry 289 (class 1259 OID 43089)
-- Name: usercoupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usercoupons (
    usercouponid integer NOT NULL,
    userid integer NOT NULL,
    couponid integer NOT NULL,
    usedat timestamp without time zone,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usercoupons OWNER TO postgres;

--
-- TOC entry 290 (class 1259 OID 43097)
-- Name: usercoupons_usercouponid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usercoupons_usercouponid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usercoupons_usercouponid_seq OWNER TO postgres;

--
-- TOC entry 5654 (class 0 OID 0)
-- Dependencies: 290
-- Name: usercoupons_usercouponid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usercoupons_usercouponid_seq OWNED BY public.usercoupons.usercouponid;


--
-- TOC entry 291 (class 1259 OID 43098)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    userid integer NOT NULL,
    username character varying(64) NOT NULL,
    email character varying(128) NOT NULL,
    password character varying(255) NOT NULL,
    mobile_number character varying(10) NOT NULL,
    dob character varying(10) NOT NULL,
    creation_ip character varying(50),
    role character varying(50) DEFAULT 'customer'::character varying,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_ip inet,
    otp character varying(4),
    promotional boolean,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['customer'::character varying, 'sales_staff'::character varying, 'warehouse_manager'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 292 (class 1259 OID 43114)
-- Name: users_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_userid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_userid_seq OWNER TO postgres;

--
-- TOC entry 5655 (class 0 OID 0)
-- Dependencies: 292
-- Name: users_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_userid_seq OWNED BY public.users.userid;


--
-- TOC entry 296 (class 1259 OID 44125)
-- Name: v_best_selling_products; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_best_selling_products AS
 SELECT p.productid,
    p.title,
    p.brand,
    COALESCE(sum(oi.quantity), (0)::bigint) AS sold_quantity,
    COALESCE(sum(((oi.quantity)::numeric * public.fn_product_final_price(oi.productid))), (0)::numeric) AS revenue
   FROM ((public.products p
     LEFT JOIN public.orderitems oi ON ((oi.productid = p.productid)))
     LEFT JOIN public.orders o ON ((o.orderid = oi.orderid)))
  GROUP BY p.productid, p.title, p.brand
  ORDER BY COALESCE(sum(oi.quantity), (0)::bigint) DESC, COALESCE(sum(((oi.quantity)::numeric * public.fn_product_final_price(oi.productid))), (0)::numeric) DESC;


ALTER VIEW public.v_best_selling_products OWNER TO postgres;

--
-- TOC entry 295 (class 1259 OID 44121)
-- Name: v_low_stock_products; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_low_stock_products AS
 SELECT productid,
    title,
    stock,
    low_stock_threshold,
    brand,
    supplier_id
   FROM public.products
  WHERE (stock <= COALESCE(low_stock_threshold, 10));


ALTER VIEW public.v_low_stock_products OWNER TO postgres;

--
-- TOC entry 297 (class 1259 OID 44130)
-- Name: v_monthly_revenue; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_monthly_revenue AS
 SELECT (date_trunc('month'::text, createdat))::date AS month,
    count(DISTINCT orderid) AS total_orders,
    COALESCE(sum(totalamount), (0)::numeric) AS revenue
   FROM public.orders o
  WHERE (lower((COALESCE(orderstatus, order_status, ''::character varying))::text) <> ALL (ARRAY['cancelled'::text, 'canceled'::text, 'payment failed'::text]))
  GROUP BY ((date_trunc('month'::text, createdat))::date)
  ORDER BY ((date_trunc('month'::text, createdat))::date) DESC;


ALTER VIEW public.v_monthly_revenue OWNER TO postgres;

--
-- TOC entry 293 (class 1259 OID 43115)
-- Name: wishlistitems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlistitems (
    wishlistitemid integer NOT NULL,
    userid integer NOT NULL,
    productid integer NOT NULL,
    addedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wishlistitems OWNER TO postgres;

--
-- TOC entry 294 (class 1259 OID 43122)
-- Name: wishlistitems_wishlistitemid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wishlistitems_wishlistitemid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wishlistitems_wishlistitemid_seq OWNER TO postgres;

--
-- TOC entry 5656 (class 0 OID 0)
-- Dependencies: 294
-- Name: wishlistitems_wishlistitemid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wishlistitems_wishlistitemid_seq OWNED BY public.wishlistitems.wishlistitemid;


--
-- TOC entry 5072 (class 2604 OID 43123)
-- Name: addresses addressid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN addressid SET DEFAULT nextval('public.addresses_addressid_seq'::regclass);


--
-- TOC entry 5075 (class 2604 OID 43124)
-- Name: articles article_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles ALTER COLUMN article_id SET DEFAULT nextval('public.articles_article_id_seq'::regclass);


--
-- TOC entry 5077 (class 2604 OID 43125)
-- Name: banners bannerid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners ALTER COLUMN bannerid SET DEFAULT nextval('public.banners_bannerid_seq'::regclass);


--
-- TOC entry 5081 (class 2604 OID 43126)
-- Name: brands brand_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands ALTER COLUMN brand_id SET DEFAULT nextval('public.brands_brand_id_seq'::regclass);


--
-- TOC entry 5085 (class 2604 OID 43127)
-- Name: cartitems cartitemid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitems ALTER COLUMN cartitemid SET DEFAULT nextval('public.cartitems_cartitemid_seq'::regclass);


--
-- TOC entry 5088 (class 2604 OID 43128)
-- Name: categories categoryid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN categoryid SET DEFAULT nextval('public.categories_categoryid_seq'::regclass);


--
-- TOC entry 5089 (class 2604 OID 43129)
-- Name: child_profiles child_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profiles ALTER COLUMN child_id SET DEFAULT nextval('public.child_profiles_child_id_seq'::regclass);


--
-- TOC entry 5092 (class 2604 OID 43130)
-- Name: collections collection_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections ALTER COLUMN collection_id SET DEFAULT nextval('public.collections_collection_id_seq'::regclass);


--
-- TOC entry 5096 (class 2604 OID 43131)
-- Name: contact_queries queryid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_queries ALTER COLUMN queryid SET DEFAULT nextval('public.contact_queries_queryid_seq'::regclass);


--
-- TOC entry 5097 (class 2604 OID 43132)
-- Name: content_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_items ALTER COLUMN id SET DEFAULT nextval('public.content_items_id_seq'::regclass);


--
-- TOC entry 5100 (class 2604 OID 43133)
-- Name: coupons couponid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons ALTER COLUMN couponid SET DEFAULT nextval('public.coupons_couponid_seq'::regclass);


--
-- TOC entry 5103 (class 2604 OID 43134)
-- Name: deals dealid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals ALTER COLUMN dealid SET DEFAULT nextval('public.deals_dealid_seq'::regclass);


--
-- TOC entry 5104 (class 2604 OID 43135)
-- Name: gift_message_templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_message_templates ALTER COLUMN template_id SET DEFAULT nextval('public.gift_message_templates_template_id_seq'::regclass);


--
-- TOC entry 5107 (class 2604 OID 43136)
-- Name: giftcards cardid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giftcards ALTER COLUMN cardid SET DEFAULT nextval('public.giftcards_cardid_seq'::regclass);


--
-- TOC entry 5111 (class 2604 OID 43137)
-- Name: inventory_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs ALTER COLUMN log_id SET DEFAULT nextval('public.inventory_logs_log_id_seq'::regclass);


--
-- TOC entry 5113 (class 2604 OID 43138)
-- Name: inventory_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.inventory_transactions_transaction_id_seq'::regclass);


--
-- TOC entry 5116 (class 2604 OID 43139)
-- Name: orders orderid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN orderid SET DEFAULT nextval('public.orders_orderid_seq'::regclass);


--
-- TOC entry 5123 (class 2604 OID 43140)
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- TOC entry 5126 (class 2604 OID 43141)
-- Name: payments paymentid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN paymentid SET DEFAULT nextval('public.payments_paymentid_seq'::regclass);


--
-- TOC entry 5130 (class 2604 OID 43142)
-- Name: product_batches batch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches ALTER COLUMN batch_id SET DEFAULT nextval('public.product_batches_batch_id_seq'::regclass);


--
-- TOC entry 5133 (class 2604 OID 43143)
-- Name: productcolors colorid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcolors ALTER COLUMN colorid SET DEFAULT nextval('public.productcolors_colorid_seq'::regclass);


--
-- TOC entry 5134 (class 2604 OID 43144)
-- Name: productimages imageid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages ALTER COLUMN imageid SET DEFAULT nextval('public.productimages_imageid_seq'::regclass);


--
-- TOC entry 5136 (class 2604 OID 43145)
-- Name: productparams productid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productparams ALTER COLUMN productid SET DEFAULT nextval('public.productparams_productid_seq'::regclass);


--
-- TOC entry 5140 (class 2604 OID 43146)
-- Name: products productid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN productid SET DEFAULT nextval('public.products_productid_seq'::regclass);


--
-- TOC entry 5145 (class 2604 OID 43147)
-- Name: productsizes sizeid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsizes ALTER COLUMN sizeid SET DEFAULT nextval('public.productsizes_sizeid_seq'::regclass);


--
-- TOC entry 5146 (class 2604 OID 43148)
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);


--
-- TOC entry 5149 (class 2604 OID 43149)
-- Name: returns return_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns ALTER COLUMN return_id SET DEFAULT nextval('public.returns_return_id_seq'::regclass);


--
-- TOC entry 5154 (class 2604 OID 43150)
-- Name: reviews reviewid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN reviewid SET DEFAULT nextval('public.reviews_reviewid_seq'::regclass);


--
-- TOC entry 5158 (class 2604 OID 43151)
-- Name: savedpaymentcards cardid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savedpaymentcards ALTER COLUMN cardid SET DEFAULT nextval('public.savedpaymentcards_cardid_seq'::regclass);


--
-- TOC entry 5161 (class 2604 OID 43152)
-- Name: shipping shippingid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping ALTER COLUMN shippingid SET DEFAULT nextval('public.shipping_shippingid_seq'::regclass);


--
-- TOC entry 5164 (class 2604 OID 43153)
-- Name: shipping_zones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_zones ALTER COLUMN id SET DEFAULT nextval('public.shipping_zones_id_seq'::regclass);


--
-- TOC entry 5167 (class 2604 OID 43154)
-- Name: staff_notes note_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_notes ALTER COLUMN note_id SET DEFAULT nextval('public.staff_notes_note_id_seq'::regclass);


--
-- TOC entry 5169 (class 2604 OID 43155)
-- Name: suppliers supplier_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN supplier_id SET DEFAULT nextval('public.suppliers_supplier_id_seq'::regclass);


--
-- TOC entry 5171 (class 2604 OID 43156)
-- Name: usercoupons usercouponid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usercoupons ALTER COLUMN usercouponid SET DEFAULT nextval('public.usercoupons_usercouponid_seq'::regclass);


--
-- TOC entry 5174 (class 2604 OID 43157)
-- Name: users userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN userid SET DEFAULT nextval('public.users_userid_seq'::regclass);


--
-- TOC entry 5179 (class 2604 OID 43158)
-- Name: wishlistitems wishlistitemid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlistitems ALTER COLUMN wishlistitemid SET DEFAULT nextval('public.wishlistitems_wishlistitemid_seq'::regclass);


--
-- TOC entry 5514 (class 0 OID 42710)
-- Dependencies: 219
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (addressid, userid, addresstype, username, contactnumber, addressline1, addressline2, city, state, country, postalcode, createdat, updatedat, is_default) FROM stdin;
1	1	HOME	Nguyen Van Khach	0900000001	12 Le Loi	Phuong Ben Nghe	Ho Chi Minh	HCM	Vietnam	700000	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	t
2	2	WORK	Tran Sales Staff	0900000002	88 Tran Duy Hung	Cau Giay	Ha Noi	HN	Vietnam	100000	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	t
3	3	WORK	Le Warehouse Manager	0900000003	25 Bach Dang	\N	Da Nang	DN	Vietnam	550000	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	t
4	4	WORK	Pham System Admin	0900000004	1 Nguyen Hue	\N	Ho Chi Minh	HCM	Vietnam	700000	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	t
3518925	787942253	HOME	Vũ Tuấn	1111111111	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	2	2026-05-14 22:37:02.9093	2026-05-14 22:37:02.9093	t
9994616	123495088	HOME	Vũ Tuấn	1111111111	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	2	2026-05-14 22:58:13.446354	2026-05-14 22:58:13.446354	t
32337288	412047475	HOME	Vũ Tuấn	1111111111	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	3	2026-05-15 08:10:42.088977	2026-05-15 08:10:42.088977	t
\.


--
-- TOC entry 5516 (class 0 OID 42727)
-- Dependencies: 221
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articles (article_id, category, title, imglink, imgalt, author, published_date, content) FROM stdin;
1	Parenting	Cách chọn đồ chơi theo độ tuổi	/images/christmas10.jpg	Đồ chơi theo tuổi	Toy Expert	2026-05-14 20:48:16.315677	Hướng dẫn chọn đồ chơi phù hợp với từng giai đoạn phát triển của trẻ.
2	STEM	Top đồ chơi STEM cho bé	/images/christmas11.jpg	Đồ chơi STEM	Toy Expert	2026-05-14 20:48:16.315677	Các sản phẩm STEM giúp bé phát triển tư duy logic và sáng tạo.
3	Gift Guide	Gợi ý quà Noel cho trẻ em	/images/christmas12.jpg	Quà Noel	3TL Team	2026-05-14 20:48:16.315677	Danh sách quà Noel phù hợp cho bé trai và bé gái.
4	Safety	Tiêu chuẩn an toàn đồ chơi	/images/christmas13.jpg	An toàn đồ chơi	3TL Team	2026-05-14 20:48:16.315677	Các chứng nhận CE, ASTM, EN71 cần biết khi chọn đồ chơi.
\.


--
-- TOC entry 5518 (class 0 OID 42737)
-- Dependencies: 223
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (bannerid, toptitle, middletitle, bottomtitle, imglink, startprice, buttontitle, redirect_link, createdat, updatedat) FROM stdin;
1	Ưu đãi hè	Đồ chơi vận động	Giúp bé năng động mỗi ngày	/images/bannerslide.png	150000.00	Mua ngay	/collections/van-dong-ngoai-troi	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
2	STEM Learning	Học mà chơi	Khơi gợi tư duy sáng tạo	/images/bannerslide1.png	250000.00	Khám phá	/collections/stem-thong-minh	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
3	Christmas Sale	Quà Noel cho bé	Giảm đến 25%	/images/christmas.jpg	99000.00	Xem quà	/collections/qua-noel	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
4	LEGO World	Xây thế giới riêng	Bộ lắp ráp chính hãng	/images/banner.png	399000.00	Xem LEGO	/category/lego-building	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5520 (class 0 OID 42753)
-- Dependencies: 225
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (brand_id, name, slug, manufacturer, country, description, safety_certificates, website, logo_url, is_active, created_at, updated_at) FROM stdin;
6	PlayActive	playactive	PlayActive Toys	Vietnam	Đồ chơi vận động ngoài trời.	CE	https://example.com	/images/active_fishing.jpg	t	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
1	LEGO	lego	The LEGO Group	Denmark	Đồ chơi lắp ráp phát triển tư duy sáng tạo.	CE, ASTM F963, EN71	https://www.lego.com	/images/banner.png	t	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
2	Fisher-Price	fisher-price	Mattel	USA	Đồ chơi an toàn cho trẻ sơ sinh và mầm non.	CE, ASTM F963	https://www.fisher-price.com	/images/ball_house.jpg	t	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
3	Melissa & Doug	melissa-doug	Melissa & Doug	USA	Đồ chơi gỗ giáo dục và nhập vai.	CE, ASTM F963	https://www.melissaanddoug.com	/images/bubble_machine.jpg	t	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
4	Hot Wheels	hot-wheels	Mattel	USA	Xe mô hình và đường đua cho trẻ em.	CE, ASTM F963	https://www.hotwheels.com	/images/car.jpg	t	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
5	VTech	vtech	VTech Holdings	Hong Kong	Đồ chơi điện tử học tập.	CE, ASTM F963	https://www.vtechkids.com	/images/card_pokemon.jpg	t	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5522 (class 0 OID 42765)
-- Dependencies: 227
-- Data for Name: cartitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cartitems (cartitemid, userid, productid, quantity, sizeid, colorid, createdat, updatedat) FROM stdin;
1	1	1	1	1	1	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
2	1	12	2	23	24	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
3	2	28	1	55	56	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
55899714	412047475	47	1	94	93	2026-05-15 08:00:08.265031	2026-05-15 08:00:08.265031
80799677	123495088	46	1	92	91	2026-05-17 23:41:58.245307	2026-05-17 23:41:58.245307
33593038	412047475	35	1	69	69	2026-05-18 09:01:55.434093	2026-05-18 09:01:55.434093
\.


--
-- TOC entry 5524 (class 0 OID 42773)
-- Dependencies: 229
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (categoryid, name, slug, maincategory) FROM stdin;
1	LEGO & Building	lego-building	Building
2	STEM & Science	stem-science	Education
3	Remote Control	remote-control	Electronic
4	Dolls & Figures	dolls-figures	Role Play
5	Board Games	board-games	Family
6	Outdoor Toys	outdoor-toys	Outdoor
7	Baby Toys	baby-toys	Baby
8	Arts & Crafts	arts-crafts	Creative
9	Puzzles	puzzles	Brain
10	Musical Toys	musical-toys	Music
\.


--
-- TOC entry 5526 (class 0 OID 42780)
-- Dependencies: 231
-- Data for Name: child_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_profiles (child_id, user_id, child_name, birth_date, gender, created_at) FROM stdin;
1	1	Bé An	2020-06-01	Boy	2026-05-14 20:48:16.315677
2	1	Bé Mai	2018-12-20	Girl	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5528 (class 0 OID 42786)
-- Dependencies: 233
-- Data for Name: collection_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collection_products (collection_id, productid, added_at) FROM stdin;
2	1	2026-05-14 20:48:16.315677
3	2	2026-05-14 20:48:16.315677
4	3	2026-05-14 20:48:16.315677
5	4	2026-05-14 20:48:16.315677
1	5	2026-05-14 20:48:16.315677
2	6	2026-05-14 20:48:16.315677
3	7	2026-05-14 20:48:16.315677
4	8	2026-05-14 20:48:16.315677
5	9	2026-05-14 20:48:16.315677
1	10	2026-05-14 20:48:16.315677
2	11	2026-05-14 20:48:16.315677
3	12	2026-05-14 20:48:16.315677
4	13	2026-05-14 20:48:16.315677
5	14	2026-05-14 20:48:16.315677
1	15	2026-05-14 20:48:16.315677
2	16	2026-05-14 20:48:16.315677
3	17	2026-05-14 20:48:16.315677
4	18	2026-05-14 20:48:16.315677
5	19	2026-05-14 20:48:16.315677
1	20	2026-05-14 20:48:16.315677
2	21	2026-05-14 20:48:16.315677
3	22	2026-05-14 20:48:16.315677
4	23	2026-05-14 20:48:16.315677
5	24	2026-05-14 20:48:16.315677
1	25	2026-05-14 20:48:16.315677
2	26	2026-05-14 20:48:16.315677
3	27	2026-05-14 20:48:16.315677
4	28	2026-05-14 20:48:16.315677
5	29	2026-05-14 20:48:16.315677
1	30	2026-05-14 20:48:16.315677
2	31	2026-05-14 20:48:16.315677
3	32	2026-05-14 20:48:16.315677
4	33	2026-05-14 20:48:16.315677
5	34	2026-05-14 20:48:16.315677
1	35	2026-05-14 20:48:16.315677
2	36	2026-05-14 20:48:16.315677
3	37	2026-05-14 20:48:16.315677
4	38	2026-05-14 20:48:16.315677
5	39	2026-05-14 20:48:16.315677
1	40	2026-05-14 20:48:16.315677
2	41	2026-05-14 20:48:16.315677
3	42	2026-05-14 20:48:16.315677
4	43	2026-05-14 20:48:16.315677
5	44	2026-05-14 20:48:16.315677
1	45	2026-05-14 20:48:16.315677
2	46	2026-05-14 20:48:16.315677
3	47	2026-05-14 20:48:16.315677
4	48	2026-05-14 20:48:16.315677
5	49	2026-05-14 20:48:16.315677
1	50	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5529 (class 0 OID 42792)
-- Dependencies: 234
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collections (collection_id, name, slug, description, imglink, display_order, is_active, created_at) FROM stdin;
1	Bán chạy	ban-chay	Các sản phẩm được mua nhiều nhất	/images/bannerslide1.png	1	t	2026-05-14 20:48:16.315677
2	STEM thông minh	stem-thong-minh	Đồ chơi giáo dục khoa học công nghệ	/images/bannerslide2.png	2	t	2026-05-14 20:48:16.315677
3	Quà Noel	qua-noel	Gợi ý quà Giáng sinh cho bé	/images/christmas.jpg	3	t	2026-05-14 20:48:16.315677
4	Mầm non 2-5 tuổi	mam-non-2-5	Đồ chơi an toàn cho trẻ nhỏ	/images/ball_house.jpg	4	t	2026-05-14 20:48:16.315677
5	Vận động ngoài trời	van-dong-ngoai-troi	Đồ chơi giúp bé vận động	/images/active_fishing.jpg	5	t	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5531 (class 0 OID 42804)
-- Dependencies: 236
-- Data for Name: contact_queries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_queries (queryid, name, email, number, method, message) FROM stdin;
1	Nguyen Van Khach	customer@3tltoys.vn	0900000001	email	Tôi muốn tư vấn đồ chơi cho bé 5 tuổi.
2	Minh Anh	minhanh@example.com	0911111111	phone	Còn hàng LEGO Classic không?
\.


--
-- TOC entry 5533 (class 0 OID 42811)
-- Dependencies: 238
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content_items (id, title, type, location, content_data, status, created_at) FROM stdin;
1	Homepage Hero	banner	home_top	{"link": "/shop", "image": "/images/bannerslide.png"}	t	2026-05-14 20:48:16.315677
2	Deal Section	section	home_middle	{"limit": 8, "title": "Flash Sale"}	t	2026-05-14 20:48:16.315677
3	Noel Popup	popup	home	{"image": "/images/christmas.jpg", "coupon": "NOEL25"}	t	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5535 (class 0 OID 42823)
-- Dependencies: 240
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (couponid, code, description, discountpercentage, maxdiscountamount, minpurchaseamount, validfrom, validuntil, createdat, updatedat) FROM stdin;
1	WELCOME10	Giảm 10% cho khách hàng mới	10.00	200000.00	300000.00	2026-01-01 00:00:00	2026-12-31 00:00:00	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
2	KIDDAY20	Ưu đãi Quốc tế Thiếu nhi	20.00	500000.00	800000.00	2026-05-01 00:00:00	2026-06-30 00:00:00	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
3	NOEL25	Ưu đãi Noel	25.00	600000.00	1000000.00	2026-12-01 00:00:00	2026-12-31 00:00:00	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
4	BIRTHDAY15	Ưu đãi sinh nhật cho bé	15.00	300000.00	500000.00	2026-01-01 00:00:00	2026-12-31 00:00:00	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5537 (class 0 OID 42833)
-- Dependencies: 242
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deals (dealid, productid, end_time, sold, available) FROM stdin;
1	1	2026-06-01 23:59:59	35	100
2	5	2026-06-05 23:59:59	20	50
3	25	2026-12-25 23:59:59	48	120
4	40	2026-07-01 23:59:59	12	80
\.


--
-- TOC entry 5539 (class 0 OID 42840)
-- Dependencies: 244
-- Data for Name: gift_message_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gift_message_templates (template_id, occasion, title, content, is_active, created_at) FROM stdin;
1	Birthday	Sinh nhật vui vẻ	Chúc bé sinh nhật vui vẻ, luôn ngoan và học giỏi!	t	2026-05-14 20:48:16.315677
2	Christmas	Merry Christmas	Chúc bé một mùa Giáng sinh ấm áp và nhiều quà!	t	2026-05-14 20:48:16.315677
3	Children Day	Quốc tế Thiếu nhi	Chúc bé luôn vui khỏe và sáng tạo mỗi ngày!	t	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5541 (class 0 OID 42852)
-- Dependencies: 246
-- Data for Name: giftcards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.giftcards (cardid, cardname, cardcode, description, balance, currency, expirydate, recipientname, recipientemail, sendername, senderemail, message, createdat, updatedat, status) FROM stdin;
1	Gift Card 500K	GC500K2026	Phiếu quà tặng mua đồ chơi	500000.00	VND	2026-12-31	Bé An	be.an@example.com	Nguyen Van Khach	customer@3tltoys.vn	Chúc bé chọn được món quà yêu thích	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	Active
2	Gift Card 1M	GC1M2026	Phiếu quà tặng cao cấp	1000000.00	VND	2026-12-31	Bé Mai	be.mai@example.com	Nguyen Van Khach	customer@3tltoys.vn	Món quà đặc biệt cho bé	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	Active
\.


--
-- TOC entry 5543 (class 0 OID 42867)
-- Dependencies: 248
-- Data for Name: inventory_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_logs (log_id, productid, change_type, quantity_change, stock_after, batch_code, supplier_id, note, created_by, created_at) FROM stdin;
1	1	import	50	53	BATCH-2026-001	2	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
2	2	import	50	56	BATCH-2026-002	3	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
3	3	import	50	59	BATCH-2026-003	4	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
4	4	import	50	62	BATCH-2026-004	1	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
5	5	import	50	65	BATCH-2026-005	2	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
6	6	import	50	68	BATCH-2026-006	3	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
7	7	import	50	71	BATCH-2026-007	4	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
8	8	import	50	74	BATCH-2026-008	1	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
9	9	import	50	77	BATCH-2026-009	2	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
10	10	import	50	80	BATCH-2026-010	3	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
11	11	import	50	83	BATCH-2026-011	4	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
12	12	import	50	86	BATCH-2026-012	1	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
13	13	import	50	89	BATCH-2026-013	2	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
14	14	import	50	92	BATCH-2026-014	3	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
15	15	import	50	95	BATCH-2026-015	4	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
16	16	import	50	98	BATCH-2026-016	1	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
17	17	import	50	101	BATCH-2026-017	2	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
18	18	import	50	104	BATCH-2026-018	3	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
19	19	import	50	107	BATCH-2026-019	4	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
20	20	import	50	110	BATCH-2026-020	1	Nhập kho dữ liệu demo	3	2026-05-14 20:48:16.315677
21	6	IN	9	80	65	\N	tỷ	123495088	2026-05-14 23:06:12.658083
22	45	RETURN	1	56	\N	\N	Restore stock from return #1	123495088	2026-05-14 23:06:43.092367
23	45	RETURN	1	57	\N	\N	Restore stock from return #1	123495088	2026-05-14 23:06:44.060677
24	45	RETURN	1	58	\N	\N	Restore stock from return #1	123495088	2026-05-14 23:06:49.249562
25	50	SALE	-1	89	\N	\N	Auto stock decrease from order #51760370	\N	2026-05-15 15:58:19.953494
26	50	SALE	-1	88	\N	\N	Auto stock decrease from order #93310607	\N	2026-05-15 15:59:07.717203
27	50	SALE	-1	87	\N	\N	Auto stock decrease from order #39216767	\N	2026-05-15 15:59:34.900139
28	50	SALE	-1	86	\N	\N	Auto stock decrease from order #9	\N	2026-05-15 16:07:34.155337
29	48	SALE	-1	75	\N	\N	Auto stock decrease from order #10	\N	2026-05-15 16:18:58.194236
30	48	SALE	-1	74	\N	\N	Auto stock decrease from order #11	\N	2026-05-15 16:28:44.897426
31	49	SALE	-1	82	\N	\N	Auto stock decrease from order #12	\N	2026-05-15 16:30:53.698979
32	40	SALE	-1	19	\N	\N	Auto stock decrease from order #13	\N	2026-05-16 14:43:36.449337
33	40	SALE	-1	18	\N	\N	Auto stock decrease from order #14	\N	2026-05-16 15:17:29.078933
34	40	SALE	-1	17	\N	\N	Auto stock decrease from order #15	\N	2026-05-16 15:19:52.416051
35	50	SALE	-1	85	\N	\N	Auto stock decrease from order #16	\N	2026-05-16 15:41:00.410711
36	50	SALE	-1	84	\N	\N	Auto stock decrease from order #17	\N	2026-05-17 07:58:39.031208
37	50	SALE	-1	83	\N	\N	Auto stock decrease from order #18	\N	2026-05-17 22:38:43.418968
38	50	SALE	-1	81	\N	\N	Auto stock decrease from order #19	\N	2026-05-17 22:39:19.052402
39	50	SALE	-1	79	\N	\N	Auto stock decrease from order #20	\N	2026-05-17 22:39:29.01416
40	50	SALE	-1	77	\N	\N	Auto stock decrease from order #21	\N	2026-05-17 22:41:42.716081
41	49	SALE	-1	81	\N	\N	Auto stock decrease from order #22	\N	2026-05-17 22:52:30.407145
42	49	SALE	-1	79	\N	\N	Auto stock decrease from order #23	\N	2026-05-17 22:52:55.52094
43	48	SALE	-1	73	\N	\N	Auto stock decrease from order #24	\N	2026-05-17 23:36:17.901174
44	48	SALE	-1	71	\N	\N	Auto stock decrease from order #25	\N	2026-05-18 08:29:56.681446
45	35	SALE	-1	124	\N	\N	Auto stock decrease from order #26	\N	2026-05-18 09:03:59.55541
\.


--
-- TOC entry 5545 (class 0 OID 42878)
-- Dependencies: 250
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_transactions (transaction_id, product_id, transaction_type, quantity, batch_number, notes, created_by, created_at) FROM stdin;
1	1	IMPORT	52	BATCH-2026-001	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
2	2	IMPORT	54	BATCH-2026-002	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
3	3	IMPORT	56	BATCH-2026-003	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
4	4	IMPORT	58	BATCH-2026-004	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
5	5	IMPORT	60	BATCH-2026-005	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
6	6	IMPORT	62	BATCH-2026-006	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
7	7	IMPORT	64	BATCH-2026-007	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
8	8	IMPORT	66	BATCH-2026-008	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
9	9	IMPORT	68	BATCH-2026-009	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
10	10	IMPORT	70	BATCH-2026-010	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
11	11	IMPORT	72	BATCH-2026-011	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
12	12	IMPORT	74	BATCH-2026-012	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
13	13	IMPORT	76	BATCH-2026-013	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
14	14	IMPORT	78	BATCH-2026-014	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
15	15	IMPORT	80	BATCH-2026-015	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
16	16	IMPORT	82	BATCH-2026-016	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
17	17	IMPORT	84	BATCH-2026-017	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
18	18	IMPORT	86	BATCH-2026-018	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
19	19	IMPORT	88	BATCH-2026-019	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
20	20	IMPORT	90	BATCH-2026-020	Nhập hàng đầu kỳ	3	2026-05-14 20:48:16.315677
21	6	IN	9	65	tỷ	123495088	2026-05-14 23:06:12.658083
\.


--
-- TOC entry 5547 (class 0 OID 42888)
-- Dependencies: 252
-- Data for Name: orderitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orderitems (orderitemid, orderid, productid, quantity, shippingid, paymentid, colorid, sizeid, gift_wrapping, gift_wrap_style, gift_message) FROM stdin;
1	1	1	1	1	1	1	1	t	Birthday	Chúc bé vui
2	1	4	1	1	1	7	7	f	\N	\N
3	2	25	1	2	2	49	49	f	\N	\N
4	3	10	1	3	3	19	19	f	\N	\N
5	4	13	2	4	4	25	25	t	Christmas	Merry Christmas
6	5	45	1	5	5	89	89	f	\N	\N
7	6	28	1	6	6	55	55	f	\N	\N
8	7	34	1	7	7	67	67	f	\N	\N
9	8	6	1	8	8	11	11	t	Premium	Quà cho bé
33202881	51760370	50	1	82085095	56401643	99	99	f	\N	\N
24180266	93310607	50	1	17468614	47996291	99	99	f	\N	\N
63731941	39216767	50	1	74986719	65697413	99	99	t	Classic Red	njjk
48959291	9	50	1	42042946	90948917	99	99	f	\N	\N
63293232	10	48	1	69927025	2939201	95	95	f	\N	\N
71648289	11	48	1	27163051	89904416	95	95	f	\N	\N
45683319	12	49	1	95844789	2222327	97	97	f	\N	\N
9596839	13	40	1	76537194	96207525	79	79	f	\N	\N
18060944	14	40	1	84794690	22114770	79	79	f	\N	\N
48294814	15	40	1	62077195	30691397	79	79	f	\N	\N
43132871	16	50	1	9781583	3997313	99	100	f	\N	\N
75837333	17	50	1	79867177	51224647	99	99	f	\N	\N
75376238	18	50	1	13341340	78821183	99	99	f	\N	\N
79951727	19	50	1	59506399	72658812	99	99	f	\N	\N
8542056	20	50	1	56842064	12052682	99	99	f	\N	\N
89344497	21	50	1	64403268	85561543	99	99	f	Christmas Theme	Happy Birthday! Wishing you joy and creativity!
99644746	22	49	1	9857920	79216675	97	97	f	\N	\N
37931974	23	49	1	1117304	95759845	97	97	f	\N	\N
34354782	24	48	1	7655190	74016285	95	95	f	Baby Blue	Happy Birthday! Wishing you joy and creativity!
78984986	25	48	1	76859832	84551712	95	95	t	Birthday Theme	A special gift just for you!
107510	26	35	1	65649846	15084420	69	69	f	\N	\N
\.


--
-- TOC entry 5548 (class 0 OID 42895)
-- Dependencies: 253
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (orderid, userid, totalamount, orderstatus, createdat, updatedat, order_code, is_gift, gift_message, gift_wrapping_type, order_status, tracking_number, shipped_at, delivered_at, delivery_status) FROM stdin;
1	1	638000.00	Delivered	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	A001	t	Chúc bé sinh nhật vui vẻ	Birthday	Delivered	3TL0001	2026-05-01 09:00:00	2026-05-03 15:00:00	Delivered
2	1	1490000.00	Pending	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	A002	f	\N	\N	Pending	\N	\N	\N	Confirmed
4	1	2190000.00	Shipping	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	A004	t	Merry Christmas	Christmas	Shipping	3TL0004	2026-05-10 10:30:00	\N	Shipping
5	1	450000.00	Cancelled	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	A005	f	\N	\N	Cancelled	\N	\N	\N	Cancelled
6	2	1250000.00	Delivered	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	A006	f	\N	\N	Delivered	3TL0006	2026-04-20 08:00:00	2026-04-22 11:00:00	Delivered
7	1	760000.00	Delivered	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	A007	f	\N	\N	Delivered	3TL0007	2026-04-25 08:00:00	2026-04-27 12:00:00	Delivered
8	1	1990000.00	Confirmed	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	A008	t	Quà tặng bé ngoan	Premium	Confirmed	3TL0008	\N	\N	Confirmed
3	2	890000.00	Confirmed	2026-05-14 20:48:16.315677	2026-05-14 22:20:19.068799	A003	f	\N	\N	Confirmed	3TL0003	\N	\N	Confirmed
51760370	412047475	1377505.00	Delivered	2026-05-15 15:58:19.843245	2026-05-15 15:58:19.953494	IN	f	\N	\N	Delivered	\N	\N	2026-05-20 15:58:19	Delivered
93310607	412047475	1377505.00	Delivered	2026-05-15 15:59:07.68881	2026-05-15 15:59:07.717203	IN	f	\N	\N	Delivered	\N	\N	2026-05-20 15:59:07	Delivered
19	412047475	1407500.00	Confirmed	2026-05-17 22:39:19.052402	2026-05-17 22:39:19.052402	IN	f	\N	\N	Confirmed	\N	\N	2026-05-22 15:39:19	Delivered
39216767	412047475	1377505.00	Delivered	2026-05-15 15:59:34.887235	2026-05-15 15:59:34.900139	IN	f	\N	\N	Delivered	\N	\N	2026-05-20 15:59:34	Delivered
9	412047475	1382500.00	Delivered	2026-05-15 16:07:34.155337	2026-05-15 16:07:34.155337	IN	f	\N	\N	Delivered	\N	\N	2026-05-20 16:07:34	Delivered
10	412047475	1048200.00	Delivered	2026-05-15 16:18:58.194236	2026-05-15 16:18:58.194236	IN	f	\N	\N	Delivered	\N	\N	2026-05-20 16:18:58	Delivered
11	412047475	1048200.00	Delivered	2026-05-15 16:28:44.897426	2026-05-15 16:28:44.897426	IN	f	\N	\N	Delivered	\N	\N	2026-05-20 16:28:44	Delivered
12	412047475	1382000.00	Delivered	2026-05-15 16:30:53.698979	2026-05-15 16:30:53.698979	IN	f	\N	\N	Delivered	\N	\N	2026-05-20 16:30:53	Delivered
20	412047475	1407500.00	Confirmed	2026-05-17 22:39:29.01416	2026-05-17 22:39:29.01416	IN	f	\N	\N	Confirmed	\N	\N	2026-05-22 15:39:29	Delivered
13	412047475	617000.00	Delivered	2026-05-16 14:43:36.449337	2026-05-16 14:43:36.449337	IN	f	\N	\N	Delivered	\N	\N	2026-05-21 14:43:36	Delivered
14	412047475	617000.00	Delivered	2026-05-16 15:17:29.078933	2026-05-16 15:17:29.078933	IN	f	\N	\N	Delivered	\N	\N	2026-05-21 15:17:29	Delivered
15	412047475	617000.00	Delivered	2026-05-16 15:19:52.416051	2026-05-16 15:19:52.416051	IN	f	\N	\N	Delivered	\N	\N	2026-05-21 15:19:52	Delivered
16	412047475	1382500.00	Packed	2026-05-16 15:41:00.410711	2026-05-16 19:57:49.008027	IN	f	\N	\N	Packed	\N	\N	2026-05-21 15:41:00	Packed
21	412047475	1407500.00	Confirmed	2026-05-17 22:41:42.716081	2026-05-17 22:41:42.716081	IN	f	Happy Birthday! Wishing you joy and creativity!	Christmas Theme	Confirmed	\N	\N	2026-05-22 15:41:42	Delivered
17	412047475	1382500.00	Delivered	2026-05-17 07:58:39.031208	2026-05-17 07:58:39.031208	IN	f	\N	\N	Delivered	\N	\N	2026-05-22 07:58:39	Delivered
18	412047475	1407500.00	Delivered	2026-05-17 22:38:43.418968	2026-05-17 22:38:43.418968	IN	f	\N	\N	Delivered	\N	\N	2026-05-22 15:38:43	Delivered
22	412047475	1407000.00	Delivered	2026-05-17 22:52:30.407145	2026-05-17 22:52:30.407145	IN	f	\N	\N	Delivered	\N	\N	2026-05-22 15:52:30	Delivered
25	412047475	1073200.00	Confirmed	2026-05-18 08:29:56.681446	2026-05-18 08:29:56.681446	IN	t	A special gift just for you!	Birthday Theme	Confirmed	\N	\N	2026-05-23 01:29:56	Delivered
23	412047475	1407000.00	Confirmed	2026-05-17 22:52:55.52094	2026-05-17 22:52:55.52094	IN	f	\N	\N	Confirmed	\N	\N	2026-05-22 15:52:55	Delivered
24	412047475	1073200.00	Confirmed	2026-05-17 23:36:17.901174	2026-05-17 23:38:22.440279	IN	f	Happy Birthday! Wishing you joy and creativity!	Baby Blue	Confirmed	\N	\N	2026-05-22 16:36:17	Confirmed
26	412047475	385000.00	Confirmed	2026-05-18 09:03:59.55541	2026-05-18 09:03:59.55541	IN	f	\N	\N	Confirmed	\N	\N	2026-05-23 02:03:59	Delivered
\.


--
-- TOC entry 5550 (class 0 OID 42909)
-- Dependencies: 255
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (id, name, type, status, config, created_at) FROM stdin;
1	Thanh toán khi nhận hàng	COD	t	{"fee": 15000, "description": "Thanh toán tiền mặt khi nhận hàng"}	2026-05-14 20:48:16.315677
2	Ví Momo	E-Wallet	t	{"fee": 0, "provider": "momo", "storeName": "TOYS 3TL", "qrImageUrl": "/images/payment/momo-qr.png", "description": "Quét QR hoặc thanh toán qua ví Momo"}	2026-05-14 20:48:16.315677
3	VNPay	Gateway	t	{"fee": 0, "provider": "vnpay", "storeName": "TOYS 3TL", "qrImageUrl": "/images/payment/vnpay-qr.png", "description": "ATM/Napas/QR qua VNPay"}	2026-05-14 20:48:16.315677
4	Thẻ ATM/Napas/Visa/Mastercard	Card	t	{"fee": 0, "provider": "local_card", "qrImageUrl": "/images/payment/card-qr.png", "description": "Thanh toán bằng thẻ ngân hàng nội địa hoặc quốc tế"}	2026-05-14 20:48:16.315677
5	Chuyển khoản ngân hàng	BankTransfer	t	{"fee": 0, "bankBin": "970436", "provider": "bank_transfer", "storeName": "TOYS 3TL", "qrImageUrl": "/images/payment/bank-qr.png", "bankAccount": "1234567890", "description": "Quét QR ngân hàng hoặc chuyển khoản theo thông tin cửa hàng cung cấp", "bankAccountName": "TOYS 3TL"}	2026-05-17 23:05:16.623871
\.


--
-- TOC entry 5552 (class 0 OID 42920)
-- Dependencies: 257
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (paymentid, orderid, paymentmethod, paymentstatus, amount, transactionid, createdat, updatedat, billingaddress, paymentgateway_id) FROM stdin;
1	1	COD	Paid	638000.00	COD-A001	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	1	\N
2	2	Momo	Pending	1490000.00	MOMO-A002	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	1	momo_demo_002
3	3	VNPay	Paid	890000.00	VNP-A003	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	2	vnp_demo_003
4	4	Credit Card	Paid	2190000.00	CARD-A004	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	1	stripe_demo_004
5	5	COD	Refunded	450000.00	COD-A005	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	1	\N
6	6	Momo	Paid	1250000.00	MOMO-A006	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	2	momo_demo_006
7	7	COD	Paid	760000.00	COD-A007	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	1	\N
8	8	VNPay	Pending	1990000.00	VNP-A008	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	1	vnp_demo_008
56401643	51760370	Payment on Delivery	Pending	5.00	TS-73414790-56401643-51760370	2026-05-15 15:58:19.944104	2026-05-15 15:58:19.944104	32337288	\N
47996291	93310607	Payment on Delivery	Pending	5.00	TS-52258287-47996291-93310607	2026-05-15 15:59:07.71483	2026-05-15 15:59:07.71483	32337288	\N
65697413	39216767	Payment on Delivery	Pending	5.00	TS-69294091-65697413-39216767	2026-05-15 15:59:34.896806	2026-05-15 15:59:34.896806	32337288	\N
90948917	9	Payment on Delivery	Pending	1377500.00	COD-9-90948917	2026-05-15 16:07:34.155337	2026-05-15 16:07:34.155337	32337288	\N
2939201	10	Payment on Delivery	Pending	1043200.00	COD-10-2939201	2026-05-15 16:18:58.194236	2026-05-15 16:18:58.194236	32337288	\N
89904416	11	Payment on Delivery	Pending	1043200.00	COD-11-89904416	2026-05-15 16:28:44.897426	2026-05-15 16:28:44.897426	32337288	\N
2222327	12	Payment on Delivery	Pending	1377000.00	COD-12-2222327	2026-05-15 16:30:53.698979	2026-05-15 16:30:53.698979	32337288	\N
96207525	13	Payment on Delivery	Pending	612000.00	COD-13-96207525	2026-05-16 14:43:36.449337	2026-05-16 14:43:36.449337	32337288	\N
22114770	14	Payment on Delivery	Pending	612000.00	COD-14-22114770	2026-05-16 15:17:29.078933	2026-05-16 15:17:29.078933	32337288	\N
30691397	15	Payment on Delivery	Pending	612000.00	COD-15-30691397	2026-05-16 15:19:52.416051	2026-05-16 15:19:52.416051	32337288	\N
3997313	16	Payment on Delivery	Pending	1377500.00	COD-16-3997313	2026-05-16 15:41:00.410711	2026-05-16 15:41:00.410711	32337288	\N
51224647	17	Payment on Delivery	Pending	1377500.00	COD-17-51224647	2026-05-17 07:58:39.031208	2026-05-17 07:58:39.031208	32337288	\N
78821183	18	Thanh toán khi nhận hàng	Pending	1377500.00	THANH-TOÁN-KHI-NHẬN-HÀNG-18-78821183	2026-05-17 22:38:43.418968	2026-05-17 22:38:43.418968	32337288	\N
72658812	19	Ví Momo	Paid	1377500.00	VÍ-MOMO-19-72658812	2026-05-17 22:39:19.052402	2026-05-17 22:39:19.052402	32337288	DEMO-1779032359051
12052682	20	VNPay	Paid	1377500.00	VNPAY-20-12052682	2026-05-17 22:39:29.01416	2026-05-17 22:39:29.01416	32337288	DEMO-1779032369013
85561543	21	Chuyển khoản ngân hàng	Paid	1377500.00	CHUYỂN-KHOẢN-NGÂN-HÀNG-21-85561543	2026-05-17 22:41:42.716081	2026-05-17 22:41:42.716081	32337288	DEMO-1779032502715
79216675	22	Thanh toán khi nhận hàng	Pending	1377000.00	THANH-TOÁN-KHI-NHẬN-HÀNG-22-79216675	2026-05-17 22:52:30.407145	2026-05-17 22:52:30.407145	32337288	\N
95759845	23	Ví Momo	Paid	1377000.00	VÍ-MOMO-23-95759845	2026-05-17 22:52:55.52094	2026-05-17 22:52:55.52094	32337288	DEMO-1779033175520
74016285	24	VNPay	Paid	1043200.00	VNPAY-24-74016285	2026-05-17 23:36:17.901174	2026-05-17 23:36:17.901174	32337288	DEMO-1779035777899
84551712	25	Chuyển khoản ngân hàng	Paid	1043200.00	CHUYỂN-KHOẢN-NGÂN-HÀNG-25-84551712	2026-05-18 08:29:56.681446	2026-05-18 08:29:56.681446	32337288	DEMO-1779067796678
15084420	26	Ví Momo	Paid	355000.00	VÍ-MOMO-26-15084420	2026-05-18 09:03:59.55541	2026-05-18 09:03:59.55541	32337288	DEMO-1779069839554
\.


--
-- TOC entry 5554 (class 0 OID 42931)
-- Dependencies: 259
-- Data for Name: product_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_batches (batch_id, product_id, batch_number, quantity, manufacture_date, expiry_date, created_at) FROM stdin;
1	1	BATCH-2026-001	53	2026-01-01	\N	2026-05-14 20:48:16.315677
2	2	BATCH-2026-002	56	2026-01-01	\N	2026-05-14 20:48:16.315677
3	3	BATCH-2026-003	59	2026-01-01	\N	2026-05-14 20:48:16.315677
4	4	BATCH-2026-004	62	2026-01-01	\N	2026-05-14 20:48:16.315677
5	5	BATCH-2026-005	65	2026-01-01	\N	2026-05-14 20:48:16.315677
6	6	BATCH-2026-006	68	2026-01-01	\N	2026-05-14 20:48:16.315677
7	7	BATCH-2026-007	71	2026-01-01	\N	2026-05-14 20:48:16.315677
8	8	BATCH-2026-008	74	2026-01-01	\N	2026-05-14 20:48:16.315677
9	9	BATCH-2026-009	77	2026-01-01	\N	2026-05-14 20:48:16.315677
10	10	BATCH-2026-010	80	2026-01-01	\N	2026-05-14 20:48:16.315677
11	11	BATCH-2026-011	83	2026-01-01	\N	2026-05-14 20:48:16.315677
12	12	BATCH-2026-012	86	2026-01-01	\N	2026-05-14 20:48:16.315677
13	13	BATCH-2026-013	89	2026-01-01	\N	2026-05-14 20:48:16.315677
14	14	BATCH-2026-014	92	2026-01-01	\N	2026-05-14 20:48:16.315677
15	15	BATCH-2026-015	95	2026-01-01	\N	2026-05-14 20:48:16.315677
16	16	BATCH-2026-016	98	2026-01-01	\N	2026-05-14 20:48:16.315677
17	17	BATCH-2026-017	101	2026-01-01	\N	2026-05-14 20:48:16.315677
18	18	BATCH-2026-018	104	2026-01-01	\N	2026-05-14 20:48:16.315677
19	19	BATCH-2026-019	107	2026-01-01	\N	2026-05-14 20:48:16.315677
20	20	BATCH-2026-020	110	2026-01-01	\N	2026-05-14 20:48:16.315677
21	6	65	9	2026-05-13	2026-05-21	2026-05-14 23:06:12.658083
\.


--
-- TOC entry 5556 (class 0 OID 42940)
-- Dependencies: 261
-- Data for Name: productcolors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productcolors (colorid, productid, colorname, colorclass) FROM stdin;
1	1	Đỏ	bg-red-500
3	2	Đỏ	bg-red-500
5	3	Đỏ	bg-red-500
7	4	Đỏ	bg-red-500
9	5	Đỏ	bg-red-500
11	6	Đỏ	bg-red-500
13	7	Đỏ	bg-red-500
15	8	Đỏ	bg-red-500
17	9	Đỏ	bg-red-500
19	10	Đỏ	bg-red-500
21	11	Đỏ	bg-red-500
23	12	Đỏ	bg-red-500
25	13	Đỏ	bg-red-500
27	14	Đỏ	bg-red-500
29	15	Đỏ	bg-red-500
31	16	Đỏ	bg-red-500
33	17	Đỏ	bg-red-500
35	18	Đỏ	bg-red-500
37	19	Đỏ	bg-red-500
39	20	Đỏ	bg-red-500
41	21	Đỏ	bg-red-500
43	22	Đỏ	bg-red-500
45	23	Đỏ	bg-red-500
47	24	Đỏ	bg-red-500
49	25	Đỏ	bg-red-500
51	26	Đỏ	bg-red-500
53	27	Đỏ	bg-red-500
55	28	Đỏ	bg-red-500
57	29	Đỏ	bg-red-500
59	30	Đỏ	bg-red-500
61	31	Đỏ	bg-red-500
63	32	Đỏ	bg-red-500
65	33	Đỏ	bg-red-500
67	34	Đỏ	bg-red-500
69	35	Đỏ	bg-red-500
71	36	Đỏ	bg-red-500
73	37	Đỏ	bg-red-500
75	38	Đỏ	bg-red-500
77	39	Đỏ	bg-red-500
79	40	Đỏ	bg-red-500
81	41	Đỏ	bg-red-500
83	42	Đỏ	bg-red-500
85	43	Đỏ	bg-red-500
87	44	Đỏ	bg-red-500
89	45	Đỏ	bg-red-500
91	46	Đỏ	bg-red-500
93	47	Đỏ	bg-red-500
95	48	Đỏ	bg-red-500
97	49	Đỏ	bg-red-500
99	50	Đỏ	bg-red-500
2	1	Xanh	bg-blue-500
4	2	Xanh	bg-blue-500
6	3	Xanh	bg-blue-500
8	4	Xanh	bg-blue-500
10	5	Xanh	bg-blue-500
12	6	Xanh	bg-blue-500
14	7	Xanh	bg-blue-500
16	8	Xanh	bg-blue-500
18	9	Xanh	bg-blue-500
20	10	Xanh	bg-blue-500
22	11	Xanh	bg-blue-500
24	12	Xanh	bg-blue-500
26	13	Xanh	bg-blue-500
28	14	Xanh	bg-blue-500
30	15	Xanh	bg-blue-500
32	16	Xanh	bg-blue-500
34	17	Xanh	bg-blue-500
36	18	Xanh	bg-blue-500
38	19	Xanh	bg-blue-500
40	20	Xanh	bg-blue-500
42	21	Xanh	bg-blue-500
44	22	Xanh	bg-blue-500
46	23	Xanh	bg-blue-500
48	24	Xanh	bg-blue-500
50	25	Xanh	bg-blue-500
52	26	Xanh	bg-blue-500
54	27	Xanh	bg-blue-500
56	28	Xanh	bg-blue-500
58	29	Xanh	bg-blue-500
60	30	Xanh	bg-blue-500
62	31	Xanh	bg-blue-500
64	32	Xanh	bg-blue-500
66	33	Xanh	bg-blue-500
68	34	Xanh	bg-blue-500
70	35	Xanh	bg-blue-500
72	36	Xanh	bg-blue-500
74	37	Xanh	bg-blue-500
76	38	Xanh	bg-blue-500
78	39	Xanh	bg-blue-500
80	40	Xanh	bg-blue-500
82	41	Xanh	bg-blue-500
84	42	Xanh	bg-blue-500
86	43	Xanh	bg-blue-500
88	44	Xanh	bg-blue-500
90	45	Xanh	bg-blue-500
92	46	Xanh	bg-blue-500
94	47	Xanh	bg-blue-500
96	48	Xanh	bg-blue-500
98	49	Xanh	bg-blue-500
100	50	Xanh	bg-blue-500
\.


--
-- TOC entry 5558 (class 0 OID 42946)
-- Dependencies: 263
-- Data for Name: productimages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productimages (imageid, productid, imglink, imgalt, createdat, isprimary) FROM stdin;
1	1	/images/active_fishing.jpg	Ảnh sản phẩm Bộ câu cá nam châm Active Fishing	2026-05-14 20:48:16.315677	t
2	2	/images/ball_house.jpg	Ảnh sản phẩm Nhà bóng mini cho bé	2026-05-14 20:48:16.315677	t
3	3	/images/bubble_machine.jpg	Ảnh sản phẩm Máy thổi bong bóng tự động	2026-05-14 20:48:16.315677	t
4	4	/images/bubble_machine2.jpg	Ảnh sản phẩm Máy bong bóng hình gấu	2026-05-14 20:48:16.315677	t
5	5	/images/car.jpg	Ảnh sản phẩm Xe điều khiển địa hình	2026-05-14 20:48:16.315677	t
6	6	/images/car2.jpg	Ảnh sản phẩm Xe đua thể thao trẻ em	2026-05-14 20:48:16.315677	t
7	7	/images/card_pokemon.jpg	Ảnh sản phẩm Bộ thẻ Pokemon cơ bản	2026-05-14 20:48:16.315677	t
8	8	/images/card_pokemon1.jpg	Ảnh sản phẩm Bộ thẻ Pokemon hiếm	2026-05-14 20:48:16.315677	t
9	9	/images/card_pokemon2.jpg	Ảnh sản phẩm Hộp thẻ Pokemon sưu tầm	2026-05-14 20:48:16.315677	t
10	10	/images/christmas1.jpg	Ảnh sản phẩm Cây thông Noel đồ chơi	2026-05-14 20:48:16.315677	t
11	11	/images/christmas2.jpg	Ảnh sản phẩm Bộ xếp hình Noel 120 chi tiết	2026-05-14 20:48:16.315677	t
12	12	/images/christmas3.jpg	Ảnh sản phẩm Gấu bông tuần lộc	2026-05-14 20:48:16.315677	t
13	13	/images/christmas4.jpg	Ảnh sản phẩm Xe kéo quà Giáng sinh	2026-05-14 20:48:16.315677	t
14	14	/images/christmas5.jpg	Ảnh sản phẩm Bộ ông già Noel mini	2026-05-14 20:48:16.315677	t
15	15	/images/christmas6.jpg	Ảnh sản phẩm Puzzle Giáng sinh 100 mảnh	2026-05-14 20:48:16.315677	t
16	16	/images/christmas7.jpg	Ảnh sản phẩm Đèn nhạc Noel cho bé	2026-05-14 20:48:16.315677	t
17	17	/images/christmas8.jpg	Ảnh sản phẩm Bộ trang trí cây thông trẻ em	2026-05-14 20:48:16.315677	t
18	18	/images/christmas9.jpg	Ảnh sản phẩm Lâu đài tuyết lắp ráp	2026-05-14 20:48:16.315677	t
19	19	/images/christmas10.jpg	Ảnh sản phẩm Búp bê công chúa mùa đông	2026-05-14 20:48:16.315677	t
20	20	/images/christmas11.jpg	Ảnh sản phẩm Robot tuần lộc phát nhạc	2026-05-14 20:48:16.315677	t
21	21	/images/christmas12.jpg	Ảnh sản phẩm Hộp quà sáng tạo Noel	2026-05-14 20:48:16.315677	t
22	22	/images/christmas13.jpg	Ảnh sản phẩm Bộ đất nặn chủ đề Noel	2026-05-14 20:48:16.315677	t
23	23	/images/christmas14.jpg	Ảnh sản phẩm Xe lửa Giáng sinh	2026-05-14 20:48:16.315677	t
24	24	/images/christmas15.jpg	Ảnh sản phẩm Bộ tô màu Noel	2026-05-14 20:48:16.315677	t
25	25	/images/christmas16.jpg	Ảnh sản phẩm LEGO Classic Creative Box	2026-05-14 20:48:16.315677	t
26	26	/images/christmas17.jpg	Ảnh sản phẩm LEGO City Police Station	2026-05-14 20:48:16.315677	t
27	27	/images/christmas18.jpg	Ảnh sản phẩm LEGO Friends House	2026-05-14 20:48:16.315677	t
28	28	/images/christmas19.jpg	Ảnh sản phẩm Bộ STEM robot mini	2026-05-14 20:48:16.315677	t
29	29	/images/christmas20.jpg	Ảnh sản phẩm Kính hiển vi trẻ em	2026-05-14 20:48:16.315677	t
30	30	/images/christmas21.jpg	Ảnh sản phẩm Bộ thí nghiệm khoa học vui	2026-05-14 20:48:16.315677	t
31	31	/images/christmas22.jpg	Ảnh sản phẩm Bảng chữ cái thông minh	2026-05-14 20:48:16.315677	t
32	32	/images/christmas23.jpg	Ảnh sản phẩm Đàn piano thú cưng	2026-05-14 20:48:16.315677	t
33	33	/images/christmas24.jpg	Ảnh sản phẩm Trống nhạc baby	2026-05-14 20:48:16.315677	t
34	34	/images/christmas25.jpg	Ảnh sản phẩm Puzzle gỗ động vật	2026-05-14 20:48:16.315677	t
35	35	/images/christmas26.jpg	Ảnh sản phẩm Bộ rau củ cắt gỗ	2026-05-14 20:48:16.315677	t
36	36	/images/christmas27.jpg	Ảnh sản phẩm Bếp đồ chơi mini	2026-05-14 20:48:16.315677	t
37	37	/images/christmas28.jpg	Ảnh sản phẩm Búp bê chăm sóc em bé	2026-05-14 20:48:16.315677	t
38	38	/images/christmas29.jpg	Ảnh sản phẩm Khủng long mô hình	2026-05-14 20:48:16.315677	t
39	39	/images/christmas30.jpg	Ảnh sản phẩm Board game gia đình	2026-05-14 20:48:16.315677	t
40	40	/images/christmas31.jpg	Ảnh sản phẩm Cờ cá ngựa nam châm	2026-05-14 20:48:16.315677	t
41	41	/images/christmas32.jpg	Ảnh sản phẩm Bóng rổ trẻ em	2026-05-14 20:48:16.315677	t
42	42	/images/bannerslide3.png	Ảnh sản phẩm Cầu trượt mini trong nhà	2026-05-14 20:48:16.315677	t
43	43	/images/bannerslide4.png	Ảnh sản phẩm Bộ bowling trẻ em	2026-05-14 20:48:16.315677	t
44	44	/images/bannerslide5.png	Ảnh sản phẩm Súng bắn bóng mềm an toàn	2026-05-14 20:48:16.315677	t
45	45	/images/bannerslide6.png	Ảnh sản phẩm Bộ vẽ màu 86 món	2026-05-14 20:48:16.315677	t
46	46	/images/banner.png	Ảnh sản phẩm Hạt xâu vòng sáng tạo	2026-05-14 20:48:16.315677	t
47	47	/images/bannerslide.png	Ảnh sản phẩm Đất nặn 24 màu	2026-05-14 20:48:16.315677	t
48	48	/images/bannerslide1.png	Ảnh sản phẩm Sách vải cho bé	2026-05-14 20:48:16.315677	t
49	49	/images/bannerslide2.png	Ảnh sản phẩm Xe chòi chân 4 bánh	2026-05-14 20:48:16.315677	t
50	50	/images/car2png.png	Ảnh sản phẩm Bộ xếp cốc cầu vồng	2026-05-14 20:48:16.315677	t
\.


--
-- TOC entry 5560 (class 0 OID 42955)
-- Dependencies: 265
-- Data for Name: productparams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productparams (productid, issale, isnew, isdiscount, stars, views, sold, rating) FROM stdin;
2	f	f	t	4	174	18	4
3	t	f	t	4.1	211	27	5
4	f	f	t	4.2	248	36	4
5	f	f	t	4.3	285	45	5
6	t	f	t	4.4	322	54	4
7	f	f	f	4.5	359	63	5
8	f	f	t	4.6	396	72	4
9	t	f	t	4.7	433	81	5
10	f	f	t	4.8	470	90	4
12	t	f	t	3.8	544	108	4
13	f	f	t	3.9	581	117	5
14	f	f	f	4	618	126	4
15	t	f	t	4.1	655	135	5
16	f	f	t	4.2	692	144	4
17	f	f	t	4.3	729	153	5
18	t	f	t	4.4	766	162	4
19	f	f	t	4.5	803	171	5
22	f	f	t	4.8	914	198	4
24	t	f	t	3.8	988	216	4
25	f	f	t	3.9	1025	5	5
26	f	f	t	4	1062	14	4
27	t	f	t	4.1	1099	23	5
28	f	f	f	4.2	1136	32	4
29	f	f	t	4.3	1173	41	5
30	t	f	t	4.4	1210	50	4
31	f	f	t	4.5	1247	59	5
32	f	f	t	4.6	1284	68	4
33	t	f	t	4.7	1321	77	5
34	f	f	t	4.8	1358	86	4
36	t	f	t	3.8	1432	104	4
37	f	f	t	3.9	1469	113	5
38	f	f	t	4	1506	122	4
39	t	f	t	4.1	1543	131	5
41	f	t	t	4.3	1617	149	5
42	t	t	f	4.4	1654	158	4
43	f	t	t	4.5	1691	167	5
44	f	t	t	4.6	1728	176	4
45	t	t	t	4.7	1765	185	5
46	f	t	t	4.8	1802	194	4
40	f	f	t	4.2	1600	143	4
11	f	f	t	4.9	509	99	5
20	f	f	t	4.6	842	180	4
23	f	f	t	4.9	952	207	5
1	f	f	t	3.9	139	9	5
48	t	t	t	3.8	1893	216	4
21	t	f	f	4.7	880	189	5
49	f	t	f	3.9	1924	4	5
47	f	t	t	4.9	1844	203	5
35	f	f	f	4.9	1397	96	5
50	f	t	t	4	1979	20	4
\.


--
-- TOC entry 5562 (class 0 OID 42963)
-- Dependencies: 267
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (productid, title, description, categoryid, price, discount, stock, tags, createdat, updatedat, imgid, seller_id, age_group, gender, material, skill_type, brand, safety_certificates, low_stock_threshold, supplier_id, is_active) FROM stdin;
1	Bộ câu cá nam châm Active Fishing	Bộ câu cá nam châm Active Fishing - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	2	223000.00	5.00	27	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	1	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	2	t
2	Nhà bóng mini cho bé	Nhà bóng mini cho bé - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	3	296000.00	8.00	34	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	2	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	3	t
3	Máy thổi bong bóng tự động	Máy thổi bong bóng tự động - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	4	369000.00	10.00	41	toy,kids,stem	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	3	1	4-8	Unisex	Fabric	STEM	Hot Wheels	CE, ASTM F963	10	4	t
4	Máy bong bóng hình gấu	Máy bong bóng hình gấu - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	5	442000.00	12.00	48	toy,kids,music	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	4	2	5-10	Boys	Paper	Music	LEGO	CE, ASTM F963	10	1	t
5	Xe điều khiển địa hình	Xe điều khiển địa hình - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	6	515000.00	15.00	55	toy,kids,social-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	5	3	6-12	Girls	Rubber	Social Skills	Melissa & Doug	CE, ASTM F963	10	2	t
7	Bộ thẻ Pokemon cơ bản	Bộ thẻ Pokemon cơ bản - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	8	661000.00	0.00	69	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	7	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	4	t
8	Bộ thẻ Pokemon hiếm	Bộ thẻ Pokemon hiếm - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	9	734000.00	5.00	76	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	8	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	1	t
9	Hộp thẻ Pokemon sưu tầm	Hộp thẻ Pokemon sưu tầm - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	10	807000.00	8.00	83	toy,kids,stem	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	9	1	4-8	Unisex	Fabric	STEM	Hot Wheels	CE, ASTM F963	10	2	t
10	Cây thông Noel đồ chơi	Cây thông Noel đồ chơi - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	1	880000.00	10.00	90	toy,kids,music	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	10	2	5-10	Boys	Paper	Music	LEGO	CE, ASTM F963	10	3	t
11	Bộ xếp hình Noel 120 chi tiết	Bộ xếp hình Noel 120 chi tiết - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	2	953000.00	12.00	97	toy,kids,social-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	11	3	6-12	Girls	Rubber	Social Skills	Melissa & Doug	CE, ASTM F963	10	4	t
12	Gấu bông tuần lộc	Gấu bông tuần lộc - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	3	1026000.00	15.00	104	toy,kids,motor-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	12	1	1-3	Unisex	Plastic	Motor Skills	PlayActive	CE, ASTM F963	10	1	t
13	Xe kéo quà Giáng sinh	Xe kéo quà Giáng sinh - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	4	1099000.00	20.00	111	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	13	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	2	t
14	Bộ ông già Noel mini	Bộ ông già Noel mini - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	5	1172000.00	0.00	118	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	14	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	3	t
15	Puzzle Giáng sinh 100 mảnh	Puzzle Giáng sinh 100 mảnh - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	6	1245000.00	5.00	125	toy,kids,stem	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	15	1	4-8	Unisex	Fabric	STEM	Hot Wheels	CE, ASTM F963	10	4	t
16	Đèn nhạc Noel cho bé	Đèn nhạc Noel cho bé - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	7	1318000.00	8.00	132	toy,kids,music	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	16	2	5-10	Boys	Paper	Music	LEGO	CE, ASTM F963	10	1	t
17	Bộ trang trí cây thông trẻ em	Bộ trang trí cây thông trẻ em - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	8	1391000.00	10.00	139	toy,kids,social-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	17	3	6-12	Girls	Rubber	Social Skills	Melissa & Doug	CE, ASTM F963	10	2	t
18	Lâu đài tuyết lắp ráp	Lâu đài tuyết lắp ráp - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	9	1464000.00	12.00	146	toy,kids,motor-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	18	1	1-3	Unisex	Plastic	Motor Skills	PlayActive	CE, ASTM F963	10	3	t
19	Búp bê công chúa mùa đông	Búp bê công chúa mùa đông - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	10	1537000.00	15.00	153	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	19	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	4	t
20	Robot tuần lộc phát nhạc	Robot tuần lộc phát nhạc - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	1	1610000.00	20.00	20	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	20	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	1	t
21	Hộp quà sáng tạo Noel	Hộp quà sáng tạo Noel - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	2	1683000.00	0.00	27	toy,kids,stem	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	21	1	4-8	Unisex	Fabric	STEM	Hot Wheels	CE, ASTM F963	10	2	t
22	Bộ đất nặn chủ đề Noel	Bộ đất nặn chủ đề Noel - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	3	1756000.00	5.00	34	toy,kids,music	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	22	2	5-10	Boys	Paper	Music	LEGO	CE, ASTM F963	10	3	t
23	Xe lửa Giáng sinh	Xe lửa Giáng sinh - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	4	1829000.00	8.00	41	toy,kids,social-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	23	3	6-12	Girls	Rubber	Social Skills	Melissa & Doug	CE, ASTM F963	10	4	t
24	Bộ tô màu Noel	Bộ tô màu Noel - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	5	1902000.00	10.00	48	toy,kids,motor-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	24	1	1-3	Unisex	Plastic	Motor Skills	PlayActive	CE, ASTM F963	10	1	t
25	LEGO Classic Creative Box	LEGO Classic Creative Box - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	6	1975000.00	12.00	55	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	25	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	2	t
27	LEGO Friends House	LEGO Friends House - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	8	2121000.00	20.00	69	toy,kids,stem	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	27	1	4-8	Unisex	Fabric	STEM	Hot Wheels	CE, ASTM F963	10	4	t
28	Bộ STEM robot mini	Bộ STEM robot mini - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	9	2194000.00	0.00	76	toy,kids,music	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	28	2	5-10	Boys	Paper	Music	LEGO	CE, ASTM F963	10	1	t
29	Kính hiển vi trẻ em	Kính hiển vi trẻ em - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	10	2267000.00	5.00	83	toy,kids,social-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	29	3	6-12	Girls	Rubber	Social Skills	Melissa & Doug	CE, ASTM F963	10	2	t
30	Bộ thí nghiệm khoa học vui	Bộ thí nghiệm khoa học vui - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	1	2340000.00	8.00	90	toy,kids,motor-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	30	1	1-3	Unisex	Plastic	Motor Skills	PlayActive	CE, ASTM F963	10	3	t
31	Bảng chữ cái thông minh	Bảng chữ cái thông minh - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	2	2413000.00	10.00	97	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	31	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	4	t
32	Đàn piano thú cưng	Đàn piano thú cưng - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	3	2486000.00	12.00	104	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	32	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	1	t
33	Trống nhạc baby	Trống nhạc baby - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	4	209000.00	15.00	111	toy,kids,stem	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	33	1	4-8	Unisex	Fabric	STEM	Hot Wheels	CE, ASTM F963	10	2	t
34	Puzzle gỗ động vật	Puzzle gỗ động vật - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	5	282000.00	20.00	118	toy,kids,music	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	34	2	5-10	Boys	Paper	Music	LEGO	CE, ASTM F963	10	3	t
36	Bếp đồ chơi mini	Bếp đồ chơi mini - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	7	428000.00	5.00	132	toy,kids,motor-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	36	1	1-3	Unisex	Plastic	Motor Skills	PlayActive	CE, ASTM F963	10	1	t
37	Búp bê chăm sóc em bé	Búp bê chăm sóc em bé - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	8	501000.00	8.00	139	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	37	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	2	t
38	Khủng long mô hình	Khủng long mô hình - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	9	574000.00	10.00	146	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	38	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	3	t
39	Board game gia đình	Board game gia đình - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	10	647000.00	12.00	153	toy,kids,stem	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	39	1	4-8	Unisex	Fabric	STEM	Hot Wheels	CE, ASTM F963	10	4	t
41	Bóng rổ trẻ em	Bóng rổ trẻ em - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	2	793000.00	20.00	27	toy,kids,social-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	41	3	6-12	Girls	Rubber	Social Skills	Melissa & Doug	CE, ASTM F963	10	2	t
42	Cầu trượt mini trong nhà	Cầu trượt mini trong nhà - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	3	866000.00	0.00	34	toy,kids,motor-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	42	1	1-3	Unisex	Plastic	Motor Skills	PlayActive	CE, ASTM F963	10	3	t
43	Bộ bowling trẻ em	Bộ bowling trẻ em - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	4	939000.00	5.00	41	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	43	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	4	t
44	Súng bắn bóng mềm an toàn	Súng bắn bóng mềm an toàn - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	5	1012000.00	8.00	48	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	44	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	1	t
46	Hạt xâu vòng sáng tạo	Hạt xâu vòng sáng tạo - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	7	1158000.00	12.00	62	toy,kids,music	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	46	2	5-10	Boys	Paper	Music	LEGO	CE, ASTM F963	10	3	t
47	Đất nặn 24 màu	Đất nặn 24 màu - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	8	1231000.00	15.00	69	toy,kids,social-skills	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	47	3	6-12	Girls	Rubber	Social Skills	Melissa & Doug	CE, ASTM F963	10	4	t
45	Bộ vẽ màu 86 món	Bộ vẽ màu 86 món - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	6	1085000.00	10.00	58	toy,kids,stem	2026-05-14 20:48:16.315677	2026-05-14 23:06:49.249562	45	1	4-8	Unisex	Fabric	STEM	Hot Wheels	CE, ASTM F963	10	2	t
40	Cờ cá ngựa nam châm	Cờ cá ngựa nam châm - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	1	720000.00	15.00	17	toy,kids,music	2026-05-14 20:48:16.315677	2026-05-16 15:19:52.416051	40	2	5-10	Boys	Paper	Music	LEGO	CE, ASTM F963	10	1	t
26	LEGO City Police Station	LEGO City Police Station - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	5	2048000.00	20.00	62	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-16 18:59:08.608466	26	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	3	t
48	Sách vải cho bé	Sách vải cho bé - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	9	1304000.00	20.00	70	toy,kids,motor-skills	2026-05-14 20:48:16.315677	2026-05-18 08:29:56.681446	48	1	1-3	Unisex	Plastic	Motor Skills	PlayActive	CE, ASTM F963	10	1	t
35	Bộ rau củ cắt gỗ	Bộ rau củ cắt gỗ - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	6	355000.00	0.00	123	toy,kids,social-skills	2026-05-14 20:48:16.315677	2026-05-18 09:03:59.55541	35	3	6-12	Girls	Rubber	Social Skills	Melissa & Doug	CE, ASTM F963	10	4	t
6	Xe đua thể thao trẻ em	Xe đua thể thao trẻ em - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	7	588000.00	20.00	80	toy,kids,motor-skills	2026-05-14 20:48:16.315677	2026-05-14 23:06:12.658083	6	1	1-3	Unisex	Plastic	Motor Skills	PlayActive	CE, ASTM F963	10	3	t
50	Bộ xếp cốc cầu vồng	Bộ xếp cốc cầu vồng - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	1	1450000.00	5.00	76	toy,kids,logic	2026-05-14 20:48:16.315677	2026-05-17 22:41:42.716081	50	3	3-6	Girls	ABS Plastic	Logic	VTech	CE, ASTM F963	10	3	t
49	Xe chòi chân 4 bánh	Xe chòi chân 4 bánh - đồ chơi trẻ em an toàn, phù hợp làm quà tặng và hỗ trợ phát triển kỹ năng.	10	1377000.00	0.00	78	toy,kids,creativity	2026-05-14 20:48:16.315677	2026-05-17 22:52:55.52094	49	2	2-5	Boys	Wood	Creativity	Fisher-Price	CE, ASTM F963	10	2	t
\.


--
-- TOC entry 5564 (class 0 OID 42976)
-- Dependencies: 269
-- Data for Name: productsizes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productsizes (sizeid, productid, sizename, instock) FROM stdin;
1	1	S	t
3	2	S	t
5	3	S	t
7	4	S	t
9	5	S	t
11	6	S	t
13	7	S	t
15	8	S	t
17	9	S	t
19	10	S	t
21	11	S	t
23	12	S	t
25	13	S	t
27	14	S	t
29	15	S	t
31	16	S	t
33	17	S	t
35	18	S	t
37	19	S	t
39	20	S	t
41	21	S	t
43	22	S	t
45	23	S	t
47	24	S	t
49	25	S	t
51	26	S	t
53	27	S	t
55	28	S	t
57	29	S	t
59	30	S	t
61	31	S	t
63	32	S	t
65	33	S	t
67	34	S	t
69	35	S	t
71	36	S	t
73	37	S	t
75	38	S	t
77	39	S	t
79	40	S	t
81	41	S	t
83	42	S	t
85	43	S	t
87	44	S	t
89	45	S	t
91	46	S	t
93	47	S	t
95	48	S	t
97	49	S	t
99	50	S	t
2	1	M	t
4	2	M	t
6	3	M	t
8	4	M	t
10	5	M	t
12	6	M	t
14	7	M	t
16	8	M	t
18	9	M	t
20	10	M	t
22	11	M	t
24	12	M	t
26	13	M	t
28	14	M	t
30	15	M	t
32	16	M	t
34	17	M	t
36	18	M	t
38	19	M	t
40	20	M	t
42	21	M	t
44	22	M	t
46	23	M	t
48	24	M	t
50	25	M	t
52	26	M	t
54	27	M	t
56	28	M	t
58	29	M	t
60	30	M	t
62	31	M	t
64	32	M	t
66	33	M	t
68	34	M	t
70	35	M	t
72	36	M	t
74	37	M	t
76	38	M	t
78	39	M	t
80	40	M	t
82	41	M	t
84	42	M	t
86	43	M	t
88	44	M	t
90	45	M	t
92	46	M	t
94	47	M	t
96	48	M	t
98	49	M	t
100	50	M	t
\.


--
-- TOC entry 5566 (class 0 OID 42983)
-- Dependencies: 271
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotions (id, code, type, discount, expiration_date, is_active, created_at, event_name, applicable_age_group, season, min_child_age, max_child_age) FROM stdin;
1	SUMMER15	percentage	15.00	2026-08-31 00:00:00	t	2026-05-14 20:48:16.315677	Summer Toy Festival	3-12	Summer	3	12
2	MID_AUTUMN10	percentage	10.00	2026-09-30 00:00:00	t	2026-05-14 20:48:16.315677	Trung Thu Cho Bé	2-10	Autumn	2	10
3	NOEL25	percentage	25.00	2026-12-31 00:00:00	t	2026-05-14 20:48:16.315677	Christmas Gift Sale	All	Winter	0	14
4	BIRTHDAY20	percentage	20.00	2026-12-31 00:00:00	t	2026-05-14 20:48:16.315677	Birthday Gift	All	All	0	14
5	CVBCVB	percent	4.00	2026-05-30 00:00:00	t	2026-05-15 07:53:50.626588	Quốc tế Thiếu nhi	\N	\N	\N	\N
\.


--
-- TOC entry 5568 (class 0 OID 42993)
-- Dependencies: 273
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returns (return_id, orderid, productid, userid, quantity, reason, description, status, refund_amount, handled_by, created_at, updated_at) FROM stdin;
1	5	45	1	1	Đổi ý	Khách muốn đổi sang sản phẩm khác	processing	450000.00	123495088	2026-05-14 20:48:16.315677	2026-05-14 23:06:52.490879
\.


--
-- TOC entry 5570 (class 0 OID 43009)
-- Dependencies: 275
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (reviewid, userid, productid, rating, comment, createdat, updatedat, title, status, durability_rating, safety_rating, child_enjoyment_rating, age_at_review, enjoyment_rating) FROM stdin;
1	1	1	5	Bé rất thích, màu sắc đẹp.	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	Rất tốt	approved	5	5	5	6	5
2	1	5	4.5	Xe chạy ổn, đóng gói kỹ.	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	Đáng mua	approved	4	5	5	7	5
3	2	10	4	Âm thanh vui, phù hợp trẻ nhỏ.	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	Ổn	approved	4	4	4	4	4
4	1	25	5	LEGO chính hãng, nhiều chi tiết.	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	Tuyệt vời	approved	5	5	5	8	5
5	1	34	4.5	Puzzle gỗ đẹp, an toàn.	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	Hài lòng	approved	5	5	4	3	4
\.


--
-- TOC entry 5572 (class 0 OID 43029)
-- Dependencies: 277
-- Data for Name: savedpaymentcards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.savedpaymentcards (cardid, userid, cardnumber, cardholdername, expirymonth, expiryyear, cardtype, createdat, updatedat) FROM stdin;
1	1	4111111111111111	NGUYEN VAN KHACH	12	2028	Visa	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
2	2	5555555555554444	TRAN SALES STAFF	10	2029	Mastercard	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5574 (class 0 OID 43041)
-- Dependencies: 279
-- Data for Name: sellers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sellers (seller_id, name, email, password, phone_number, company_name, tax_id, registration_number, store_url, business_description, profile_image_url, join_date, rating, addressline1, addressline2, city, state, country, postalcode) FROM stdin;
1	3TL Official Store	official@3tltoys.vn	demo	0909000001	3TL Toys Co., Ltd	0312345678	DKKD-3TL-001	/store/3tl-official	Cửa hàng đồ chơi trẻ em chính hãng	/images/banner.png	2024-01-10	4.90	12 Nguyen Trai	District 1	Ho Chi Minh	HCM	Vietnam	700000
2	EduKids Partner	partner@edukids.vn	demo	0909000002	EduKids VN	0101234567	DKKD-EDU-002	/store/edukids	Đồ chơi giáo dục STEM	/images/bannerslide.png	2024-03-05	4.70	88 Tran Duy Hung	Cau Giay	Ha Noi	HN	Vietnam	100000
3	Outdoor Fun Shop	outdoor@kids.vn	demo	0909000003	Outdoor Kids	0401234567	DKKD-OUT-003	/store/outdoor-fun	Đồ chơi vận động ngoài trời	/images/active_fishing.jpg	2024-05-20	4.60	25 Bach Dang	\N	Da Nang	DN	Vietnam	550000
\.


--
-- TOC entry 5575 (class 0 OID 43047)
-- Dependencies: 280
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value) FROM stdin;
require_strong_password	true
failed_login_limit	true
default_language	"vi"
timezone	"Asia/Shanghai"
order_notifications	true
daily_reports	false
site_name	"3TL Toys Store"
support_email	"support@3tltoys.vn"
support_phone	"19001234"
free_shipping_threshold	500000
maintenance_mode	false
low_stock_alert_enabled	true
default_image_path	"/images/banner.png"
store_name	"Toys 3TL"
currency	"VND"
tax_rate	0
enable_stripe	false
default_low_stock_threshold	10
\.


--
-- TOC entry 5576 (class 0 OID 43054)
-- Dependencies: 281
-- Data for Name: shipping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping (shippingid, orderid, addressid, shippingmethod, shippingcost, trackingnumber, shippedat, deliveredat, createdat, updatedat, shipped_at, delivered_at) FROM stdin;
1	1	1	Standard	30000.00	3TL0001	2026-05-01 09:00:00	2026-05-03 15:00:00	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	2026-05-01 09:00:00	2026-05-03 15:00:00
2	2	1	Express	50000.00	\N	\N	\N	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	\N	\N
3	3	2	Standard	30000.00	3TL0003	\N	\N	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	\N	\N
4	4	1	Express	60000.00	3TL0004	2026-05-10 10:30:00	\N	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	2026-05-10 10:30:00	\N
5	5	1	Standard	30000.00	\N	\N	\N	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	\N	\N
6	6	2	Standard	30000.00	3TL0006	2026-04-20 08:00:00	2026-04-22 11:00:00	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	2026-04-20 08:00:00	2026-04-22 11:00:00
7	7	1	Standard	30000.00	3TL0007	2026-04-25 08:00:00	2026-04-27 12:00:00	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	2026-04-25 08:00:00	2026-04-27 12:00:00
8	8	1	Express	60000.00	3TL0008	\N	\N	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	\N	\N
82085095	51760370	32337288	Express	5.00	IN51760370-56401643-TS-73414790-56401643-51760370	\N	2026-05-20 15:58:19	2026-05-15 15:58:19.855045	2026-05-15 15:58:19.855045	\N	\N
17468614	93310607	32337288	Express	5.00	IN93310607-47996291-TS-52258287-47996291-93310607	\N	2026-05-20 15:59:07	2026-05-15 15:59:07.694261	2026-05-15 15:59:07.694261	\N	\N
74986719	39216767	32337288	Express	5.00	IN39216767-65697413-TS-69294091-65697413-39216767	\N	2026-05-20 15:59:34	2026-05-15 15:59:34.890023	2026-05-15 15:59:34.890023	\N	\N
42042946	9	32337288	Express	5000.00	IN9-90948917	\N	2026-05-20 16:07:34	2026-05-15 16:07:34.155337	2026-05-15 16:07:34.155337	\N	\N
69927025	10	32337288	Express	5000.00	IN10-2939201	\N	2026-05-20 16:18:58	2026-05-15 16:18:58.194236	2026-05-15 16:18:58.194236	\N	\N
27163051	11	32337288	Express	5000.00	IN11-89904416	\N	2026-05-20 16:28:44	2026-05-15 16:28:44.897426	2026-05-15 16:28:44.897426	\N	\N
95844789	12	32337288	Express	5000.00	IN12-2222327	\N	2026-05-20 16:30:53	2026-05-15 16:30:53.698979	2026-05-15 16:30:53.698979	\N	\N
76537194	13	32337288	Express	5000.00	IN13-96207525	\N	2026-05-21 14:43:36	2026-05-16 14:43:36.449337	2026-05-16 14:43:36.449337	\N	\N
84794690	14	32337288	Express	5000.00	IN14-22114770	\N	2026-05-21 15:17:29	2026-05-16 15:17:29.078933	2026-05-16 15:17:29.078933	\N	\N
62077195	15	32337288	Express	5000.00	IN15-30691397	\N	2026-05-21 15:19:52	2026-05-16 15:19:52.416051	2026-05-16 15:19:52.416051	\N	\N
9781583	16	32337288	Express	5000.00	IN16-3997313	\N	2026-05-21 15:41:00	2026-05-16 15:41:00.410711	2026-05-16 15:41:00.410711	\N	\N
79867177	17	32337288	Express	5000.00	IN17-51224647	\N	2026-05-22 07:58:39	2026-05-17 07:58:39.031208	2026-05-17 07:58:39.031208	\N	\N
13341340	18	32337288	Giao hàng tiêu chuẩn	30000.00	IN18-78821183	\N	2026-05-22 15:38:43	2026-05-17 22:38:43.418968	2026-05-17 22:38:43.418968	\N	\N
59506399	19	32337288	Giao hàng tiêu chuẩn	30000.00	IN19-72658812	\N	2026-05-22 15:39:19	2026-05-17 22:39:19.052402	2026-05-17 22:39:19.052402	\N	\N
56842064	20	32337288	Giao hàng tiêu chuẩn	30000.00	IN20-12052682	\N	2026-05-22 15:39:29	2026-05-17 22:39:29.01416	2026-05-17 22:39:29.01416	\N	\N
64403268	21	32337288	Giao hàng tiêu chuẩn	30000.00	IN21-85561543	\N	2026-05-22 15:41:42	2026-05-17 22:41:42.716081	2026-05-17 22:41:42.716081	\N	\N
9857920	22	32337288	Giao hàng tiêu chuẩn	30000.00	IN22-79216675	\N	2026-05-22 15:52:30	2026-05-17 22:52:30.407145	2026-05-17 22:52:30.407145	\N	\N
1117304	23	32337288	Giao hàng tiêu chuẩn	30000.00	IN23-95759845	\N	2026-05-22 15:52:55	2026-05-17 22:52:55.52094	2026-05-17 22:52:55.52094	\N	\N
7655190	24	32337288	Giao hàng tiêu chuẩn	30000.00	IN24-74016285	\N	2026-05-22 16:36:17	2026-05-17 23:36:17.901174	2026-05-17 23:36:17.901174	\N	\N
76859832	25	32337288	Giao hàng tiêu chuẩn	30000.00	IN25-84551712	\N	2026-05-23 01:29:56	2026-05-18 08:29:56.681446	2026-05-18 08:29:56.681446	\N	\N
65649846	26	32337288	Giao hàng tiêu chuẩn	30000.00	IN26-15084420	\N	2026-05-23 02:03:59	2026-05-18 09:03:59.55541	2026-05-18 09:03:59.55541	\N	\N
\.


--
-- TOC entry 5578 (class 0 OID 43061)
-- Dependencies: 283
-- Data for Name: shipping_zones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_zones (id, zone_name, delivery_time, shipping_cost, status, created_at) FROM stdin;
1	Nội thành Hà Nội	1-2 ngày	25000.00	t	2026-05-14 20:48:16.315677
2	Nội thành TP.HCM	1-2 ngày	25000.00	t	2026-05-14 20:48:16.315677
3	Miền Bắc	2-4 ngày	35000.00	t	2026-05-14 20:48:16.315677
4	Miền Trung	3-5 ngày	45000.00	t	2026-05-14 20:48:16.315677
5	Miền Nam	2-4 ngày	40000.00	t	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5580 (class 0 OID 43071)
-- Dependencies: 285
-- Data for Name: staff_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_notes (note_id, staff_id, customer_id, note, created_at) FROM stdin;
1	2	1	Khách có 2 bé, thích LEGO và đồ chơi âm nhạc.	2026-05-14 20:48:16.315677
2	2	1	Có thể gửi coupon sinh nhật vào tháng 6.	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5582 (class 0 OID 43080)
-- Dependencies: 287
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (supplier_id, supplier_name, contact_name, phone, email, address, created_at) FROM stdin;
1	Global Toy Distribution	Nguyen Minh Anh	0901234567	sales@globaltoy.vn	Ho Chi Minh City, Vietnam	2026-05-14 20:48:16.315677
2	EduKids Wholesale	Tran Bao Chau	0912345678	contact@edukids.vn	Ha Noi, Vietnam	2026-05-14 20:48:16.315677
3	Happy Toys Import	Le Hoang Nam	0923456789	support@happytoys.vn	Da Nang, Vietnam	2026-05-14 20:48:16.315677
4	Kids World Supply	Pham Ngoc Mai	0934567890	order@kidsworld.vn	Binh Duong, Vietnam	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5584 (class 0 OID 43089)
-- Dependencies: 289
-- Data for Name: usercoupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usercoupons (usercouponid, userid, couponid, usedat, createdat, updatedat) FROM stdin;
1	1	1	\N	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
2	1	4	\N	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
3	2	2	\N	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677
\.


--
-- TOC entry 5586 (class 0 OID 43098)
-- Dependencies: 291
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (userid, username, email, password, mobile_number, dob, creation_ip, role, createdat, updatedat, update_ip, otp, promotional, is_active) FROM stdin;
1	Nguyen Van Khach	customer@3tltoys.vn	$2b$10$demo_customer_hash	0900000001	1998-05-12	127.0.0.1	customer	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	127.0.0.1	\N	t	t
2	Tran Sales Staff	sales@3tltoys.vn	$2b$10$demo_sales_hash	0900000002	1997-03-20	127.0.0.1	sales_staff	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	127.0.0.1	\N	t	t
3	Le Warehouse Manager	warehouse@3tltoys.vn	$2b$10$demo_warehouse_hash	0900000003	1995-08-15	127.0.0.1	warehouse_manager	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	127.0.0.1	\N	f	t
4	Pham System Admin	admin@3tltoys.vn	$2b$10$demo_admin_hash	0900000004	1993-11-01	127.0.0.1	admin	2026-05-14 20:48:16.315677	2026-05-14 20:48:16.315677	127.0.0.1	\N	f	t
412047475	Phú Luận	luan@gmail.com	$2b$10$r5yRyp.7R/AKnZdAbL8WcuVLJFqTCX8bn3ffNHx0Zec/9mThHmX8.	3333333333	2026-05-07	::1/128	customer	2026-05-14 21:07:32.494728	2026-05-14 21:07:32.494728	::1	\N	f	t
787942253	Tuấn Vũ	tuanvu@gmail.com	$2b$10$u3.TM2xTdxod1CfUf8zxCOtwWKaxOF/5roFx4MDjwrIW6yWIU7sXC	2222222222	2026-05-05	::1/128	sales_staff	2026-05-14 21:04:47.156926	2026-05-14 21:17:55.201482	::1	\N	f	t
123495088	admin	admin@gmail.com	$2b$10$.wi9B1FJKsFVLSwn38O8H.TswrXkruuQwBFieLWiVNqk3eINXUvPa	1111111111	2026-05-05	::1/128	admin	2026-05-14 21:06:00.296772	2026-05-14 22:52:29.854959	::1	\N	f	t
891195250	Thành Công	cong@gmail.com	$2b$10$dmy.QCwROx72xxgSmuXnGuH2G3//UyUwCm.kma2w4M27/Ip.P/KLK	4444444444	2026-05-07	::1/128	warehouse_manager	2026-05-14 21:10:46.661574	2026-05-16 19:13:47.861119	::1	\N	f	t
\.


--
-- TOC entry 5588 (class 0 OID 43115)
-- Dependencies: 293
-- Data for Name: wishlistitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlistitems (wishlistitemid, userid, productid, addedat) FROM stdin;
1	1	5	2026-05-14 20:48:16.315677
2	1	25	2026-05-14 20:48:16.315677
3	1	33	2026-05-14 20:48:16.315677
4	2	10	2026-05-14 20:48:16.315677
86792622	412047475	21	2026-05-18 09:00:14.193444
51904179	412047475	50	2026-05-18 09:01:04.204251
84503808	412047475	35	2026-05-18 09:01:26.071389
\.


--
-- TOC entry 5657 (class 0 OID 0)
-- Dependencies: 220
-- Name: addresses_addressid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.addresses_addressid_seq', 4, true);


--
-- TOC entry 5658 (class 0 OID 0)
-- Dependencies: 222
-- Name: articles_article_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.articles_article_id_seq', 4, true);


--
-- TOC entry 5659 (class 0 OID 0)
-- Dependencies: 224
-- Name: banners_bannerid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.banners_bannerid_seq', 4, true);


--
-- TOC entry 5660 (class 0 OID 0)
-- Dependencies: 226
-- Name: brands_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brands_brand_id_seq', 6, true);


--
-- TOC entry 5661 (class 0 OID 0)
-- Dependencies: 228
-- Name: cartitems_cartitemid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cartitems_cartitemid_seq', 3, true);


--
-- TOC entry 5662 (class 0 OID 0)
-- Dependencies: 230
-- Name: categories_categoryid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_categoryid_seq', 10, true);


--
-- TOC entry 5663 (class 0 OID 0)
-- Dependencies: 232
-- Name: child_profiles_child_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_profiles_child_id_seq', 2, true);


--
-- TOC entry 5664 (class 0 OID 0)
-- Dependencies: 235
-- Name: collections_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.collections_collection_id_seq', 5, true);


--
-- TOC entry 5665 (class 0 OID 0)
-- Dependencies: 237
-- Name: contact_queries_queryid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contact_queries_queryid_seq', 2, true);


--
-- TOC entry 5666 (class 0 OID 0)
-- Dependencies: 239
-- Name: content_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.content_items_id_seq', 3, true);


--
-- TOC entry 5667 (class 0 OID 0)
-- Dependencies: 241
-- Name: coupons_couponid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coupons_couponid_seq', 4, true);


--
-- TOC entry 5668 (class 0 OID 0)
-- Dependencies: 243
-- Name: deals_dealid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deals_dealid_seq', 4, true);


--
-- TOC entry 5669 (class 0 OID 0)
-- Dependencies: 245
-- Name: gift_message_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gift_message_templates_template_id_seq', 3, true);


--
-- TOC entry 5670 (class 0 OID 0)
-- Dependencies: 247
-- Name: giftcards_cardid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.giftcards_cardid_seq', 2, true);


--
-- TOC entry 5671 (class 0 OID 0)
-- Dependencies: 249
-- Name: inventory_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_logs_log_id_seq', 45, true);


--
-- TOC entry 5672 (class 0 OID 0)
-- Dependencies: 251
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_transactions_transaction_id_seq', 21, true);


--
-- TOC entry 5673 (class 0 OID 0)
-- Dependencies: 254
-- Name: orders_orderid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_orderid_seq', 26, true);


--
-- TOC entry 5674 (class 0 OID 0)
-- Dependencies: 256
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 4, true);


--
-- TOC entry 5675 (class 0 OID 0)
-- Dependencies: 258
-- Name: payments_paymentid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_paymentid_seq', 8, true);


--
-- TOC entry 5676 (class 0 OID 0)
-- Dependencies: 260
-- Name: product_batches_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_batches_batch_id_seq', 21, true);


--
-- TOC entry 5677 (class 0 OID 0)
-- Dependencies: 262
-- Name: productcolors_colorid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productcolors_colorid_seq', 100, true);


--
-- TOC entry 5678 (class 0 OID 0)
-- Dependencies: 264
-- Name: productimages_imageid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productimages_imageid_seq', 50, true);


--
-- TOC entry 5679 (class 0 OID 0)
-- Dependencies: 266
-- Name: productparams_productid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productparams_productid_seq', 50, true);


--
-- TOC entry 5680 (class 0 OID 0)
-- Dependencies: 268
-- Name: products_productid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_productid_seq', 50, true);


--
-- TOC entry 5681 (class 0 OID 0)
-- Dependencies: 270
-- Name: productsizes_sizeid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productsizes_sizeid_seq', 100, true);


--
-- TOC entry 5682 (class 0 OID 0)
-- Dependencies: 272
-- Name: promotions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promotions_id_seq', 5, true);


--
-- TOC entry 5683 (class 0 OID 0)
-- Dependencies: 274
-- Name: returns_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returns_return_id_seq', 1, true);


--
-- TOC entry 5684 (class 0 OID 0)
-- Dependencies: 276
-- Name: reviews_reviewid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_reviewid_seq', 5, true);


--
-- TOC entry 5685 (class 0 OID 0)
-- Dependencies: 278
-- Name: savedpaymentcards_cardid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.savedpaymentcards_cardid_seq', 2, true);


--
-- TOC entry 5686 (class 0 OID 0)
-- Dependencies: 282
-- Name: shipping_shippingid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipping_shippingid_seq', 8, true);


--
-- TOC entry 5687 (class 0 OID 0)
-- Dependencies: 284
-- Name: shipping_zones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipping_zones_id_seq', 5, true);


--
-- TOC entry 5688 (class 0 OID 0)
-- Dependencies: 286
-- Name: staff_notes_note_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_notes_note_id_seq', 2, true);


--
-- TOC entry 5689 (class 0 OID 0)
-- Dependencies: 288
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_supplier_id_seq', 4, true);


--
-- TOC entry 5690 (class 0 OID 0)
-- Dependencies: 290
-- Name: usercoupons_usercouponid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usercoupons_usercouponid_seq', 3, true);


--
-- TOC entry 5691 (class 0 OID 0)
-- Dependencies: 292
-- Name: users_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_userid_seq', 4, true);


--
-- TOC entry 5692 (class 0 OID 0)
-- Dependencies: 294
-- Name: wishlistitems_wishlistitemid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wishlistitems_wishlistitemid_seq', 4, true);


--
-- TOC entry 5187 (class 2606 OID 43160)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (addressid);


--
-- TOC entry 5189 (class 2606 OID 43162)
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (article_id);


--
-- TOC entry 5191 (class 2606 OID 43164)
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (bannerid);


--
-- TOC entry 5193 (class 2606 OID 43166)
-- Name: brands brands_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_key UNIQUE (name);


--
-- TOC entry 5195 (class 2606 OID 43168)
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (brand_id);


--
-- TOC entry 5197 (class 2606 OID 43170)
-- Name: brands brands_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_slug_key UNIQUE (slug);


--
-- TOC entry 5199 (class 2606 OID 43172)
-- Name: cartitems cartitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitems
    ADD CONSTRAINT cartitems_pkey PRIMARY KEY (cartitemid);


--
-- TOC entry 5201 (class 2606 OID 43174)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (categoryid);


--
-- TOC entry 5203 (class 2606 OID 43176)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 5205 (class 2606 OID 43178)
-- Name: child_profiles child_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profiles
    ADD CONSTRAINT child_profiles_pkey PRIMARY KEY (child_id);


--
-- TOC entry 5208 (class 2606 OID 43180)
-- Name: collection_products collection_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_pkey PRIMARY KEY (collection_id, productid);


--
-- TOC entry 5210 (class 2606 OID 43182)
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (collection_id);


--
-- TOC entry 5212 (class 2606 OID 43184)
-- Name: collections collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_slug_key UNIQUE (slug);


--
-- TOC entry 5214 (class 2606 OID 43186)
-- Name: contact_queries contact_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_queries
    ADD CONSTRAINT contact_queries_pkey PRIMARY KEY (queryid);


--
-- TOC entry 5216 (class 2606 OID 43188)
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5218 (class 2606 OID 43190)
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- TOC entry 5220 (class 2606 OID 43192)
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (couponid);


--
-- TOC entry 5222 (class 2606 OID 43194)
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (dealid);


--
-- TOC entry 5224 (class 2606 OID 43196)
-- Name: gift_message_templates gift_message_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_message_templates
    ADD CONSTRAINT gift_message_templates_pkey PRIMARY KEY (template_id);


--
-- TOC entry 5226 (class 2606 OID 43198)
-- Name: giftcards giftcards_cardcode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_cardcode_key UNIQUE (cardcode);


--
-- TOC entry 5228 (class 2606 OID 43200)
-- Name: giftcards giftcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_pkey PRIMARY KEY (cardid);


--
-- TOC entry 5233 (class 2606 OID 43202)
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 5237 (class 2606 OID 43204)
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 5239 (class 2606 OID 43206)
-- Name: orderitems orderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_pkey PRIMARY KEY (orderitemid);


--
-- TOC entry 5242 (class 2606 OID 43208)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (orderid);


--
-- TOC entry 5244 (class 2606 OID 43210)
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 5246 (class 2606 OID 43212)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (paymentid);


--
-- TOC entry 5249 (class 2606 OID 43214)
-- Name: product_batches product_batches_batch_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_batch_number_key UNIQUE (batch_number);


--
-- TOC entry 5251 (class 2606 OID 43216)
-- Name: product_batches product_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_pkey PRIMARY KEY (batch_id);


--
-- TOC entry 5253 (class 2606 OID 44138)
-- Name: product_batches product_batches_product_batch_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_product_batch_unique UNIQUE (product_id, batch_number);


--
-- TOC entry 5256 (class 2606 OID 43218)
-- Name: productcolors productcolors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcolors
    ADD CONSTRAINT productcolors_pkey PRIMARY KEY (colorid);


--
-- TOC entry 5258 (class 2606 OID 43220)
-- Name: productimages productimages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages
    ADD CONSTRAINT productimages_pkey PRIMARY KEY (imageid);


--
-- TOC entry 5260 (class 2606 OID 43222)
-- Name: productparams productparams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productparams
    ADD CONSTRAINT productparams_pkey PRIMARY KEY (productid);


--
-- TOC entry 5268 (class 2606 OID 43224)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (productid);


--
-- TOC entry 5270 (class 2606 OID 43226)
-- Name: productsizes productsizes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsizes
    ADD CONSTRAINT productsizes_pkey PRIMARY KEY (sizeid);


--
-- TOC entry 5273 (class 2606 OID 43228)
-- Name: promotions promotions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_code_key UNIQUE (code);


--
-- TOC entry 5275 (class 2606 OID 43230)
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- TOC entry 5280 (class 2606 OID 43232)
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (return_id);


--
-- TOC entry 5282 (class 2606 OID 43234)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (reviewid);


--
-- TOC entry 5284 (class 2606 OID 43236)
-- Name: savedpaymentcards savedpaymentcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savedpaymentcards
    ADD CONSTRAINT savedpaymentcards_pkey PRIMARY KEY (cardid);


--
-- TOC entry 5286 (class 2606 OID 43238)
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (seller_id);


--
-- TOC entry 5288 (class 2606 OID 43240)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- TOC entry 5290 (class 2606 OID 43242)
-- Name: shipping shipping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT shipping_pkey PRIMARY KEY (shippingid);


--
-- TOC entry 5292 (class 2606 OID 43244)
-- Name: shipping_zones shipping_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_zones
    ADD CONSTRAINT shipping_zones_pkey PRIMARY KEY (id);


--
-- TOC entry 5294 (class 2606 OID 43246)
-- Name: staff_notes staff_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_notes
    ADD CONSTRAINT staff_notes_pkey PRIMARY KEY (note_id);


--
-- TOC entry 5296 (class 2606 OID 43248)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_id);


--
-- TOC entry 5298 (class 2606 OID 43250)
-- Name: usercoupons usercoupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usercoupons
    ADD CONSTRAINT usercoupons_pkey PRIMARY KEY (usercouponid);


--
-- TOC entry 5301 (class 2606 OID 43252)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5303 (class 2606 OID 43254)
-- Name: users users_mobile_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_mobile_number_key UNIQUE (mobile_number);


--
-- TOC entry 5305 (class 2606 OID 43256)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 5308 (class 2606 OID 43258)
-- Name: wishlistitems wishlistitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlistitems
    ADD CONSTRAINT wishlistitems_pkey PRIMARY KEY (wishlistitemid);


--
-- TOC entry 5206 (class 1259 OID 43259)
-- Name: idx_child_profiles_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_child_profiles_user ON public.child_profiles USING btree (user_id);


--
-- TOC entry 5229 (class 1259 OID 43260)
-- Name: idx_inventory_logs_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_logs_product ON public.inventory_logs USING btree (productid);


--
-- TOC entry 5230 (class 1259 OID 43261)
-- Name: idx_inventory_logs_product_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_logs_product_created ON public.inventory_logs USING btree (productid, created_at DESC);


--
-- TOC entry 5231 (class 1259 OID 43262)
-- Name: idx_inventory_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_product ON public.inventory_logs USING btree (productid);


--
-- TOC entry 5234 (class 1259 OID 43263)
-- Name: idx_inventory_transactions_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_transactions_product ON public.inventory_transactions USING btree (product_id);


--
-- TOC entry 5235 (class 1259 OID 43264)
-- Name: idx_inventory_transactions_product_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_transactions_product_created ON public.inventory_transactions USING btree (product_id, created_at DESC);


--
-- TOC entry 5240 (class 1259 OID 43265)
-- Name: idx_orders_fulfillment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_fulfillment_status ON public.orders USING btree (orderstatus, order_status, delivery_status, createdat DESC);


--
-- TOC entry 5247 (class 1259 OID 43266)
-- Name: idx_product_batches_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_batches_product ON public.product_batches USING btree (product_id);


--
-- TOC entry 5261 (class 1259 OID 43267)
-- Name: idx_products_age_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_age_group ON public.products USING btree (age_group);


--
-- TOC entry 5262 (class 1259 OID 43268)
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_brand ON public.products USING btree (brand);


--
-- TOC entry 5263 (class 1259 OID 43269)
-- Name: idx_products_gender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_gender ON public.products USING btree (gender);


--
-- TOC entry 5264 (class 1259 OID 43270)
-- Name: idx_products_low_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_low_stock ON public.products USING btree (stock, low_stock_threshold);


--
-- TOC entry 5265 (class 1259 OID 43271)
-- Name: idx_products_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_material ON public.products USING btree (material);


--
-- TOC entry 5266 (class 1259 OID 43272)
-- Name: idx_products_skill_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_skill_type ON public.products USING btree (skill_type);


--
-- TOC entry 5271 (class 1259 OID 43273)
-- Name: idx_promotions_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promotions_event ON public.promotions USING btree (event_name, season, is_active);


--
-- TOC entry 5276 (class 1259 OID 43274)
-- Name: idx_returns_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_order ON public.returns USING btree (orderid);


--
-- TOC entry 5277 (class 1259 OID 43275)
-- Name: idx_returns_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_status ON public.returns USING btree (status);


--
-- TOC entry 5278 (class 1259 OID 43276)
-- Name: idx_returns_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_status_created ON public.returns USING btree (status, created_at DESC);


--
-- TOC entry 5299 (class 1259 OID 43277)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 5306 (class 1259 OID 43278)
-- Name: idx_wishlistitems_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wishlistitems_user ON public.wishlistitems USING btree (userid);


--
-- TOC entry 5254 (class 1259 OID 43279)
-- Name: ux_product_batches_product_batch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_product_batches_product_batch ON public.product_batches USING btree (product_id, batch_number);


--
-- TOC entry 5343 (class 2620 OID 44088)
-- Name: addresses trg_addresses_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_addresses_updatedat BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5344 (class 2620 OID 44089)
-- Name: cartitems trg_cartitems_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cartitems_updatedat BEFORE UPDATE ON public.cartitems FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5345 (class 2620 OID 44090)
-- Name: coupons trg_coupons_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_coupons_updatedat BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5346 (class 2620 OID 44091)
-- Name: giftcards trg_giftcards_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_giftcards_updatedat BEFORE UPDATE ON public.giftcards FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5347 (class 2620 OID 44110)
-- Name: inventory_transactions trg_inventory_transactions_apply; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_inventory_transactions_apply AFTER INSERT ON public.inventory_transactions FOR EACH ROW EXECUTE FUNCTION public.trg_apply_inventory_transaction();


--
-- TOC entry 5348 (class 2620 OID 44145)
-- Name: orderitems trg_orderitems_check_stock; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orderitems_check_stock BEFORE INSERT OR UPDATE ON public.orderitems FOR EACH ROW EXECUTE FUNCTION public.trg_check_stock_before_orderitem();


--
-- TOC entry 5349 (class 2620 OID 44147)
-- Name: orderitems trg_orderitems_recalculate_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orderitems_recalculate_total AFTER INSERT OR DELETE OR UPDATE ON public.orderitems FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_order_total();


--
-- TOC entry 5350 (class 2620 OID 44146)
-- Name: orderitems trg_orderitems_update_stock; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orderitems_update_stock AFTER INSERT OR DELETE OR UPDATE ON public.orderitems FOR EACH ROW EXECUTE FUNCTION public.trg_update_stock_after_orderitem();


--
-- TOC entry 5351 (class 2620 OID 44092)
-- Name: orders trg_orders_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orders_updatedat BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5352 (class 2620 OID 44112)
-- Name: payments trg_payments_update_order; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payments_update_order AFTER INSERT OR UPDATE OF paymentstatus ON public.payments FOR EACH ROW EXECUTE FUNCTION public.trg_update_order_after_payment();


--
-- TOC entry 5353 (class 2620 OID 44093)
-- Name: payments trg_payments_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payments_updatedat BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5354 (class 2620 OID 44094)
-- Name: products trg_products_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_products_updatedat BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5355 (class 2620 OID 44149)
-- Name: returns trg_returns_restore_stock; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_returns_restore_stock AFTER INSERT OR UPDATE OF status ON public.returns FOR EACH ROW EXECUTE FUNCTION public.trg_return_restore_stock();


--
-- TOC entry 5356 (class 2620 OID 44099)
-- Name: returns trg_returns_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_returns_updatedat BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5357 (class 2620 OID 44095)
-- Name: reviews trg_reviews_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reviews_updatedat BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5358 (class 2620 OID 44117)
-- Name: reviews trg_reviews_validate_purchase; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reviews_validate_purchase BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.trg_validate_review_purchase();


--
-- TOC entry 5359 (class 2620 OID 44148)
-- Name: shipping trg_shipping_recalculate_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_shipping_recalculate_total AFTER INSERT OR DELETE OR UPDATE ON public.shipping FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_order_total();


--
-- TOC entry 5360 (class 2620 OID 44114)
-- Name: shipping trg_shipping_update_order; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_shipping_update_order AFTER INSERT OR UPDATE ON public.shipping FOR EACH ROW EXECUTE FUNCTION public.trg_update_order_after_shipping();


--
-- TOC entry 5361 (class 2620 OID 44096)
-- Name: shipping trg_shipping_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_shipping_updatedat BEFORE UPDATE ON public.shipping FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5362 (class 2620 OID 44098)
-- Name: usercoupons trg_usercoupons_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_usercoupons_updatedat BEFORE UPDATE ON public.usercoupons FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5363 (class 2620 OID 44097)
-- Name: users trg_users_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updatedat BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_set_updatedat();


--
-- TOC entry 5309 (class 2606 OID 43291)
-- Name: addresses addresses_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5310 (class 2606 OID 43296)
-- Name: cartitems cartitems_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitems
    ADD CONSTRAINT cartitems_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5311 (class 2606 OID 43301)
-- Name: cartitems cartitems_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitems
    ADD CONSTRAINT cartitems_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5312 (class 2606 OID 43306)
-- Name: child_profiles child_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profiles
    ADD CONSTRAINT child_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5313 (class 2606 OID 43311)
-- Name: collection_products collection_products_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(collection_id) ON DELETE CASCADE;


--
-- TOC entry 5314 (class 2606 OID 43316)
-- Name: collection_products collection_products_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5315 (class 2606 OID 43321)
-- Name: inventory_logs inventory_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(userid);


--
-- TOC entry 5316 (class 2606 OID 43326)
-- Name: inventory_logs inventory_logs_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5317 (class 2606 OID 43331)
-- Name: inventory_transactions inventory_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(userid) ON DELETE SET NULL;


--
-- TOC entry 5318 (class 2606 OID 43336)
-- Name: inventory_transactions inventory_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5319 (class 2606 OID 43341)
-- Name: orderitems orderitems_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid);


--
-- TOC entry 5320 (class 2606 OID 43346)
-- Name: orderitems orderitems_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid);


--
-- TOC entry 5321 (class 2606 OID 43351)
-- Name: orders orders_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5322 (class 2606 OID 43356)
-- Name: payments payments_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid) ON DELETE CASCADE;


--
-- TOC entry 5323 (class 2606 OID 43361)
-- Name: product_batches product_batches_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5324 (class 2606 OID 43366)
-- Name: productcolors productcolors_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcolors
    ADD CONSTRAINT productcolors_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5325 (class 2606 OID 43371)
-- Name: productimages productimages_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages
    ADD CONSTRAINT productimages_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5326 (class 2606 OID 43376)
-- Name: products products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id);


--
-- TOC entry 5327 (class 2606 OID 43381)
-- Name: productsizes productsizes_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsizes
    ADD CONSTRAINT productsizes_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5328 (class 2606 OID 43386)
-- Name: returns returns_handled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.users(userid);


--
-- TOC entry 5329 (class 2606 OID 43391)
-- Name: returns returns_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid);


--
-- TOC entry 5330 (class 2606 OID 43396)
-- Name: returns returns_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid);


--
-- TOC entry 5331 (class 2606 OID 43401)
-- Name: returns returns_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5332 (class 2606 OID 43406)
-- Name: reviews reviews_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5333 (class 2606 OID 43411)
-- Name: reviews reviews_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5334 (class 2606 OID 43416)
-- Name: savedpaymentcards savedpaymentcards_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savedpaymentcards
    ADD CONSTRAINT savedpaymentcards_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5335 (class 2606 OID 43421)
-- Name: shipping shipping_addressid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT shipping_addressid_fkey FOREIGN KEY (addressid) REFERENCES public.addresses(addressid) ON DELETE CASCADE;


--
-- TOC entry 5336 (class 2606 OID 43426)
-- Name: shipping shipping_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT shipping_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid) ON DELETE CASCADE;


--
-- TOC entry 5337 (class 2606 OID 43431)
-- Name: staff_notes staff_notes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_notes
    ADD CONSTRAINT staff_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5338 (class 2606 OID 43436)
-- Name: staff_notes staff_notes_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_notes
    ADD CONSTRAINT staff_notes_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(userid) ON DELETE SET NULL;


--
-- TOC entry 5339 (class 2606 OID 43441)
-- Name: usercoupons usercoupons_couponid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usercoupons
    ADD CONSTRAINT usercoupons_couponid_fkey FOREIGN KEY (couponid) REFERENCES public.coupons(couponid);


--
-- TOC entry 5340 (class 2606 OID 43446)
-- Name: usercoupons usercoupons_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usercoupons
    ADD CONSTRAINT usercoupons_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5341 (class 2606 OID 43451)
-- Name: wishlistitems wishlistitems_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlistitems
    ADD CONSTRAINT wishlistitems_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5342 (class 2606 OID 43456)
-- Name: wishlistitems wishlistitems_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlistitems
    ADD CONSTRAINT wishlistitems_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5596 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-05-18 15:31:32

--
-- PostgreSQL database dump complete
--

\unrestrict PNwA6aqroovVk93uhp0Mu99YiQlmKsrBzfCZ87eQJUuENrAAS9RZSl5yAOPoxKP

