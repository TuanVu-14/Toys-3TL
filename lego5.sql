--
-- PostgreSQL database dump
--

\restrict 2wNlWEpnohP9FrHHRExDSHWnckhrU5ySV9K0qonBkHoTWBZKxcPhFiQy5NadoQG

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-14 15:54:16

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
-- TOC entry 5 (class 2615 OID 41412)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5554 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 295 (class 1255 OID 41413)
-- Name: sync_stock_after(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_stock_after() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  SELECT stock INTO NEW.stock_after FROM products WHERE productid = NEW.productid;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_stock_after() OWNER TO postgres;

--
-- TOC entry 296 (class 1255 OID 41414)
-- Name: update_updatedat_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updatedat_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updatedat_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 41415)
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
-- TOC entry 220 (class 1259 OID 41431)
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
-- TOC entry 5556 (class 0 OID 0)
-- Dependencies: 220
-- Name: addresses_addressid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_addressid_seq OWNED BY public.addresses.addressid;


--
-- TOC entry 221 (class 1259 OID 41432)
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
-- TOC entry 222 (class 1259 OID 41441)
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
-- TOC entry 5557 (class 0 OID 0)
-- Dependencies: 222
-- Name: articles_article_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.articles_article_id_seq OWNED BY public.articles.article_id;


--
-- TOC entry 223 (class 1259 OID 41442)
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
-- TOC entry 224 (class 1259 OID 41457)
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
-- TOC entry 5558 (class 0 OID 0)
-- Dependencies: 224
-- Name: banners_bannerid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.banners_bannerid_seq OWNED BY public.banners.bannerid;


--
-- TOC entry 284 (class 1259 OID 42124)
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
-- TOC entry 283 (class 1259 OID 42123)
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
-- TOC entry 5559 (class 0 OID 0)
-- Dependencies: 283
-- Name: brands_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brands_brand_id_seq OWNED BY public.brands.brand_id;


--
-- TOC entry 225 (class 1259 OID 41467)
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
-- TOC entry 226 (class 1259 OID 41474)
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
-- TOC entry 5560 (class 0 OID 0)
-- Dependencies: 226
-- Name: cartitems_cartitemid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cartitems_cartitemid_seq OWNED BY public.cartitems.cartitemid;


--
-- TOC entry 227 (class 1259 OID 41475)
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
-- TOC entry 228 (class 1259 OID 41481)
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
-- TOC entry 5561 (class 0 OID 0)
-- Dependencies: 228
-- Name: categories_categoryid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_categoryid_seq OWNED BY public.categories.categoryid;


--
-- TOC entry 286 (class 1259 OID 42147)
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
-- TOC entry 285 (class 1259 OID 42146)
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
-- TOC entry 5562 (class 0 OID 0)
-- Dependencies: 285
-- Name: child_profiles_child_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_profiles_child_id_seq OWNED BY public.child_profiles.child_id;


--
-- TOC entry 229 (class 1259 OID 41494)
-- Name: collection_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_products (
    collection_id integer NOT NULL,
    productid integer NOT NULL,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.collection_products OWNER TO postgres;

--
-- TOC entry 5563 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE collection_products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.collection_products IS 'Ánh xạ sản phẩm vào bộ sưu tập (many-to-many)';


--
-- TOC entry 230 (class 1259 OID 41500)
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
-- TOC entry 5564 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE collections; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.collections IS 'Bộ sưu tập sản phẩm theo chủ đề: STEM, Mô hình, Nhà bếp...';


--
-- TOC entry 231 (class 1259 OID 41511)
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
-- TOC entry 5565 (class 0 OID 0)
-- Dependencies: 231
-- Name: collections_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.collections_collection_id_seq OWNED BY public.collections.collection_id;


--
-- TOC entry 232 (class 1259 OID 41512)
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
-- TOC entry 233 (class 1259 OID 41518)
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
-- TOC entry 5566 (class 0 OID 0)
-- Dependencies: 233
-- Name: contact_queries_queryid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contact_queries_queryid_seq OWNED BY public.contact_queries.queryid;


--
-- TOC entry 234 (class 1259 OID 41519)
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
-- TOC entry 235 (class 1259 OID 41530)
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
-- TOC entry 5567 (class 0 OID 0)
-- Dependencies: 235
-- Name: content_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.content_items_id_seq OWNED BY public.content_items.id;


--
-- TOC entry 236 (class 1259 OID 41531)
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
-- TOC entry 237 (class 1259 OID 41540)
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
-- TOC entry 5568 (class 0 OID 0)
-- Dependencies: 237
-- Name: coupons_couponid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coupons_couponid_seq OWNED BY public.coupons.couponid;


--
-- TOC entry 238 (class 1259 OID 41541)
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
-- TOC entry 239 (class 1259 OID 41547)
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
-- TOC entry 5569 (class 0 OID 0)
-- Dependencies: 239
-- Name: deals_dealid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deals_dealid_seq OWNED BY public.deals.dealid;


--
-- TOC entry 240 (class 1259 OID 41548)
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
-- TOC entry 5570 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE gift_message_templates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gift_message_templates IS 'Mẫu lời nhắn thiệp quà có sẵn để khách chọn nhanh';


--
-- TOC entry 241 (class 1259 OID 41559)
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
-- TOC entry 5571 (class 0 OID 0)
-- Dependencies: 241
-- Name: gift_message_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gift_message_templates_template_id_seq OWNED BY public.gift_message_templates.template_id;


--
-- TOC entry 242 (class 1259 OID 41560)
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
-- TOC entry 243 (class 1259 OID 41574)
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
-- TOC entry 5572 (class 0 OID 0)
-- Dependencies: 243
-- Name: giftcards_cardid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.giftcards_cardid_seq OWNED BY public.giftcards.cardid;


--
-- TOC entry 244 (class 1259 OID 41575)
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
-- TOC entry 5573 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE inventory_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.inventory_logs IS 'Lịch sử nhập/xuất kho theo lô, phục vụ quản trị kho';


--
-- TOC entry 5574 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN inventory_logs.change_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inventory_logs.change_type IS 'Loại thay đổi: import, export, return, adjustment, damage';


--
-- TOC entry 5575 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN inventory_logs.batch_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inventory_logs.batch_code IS 'Mã lô hàng nhập, ví dụ: LOT-2025-001';


--
-- TOC entry 245 (class 1259 OID 41585)
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
-- TOC entry 5576 (class 0 OID 0)
-- Dependencies: 245
-- Name: inventory_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_logs_log_id_seq OWNED BY public.inventory_logs.log_id;


--
-- TOC entry 292 (class 1259 OID 42203)
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
-- TOC entry 291 (class 1259 OID 42202)
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
-- TOC entry 5577 (class 0 OID 0)
-- Dependencies: 291
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_transactions_transaction_id_seq OWNED BY public.inventory_transactions.transaction_id;


--
-- TOC entry 246 (class 1259 OID 41586)
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
-- TOC entry 247 (class 1259 OID 41590)
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
-- TOC entry 5578 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN orders.is_gift; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.is_gift IS 'Đánh dấu đây là đơn hàng quà tặng';


--
-- TOC entry 5579 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN orders.gift_message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.gift_message IS 'Nội dung lời nhắn viết trên thiệp';


--
-- TOC entry 5580 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN orders.gift_wrapping_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.gift_wrapping_type IS 'Loại gói quà: none, standard, premium, birthday, holiday';


--
-- TOC entry 248 (class 1259 OID 41601)
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
-- TOC entry 5581 (class 0 OID 0)
-- Dependencies: 248
-- Name: orders_orderid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_orderid_seq OWNED BY public.orders.orderid;


--
-- TOC entry 249 (class 1259 OID 41602)
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
-- TOC entry 250 (class 1259 OID 41612)
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
-- TOC entry 5582 (class 0 OID 0)
-- Dependencies: 250
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- TOC entry 251 (class 1259 OID 41613)
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
-- TOC entry 252 (class 1259 OID 41623)
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
-- TOC entry 5583 (class 0 OID 0)
-- Dependencies: 252
-- Name: payments_paymentid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_paymentid_seq OWNED BY public.payments.paymentid;


--
-- TOC entry 290 (class 1259 OID 42184)
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
-- TOC entry 289 (class 1259 OID 42183)
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
-- TOC entry 5584 (class 0 OID 0)
-- Dependencies: 289
-- Name: product_batches_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_batches_batch_id_seq OWNED BY public.product_batches.batch_id;


--
-- TOC entry 253 (class 1259 OID 41632)
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
-- TOC entry 254 (class 1259 OID 41637)
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
-- TOC entry 5585 (class 0 OID 0)
-- Dependencies: 254
-- Name: productcolors_colorid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productcolors_colorid_seq OWNED BY public.productcolors.colorid;


--
-- TOC entry 255 (class 1259 OID 41638)
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
-- TOC entry 256 (class 1259 OID 41646)
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
-- TOC entry 5586 (class 0 OID 0)
-- Dependencies: 256
-- Name: productimages_imageid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productimages_imageid_seq OWNED BY public.productimages.imageid;


--
-- TOC entry 257 (class 1259 OID 41647)
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
-- TOC entry 258 (class 1259 OID 41654)
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
-- TOC entry 5587 (class 0 OID 0)
-- Dependencies: 258
-- Name: productparams_productid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productparams_productid_seq OWNED BY public.productparams.productid;


--
-- TOC entry 259 (class 1259 OID 41655)
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
    supplier_id integer
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 5588 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN products.age_group; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.age_group IS 'Độ tuổi phù hợp: 0-2, 3-5, 6-8, 9-12, 12+';


--
-- TOC entry 5589 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN products.gender; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.gender IS 'Giới tính: boy, girl, unisex';


--
-- TOC entry 5590 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN products.material; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.material IS 'Chất liệu: wood, abs_plastic, fabric, metal, mixed';


--
-- TOC entry 5591 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN products.skill_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.skill_type IS 'Kỹ năng phát triển: cognitive, motor, language, social, stem';


--
-- TOC entry 5592 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN products.safety_certificates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.safety_certificates IS 'Các chứng chỉ an toàn: CE, TCVN, ASTM, EN71';


--
-- TOC entry 5593 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN products.low_stock_threshold; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.low_stock_threshold IS 'Ngưỡng tồn kho thấp để kích hoạt cảnh báo nhập hàng';


--
-- TOC entry 260 (class 1259 OID 41667)
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
-- TOC entry 5594 (class 0 OID 0)
-- Dependencies: 260
-- Name: products_productid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_productid_seq OWNED BY public.products.productid;


--
-- TOC entry 261 (class 1259 OID 41668)
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
-- TOC entry 262 (class 1259 OID 41674)
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
-- TOC entry 5595 (class 0 OID 0)
-- Dependencies: 262
-- Name: productsizes_sizeid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productsizes_sizeid_seq OWNED BY public.productsizes.sizeid;


--
-- TOC entry 263 (class 1259 OID 41675)
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
-- TOC entry 5596 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN promotions.event_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.promotions.event_name IS 'Tên sự kiện: Quốc tế thiếu nhi, Trung thu, Giáng sinh...';


--
-- TOC entry 5597 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN promotions.season; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.promotions.season IS 'Mùa áp dụng: spring, summer, autumn, winter';


--
-- TOC entry 264 (class 1259 OID 41684)
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
-- TOC entry 5598 (class 0 OID 0)
-- Dependencies: 264
-- Name: promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promotions_id_seq OWNED BY public.promotions.id;


--
-- TOC entry 265 (class 1259 OID 41685)
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
-- TOC entry 5599 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE returns; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.returns IS 'Quản lý đơn hàng trả lại từ khách';


--
-- TOC entry 5600 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN returns.reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.returns.reason IS 'Lý do trả: defective, wrong_item, not_as_described, child_disliked, other';


--
-- TOC entry 5601 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN returns.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.returns.status IS 'Trạng thái: pending, approved, rejected, refunded, exchanged';


--
-- TOC entry 266 (class 1259 OID 41700)
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
-- TOC entry 5602 (class 0 OID 0)
-- Dependencies: 266
-- Name: returns_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.returns_return_id_seq OWNED BY public.returns.return_id;


--
-- TOC entry 267 (class 1259 OID 41701)
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
-- TOC entry 5603 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN reviews.durability_rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reviews.durability_rating IS 'Đánh giá độ bền sản phẩm (1-5)';


--
-- TOC entry 5604 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN reviews.safety_rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reviews.safety_rating IS 'Đánh giá tính an toàn (1-5)';


--
-- TOC entry 5605 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN reviews.child_enjoyment_rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reviews.child_enjoyment_rating IS 'Mức độ bé thích sản phẩm (1-5)';


--
-- TOC entry 5606 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN reviews.age_at_review; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reviews.age_at_review IS 'Tuổi của bé khi đánh giá, ví dụ: 3 tuổi';


--
-- TOC entry 268 (class 1259 OID 41720)
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
-- TOC entry 5607 (class 0 OID 0)
-- Dependencies: 268
-- Name: reviews_reviewid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_reviewid_seq OWNED BY public.reviews.reviewid;


--
-- TOC entry 269 (class 1259 OID 41735)
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
-- TOC entry 270 (class 1259 OID 41746)
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
-- TOC entry 5608 (class 0 OID 0)
-- Dependencies: 270
-- Name: savedpaymentcards_cardid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.savedpaymentcards_cardid_seq OWNED BY public.savedpaymentcards.cardid;


--
-- TOC entry 271 (class 1259 OID 41747)
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
-- TOC entry 272 (class 1259 OID 41753)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    key character varying(100) NOT NULL,
    value jsonb NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 41760)
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
-- TOC entry 274 (class 1259 OID 41766)
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
-- TOC entry 5609 (class 0 OID 0)
-- Dependencies: 274
-- Name: shipping_shippingid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipping_shippingid_seq OWNED BY public.shipping.shippingid;


--
-- TOC entry 275 (class 1259 OID 41767)
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
-- TOC entry 276 (class 1259 OID 41776)
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
-- TOC entry 5610 (class 0 OID 0)
-- Dependencies: 276
-- Name: shipping_zones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipping_zones_id_seq OWNED BY public.shipping_zones.id;


--
-- TOC entry 288 (class 1259 OID 42162)
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
-- TOC entry 287 (class 1259 OID 42161)
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
-- TOC entry 5611 (class 0 OID 0)
-- Dependencies: 287
-- Name: staff_notes_note_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_notes_note_id_seq OWNED BY public.staff_notes.note_id;


--
-- TOC entry 294 (class 1259 OID 42226)
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
-- TOC entry 293 (class 1259 OID 42225)
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
-- TOC entry 5612 (class 0 OID 0)
-- Dependencies: 293
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_supplier_id_seq OWNED BY public.suppliers.supplier_id;


--
-- TOC entry 277 (class 1259 OID 41777)
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
-- TOC entry 278 (class 1259 OID 41785)
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
-- TOC entry 5613 (class 0 OID 0)
-- Dependencies: 278
-- Name: usercoupons_usercouponid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usercoupons_usercouponid_seq OWNED BY public.usercoupons.usercouponid;


--
-- TOC entry 279 (class 1259 OID 41786)
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
    promotional boolean
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 41802)
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
-- TOC entry 5614 (class 0 OID 0)
-- Dependencies: 280
-- Name: users_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_userid_seq OWNED BY public.users.userid;


--
-- TOC entry 281 (class 1259 OID 41803)
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
-- TOC entry 282 (class 1259 OID 41810)
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
-- TOC entry 5615 (class 0 OID 0)
-- Dependencies: 282
-- Name: wishlistitems_wishlistitemid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wishlistitems_wishlistitemid_seq OWNED BY public.wishlistitems.wishlistitemid;


--
-- TOC entry 5049 (class 2604 OID 41811)
-- Name: addresses addressid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN addressid SET DEFAULT nextval('public.addresses_addressid_seq'::regclass);


--
-- TOC entry 5052 (class 2604 OID 41812)
-- Name: articles article_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles ALTER COLUMN article_id SET DEFAULT nextval('public.articles_article_id_seq'::regclass);


--
-- TOC entry 5054 (class 2604 OID 41813)
-- Name: banners bannerid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners ALTER COLUMN bannerid SET DEFAULT nextval('public.banners_bannerid_seq'::regclass);


--
-- TOC entry 5141 (class 2604 OID 42127)
-- Name: brands brand_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands ALTER COLUMN brand_id SET DEFAULT nextval('public.brands_brand_id_seq'::regclass);


--
-- TOC entry 5058 (class 2604 OID 41815)
-- Name: cartitems cartitemid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitems ALTER COLUMN cartitemid SET DEFAULT nextval('public.cartitems_cartitemid_seq'::regclass);


--
-- TOC entry 5061 (class 2604 OID 41816)
-- Name: categories categoryid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN categoryid SET DEFAULT nextval('public.categories_categoryid_seq'::regclass);


--
-- TOC entry 5145 (class 2604 OID 42150)
-- Name: child_profiles child_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profiles ALTER COLUMN child_id SET DEFAULT nextval('public.child_profiles_child_id_seq'::regclass);


--
-- TOC entry 5063 (class 2604 OID 41818)
-- Name: collections collection_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections ALTER COLUMN collection_id SET DEFAULT nextval('public.collections_collection_id_seq'::regclass);


--
-- TOC entry 5067 (class 2604 OID 41819)
-- Name: contact_queries queryid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_queries ALTER COLUMN queryid SET DEFAULT nextval('public.contact_queries_queryid_seq'::regclass);


--
-- TOC entry 5068 (class 2604 OID 41820)
-- Name: content_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_items ALTER COLUMN id SET DEFAULT nextval('public.content_items_id_seq'::regclass);


--
-- TOC entry 5071 (class 2604 OID 41821)
-- Name: coupons couponid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons ALTER COLUMN couponid SET DEFAULT nextval('public.coupons_couponid_seq'::regclass);


--
-- TOC entry 5074 (class 2604 OID 41822)
-- Name: deals dealid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals ALTER COLUMN dealid SET DEFAULT nextval('public.deals_dealid_seq'::regclass);


--
-- TOC entry 5075 (class 2604 OID 41823)
-- Name: gift_message_templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_message_templates ALTER COLUMN template_id SET DEFAULT nextval('public.gift_message_templates_template_id_seq'::regclass);


--
-- TOC entry 5078 (class 2604 OID 41824)
-- Name: giftcards cardid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giftcards ALTER COLUMN cardid SET DEFAULT nextval('public.giftcards_cardid_seq'::regclass);


--
-- TOC entry 5082 (class 2604 OID 41825)
-- Name: inventory_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs ALTER COLUMN log_id SET DEFAULT nextval('public.inventory_logs_log_id_seq'::regclass);


--
-- TOC entry 5152 (class 2604 OID 42206)
-- Name: inventory_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.inventory_transactions_transaction_id_seq'::regclass);


--
-- TOC entry 5085 (class 2604 OID 41826)
-- Name: orders orderid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN orderid SET DEFAULT nextval('public.orders_orderid_seq'::regclass);


--
-- TOC entry 5092 (class 2604 OID 41827)
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- TOC entry 5095 (class 2604 OID 41828)
-- Name: payments paymentid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN paymentid SET DEFAULT nextval('public.payments_paymentid_seq'::regclass);


--
-- TOC entry 5149 (class 2604 OID 42187)
-- Name: product_batches batch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches ALTER COLUMN batch_id SET DEFAULT nextval('public.product_batches_batch_id_seq'::regclass);


--
-- TOC entry 5099 (class 2604 OID 41830)
-- Name: productcolors colorid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcolors ALTER COLUMN colorid SET DEFAULT nextval('public.productcolors_colorid_seq'::regclass);


--
-- TOC entry 5100 (class 2604 OID 41831)
-- Name: productimages imageid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages ALTER COLUMN imageid SET DEFAULT nextval('public.productimages_imageid_seq'::regclass);


--
-- TOC entry 5102 (class 2604 OID 41832)
-- Name: productparams productid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productparams ALTER COLUMN productid SET DEFAULT nextval('public.productparams_productid_seq'::regclass);


--
-- TOC entry 5106 (class 2604 OID 41833)
-- Name: products productid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN productid SET DEFAULT nextval('public.products_productid_seq'::regclass);


--
-- TOC entry 5110 (class 2604 OID 41834)
-- Name: productsizes sizeid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsizes ALTER COLUMN sizeid SET DEFAULT nextval('public.productsizes_sizeid_seq'::regclass);


--
-- TOC entry 5111 (class 2604 OID 41835)
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);


--
-- TOC entry 5114 (class 2604 OID 41836)
-- Name: returns return_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns ALTER COLUMN return_id SET DEFAULT nextval('public.returns_return_id_seq'::regclass);


--
-- TOC entry 5119 (class 2604 OID 41837)
-- Name: reviews reviewid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN reviewid SET DEFAULT nextval('public.reviews_reviewid_seq'::regclass);


--
-- TOC entry 5123 (class 2604 OID 41839)
-- Name: savedpaymentcards cardid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savedpaymentcards ALTER COLUMN cardid SET DEFAULT nextval('public.savedpaymentcards_cardid_seq'::regclass);


--
-- TOC entry 5126 (class 2604 OID 41840)
-- Name: shipping shippingid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping ALTER COLUMN shippingid SET DEFAULT nextval('public.shipping_shippingid_seq'::regclass);


--
-- TOC entry 5129 (class 2604 OID 41841)
-- Name: shipping_zones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_zones ALTER COLUMN id SET DEFAULT nextval('public.shipping_zones_id_seq'::regclass);


--
-- TOC entry 5147 (class 2604 OID 42165)
-- Name: staff_notes note_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_notes ALTER COLUMN note_id SET DEFAULT nextval('public.staff_notes_note_id_seq'::regclass);


--
-- TOC entry 5154 (class 2604 OID 42229)
-- Name: suppliers supplier_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN supplier_id SET DEFAULT nextval('public.suppliers_supplier_id_seq'::regclass);


--
-- TOC entry 5132 (class 2604 OID 41842)
-- Name: usercoupons usercouponid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usercoupons ALTER COLUMN usercouponid SET DEFAULT nextval('public.usercoupons_usercouponid_seq'::regclass);


--
-- TOC entry 5135 (class 2604 OID 41843)
-- Name: users userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN userid SET DEFAULT nextval('public.users_userid_seq'::regclass);


--
-- TOC entry 5139 (class 2604 OID 41844)
-- Name: wishlistitems wishlistitemid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlistitems ALTER COLUMN wishlistitemid SET DEFAULT nextval('public.wishlistitems_wishlistitemid_seq'::regclass);


--
-- TOC entry 5473 (class 0 OID 41415)
-- Dependencies: 219
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (addressid, userid, addresstype, username, contactnumber, addressline1, addressline2, city, state, country, postalcode, createdat, updatedat, is_default) FROM stdin;
49256814	666574596	HOME	Random Guy	2226701812	4, Chandan, 1 St Floor Railway Soc	Irla, Opp Pappilon Hotel, Vile Parle (west)	Mumbai	Maharastra	India	400054	2024-06-19 18:41:01.082378	2024-07-16 16:55:48.198806	t
24434471	708932322	HOME	Vuuuu	1111111111	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Vietnam	1101	2026-05-07 23:28:28.722895	2026-05-07 23:28:28.722895	t
84315802	708932322	WORK	Vuuuu	1111111111	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Vietnam	1101	2026-05-07 23:28:40.078842	2026-05-07 23:28:40.078842	f
30389952	1111111	HOME	Vuuuu	1111111111	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Hà Tĩnh	Vietnam	1101	2026-05-08 07:25:16.353387	2026-05-08 07:25:16.353387	t
\.


--
-- TOC entry 5475 (class 0 OID 41432)
-- Dependencies: 221
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articles (article_id, category, title, imglink, imgalt, author, published_date, content) FROM stdin;
1	Fashion	Clothes Retail KPIs 2021 Guide for Clothes Executives	https://codewithsadee.github.io/anon-ecommerce-website/assets/images/blog-1.jpg	girls	Avery Thompson	2024-06-28 00:18:56.133959	In the dynamic world of fashion retail, understanding and leveraging key performance indicators (KPIs) is crucial for driving success. The "Clothes Retail KPIs 2021 Guide for Clothes Executives" offers a comprehensive overview of the most critical metrics that industry leaders should monitor. This guide delves into the intricacies of sales performance, inventory management, customer engagement, and digital transformation. By examining real-world case studies and industry trends, executives will gain actionable insights to enhance their strategic decision-making, optimize operations, and ultimately, boost profitability in an increasingly competitive market. Whether you are navigating the complexities of e-commerce or managing a chain of brick-and-mortar stores, this guide equips you with the knowledge to stay ahead in the ever-evolving apparel sector.
2	Clothes	Curbside fashion Trends: How to Win the Pickup Battle	https://codewithsadee.github.io/anon-ecommerce-website/assets/images/blog-2.jpg	girls	Jordan Blake	2024-06-28 00:20:47.159632	In today s fast-paced retail environment, curbside pickup has emerged as a game-changer, blending convenience with style. "Curbside Fashion Trends: How to Win the Pickup Battle" provides an in-depth look at how fashion retailers can capitalize on this growing trend. This guide explores the latest curbside fashion trends, from streamlined logistics and seamless customer experiences to innovative marketing strategies. With expert insights and practical tips, retailers will learn how to enhance their curbside services, attract more customers, and stand out in a competitive market. Whether you’re a boutique owner or part of a large retail chain, this guide is your key to mastering the curbside pickup battle and driving your business forward.
3	Shoes	EBT vendors: Claim Your Share of SNAP Online Revenue	https://codewithsadee.github.io/anon-ecommerce-website/assets/images/blog-3.jpg	girls	Morgan Ellis	2024-06-28 00:22:31.716156	With the digital transformation of the Supplemental Nutrition Assistance Program (SNAP), EBT vendors have a unique opportunity to tap into a growing market. "EBT Vendors: Claim Your Share of SNAP Online Revenue" is an essential guide for vendors looking to expand their reach and boost their revenue through online SNAP transactions. This comprehensive resource covers everything from regulatory requirements and technical integrations to marketing strategies and customer engagement tactics. By following the insights and best practices outlined in this guide, EBT vendors can streamline their operations, enhance user experiences, and effectively capture a larger share of the SNAP online market. Whether you re a seasoned vendor or new to the SNAP ecosystem, this guide will equip you with the tools and knowledge to succeed in the digital landscape.
4	Electronics	Curbside Fashion Trends: How to Win the Pickup Battle	https://codewithsadee.github.io/anon-ecommerce-website/assets/images/blog-4.jpg	girls	Taylor Reed	2024-06-28 00:24:00.659415	As consumers increasingly turn to convenient shopping options, curbside pickup has become a crucial aspect of the retail experience. "Curbside Fashion Trends: How to Win the Pickup Battle" offers a detailed analysis of how fashion retailers can excel in this competitive space. This guide highlights the latest trends in curbside fashion, effective strategies for optimizing pickup processes, and ways to enhance customer satisfaction. By implementing the expert advice and innovative solutions presented, retailers can streamline their operations, boost sales, and create a loyal customer base. Whether you re managing a small boutique or a large retail chain, this guide is your roadmap to mastering the curbside pickup trend and achieving sustained success.
\.


--
-- TOC entry 5477 (class 0 OID 41442)
-- Dependencies: 223
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (bannerid, toptitle, middletitle, bottomtitle, imglink, startprice, buttontitle, redirect_link, createdat, updatedat) FROM stdin;
1	Trending Item	Women Latest Fashion Sale	starting at $	https://img.pikbest.com/templates/20240815/banner-promoting-the-sale-of-toys-for-children-in-the-supermarket_10729034.jpg!sw800	20.00	Shop Now	/	2024-07-10 00:54:06.964031	2026-05-06 09:31:55.340764
2	Trending Accessories	Modern Sunglasses	starting at $	https://img.pikbest.com/templates/20240725/sale-banner-template-to-decorate-a-shop-selling-children-27s-toys_10680872.jpg!w700wp	15.00	Shop Now	/	2024-07-10 00:54:06.964031	2026-05-06 09:31:55.340764
3	Sale Offer	New Fashion Summer Sale	starting at $	https://thietkewebchuyen.com/wp-content/uploads/thiet-ke-banner-website-anh-bia-Facebook-shop-do-choi-10.jpg	29.99	Shop Now	/	2024-07-10 00:54:06.964031	2026-05-06 09:33:05.757605
\.


--
-- TOC entry 5538 (class 0 OID 42124)
-- Dependencies: 284
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (brand_id, name, slug, manufacturer, country, description, safety_certificates, website, logo_url, is_active, created_at, updated_at) FROM stdin;
1	LEGO Technic	lego-technic	LEGO Group	Denmark	Dòng LEGO kỹ thuật, xe, máy móc.	CE, ASTM F963, EN71	https://www.lego.com	\N	t	2026-05-13 20:54:52.483351	2026-05-13 20:54:52.483351
2	LEGO City	lego-city	LEGO Group	Denmark	Dòng LEGO thành phố, cảnh sát, cứu hỏa.	CE, EN71, TCVN 6238	https://www.lego.com	\N	t	2026-05-13 20:54:52.483351	2026-05-13 20:54:52.483351
3	LEGO Star Wars	lego-star-wars	LEGO Group	Denmark	Dòng LEGO chủ đề Star Wars.	CE, ASTM F963	https://www.lego.com	\N	t	2026-05-13 20:54:52.483351	2026-05-13 20:54:52.483351
4	LEGO Creator	lego-creator	LEGO Group	Denmark	Dòng LEGO sáng tạo 3 trong 1.	CE, EN71	https://www.lego.com	\N	t	2026-05-13 20:54:52.483351	2026-05-13 20:54:52.483351
5	LEGO DUPLO	lego-duplo	LEGO Group	Denmark	Dòng LEGO cho trẻ nhỏ.	CE, EN71, TCVN 6238	https://www.lego.com	\N	t	2026-05-13 20:54:52.483351	2026-05-13 20:54:52.483351
\.


--
-- TOC entry 5479 (class 0 OID 41467)
-- Dependencies: 225
-- Data for Name: cartitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cartitems (cartitemid, userid, productid, quantity, sizeid, colorid, createdat, updatedat) FROM stdin;
23701904	666574596	35000034	2	10000035	10000021	2024-07-16 01:07:48.066402	2024-07-16 16:54:16.055224
93769989	708932322	35100034	1	10000039	10000023	2026-05-06 16:59:22.556338	2026-05-06 16:59:22.556338
32122015	1111111	30000026	1	30000026	30000026	2026-05-08 16:17:31.079789	2026-05-08 16:17:31.079789
16747496	708932322	20000020	14	20000020	20000020	2026-05-06 09:47:46.27889	2026-05-13 09:58:14.001922
80928016	708932322	30000026	1	30000026	30000026	2026-05-14 15:20:11.261814	2026-05-14 15:20:11.261814
\.


--
-- TOC entry 5481 (class 0 OID 41475)
-- Dependencies: 227
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (categoryid, name, slug, maincategory) FROM stdin;
396120533	Boy's Lego	9149319	BUILDING-BLOCKS
966726005	Girl's Lego	5146747	BUILDING-BLOCKS
911347783	Kindergarten's Lego	1013006	BUILDING-BLOCKS
725423327	Adult Lego	7445707	BUILDING-BLOCKS
202560683	Starter Sets	5065298	BUILDING-BLOCKS
750590918	Mini Sets	8783089	BUILDING-BLOCKS
397918237	Police & Fire	5989576	CITY
359556955	Transport	15645563	CITY
204267683	Buildings	48377550	CITY
251327560	Vehicles	47919233	CITY
643579967	Airport	20719437	CITY
642778541	Harbor	40626762	CITY
430565804	Space Port	50670239	CITY
249520556	Farm	31275451	CITY
701908564	Construction	18798262	CITY
890668749	Trains	19800048	CITY
704588137	Millennium Falcon	91542032	STAR-WARS
651311796	X-Wing	3558668	STAR-WARS
136330920	Death Star	77241548	STAR-WARS
124631722	AT-AT Walker	28022927	STAR-WARS
437537458	TIE Fighter	2433843	STAR-WARS
914913022	Clone Trooper	53975817	STAR-WARS
942241807	Darth Vader Helmet	12910041	STAR-WARS
225360974	Mandalorian	95978421	STAR-WARS
886321955	Yoda	19605058	STAR-WARS
133633789	Supercar	57724448	TECHNIC
647581779	Motorcycle	38525410	TECHNIC
287894345	Crane	53983914	TECHNIC
604915562	Excavator	3367741	TECHNIC
170032536	Bulldozer	8342637	TECHNIC
949689297	Helicopter	49431849	TECHNIC
249255664	Formula 1 Car	57656248	TECHNIC
49743134	Monster Truck	89883094	TECHNIC
279512860	Tractor	48291440	TECHNIC
561330193	Airplane	63297659	TECHNIC
183994337	Robot	54693788	TECHNIC
989205241	Race Car	67077735	TECHNIC
217256273	Dump Truck	86801801	TECHNIC
319456917	Modular House	38688941	CREATOR
237505672	Treehouse	17946767	CREATOR
84962408	Beach House	34961444	CREATOR
823874113	Lighthouse	71363607	CREATOR
289031849	Roller Coaster	46649940	CREATOR
953684141	Ferris Wheel	56303032	CREATOR
417528785	Dinosaur	77219061	CREATOR
103787219	Sports Car	13530993	CREATOR
651586995	Dragon	9763889	CREATOR
540135577	Pirate Ship	24247866	CREATOR
581619279	My First Train	26194481	DUPLO
28885920	My First Farm	50358792	DUPLO
140958697	My First House	7626347	DUPLO
490127086	My First Animal	80208421	DUPLO
741474101	Harry Potter	4061583	LEGO-THEMES
228396634	Marvel	58972715	LEGO-THEMES
695797566	DC Heroes	13566745	LEGO-THEMES
15072800	Disney	44681500	LEGO-THEMES
659879521	Minecraft	9998383	LEGO-THEMES
779437084	Jurassic World	16555588	LEGO-THEMES
278725462	Ninjago	49633548	LEGO-THEMES
188464849	Avatar	10080253	LEGO-THEMES
294844724	Limited Edition	91427207	LEGO-SETS
583086156	Gift Sets	80242466	LEGO-SETS
200629899	Bundle Packs	26837036	LEGO-SETS
475582934	Collector Sets	35990578	LEGO-SETS
507914870	Icons Series	3026581	LEGO-SETS
723618655	Architecture	43601809	LEGO-SETS
930057630	Ideas Series	28645898	LEGO-SETS
912740617	Classic Bricks	5289385	BUILDING-BLOCKS
802093982	Supercar	3513816	TECHNIC
\.


--
-- TOC entry 5540 (class 0 OID 42147)
-- Dependencies: 286
-- Data for Name: child_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_profiles (child_id, user_id, child_name, birth_date, gender, created_at) FROM stdin;
4	708932322	Minh Anh	2026-05-18	Nam	2026-05-14 08:29:15.747095
\.


--
-- TOC entry 5483 (class 0 OID 41494)
-- Dependencies: 229
-- Data for Name: collection_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collection_products (collection_id, productid, added_at) FROM stdin;
1	34000034	2026-05-13 15:51:27.435154
1	34500034	2026-05-13 15:51:27.435154
1	34800034	2026-05-13 15:51:27.435154
1	20000003	2026-05-13 15:51:27.435154
1	20000006	2026-05-13 15:51:27.435154
1	20000010	2026-05-13 15:51:27.435154
1	20000015	2026-05-13 15:51:27.435154
1	20000017	2026-05-13 15:51:27.435154
2	34200034	2026-05-13 15:51:27.435154
2	35000034	2026-05-13 15:51:27.435154
2	20000007	2026-05-13 15:51:27.435154
2	20000012	2026-05-13 15:51:27.435154
2	20000013	2026-05-13 15:51:27.435154
2	20000020	2026-05-13 15:51:27.435154
2	20000021	2026-05-13 15:51:27.435154
2	20000022	2026-05-13 15:51:27.435154
2	20000024	2026-05-13 15:51:27.435154
2	34600034	2026-05-13 15:51:27.435154
3	34700034	2026-05-13 15:51:27.435154
3	20000004	2026-05-13 15:51:27.435154
3	20000023	2026-05-13 15:51:27.435154
3	20000011	2026-05-13 15:51:27.435154
3	30000025	2026-05-13 15:51:27.435154
4	34100034	2026-05-13 15:51:27.435154
4	34400034	2026-05-13 15:51:27.435154
4	34900034	2026-05-13 15:51:27.435154
4	20000008	2026-05-13 15:51:27.435154
4	20000009	2026-05-13 15:51:27.435154
4	20000014	2026-05-13 15:51:27.435154
4	20000016	2026-05-13 15:51:27.435154
4	20000018	2026-05-13 15:51:27.435154
5	20000001	2026-05-13 15:51:27.435154
5	20000002	2026-05-13 15:51:27.435154
5	20000011	2026-05-13 15:51:27.435154
5	20000023	2026-05-13 15:51:27.435154
5	30000025	2026-05-13 15:51:27.435154
5	30000026	2026-05-13 15:51:27.435154
5	30000027	2026-05-13 15:51:27.435154
5	30000028	2026-05-13 15:51:27.435154
5	34700034	2026-05-13 15:51:27.435154
2	20000005	2026-05-13 15:51:27.435154
2	35100034	2026-05-13 15:51:27.435154
2	34300034	2026-05-13 15:51:27.435154
\.


--
-- TOC entry 5484 (class 0 OID 41500)
-- Dependencies: 230
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collections (collection_id, name, slug, description, imglink, display_order, is_active, created_at) FROM stdin;
1	Đồ chơi STEM	stem-toys	Khơi dậy tư duy khoa học và sáng tạo cho bé	\N	1	t	2026-05-13 15:30:46.724002
2	Đồ chơi mô hình	model-toys	Lắp ráp, xây dựng và khám phá thế giới thu nhỏ	\N	2	t	2026-05-13 15:30:46.724002
3	Đồ chơi nhà bếp	kitchen-toys	Giả lập nấu ăn, phát triển kỹ năng sinh hoạt	\N	3	t	2026-05-13 15:30:46.724002
4	Đồ chơi vận động	active-play-toys	Phát triển thể chất và phản xạ nhanh nhẹn	\N	4	t	2026-05-13 15:30:46.724002
5	Đồ chơi giáo dục sớm	early-learning	Phù hợp trẻ 0-3 tuổi, phát triển toàn diện	\N	5	t	2026-05-13 15:30:46.724002
\.


--
-- TOC entry 5486 (class 0 OID 41512)
-- Dependencies: 232
-- Data for Name: contact_queries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_queries (queryid, name, email, number, method, message) FROM stdin;
\.


--
-- TOC entry 5488 (class 0 OID 41519)
-- Dependencies: 234
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content_items (id, title, type, location, content_data, status, created_at) FROM stdin;
1	Banner Khuyến Mãi Hè 2026	banner	homepage_hero	{"alt": "Khuyến mãi hè 2026", "link": "/sale", "image": "/images/banner_summer.jpg"}	t	2026-05-12 16:01:57.981929
2	Banner LEGO Technic	banner	homepage_hero	{"alt": "LEGO Technic", "link": "/categories/technic", "image": "/images/banner_technic.jpg"}	t	2026-05-12 16:01:57.981929
3	Banner Star Wars	banner	homepage_hero	{"alt": "LEGO Star Wars", "link": "/categories/star-wars", "image": "/images/banner_starwars.jpg"}	f	2026-05-12 16:01:57.981929
4	Popup Đăng Ký Nhận Tin	popup	global	{"cta": "Đăng ký ngay", "body": "Đăng ký email để nhận mã giảm giá LEGO10", "title": "Nhận ưu đãi 10%"}	t	2026-05-12 16:01:57.981929
5	Thông Báo Freeship	announcement	top_bar	{"color": "#e11d48", "message": "Miễn phí vận chuyển cho đơn hàng trên 500.000đ 🚚"}	t	2026-05-12 16:01:57.981929
6	SEO Trang Chủ	seo	homepage	{"title": "LEGO Shop Vietnam - Đồ Chơi LEGO Chính Hãng", "keywords": "lego, đồ chơi lego, lego việt nam, mua lego", "description": "Mua LEGO chính hãng giá tốt nhất Việt Nam. Hàng ngàn bộ LEGO City, Technic, Star Wars, Creator..."}	t	2026-05-12 16:01:57.981929
7	Hướng Dẫn Mua Hàng	page	footer_links	{"content": "Hướng dẫn đặt hàng online tại LEGO Shop Vietnam..."}	t	2026-05-12 16:01:57.981929
8	Chính Sách Đổi Trả	page	footer_links	{"content": "Chính sách đổi trả trong vòng 30 ngày kể từ ngày mua hàng..."}	t	2026-05-12 16:01:57.981929
9	Widget Sản Phẩm Bán Chạy	widget	homepage_section	{"limit": 8, "title": "Bán Chạy Nhất", "category": "all"}	t	2026-05-12 16:01:57.981929
10	Widget Sản Phẩm Mới	widget	homepage_section	{"limit": 8, "title": "Hàng Mới Về", "filter": "isnew"}	t	2026-05-12 16:01:57.981929
\.


--
-- TOC entry 5490 (class 0 OID 41531)
-- Dependencies: 236
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (couponid, code, description, discountpercentage, maxdiscountamount, minpurchaseamount, validfrom, validuntil, createdat, updatedat) FROM stdin;
1	SUMMER2024	Summer Sale 2024	15.00	50.00	100.00	2024-06-21 00:00:00	2024-09-21 00:00:00	2024-06-21 13:45:05.864108	2024-06-21 13:45:05.864108
2	WINTER2024	Winter Wonderland Sale 2024	20.00	75.00	150.00	2024-11-01 00:00:00	2025-02-28 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
3	SPRING2025	Spring Fling Sale 2025	10.00	30.00	80.00	2025-03-01 00:00:00	2025-05-31 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
4	BLACKFRIDAY2024	Black Friday Sale 2024	50.00	100.00	200.00	2024-11-29 00:00:00	2024-11-30 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
5	CYBERMONDAY2024	Cyber Monday Sale 2024	30.00	60.00	120.00	2024-12-02 00:00:00	2024-12-03 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
6	NEWYEAR2025	New Year Sale 2025	25.00	50.00	100.00	2025-01-01 00:00:00	2025-01-15 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
\.


--
-- TOC entry 5492 (class 0 OID 41541)
-- Dependencies: 238
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deals (dealid, productid, end_time, sold, available) FROM stdin;
1	20000023	2025-08-12 14:30:00	15	40
2	20000024	2025-08-25 09:45:00	20	40
\.


--
-- TOC entry 5494 (class 0 OID 41548)
-- Dependencies: 240
-- Data for Name: gift_message_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gift_message_templates (template_id, occasion, title, content, is_active, created_at) FROM stdin;
1	birthday	Chúc mừng sinh nhật	Chúc bé luôn vui vẻ, khỏe mạnh và hạnh phúc nhé! 🎂	t	2026-05-13 15:30:46.724002
2	childrens_day	Quốc tế thiếu nhi	Chúc bé có một ngày 1/6 thật vui và nhiều niềm vui bất ngờ! 🎈	t	2026-05-13 15:30:46.724002
3	mid_autumn	Tết Trung thu	Chúc bé có một mùa trăng tròn đầy ắp niềm vui! 🌕	t	2026-05-13 15:30:46.724002
4	christmas	Giáng sinh vui vẻ	Merry Christmas! Chúc bé được ông già Noel tặng thật nhiều quà! 🎄	t	2026-05-13 15:30:46.724002
5	new_year	Chúc mừng năm mới	Chúc bé năm mới luôn vui cười, học giỏi và khỏe mạnh! 🎉	t	2026-05-13 15:30:46.724002
\.


--
-- TOC entry 5496 (class 0 OID 41560)
-- Dependencies: 242
-- Data for Name: giftcards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.giftcards (cardid, cardname, cardcode, description, balance, currency, expirydate, recipientname, recipientemail, sendername, senderemail, message, createdat, updatedat, status) FROM stdin;
1	Birthday Gift	BDAY2024	Happy Birthday! Enjoy your special day with this gift card.	100.00	USD	2024-12-31	Alice Johnson	demo@demo.com	Bob Smith	bob.smith@example.com	Wishing you a fantastic birthday!	2024-06-21 21:37:03.351668	2024-06-21 21:37:03.351668	Active
2	Anniversary Gift	ANNIV2024	Happy Anniversary! Celebrate your love with this gift card.	150.00	USD	2024-11-30	John Doe	demo@demo.com	Jane Doe	jane.doe@example.com	Happy Anniversary! Love, Jane.	2024-06-21 21:37:03.351668	2024-06-21 21:37:03.351668	Active
3	Thank You Gift	THANKS2024	Thank you for your kindness and support. Enjoy this gift card.	50.00	USD	2024-10-31	Sam Wilson	demo@demo.com	Emily Clark	emily.clark@example.com	Thanks a lot, Sam. Best regards, Emily.	2024-06-21 21:37:03.351668	2024-06-21 21:37:03.351668	Active
4	Holiday Gift	HOLIDAY2024	Season Greetings! Warm wishes and happy holidays.	200.00	USD	2024-12-25	Emma Brown	demo@demo.com	Lucas Green	lucas.green@example.com	Happy Holidays! Enjoy your gift. Best, Lucas.	2024-06-21 21:37:03.351668	2024-06-21 21:37:03.351668	Active
5	Graduation Gift	GRAD2024	Congratulations on your graduation! Celebrate with this gift card.	75.00	USD	2024-09-30	Chris Lee	demo@demo.com	Pat Taylor	pat.taylor@example.com	Congrats on your achievement, Chris!	2024-06-21 21:37:03.351668	2024-06-21 21:37:03.351668	Active
\.


--
-- TOC entry 5498 (class 0 OID 41575)
-- Dependencies: 244
-- Data for Name: inventory_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_logs (log_id, productid, change_type, quantity_change, stock_after, batch_code, supplier_id, note, created_by, created_at) FROM stdin;
1	34000034	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
2	34100034	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
3	34200034	import	100	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
4	34300034	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
5	34400034	import	150	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
6	34500034	import	100	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
7	34600034	import	80	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
8	34700034	import	300	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
9	34800034	import	180	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
10	34900034	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
11	35000034	import	90	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
12	35100034	import	120	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
13	20000001	import	250	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
14	20000002	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
15	20000003	import	160	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
16	20000004	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
17	20000005	import	100	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
18	20000006	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
19	20000007	import	180	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
20	20000008	import	220	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
21	20000009	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
22	20000010	import	160	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
23	20000011	import	300	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
24	20000012	import	180	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
25	20000013	import	160	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
26	20000014	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
27	20000015	import	140	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
28	20000016	import	200	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
29	20000017	import	160	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
30	20000018	import	150	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
31	20000019	import	120	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
32	20000020	import	80	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
33	20000021	import	80	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
34	20000022	import	100	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
35	20000023	import	280	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
36	20000024	import	80	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
37	30000025	import	400	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
38	30000026	import	350	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
39	30000027	import	350	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
40	30000028	import	400	100	LOT-2025-001	1	Nhập đầu năm	1111111	2026-05-13 15:51:27.435154
41	20000011	import	200	100	LOT-2025-002	1	Dự trữ mùa 1/6	1111111	2026-05-13 15:51:27.435154
42	20000023	import	200	100	LOT-2025-002	1	Dự trữ mùa 1/6	1111111	2026-05-13 15:51:27.435154
43	30000025	import	300	100	LOT-2025-002	1	Dự trữ mùa 1/6	1111111	2026-05-13 15:51:27.435154
44	20000001	import	150	100	LOT-2025-002	1	Dự trữ mùa 1/6	1111111	2026-05-13 15:51:27.435154
45	20000002	import	100	100	LOT-2025-002	1	Dự trữ mùa 1/6	1111111	2026-05-13 15:51:27.435154
46	30000027	import	150	100	LOT-2025-002	1	Dự trữ mùa 1/6	1111111	2026-05-13 15:51:27.435154
47	34700034	import	150	100	LOT-2025-002	1	Dự trữ mùa 1/6	1111111	2026-05-13 15:51:27.435154
48	30000028	import	200	100	LOT-2025-002	1	Dự trữ mùa 1/6	1111111	2026-05-13 15:51:27.435154
49	20000001	export	-100	100	LOT-2025-001	\N	Bán Q1/2025	1111111	2026-05-13 15:51:27.435154
50	20000011	export	-80	100	LOT-2025-001	\N	Bán Q1/2025	1111111	2026-05-13 15:51:27.435154
51	20000019	export	-30	100	LOT-2025-001	\N	Bán Q1/2025	1111111	2026-05-13 15:51:27.435154
52	34700034	export	-60	100	LOT-2025-001	\N	Bán Q1/2025	1111111	2026-05-13 15:51:27.435154
53	20000007	export	-50	100	LOT-2025-001	\N	Bán Q1/2025	1111111	2026-05-13 15:51:27.435154
54	20000014	export	-70	100	LOT-2025-001	\N	Bán Q1/2025	1111111	2026-05-13 15:51:27.435154
55	20000009	export	-60	100	LOT-2025-001	\N	Bán Q1/2025	1111111	2026-05-13 15:51:27.435154
56	20000016	export	-80	100	LOT-2025-001	\N	Bán Q1/2025	1111111	2026-05-13 15:51:27.435154
57	34200034	damage	-3	100	LOT-2025-001	\N	Hộp bị móp khi vận chuyển	1111111	2026-05-13 15:51:27.435154
58	34600034	damage	-2	100	LOT-2025-001	\N	Thiếu linh kiện, trả nhà cung cấp	1111111	2026-05-13 15:51:27.435154
59	20000020	adjustment	-1	100	LOT-2025-001	\N	Lệch kết quả kiểm kê	1111111	2026-05-13 15:51:27.435154
60	20000020	return	1	100	LOT-2025-001	\N	Khách trả - sản phẩm nguyên vẹn	1111111	2026-05-13 15:51:27.435154
61	20000004	return	2	100	LOT-2025-001	\N	Khách trả - nhận nhầm đơn	1111111	2026-05-13 15:51:27.435154
62	20000019	import	120	100	LOT-2025-003	1	Chuẩn bị Trung thu	1111111	2026-05-13 15:51:27.435154
63	20000024	import	100	100	LOT-2025-003	1	Chuẩn bị Trung thu	1111111	2026-05-13 15:51:27.435154
64	20000005	import	80	100	LOT-2025-003	1	Chuẩn bị Trung thu	1111111	2026-05-13 15:51:27.435154
65	34600034	import	100	100	LOT-2025-003	1	Chuẩn bị Trung thu	1111111	2026-05-13 15:51:27.435154
66	20000002	import	100	100	LOT-2025-003	1	Chuẩn bị Trung thu	1111111	2026-05-13 15:51:27.435154
\.


--
-- TOC entry 5546 (class 0 OID 42203)
-- Dependencies: 292
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_transactions (transaction_id, product_id, transaction_type, quantity, batch_number, notes, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5500 (class 0 OID 41586)
-- Dependencies: 246
-- Data for Name: orderitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orderitems (orderitemid, orderid, productid, quantity, shippingid, paymentid, colorid, sizeid, gift_wrapping, gift_wrap_style, gift_message) FROM stdin;
95758094	16176577	20000020	1	42228873	86243815	20000020	20000020	f	\N	\N
\.


--
-- TOC entry 5501 (class 0 OID 41590)
-- Dependencies: 247
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (orderid, userid, totalamount, orderstatus, createdat, updatedat, order_code, is_gift, gift_message, gift_wrapping_type, order_status, tracking_number, shipped_at, delivered_at, delivery_status) FROM stdin;
16176577	666574596	30.00	Cancelled	2024-07-17 16:48:18.792033	2026-05-13 15:51:27.435154	IN	t	Chúc bé Minh sinh nhật vui vẻ! Lớn lên thật khỏe mạnh nhé! 🎂	birthday	Pending	\N	\N	\N	Confirmed
\.


--
-- TOC entry 5503 (class 0 OID 41602)
-- Dependencies: 249
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (id, name, type, status, config, created_at) FROM stdin;
1	Thẻ Visa / Mastercard	credit_card	t	{"gateway": "stripe", "currencies": ["VND", "USD"], "min_amount": 10000}	2026-05-12 16:01:57.981929
2	Chuyển khoản ngân hàng	bank_transfer	t	{"bank": "Vietcombank", "account_name": "LEGO VIET NAM", "account_number": "1234567890"}	2026-05-12 16:01:57.981929
3	Ví MoMo	e_wallet	t	{"phone": "0901234567", "partner_code": "MOMO_LEGO"}	2026-05-12 16:01:57.981929
4	ZaloPay	e_wallet	t	{"key": "zalopay_secret_key", "app_id": "zalopay_lego_001"}	2026-05-12 16:01:57.981929
5	Tiền mặt khi nhận hàng (COD)	cod	t	{"note": "Chỉ áp dụng nội thành", "max_amount": 5000000}	2026-05-12 16:01:57.981929
6	Thẻ ATM nội địa	debit_card	t	{"gateway": "vnpay", "supported_banks": ["Vietcombank", "Techcombank", "BIDV", "VietinBank"]}	2026-05-12 16:01:57.981929
7	Apple Pay	digital_wallet	f	{"merchant_id": "merchant.com.legoshop"}	2026-05-12 16:01:57.981929
8	Google Pay	digital_wallet	f	{"merchant_id": "BCR2DN4TXXX"}	2026-05-12 16:01:57.981929
\.


--
-- TOC entry 5505 (class 0 OID 41613)
-- Dependencies: 251
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (paymentid, orderid, paymentmethod, paymentstatus, amount, transactionid, createdat, updatedat, billingaddress, paymentgateway_id) FROM stdin;
86243815	16176577	Card	Confirmed	10.00	TS-52566197-86243815-16176577	2024-07-17 16:48:18.810615	2024-07-17 16:48:18.810615	49256814	pi_3PdVs6D7p9TT9EWx0h8Bnud2
\.


--
-- TOC entry 5544 (class 0 OID 42184)
-- Dependencies: 290
-- Data for Name: product_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_batches (batch_id, product_id, batch_number, quantity, manufacture_date, expiry_date, created_at) FROM stdin;
\.


--
-- TOC entry 5507 (class 0 OID 41632)
-- Dependencies: 253
-- Data for Name: productcolors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productcolors (colorid, productid, colorname, colorclass) FROM stdin;
10000001	34000034	Red	bg-red-500
10000002	34000034	Yellow	bg-yellow-400
10000003	34100034	Blue	bg-blue-500
10000004	34100034	Green	bg-green-500
10000005	34200034	Black	bg-black
10000006	34200034	White	bg-white
10000007	34300034	Orange	bg-orange-500
10000008	34300034	Gray	bg-gray-400
10000009	34400034	Red	bg-red-500
10000010	34400034	Yellow	bg-yellow-400
10000011	34500034	Blue	bg-blue-500
10000012	34500034	Green	bg-green-500
10000013	34600034	Black	bg-black
10000014	34600034	White	bg-white
10000015	34700034	Orange	bg-orange-500
10000016	34700034	Gray	bg-gray-400
10000017	34800034	Red	bg-red-500
10000018	34800034	Yellow	bg-yellow-400
10000019	34900034	Blue	bg-blue-500
10000020	34900034	Green	bg-green-500
10000021	35000034	Black	bg-black
10000022	35000034	White	bg-white
10000023	35100034	Orange	bg-orange-500
10000024	35100034	Gray	bg-gray-400
10000025	35100034	Red	bg-red-500
20000001	20000001	Yellow	bg-yellow-400
20000002	20000002	Blue	bg-blue-500
20000003	20000003	Green	bg-green-500
20000004	20000004	Black	bg-black
20000005	20000005	White	bg-white
20000006	20000006	Orange	bg-orange-500
20000007	20000007	Gray	bg-gray-400
20000008	20000008	Red	bg-red-500
20000009	20000009	Yellow	bg-yellow-400
20000010	20000010	Blue	bg-blue-500
20000011	20000011	Green	bg-green-500
20000012	20000012	Black	bg-black
20000013	20000013	White	bg-white
20000014	20000014	Orange	bg-orange-500
20000015	20000015	Gray	bg-gray-400
20000016	20000016	Red	bg-red-500
20000017	20000017	Yellow	bg-yellow-400
20000018	20000018	Blue	bg-blue-500
20000019	20000019	Green	bg-green-500
20000020	20000020	Black	bg-black
20000021	20000021	White	bg-white
20000022	20000022	Orange	bg-orange-500
20000023	20000023	Gray	bg-gray-400
20000024	20000024	Red	bg-red-500
30000025	30000025	Yellow	bg-yellow-400
30000026	30000026	Blue	bg-blue-500
30000027	30000027	Green	bg-green-500
30000028	30000028	Black	bg-black
\.


--
-- TOC entry 5509 (class 0 OID 41638)
-- Dependencies: 255
-- Data for Name: productimages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productimages (imageid, productid, imglink, imgalt, createdat, isprimary) FROM stdin;
1	34000034	/images/active_fishing.jpg	LEGO Technic Supercar 42143	2024-07-05 17:29:49.259673	t
2	34100034	/images/ball_house.jpg	LEGO City Police Station 60316	2024-07-05 17:29:49.259673	t
3	34200034	/images/bubble_machine.jpg	LEGO Star Wars Millennium Falcon 75192	2024-07-05 17:29:49.259673	t
4	34300034	/images/bubble_machine2.jpg	LEGO Creator Treehouse 31114	2024-07-05 17:29:49.259673	t
5	34400034	/images/car.jpg	LEGO Ninjago Dragon 71766	2024-07-05 17:29:49.259673	t
6	34500034	/images/car2.jpg	LEGO Technic Helicopter 42145	2024-07-05 17:29:49.259673	t
7	34600034	/images/card_pokemon.jpg	LEGO Harry Potter Hogwarts Castle 71043	2024-07-05 17:29:49.259673	t
8	34700034	/images/active_fishing.jpg	LEGO Duplo My First Farm 10952	2024-07-05 17:29:49.259673	t
9	34800034	/images/ball_house.jpg	LEGO Technic Monster Truck 42118	2024-07-05 17:29:49.259673	t
10	34900034	/images/bubble_machine.jpg	LEGO City Transport Truck 60305	2024-07-05 17:29:49.259673	t
11	35000034	/images/bubble_machine2.jpg	LEGO Creator Modular Bookshop 10270	2024-07-05 17:29:49.259673	t
12	35100034	/images/car.jpg	LEGO Marvel Avengers Tower 76269	2024-07-05 17:29:49.259673	t
2000001	20000001	/images/car2.jpg	LEGO Classic Rainbow Fun 11015	2024-07-05 18:25:51.266022	t
2000002	20000002	/images/card_pokemon.jpg	LEGO Friends Starter Set 41689	2024-07-05 18:25:51.266022	t
2000003	20000003	/images/active_fishing.jpg	LEGO Technic Race Car 42130	2024-07-05 18:25:51.266022	t
2000004	20000004	/images/ball_house.jpg	LEGO City Farm 60346	2024-07-05 18:25:51.266022	t
2000005	20000005	/images/bubble_machine.jpg	LEGO Marvel Iron Man Helmet 76165	2024-07-05 18:25:51.266022	t
2000006	20000006	/images/bubble_machine2.jpg	LEGO Technic Crane 42146	2024-07-05 18:25:51.266022	t
2000007	20000007	/images/car.jpg	LEGO Star Wars X-Wing Fighter 75355	2024-07-05 18:25:51.266022	t
2000008	20000008	/images/car2.jpg	LEGO Creator Sports Car 31100	2024-07-05 18:25:51.266022	t
2000009	20000009	/images/card_pokemon.jpg	LEGO City Police Patrol 60239	2024-07-05 18:25:51.266022	t
2000010	20000010	/images/active_fishing.jpg	LEGO Technic Motorcycle 42132	2024-07-05 18:25:51.266022	t
2000011	20000011	/images/ball_house.jpg	LEGO Duplo My First Train 10954	2024-07-05 18:25:51.266022	t
2000012	20000012	/images/bubble_machine.jpg	LEGO Star Wars TIE Fighter 75300	2024-07-05 18:25:51.266022	t
2000013	20000013	/images/bubble_machine2.jpg	LEGO Creator Lighthouse 31051	2024-07-05 18:25:51.266022	t
2000014	20000014	/images/car.jpg	LEGO City Fire Station 60320	2024-07-05 18:25:51.266022	t
2000015	20000015	/images/car2.jpg	LEGO Technic Bulldozer 42163	2024-07-05 18:25:51.266022	t
2000016	20000016	/images/card_pokemon.jpg	LEGO City Race Car 60322	2024-07-05 18:25:51.266022	t
2000017	20000017	/images/active_fishing.jpg	LEGO Technic Excavator 42121	2024-07-05 18:25:51.266022	t
2000018	20000018	/images/ball_house.jpg	LEGO Ninjago Lloyd's Titan Mech 71738	2024-07-05 18:25:51.266022	t
2000019	20000019	/images/bubble_machine.jpg	LEGO Disney Cinderella Castle 71040	2024-07-05 18:25:51.266022	t
2000020	20000020	/images/bubble_machine2.jpg	LEGO Architecture Eiffel Tower 21019	2024-07-05 18:25:51.266022	t
2000021	20000021	/images/car.jpg	LEGO Star Wars Death Star Trench 75329	2024-07-05 18:25:51.266022	t
2000022	20000022	/images/car2.jpg	LEGO Creator Ferris Wheel 10247	2024-07-05 18:25:51.266022	t
2000023	20000023	/images/card_pokemon.jpg	LEGO Duplo Farm Animals 10863	2024-07-05 18:25:51.266022	t
2000024	20000024	/images/active_fishing.jpg	LEGO Harry Potter Diagon Alley 75978	2024-07-05 18:25:51.266022	t
30000025	30000025	/images/ball_house.jpg	LEGO DUPLO Starter Brick Box 10913	2024-07-05 18:34:24.88477	t
30000026	30000026	/images/bubble_machine.jpg	LEGO Boy's Classic Bricks Set 10403	2024-07-05 18:34:24.88477	t
30000027	30000027	/images/bubble_machine2.jpg	LEGO Girl's Friends Starter Pack 41682	2024-07-05 18:34:24.88477	t
30000028	30000028	/images/car.jpg	LEGO Kindergarten Big Bricks Box 10958	2024-07-05 18:34:24.88477	t
\.


--
-- TOC entry 5511 (class 0 OID 41647)
-- Dependencies: 257
-- Data for Name: productparams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productparams (productid, issale, isnew, isdiscount, stars, views, sold, rating) FROM stdin;
34500034	t	f	f	0	2	0	0
20000012	f	f	t	0	2	0	0
34900034	t	f	f	0	1	0	0
20000009	f	f	t	0	3	0	0
34200034	f	f	f	0	1	2	0
35000034	f	f	f	0	17	5	0
20000001	t	f	f	0	0	0	0
20000002	f	t	f	0	0	0	0
20000003	f	f	t	0	0	0	0
20000004	t	f	f	0	0	0	0
20000005	f	t	f	0	0	0	0
20000006	f	f	t	0	0	0	0
20000007	t	f	f	0	0	0	0
20000010	t	f	f	0	0	0	0
20000011	f	t	f	0	0	0	0
20000013	t	f	f	0	0	0	0
20000014	f	t	f	0	0	0	0
20000015	f	f	t	0	0	0	0
20000016	t	f	f	0	0	0	0
20000017	f	t	f	0	0	0	0
20000018	f	f	t	0	0	0	0
20000021	f	f	t	0	0	0	0
20000022	t	f	f	0	0	0	0
34000034	f	f	t	0	0	0	0
34300034	f	t	f	0	0	0	0
34400034	f	f	f	0	0	0	0
34700034	t	f	f	0	0	0	0
34800034	f	f	f	0	0	0	0
20000024	f	f	t	0	8	0	0
20000019	t	f	f	0	3	0	0
34100034	t	f	f	0	1	0	0
20000008	f	t	f	0	1	0	0
35100034	t	f	f	0	2	0	0
20000023	f	t	f	0	5	0	0
30000028	f	t	t	0	9	0	0
30000026	f	t	t	0	26	0	0
30000027	f	t	t	0	3	0	0
20000020	f	t	f	4.5	37	6	2
34600034	f	f	f	0	15	2	1
30000025	f	t	t	0	21	12	0
\.


--
-- TOC entry 5513 (class 0 OID 41655)
-- Dependencies: 259
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (productid, title, description, categoryid, price, discount, stock, tags, createdat, updatedat, imgid, seller_id, age_group, gender, material, skill_type, brand, safety_certificates, low_stock_threshold, supplier_id) FROM stdin;
34000034	LEGO Technic Supercar 42143	High-performance LEGO Technic supercar with detailed engine and moving parts.	475582934	75.00	48.00	100	technic,supercar,advanced,car	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	1	1	9-12	boy	abs_plastic	stem	LEGO Technic	CE, ASTM F963, EN71	10	\N
34100034	LEGO City Police Station 60316	Large LEGO City police station with jail cells and police vehicles.	723618655	56.00	45.00	100	city,police,station,vehicles	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	2	1	6-8	unisex	abs_plastic	cognitive	LEGO City	CE, EN71, TCVN 6238	10	\N
34200034	LEGO Star Wars Millennium Falcon 75192	Ultimate Collector Series Millennium Falcon with 7500+ pieces.	475582934	65.00	58.00	100	star wars,millennium falcon,collector,ship	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	3	1	12+	unisex	abs_plastic	cognitive	LEGO Star Wars	CE, ASTM F963	5	\N
34300034	LEGO Creator Treehouse 31114	3-in-1 creator treehouse with animals and nature details.	228396634	35.00	25.00	100	creator,treehouse,nature,3in1	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	4	1	9-12	unisex	abs_plastic	cognitive	LEGO Creator	CE, EN71	10	\N
34400034	LEGO Ninjago Dragon 71766	Epic Ninjago dragon with articulated wings and minifigures.	583086156	105.00	99.00	100	ninjago,dragon,ninja,action	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	5	1	9-12	boy	abs_plastic	cognitive	LEGO Ninjago	CE, ASTM F963, EN71	10	\N
34500034	LEGO Technic Helicopter 42145	Detailed helicopter with working rotors and realistic design.	953684141	170.00	150.00	100	technic,helicopter,aviation,advanced	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	6	1	12+	boy	abs_plastic	stem	LEGO Technic	CE, ASTM F963	8	\N
34600034	LEGO Harry Potter Hogwarts Castle 71043	Massive Hogwarts castle with over 6000 pieces.	953684141	120.00	100.00	100	harry potter,hogwarts,castle,magical	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	7	1	12+	unisex	abs_plastic	cognitive	LEGO Harry Potter	CE, ASTM F963	5	\N
34700034	LEGO Duplo My First Farm 10952	Fun farm set for toddlers with animals and tractor.	430565804	30.00	25.00	100	duplo,farm,toddler,animals	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	8	1	3-5	unisex	abs_plastic	motor	LEGO DUPLO	CE, EN71, TCVN 6238	15	\N
34800034	LEGO Technic Monster Truck 42118	Powerful monster truck with suspension and detailed engine.	475582934	45.00	32.00	100	technic,monster truck,offroad,vehicle	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	9	1	9-12	boy	abs_plastic	stem	LEGO Technic	CE, ASTM F963	10	\N
34900034	LEGO City Transport Truck 60305	Large transport truck with car carrier and mini vehicles.	397918237	64.00	58.00	100	city,transport,truck,vehicles	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	10	1	6-8	unisex	abs_plastic	cognitive	LEGO City	CE, EN71	10	\N
35000034	LEGO Creator Modular Bookshop 10270	Detailed modular bookshop with interior decoration.	294844724	65.00	50.00	100	creator,modular,house,architecture	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	11	1	12+	unisex	abs_plastic	cognitive	LEGO Creator	CE, ASTM F963	5	\N
35100034	LEGO Marvel Avengers Tower 76269	Iconic Avengers tower with Marvel superheroes.	966726005	85.00	78.00	100	marvel,avengers,tower,superheroes	2024-07-05 17:29:49.259673	2026-05-13 15:51:27.435154	12	1	12+	unisex	abs_plastic	cognitive	LEGO Marvel	CE, ASTM F963	8	\N
20000001	LEGO Classic Rainbow Fun 11015	Classic bricks in rainbow colors for creative building.	396120533	45.00	12.00	100	classic,rainbow,bricks,creative	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000001	1	3-5	unisex	abs_plastic	motor	LEGO Classic	CE, EN71, TCVN 6238	20	\N
20000002	LEGO Friends Starter Set 41689	Colorful starter set designed for kids.	228396634	61.00	9.00	100	girls,starter,creative,fun	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000002	1	6-8	girl	abs_plastic	social	LEGO Friends	CE, EN71	12	\N
20000003	LEGO Technic Race Car 42130	Fast race car with detailed mechanics.	228396634	76.00	25.00	100	technic,race car,speed,advanced	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000003	1	9-12	boy	abs_plastic	stem	LEGO Technic	CE, ASTM F963	10	\N
20000004	LEGO City Farm 60346	Complete farm set with animals, fields and barn.	723618655	68.00	31.00	100	city,farm,animals,barn	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000004	1	6-8	unisex	abs_plastic	cognitive	LEGO City	CE, EN71	10	\N
20000005	LEGO Marvel Iron Man Helmet 76165	Highly detailed Iron Man helmet for collectors.	475582934	61.00	11.00	100	marvel,iron man,helmet,collector	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000005	1	12+	unisex	abs_plastic	cognitive	LEGO Marvel	CE, ASTM F963	8	\N
20000006	LEGO Technic Crane 42146	Fully functional crane with extendable arm.	475582934	32.00	20.00	100	technic,crane,construction,advanced	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000006	1	9-12	boy	abs_plastic	stem	LEGO Technic	CE, ASTM F963	10	\N
20000007	LEGO Star Wars X-Wing Fighter 75355	Iconic X-Wing starfighter with Luke Skywalker.	475582934	50.00	25.00	100	star wars,xwing,fighter,pilot	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000007	1	9-12	unisex	abs_plastic	cognitive	LEGO Star Wars	CE, ASTM F963	10	\N
20000008	LEGO Creator Sports Car 31100	3-in-1 sports car with convertible and roadster mode.	966726005	20.00	10.00	100	creator,sports car,3in1,fast	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000008	1	9-12	unisex	abs_plastic	cognitive	LEGO Creator	CE, EN71	10	\N
20000009	LEGO City Police Patrol 60239	Police patrol car with officer minifigure.	397918237	49.00	15.00	100	city,police,patrol,car	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000009	1	6-8	unisex	abs_plastic	cognitive	LEGO City	CE, EN71	10	\N
20000010	LEGO Technic Motorcycle 42132	Realistic motorcycle with detailed engine.	397918237	78.00	36.00	100	technic,motorcycle,engine,realistic	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000010	1	9-12	boy	abs_plastic	stem	LEGO Technic	CE, ASTM F963	10	\N
20000011	LEGO Duplo My First Train 10954	Simple train set for toddlers learning colors.	430565804	94.00	42.00	100	duplo,train,toddler,colors	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000011	1	3-5	unisex	abs_plastic	motor	LEGO DUPLO	CE, EN71, TCVN 6238	15	\N
20000012	LEGO Star Wars TIE Fighter 75300	Imperial TIE Fighter with Stormtrooper minifigure.	397918237	65.00	54.00	100	star wars,tie fighter,imperial,space	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000012	1	9-12	unisex	abs_plastic	cognitive	LEGO Star Wars	CE, ASTM F963	10	\N
20000013	LEGO Creator Lighthouse 31051	Beautiful lighthouse with rotating light and boat.	397918237	55.00	52.00	100	creator,lighthouse,ocean,3in1	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000013	1	9-12	unisex	abs_plastic	cognitive	LEGO Creator	CE, EN71	10	\N
20000014	LEGO City Fire Station 60320	Large fire station with fire truck and crew.	204267683	30.00	20.00	100	city,fire station,fire truck,rescue	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000014	1	6-8	unisex	abs_plastic	cognitive	LEGO City	CE, EN71, TCVN 6238	10	\N
20000015	LEGO Technic Bulldozer 42163	Heavy duty bulldozer with working blade.	359556955	78.00	56.00	100	technic,bulldozer,construction,heavy	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000015	1	9-12	boy	abs_plastic	stem	LEGO Technic	CE, ASTM F963	10	\N
20000016	LEGO City Race Car 60322	Speedy race car with driver for city circuit.	359556955	55.00	50.00	100	city,race car,circuit,driver	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000016	1	6-8	boy	abs_plastic	cognitive	LEGO City	CE, EN71	10	\N
20000017	LEGO Technic Excavator 42121	Large excavator with realistic arm mechanics.	953684141	50.00	34.00	100	technic,excavator,construction,arm	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000017	1	9-12	boy	abs_plastic	stem	LEGO Technic	CE, ASTM F963	10	\N
20000018	LEGO Ninjago Lloyd's Titan Mech 71738	Giant mech suit with Ninjago hero.	704588137	84.00	30.00	100	ninjago,mech,titan,hero	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000018	1	9-12	boy	abs_plastic	cognitive	LEGO Ninjago	CE, ASTM F963, EN71	10	\N
20000019	LEGO Disney Cinderella Castle 71040	Magical Disney castle with princess minifigures.	695797566	42.00	10.00	100	disney,cinderella,castle,princess	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000019	1	6-8	girl	abs_plastic	language	LEGO Disney	CE, EN71	8	\N
20000020	LEGO Architecture Eiffel Tower 21019	Iconic Eiffel Tower architectural model.	294844724	24.00	10.00	100	architecture,eiffel tower,paris,iconic	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000020	1	12+	unisex	abs_plastic	cognitive	LEGO Architecture	CE, ASTM F963	5	\N
20000021	LEGO Star Wars Death Star Trench 75329	Iconic Death Star trench run diorama.	136330920	72.00	62.00	100	star wars,death star,diorama,collector	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000021	1	12+	unisex	abs_plastic	cognitive	LEGO Star Wars	CE, ASTM F963	5	\N
20000022	LEGO Creator Ferris Wheel 10247	Giant fairground ferris wheel with carriages.	953684141	78.00	56.00	100	creator,ferris wheel,fairground,fun	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000022	1	9-12	unisex	abs_plastic	cognitive	LEGO Creator	CE, EN71	8	\N
20000023	LEGO Duplo Farm Animals 10863	Toddler farm set with animals and feeding.	136330920	30.00	20.00	100	duplo,farm,animals,toddler	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000023	1	0-2	unisex	abs_plastic	motor	LEGO DUPLO	CE, EN71, TCVN 6238	15	\N
20000024	LEGO Harry Potter Diagon Alley 75978	Magical Diagon Alley street with shops.	651311796	30.00	20.00	100	harry potter,diagon alley,magical,shops	2024-07-05 18:25:51.266022	2026-05-13 15:51:27.435154	2000024	1	12+	unisex	abs_plastic	cognitive	LEGO Harry Potter	CE, ASTM F963	5	\N
30000025	LEGO DUPLO Starter Brick Box 10913	Essential starter box for youngest builders.	251327560	5.00	4.00	100	duplo,starter,bricks,toddler	2024-07-05 18:34:24.88477	2026-05-13 15:51:27.435154	30000025	1	0-2	unisex	abs_plastic	motor	LEGO DUPLO	CE, EN71, TCVN 6238	20	\N
30000026	LEGO Boy's Classic Bricks Set 10403	Fun classic bricks set for boys.	912740617	5.00	4.00	100	classic,boys,bricks,building	2024-07-05 18:34:24.88477	2026-05-13 15:51:27.435154	30000026	1	3-5	boy	abs_plastic	motor	LEGO Classic	CE, EN71, TCVN 6238	20	\N
30000027	LEGO Girl's Friends Starter Pack 41682	Colorful friends starter pack for girls.	912740617	5.00	4.00	100	friends,girls,starter,fun	2024-07-05 18:34:24.88477	2026-05-13 15:51:27.435154	30000027	1	3-5	girl	abs_plastic	social	LEGO Friends	CE, EN71, TCVN 6238	20	\N
30000028	LEGO Kindergarten Big Bricks Box 10958	Large soft bricks perfect for kindergarten age.	583086156	5.00	4.00	100	kindergarten,big bricks,safe,learning	2024-07-05 18:34:24.88477	2026-05-13 15:51:27.435154	30000028	1	0-2	unisex	abs_plastic	motor	LEGO DUPLO	CE, EN71, TCVN 6238	20	\N
\.


--
-- TOC entry 5515 (class 0 OID 41668)
-- Dependencies: 261
-- Data for Name: productsizes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productsizes (sizeid, productid, sizename, instock) FROM stdin;
10000001	34000034	50 pcs	t
10000002	34000034	100 pcs	t
10000003	34000034	250 pcs	t
10000004	34000034	500 pcs	t
10000005	34100034	50 pcs	t
10000006	34100034	100 pcs	t
10000007	34100034	250 pcs	t
10000008	34100034	500 pcs	t
10000009	34200034	50 pcs	t
10000010	34200034	100 pcs	t
10000011	34200034	250 pcs	t
10000012	34200034	500 pcs	t
10000013	34300034	50 pcs	t
10000014	34300034	100 pcs	t
10000015	34300034	250 pcs	t
10000016	34300034	500 pcs	t
10000017	34400034	Ages 4+	t
10000018	34400034	Ages 6+	t
10000019	34400034	Ages 8+	t
10000020	34400034	Ages 12+	t
10000021	34500034	Standard	t
10000022	34600034	Standard	t
10000023	34700034	Ages 4+	t
10000024	34700034	Ages 6+	t
10000025	34700034	Ages 8+	t
10000026	34700034	Ages 12+	t
10000027	34800034	50 pcs	t
10000028	34800034	100 pcs	t
10000029	34800034	250 pcs	t
10000030	34800034	500 pcs	t
10000031	34900034	Ages 4+	t
10000032	34900034	Ages 6+	t
10000033	34900034	Ages 8+	t
10000034	34900034	Ages 12+	t
10000035	35000034	Ages 4+	t
10000036	35000034	Ages 6+	t
10000037	35000034	Ages 8+	t
10000038	35000034	Ages 12+	t
10000039	35100034	50 pcs	t
10000040	35100034	100 pcs	t
10000041	35100034	250 pcs	t
10000042	35100034	500 pcs	t
20000001	20000001	50 pcs	t
20000002	20000002	100 pcs	t
20000003	20000003	250 pcs	t
20000004	20000004	500 pcs	t
20000005	20000005	1000 pcs	t
20000006	20000006	100 pcs	t
20000007	20000007	250 pcs	t
20000008	20000008	500 pcs	t
20000009	20000009	Ages 12+	t
20000010	20000010	Ages 8+	t
20000011	20000011	Ages 6+	t
20000012	20000012	Ages 4+	t
20000013	20000013	Ages 12+	t
20000014	20000014	Ages 8+	t
20000015	20000015	Ages 6+	t
20000016	20000016	Ages 4+	t
20000017	20000017	Standard	t
20000018	20000018	Standard	t
20000019	20000019	Standard	t
20000020	20000020	Standard	t
20000021	20000021	Ages 3+	t
20000022	20000022	Ages 4+	t
20000023	20000023	Standard	t
20000024	20000024	Standard	t
30000025	30000025	50 pcs	t
30000026	30000026	100 pcs	t
30000027	30000027	250 pcs	t
30000028	30000028	500 pcs	t
\.


--
-- TOC entry 5517 (class 0 OID 41675)
-- Dependencies: 263
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotions (id, code, type, discount, expiration_date, is_active, created_at, event_name, applicable_age_group, season, min_child_age, max_child_age) FROM stdin;
1	LEGO10	percentage	10.00	2026-12-31 23:59:59	t	2026-05-12 16:01:57.981929	\N	\N	\N	\N	\N
2	LEGO20	percentage	20.00	2026-08-31 23:59:59	f	2026-05-12 16:01:57.981929	\N	\N	\N	\N	\N
3	SUMMER25	percentage	25.00	2026-09-01 23:59:59	t	2026-05-12 16:01:57.981929	Khuyến mãi hè 2026	\N	summer	\N	\N
4	FIXSHIP	fixed	50000.00	2026-12-31 23:59:59	t	2026-05-12 16:01:57.981929	Miễn phí vận chuyển	\N	\N	\N	\N
5	TECHNIC15	percentage	15.00	2026-07-31 23:59:59	t	2026-05-12 16:01:57.981929	Khuyến mãi LEGO Technic	9-12	summer	9	12
6	STARWARS30	percentage	30.00	2026-05-04 23:59:59	t	2026-05-12 16:01:57.981929	Star Wars Day 4/5	12+	\N	12	99
7	DUPLO5	percentage	5.00	2026-06-30 23:59:59	t	2026-05-12 16:01:57.981929	Ưu đãi bé nhỏ DUPLO	0-2	spring	0	2
8	NEWUSER	fixed	30000.00	2026-12-31 23:59:59	t	2026-05-12 16:01:57.981929	Ưu đãi khách hàng mới	\N	\N	\N	\N
9	FLASH50	percentage	50.00	2026-05-15 23:59:59	f	2026-05-12 16:01:57.981929	Flash Sale	\N	\N	\N	\N
10	CITY10	percentage	10.00	2026-10-31 23:59:59	t	2026-05-12 16:01:57.981929	Tháng của LEGO City	6-8	autumn	6	8
11	KIDS_DAY_10	percent	10.00	2026-06-13 00:00:00	t	2026-05-14 09:17:32.592532	Quốc tế Thiếu nhi	\N	Summer	\N	\N
12	MID_AUTUMN_15	percent	15.00	2026-06-13 00:00:00	t	2026-05-14 09:17:32.592532	Trung thu	\N	Autumn	\N	\N
13	NOEL_20	percent	20.00	2026-06-13 00:00:00	t	2026-05-14 09:17:32.592532	Noel	\N	Winter	\N	\N
14	BIRTHDAY_10	percent	10.00	2026-06-13 00:00:00	t	2026-05-14 09:17:32.592532	Sinh nhật	\N	All	\N	\N
\.


--
-- TOC entry 5519 (class 0 OID 41685)
-- Dependencies: 265
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returns (return_id, orderid, productid, userid, quantity, reason, description, status, refund_amount, handled_by, created_at, updated_at) FROM stdin;
1	16176577	20000020	666574596	1	not_as_described	Sản phẩm nhỏ hơn mô tả trên web, bé không thích lắp	approved	24.00	1111111	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154
2	16176577	20000020	666574596	1	defective	Hộp bị móp, một số mảnh ghép bị cong không lắp vừa	refunded	24.00	1111111	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154
3	16176577	20000011	666574596	1	wrong_item	Nhận được màu xanh nhưng đặt màu đỏ	approved	42.00	1111111	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154
4	16176577	20000007	666574596	1	child_disliked	Bé chơi một lần rồi không thích nữa, còn nguyên hộp	rejected	\N	1111111	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154
5	16176577	20000004	666574596	2	defective	Một số mảnh nhựa bị nứt, không an toàn cho trẻ nhỏ	refunded	68.00	1111111	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154
\.


--
-- TOC entry 5521 (class 0 OID 41701)
-- Dependencies: 267
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (reviewid, userid, productid, rating, comment, createdat, updatedat, title, status, durability_rating, safety_rating, child_enjoyment_rating, age_at_review, enjoyment_rating) FROM stdin;
1	666574596	20000011	5	Mảnh to, bé không nuốt được. Màu sắc đẹp, bé kéo tàu khắp nhà cả ngày.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Tàu DUPLO hoàn hảo cho bé 2 tuổi	approved	5	5	5	2 tuổi	\N
2	708932322	20000023	4	Bé thích các con thú, lắp ráp đơn giản. Hơi ít mảnh so với giá.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Bộ DUPLO nông trại ngộ nghĩnh	approved	4	5	4	2 tuổi	\N
3	454918396	30000025	5	Mua cho bé 18 tháng, chơi được ngay. An toàn, màu sắc chuẩn.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Starter Box lý tưởng cho bé mới chơi LEGO	approved	5	5	5	1.5 tuổi	\N
4	666574596	34700034	4	Bé thích nhất con máy kéo và trâu. Chất liệu tốt, không phai màu.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Bộ nông trại DUPLO đầy đủ	approved	5	5	4	3 tuổi	\N
5	708932322	20000001	5	Phù hợp bé 4-5 tuổi. Nhiều mảnh đa dạng, bé tự sáng tạo rất thú vị.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Bộ Classic Rainbow màu sắc rực rỡ	approved	4	5	5	4 tuổi	\N
6	454918396	20000002	5	Con gái tôi lắp suốt buổi chiều, không chịu ăn cơm. Màu pastel rất đẹp.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	LEGO Friends bé gái mê ngay	approved	4	5	5	7 tuổi	\N
7	666574596	30000027	4	Mua cho bé gái 5 tuổi. Đơn giản, bé tự lắp được. Giao hàng nhanh.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Starter pack Friends xinh xắn	approved	4	5	4	5 tuổi	\N
8	708932322	20000009	4	Bé trai 6 tuổi rất thích đóng vai cảnh sát. Lắp nhanh, chắc chắn.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Xe cảnh sát City thú vị	approved	5	4	5	6 tuổi	\N
9	454918396	20000014	5	Bộ lớn, nhiều chi tiết, bé chơi 3 tiếng mới xong. Đội cứu hỏa đầy đủ.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Trạm cứu hỏa City đáng mua	approved	5	5	5	7 tuổi	\N
10	666574596	20000016	4	Bé trai mê xe đua, lắp trong 45 phút. Kết quả đẹp, chạy mượt trên sàn.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Xe đua City tốc độ	approved	4	4	5	6 tuổi	\N
11	666574596	20000003	5	Lắp khó nhưng thành phẩm siêu đẹp. Bánh xe xoay được, cửa mở được.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Race Car Technic đỉnh cao kỹ thuật	approved	5	4	4	10 tuổi	\N
12	708932322	20000006	4	Cánh tay cẩu kéo được đồ vật, bé cực kỳ thích. Lắp cần bố hỗ trợ.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Cần cẩu Technic hoạt động thật sự	approved	5	4	5	11 tuổi	\N
13	454918396	20000010	5	Từng bộ phận của động cơ đều lắp ráp được. Người mê cơ khí sẽ thích.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Mô tô Technic quá chi tiết	approved	5	4	4	12 tuổi	\N
14	666574596	20000015	3	Hướng dẫn nhiều bước, bé 9 tuổi cần bố giúp. Nhưng kết quả ấn tượng.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Bulldozer Technic khó lắp hơn tưởng	approved	5	4	3	9 tuổi	\N
15	708932322	20000007	5	Bé trai mê Star Wars, cứ ôm cái này cả ngày. Cánh gấp được, rất hay.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	X-Wing huyền thoại!	approved	5	5	5	9 tuổi	\N
16	454918396	20000012	4	Bé lớp 5 lắp trong 2 tiếng. Kết quả rất đẹp, trưng bày luôn trên kệ.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	TIE Fighter đẹp, lắp vừa tầm	approved	5	4	5	10 tuổi	\N
17	666574596	20000018	5	To hơn tưởng! Bé trai mê robot nên thích ngay. Nhiều chi tiết chuyển động.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Mech Titan Ninjago cực ngầu	approved	4	5	5	9 tuổi	\N
18	708932322	20000019	5	Bé gái thích nhất phần phòng ngủ công chúa. Màu sắc tươi, nhiều nhân vật.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Lâu đài Cinderella cho bé gái	approved	4	5	5	7 tuổi	\N
19	454918396	20000024	4	Nhiều chi tiết nhỏ rất trung thành với bản gốc. Con Mia là fan HP ngay lập tức.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Diagon Alley đẹp hơn phim	approved	5	4	5	12 tuổi	\N
20	666574596	20000020	5	Người lớn cũng mê. Đặt trưng bày trên kệ sách rất sang. Tặng sinh nhật là chuẩn.	2026-05-13 15:51:27.435154	2026-05-13 15:51:27.435154	Tháp Eiffel thu nhỏ tuyệt đẹp	approved	5	5	4	14 tuổi	\N
\.


--
-- TOC entry 5523 (class 0 OID 41735)
-- Dependencies: 269
-- Data for Name: savedpaymentcards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.savedpaymentcards (cardid, userid, cardnumber, cardholdername, expirymonth, expiryyear, cardtype, createdat, updatedat) FROM stdin;
\.


--
-- TOC entry 5525 (class 0 OID 41747)
-- Dependencies: 271
-- Data for Name: sellers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sellers (seller_id, name, email, password, phone_number, company_name, tax_id, registration_number, store_url, business_description, profile_image_url, join_date, rating, addressline1, addressline2, city, state, country, postalcode) FROM stdin;
1	John Doe	johndoe@example.com	password123	1234567890	Doe Electronics	TX12345678	REG123456	http://doeelectronics.example.com	Leading supplier of electronic gadgets.	http://doeelectronics.example.com/profile.jpg	2023-01-15	4.50	123 Main St	Suite 100	New York	NY	USA	10001
2	Jane Smith	janesmith@example.com	password456	0987654321	Smith Fashion	TX87654321	REG654321	http://smithfashion.example.com	High-quality fashion apparel and accessories.	http://smithfashion.example.com/profile.jpg	2022-03-10	4.80	456 Market St		San Francisco	CA	USA	94105
3	Alice Johnson	alicejohnson@example.com	password789	5555555555	Johnson Home Goods	TX11223344	REG112233	http://johnsonhomegoods.example.com	Home goods and furniture.	http://johnsonhomegoods.example.com/profile.jpg	2021-07-22	4.30	789 Broadway	Apt 5	Los Angeles	CA	USA	90001
\.


--
-- TOC entry 5526 (class 0 OID 41753)
-- Dependencies: 272
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value) FROM stdin;
site_name	"LEGO Shop Vietnam"
site_description	"Cửa hàng LEGO chính hãng tại Việt Nam - Khám phá thế giới sáng tạo không giới hạn"
contact_email	"support@legoshop.vn"
contact_phone	"1800-LEGO-VN"
address	"Tầng 5, Tòa nhà Vincom, 191 Bà Triệu, Hà Nội"
currency	"VND"
tax_rate	10
free_shipping_min	500000
max_cart_items	50
order_prefix	"LEGO-"
maintenance_mode	false
allow_reviews	true
social_facebook	"https://facebook.com/legoshopvn"
social_instagram	"https://instagram.com/legoshopvn"
social_youtube	"https://youtube.com/@legoshopvn"
logo_url	"/images/logo.png"
favicon_url	"/images/favicon.ico"
\.


--
-- TOC entry 5527 (class 0 OID 41760)
-- Dependencies: 273
-- Data for Name: shipping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping (shippingid, orderid, addressid, shippingmethod, shippingcost, trackingnumber, shippedat, deliveredat, createdat, updatedat, shipped_at, delivered_at) FROM stdin;
42228873	16176577	49256814	Express	5.00	IN16176577-86243815-TS-52566197-86243815-16176577	\N	2024-07-22 16:48:18	2024-07-17 16:48:18.809074	2024-07-17 16:48:18.809074	\N	\N
\.


--
-- TOC entry 5529 (class 0 OID 41767)
-- Dependencies: 275
-- Data for Name: shipping_zones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_zones (id, zone_name, delivery_time, shipping_cost, status, created_at) FROM stdin;
1	Nội thành Hà Nội	1-2 ngày	25000.00	t	2026-05-12 16:01:57.981929
2	Nội thành TP.HCM	1-2 ngày	25000.00	t	2026-05-12 16:01:57.981929
3	Các tỉnh miền Bắc	3-5 ngày	35000.00	t	2026-05-12 16:01:57.981929
4	Các tỉnh miền Trung	3-5 ngày	40000.00	t	2026-05-12 16:01:57.981929
5	Các tỉnh miền Nam	3-5 ngày	35000.00	t	2026-05-12 16:01:57.981929
6	Tây Nguyên	4-6 ngày	45000.00	t	2026-05-12 16:01:57.981929
7	Hải đảo & vùng xa	7-10 ngày	70000.00	t	2026-05-12 16:01:57.981929
8	Giao hàng hỏa tốc HN	2-4 giờ	60000.00	t	2026-05-12 16:01:57.981929
9	Giao hàng hỏa tốc HCM	2-4 giờ	60000.00	t	2026-05-12 16:01:57.981929
10	Quốc tế (khu vực ASEAN)	7-14 ngày	250000.00	f	2026-05-12 16:01:57.981929
\.


--
-- TOC entry 5542 (class 0 OID 42162)
-- Dependencies: 288
-- Data for Name: staff_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_notes (note_id, staff_id, customer_id, note, created_at) FROM stdin;
\.


--
-- TOC entry 5548 (class 0 OID 42226)
-- Dependencies: 294
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (supplier_id, supplier_name, contact_name, phone, email, address, created_at) FROM stdin;
\.


--
-- TOC entry 5531 (class 0 OID 41777)
-- Dependencies: 277
-- Data for Name: usercoupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usercoupons (usercouponid, userid, couponid, usedat, createdat, updatedat) FROM stdin;
1	666574596	1	2024-07-01 00:00:00	2024-06-21 13:45:05.864108	2024-06-21 13:45:05.864108
2	666574596	2	2024-12-15 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
3	666574596	3	2025-03-10 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
4	666574596	4	2024-11-29 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
5	666574596	5	2024-12-02 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
6	666574596	6	2025-01-01 00:00:00	2024-06-21 13:46:37.489218	2024-06-21 13:46:37.489218
\.


--
-- TOC entry 5533 (class 0 OID 41786)
-- Dependencies: 279
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (userid, username, email, password, mobile_number, dob, creation_ip, role, createdat, updatedat, update_ip, otp, promotional) FROM stdin;
666574596	Demo Account	demo@demo.com	$2b$10$fWjFMIahgNNVoTX3hzAplOKtQw3.rt3H1v1awmuSDGf1QPr30qrbu	5345244353	2024-07-16	::1/128	customer	2024-06-19 14:12:00.773511	2024-07-16 02:12:55.209845	::1	\N	t
1111111	Admin	admin@gmail.com	$2b$10$Ix0CfiJIktXgA0D9xtgUwu5TKVkyuRgeRkq7lUd7ZMdVJLbnXvRgG	1234567891	2005-11-01	::1/128	admin	2026-05-06 09:36:18.530821	2026-05-06 21:23:52.382753	::1	\N	t
708932322	Vuuu	vu@gmail.com	$2b$10$Ix0CfiJIktXgA0D9xtgUwu5TKVkyuRgeRkq7lUd7ZMdVJLbnXvRgG	0123456789	2005-09-14	::1/128	customer	2026-05-06 09:36:18.530821	2026-05-12 15:20:38.46575	::1	\N	f
454918396	coong	cong@gmail.com	$2b$10$H7SZTVF44tlg1QeksKUnh.RBCYyS1xivDXjIiiZbA9yeMn469EpBm	1111111111	2026-05-05	::1/128	sales_staff	2026-05-12 15:45:45.599814	2026-05-14 15:27:59.612471	::1	\N	f
\.


--
-- TOC entry 5535 (class 0 OID 41803)
-- Dependencies: 281
-- Data for Name: wishlistitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlistitems (wishlistitemid, userid, productid, addedat) FROM stdin;
18501881	666574596	30000026	2024-07-10 20:14:58.572349
86818397	1111111	30000026	2026-05-13 23:35:23.188133
\.


--
-- TOC entry 5616 (class 0 OID 0)
-- Dependencies: 220
-- Name: addresses_addressid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.addresses_addressid_seq', 1, true);


--
-- TOC entry 5617 (class 0 OID 0)
-- Dependencies: 222
-- Name: articles_article_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.articles_article_id_seq', 1, false);


--
-- TOC entry 5618 (class 0 OID 0)
-- Dependencies: 224
-- Name: banners_bannerid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.banners_bannerid_seq', 1, false);


--
-- TOC entry 5619 (class 0 OID 0)
-- Dependencies: 283
-- Name: brands_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brands_brand_id_seq', 5, true);


--
-- TOC entry 5620 (class 0 OID 0)
-- Dependencies: 226
-- Name: cartitems_cartitemid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cartitems_cartitemid_seq', 1, false);


--
-- TOC entry 5621 (class 0 OID 0)
-- Dependencies: 228
-- Name: categories_categoryid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_categoryid_seq', 1, true);


--
-- TOC entry 5622 (class 0 OID 0)
-- Dependencies: 285
-- Name: child_profiles_child_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_profiles_child_id_seq', 4, true);


--
-- TOC entry 5623 (class 0 OID 0)
-- Dependencies: 231
-- Name: collections_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.collections_collection_id_seq', 5, true);


--
-- TOC entry 5624 (class 0 OID 0)
-- Dependencies: 233
-- Name: contact_queries_queryid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contact_queries_queryid_seq', 1, false);


--
-- TOC entry 5625 (class 0 OID 0)
-- Dependencies: 235
-- Name: content_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.content_items_id_seq', 10, true);


--
-- TOC entry 5626 (class 0 OID 0)
-- Dependencies: 237
-- Name: coupons_couponid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coupons_couponid_seq', 1, false);


--
-- TOC entry 5627 (class 0 OID 0)
-- Dependencies: 239
-- Name: deals_dealid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deals_dealid_seq', 2, true);


--
-- TOC entry 5628 (class 0 OID 0)
-- Dependencies: 241
-- Name: gift_message_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gift_message_templates_template_id_seq', 5, true);


--
-- TOC entry 5629 (class 0 OID 0)
-- Dependencies: 243
-- Name: giftcards_cardid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.giftcards_cardid_seq', 1, false);


--
-- TOC entry 5630 (class 0 OID 0)
-- Dependencies: 245
-- Name: inventory_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_logs_log_id_seq', 66, true);


--
-- TOC entry 5631 (class 0 OID 0)
-- Dependencies: 291
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_transactions_transaction_id_seq', 1, false);


--
-- TOC entry 5632 (class 0 OID 0)
-- Dependencies: 248
-- Name: orders_orderid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_orderid_seq', 1, false);


--
-- TOC entry 5633 (class 0 OID 0)
-- Dependencies: 250
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 8, true);


--
-- TOC entry 5634 (class 0 OID 0)
-- Dependencies: 252
-- Name: payments_paymentid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_paymentid_seq', 1, false);


--
-- TOC entry 5635 (class 0 OID 0)
-- Dependencies: 289
-- Name: product_batches_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_batches_batch_id_seq', 1, false);


--
-- TOC entry 5636 (class 0 OID 0)
-- Dependencies: 254
-- Name: productcolors_colorid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productcolors_colorid_seq', 1, false);


--
-- TOC entry 5637 (class 0 OID 0)
-- Dependencies: 256
-- Name: productimages_imageid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productimages_imageid_seq', 1, false);


--
-- TOC entry 5638 (class 0 OID 0)
-- Dependencies: 258
-- Name: productparams_productid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productparams_productid_seq', 1, false);


--
-- TOC entry 5639 (class 0 OID 0)
-- Dependencies: 260
-- Name: products_productid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_productid_seq', 1, true);


--
-- TOC entry 5640 (class 0 OID 0)
-- Dependencies: 262
-- Name: productsizes_sizeid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productsizes_sizeid_seq', 1, false);


--
-- TOC entry 5641 (class 0 OID 0)
-- Dependencies: 264
-- Name: promotions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promotions_id_seq', 14, true);


--
-- TOC entry 5642 (class 0 OID 0)
-- Dependencies: 266
-- Name: returns_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returns_return_id_seq', 5, true);


--
-- TOC entry 5643 (class 0 OID 0)
-- Dependencies: 268
-- Name: reviews_reviewid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_reviewid_seq', 20, true);


--
-- TOC entry 5644 (class 0 OID 0)
-- Dependencies: 270
-- Name: savedpaymentcards_cardid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.savedpaymentcards_cardid_seq', 1, false);


--
-- TOC entry 5645 (class 0 OID 0)
-- Dependencies: 274
-- Name: shipping_shippingid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipping_shippingid_seq', 1, false);


--
-- TOC entry 5646 (class 0 OID 0)
-- Dependencies: 276
-- Name: shipping_zones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipping_zones_id_seq', 10, true);


--
-- TOC entry 5647 (class 0 OID 0)
-- Dependencies: 287
-- Name: staff_notes_note_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_notes_note_id_seq', 1, false);


--
-- TOC entry 5648 (class 0 OID 0)
-- Dependencies: 293
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_supplier_id_seq', 1, false);


--
-- TOC entry 5649 (class 0 OID 0)
-- Dependencies: 278
-- Name: usercoupons_usercouponid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usercoupons_usercouponid_seq', 1, false);


--
-- TOC entry 5650 (class 0 OID 0)
-- Dependencies: 280
-- Name: users_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_userid_seq', 1, false);


--
-- TOC entry 5651 (class 0 OID 0)
-- Dependencies: 282
-- Name: wishlistitems_wishlistitemid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wishlistitems_wishlistitemid_seq', 1, false);


--
-- TOC entry 5161 (class 2606 OID 41846)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (addressid);


--
-- TOC entry 5163 (class 2606 OID 41848)
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (article_id);


--
-- TOC entry 5165 (class 2606 OID 41850)
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (bannerid);


--
-- TOC entry 5259 (class 2606 OID 42139)
-- Name: brands brands_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_key UNIQUE (name);


--
-- TOC entry 5261 (class 2606 OID 42137)
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (brand_id);


--
-- TOC entry 5263 (class 2606 OID 42141)
-- Name: brands brands_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_slug_key UNIQUE (slug);


--
-- TOC entry 5167 (class 2606 OID 41856)
-- Name: cartitems cartitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitems
    ADD CONSTRAINT cartitems_pkey PRIMARY KEY (cartitemid);


--
-- TOC entry 5169 (class 2606 OID 41858)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (categoryid);


--
-- TOC entry 5171 (class 2606 OID 41860)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 5265 (class 2606 OID 42154)
-- Name: child_profiles child_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profiles
    ADD CONSTRAINT child_profiles_pkey PRIMARY KEY (child_id);


--
-- TOC entry 5173 (class 2606 OID 41864)
-- Name: collection_products collection_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_pkey PRIMARY KEY (collection_id, productid);


--
-- TOC entry 5175 (class 2606 OID 41866)
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (collection_id);


--
-- TOC entry 5177 (class 2606 OID 41868)
-- Name: collections collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_slug_key UNIQUE (slug);


--
-- TOC entry 5179 (class 2606 OID 41870)
-- Name: contact_queries contact_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_queries
    ADD CONSTRAINT contact_queries_pkey PRIMARY KEY (queryid);


--
-- TOC entry 5181 (class 2606 OID 41872)
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5183 (class 2606 OID 41874)
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- TOC entry 5185 (class 2606 OID 41876)
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (couponid);


--
-- TOC entry 5187 (class 2606 OID 41878)
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (dealid);


--
-- TOC entry 5189 (class 2606 OID 41880)
-- Name: gift_message_templates gift_message_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_message_templates
    ADD CONSTRAINT gift_message_templates_pkey PRIMARY KEY (template_id);


--
-- TOC entry 5191 (class 2606 OID 41882)
-- Name: giftcards giftcards_cardcode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_cardcode_key UNIQUE (cardcode);


--
-- TOC entry 5193 (class 2606 OID 41884)
-- Name: giftcards giftcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_pkey PRIMARY KEY (cardid);


--
-- TOC entry 5198 (class 2606 OID 41886)
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 5278 (class 2606 OID 42214)
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 5200 (class 2606 OID 41888)
-- Name: orderitems orderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_pkey PRIMARY KEY (orderitemid);


--
-- TOC entry 5203 (class 2606 OID 41890)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (orderid);


--
-- TOC entry 5205 (class 2606 OID 41892)
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 5207 (class 2606 OID 41894)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (paymentid);


--
-- TOC entry 5271 (class 2606 OID 42196)
-- Name: product_batches product_batches_batch_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_batch_number_key UNIQUE (batch_number);


--
-- TOC entry 5273 (class 2606 OID 42194)
-- Name: product_batches product_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_pkey PRIMARY KEY (batch_id);


--
-- TOC entry 5209 (class 2606 OID 41900)
-- Name: productcolors productcolors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcolors
    ADD CONSTRAINT productcolors_pkey PRIMARY KEY (colorid);


--
-- TOC entry 5211 (class 2606 OID 41902)
-- Name: productimages productimages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages
    ADD CONSTRAINT productimages_pkey PRIMARY KEY (imageid);


--
-- TOC entry 5213 (class 2606 OID 41904)
-- Name: productparams productparams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productparams
    ADD CONSTRAINT productparams_pkey PRIMARY KEY (productid);


--
-- TOC entry 5221 (class 2606 OID 41906)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (productid);


--
-- TOC entry 5223 (class 2606 OID 41908)
-- Name: productsizes productsizes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsizes
    ADD CONSTRAINT productsizes_pkey PRIMARY KEY (sizeid);


--
-- TOC entry 5226 (class 2606 OID 41910)
-- Name: promotions promotions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_code_key UNIQUE (code);


--
-- TOC entry 5228 (class 2606 OID 41912)
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- TOC entry 5233 (class 2606 OID 41914)
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (return_id);


--
-- TOC entry 5235 (class 2606 OID 41916)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (reviewid);


--
-- TOC entry 5237 (class 2606 OID 41924)
-- Name: savedpaymentcards savedpaymentcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savedpaymentcards
    ADD CONSTRAINT savedpaymentcards_pkey PRIMARY KEY (cardid);


--
-- TOC entry 5239 (class 2606 OID 41926)
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (seller_id);


--
-- TOC entry 5241 (class 2606 OID 41928)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- TOC entry 5243 (class 2606 OID 41930)
-- Name: shipping shipping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT shipping_pkey PRIMARY KEY (shippingid);


--
-- TOC entry 5245 (class 2606 OID 41932)
-- Name: shipping_zones shipping_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_zones
    ADD CONSTRAINT shipping_zones_pkey PRIMARY KEY (id);


--
-- TOC entry 5268 (class 2606 OID 42172)
-- Name: staff_notes staff_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_notes
    ADD CONSTRAINT staff_notes_pkey PRIMARY KEY (note_id);


--
-- TOC entry 5280 (class 2606 OID 42236)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_id);


--
-- TOC entry 5247 (class 2606 OID 41934)
-- Name: usercoupons usercoupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usercoupons
    ADD CONSTRAINT usercoupons_pkey PRIMARY KEY (usercouponid);


--
-- TOC entry 5250 (class 2606 OID 41936)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5252 (class 2606 OID 41938)
-- Name: users users_mobile_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_mobile_number_key UNIQUE (mobile_number);


--
-- TOC entry 5254 (class 2606 OID 41940)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 5257 (class 2606 OID 41942)
-- Name: wishlistitems wishlistitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlistitems
    ADD CONSTRAINT wishlistitems_pkey PRIMARY KEY (wishlistitemid);


--
-- TOC entry 5266 (class 1259 OID 42254)
-- Name: idx_child_profiles_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_child_profiles_user ON public.child_profiles USING btree (user_id);


--
-- TOC entry 5194 (class 1259 OID 42250)
-- Name: idx_inventory_logs_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_logs_product ON public.inventory_logs USING btree (productid);


--
-- TOC entry 5195 (class 1259 OID 42245)
-- Name: idx_inventory_logs_product_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_logs_product_created ON public.inventory_logs USING btree (productid, created_at DESC);


--
-- TOC entry 5196 (class 1259 OID 41944)
-- Name: idx_inventory_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_product ON public.inventory_logs USING btree (productid);


--
-- TOC entry 5275 (class 1259 OID 42251)
-- Name: idx_inventory_transactions_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_transactions_product ON public.inventory_transactions USING btree (product_id);


--
-- TOC entry 5276 (class 1259 OID 42244)
-- Name: idx_inventory_transactions_product_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_transactions_product_created ON public.inventory_transactions USING btree (product_id, created_at DESC);


--
-- TOC entry 5201 (class 1259 OID 42246)
-- Name: idx_orders_fulfillment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_fulfillment_status ON public.orders USING btree (orderstatus, order_status, delivery_status, createdat DESC);


--
-- TOC entry 5269 (class 1259 OID 42249)
-- Name: idx_product_batches_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_batches_product ON public.product_batches USING btree (product_id);


--
-- TOC entry 5214 (class 1259 OID 41945)
-- Name: idx_products_age_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_age_group ON public.products USING btree (age_group);


--
-- TOC entry 5215 (class 1259 OID 41946)
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_brand ON public.products USING btree (brand);


--
-- TOC entry 5216 (class 1259 OID 41947)
-- Name: idx_products_gender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_gender ON public.products USING btree (gender);


--
-- TOC entry 5217 (class 1259 OID 42243)
-- Name: idx_products_low_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_low_stock ON public.products USING btree (stock, low_stock_threshold);


--
-- TOC entry 5218 (class 1259 OID 41948)
-- Name: idx_products_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_material ON public.products USING btree (material);


--
-- TOC entry 5219 (class 1259 OID 41949)
-- Name: idx_products_skill_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_skill_type ON public.products USING btree (skill_type);


--
-- TOC entry 5224 (class 1259 OID 42255)
-- Name: idx_promotions_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promotions_event ON public.promotions USING btree (event_name, season, is_active);


--
-- TOC entry 5229 (class 1259 OID 41950)
-- Name: idx_returns_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_order ON public.returns USING btree (orderid);


--
-- TOC entry 5230 (class 1259 OID 42252)
-- Name: idx_returns_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_status ON public.returns USING btree (status);


--
-- TOC entry 5231 (class 1259 OID 42247)
-- Name: idx_returns_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_status_created ON public.returns USING btree (status, created_at DESC);


--
-- TOC entry 5248 (class 1259 OID 42248)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 5255 (class 1259 OID 42253)
-- Name: idx_wishlistitems_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wishlistitems_user ON public.wishlistitems USING btree (userid);


--
-- TOC entry 5274 (class 1259 OID 42242)
-- Name: ux_product_batches_product_batch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_product_batches_product_batch ON public.product_batches USING btree (product_id, batch_number);


--
-- TOC entry 5319 (class 2620 OID 41951)
-- Name: inventory_logs trg_sync_stock_after; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_stock_after BEFORE INSERT ON public.inventory_logs FOR EACH ROW EXECUTE FUNCTION public.sync_stock_after();


--
-- TOC entry 5315 (class 2620 OID 41952)
-- Name: addresses update_address_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_address_updatedat_trigger BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5317 (class 2620 OID 41953)
-- Name: cartitems update_cartitem_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_cartitem_updatedat_trigger BEFORE UPDATE ON public.cartitems FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5318 (class 2620 OID 41954)
-- Name: giftcards update_giftcard_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_giftcard_updatedat_trigger BEFORE UPDATE ON public.giftcards FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5320 (class 2620 OID 41955)
-- Name: orders update_order_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_order_updatedat_trigger BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5321 (class 2620 OID 41956)
-- Name: payments update_payment_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_payment_updatedat_trigger BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5322 (class 2620 OID 41957)
-- Name: products update_product_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_product_updatedat_trigger BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5323 (class 2620 OID 41958)
-- Name: reviews update_review_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_review_updatedat_trigger BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5324 (class 2620 OID 41959)
-- Name: shipping update_shipping_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_shipping_updatedat_trigger BEFORE UPDATE ON public.shipping FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5316 (class 2620 OID 41960)
-- Name: banners update_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_updatedat_trigger BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5325 (class 2620 OID 41961)
-- Name: users update_updatedat_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_updatedat_trigger BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5281 (class 2606 OID 41962)
-- Name: addresses addresses_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5282 (class 2606 OID 41977)
-- Name: cartitems cartitems_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitems
    ADD CONSTRAINT cartitems_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5283 (class 2606 OID 41982)
-- Name: cartitems cartitems_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitems
    ADD CONSTRAINT cartitems_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5309 (class 2606 OID 42155)
-- Name: child_profiles child_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profiles
    ADD CONSTRAINT child_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5284 (class 2606 OID 41992)
-- Name: collection_products collection_products_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(collection_id) ON DELETE CASCADE;


--
-- TOC entry 5285 (class 2606 OID 41997)
-- Name: collection_products collection_products_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5286 (class 2606 OID 42002)
-- Name: inventory_logs inventory_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(userid);


--
-- TOC entry 5287 (class 2606 OID 42007)
-- Name: inventory_logs inventory_logs_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5313 (class 2606 OID 42220)
-- Name: inventory_transactions inventory_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(userid) ON DELETE SET NULL;


--
-- TOC entry 5314 (class 2606 OID 42215)
-- Name: inventory_transactions inventory_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5288 (class 2606 OID 42012)
-- Name: orderitems orderitems_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid);


--
-- TOC entry 5289 (class 2606 OID 42017)
-- Name: orderitems orderitems_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid);


--
-- TOC entry 5290 (class 2606 OID 42022)
-- Name: orders orders_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5291 (class 2606 OID 42027)
-- Name: payments payments_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid) ON DELETE CASCADE;


--
-- TOC entry 5312 (class 2606 OID 42197)
-- Name: product_batches product_batches_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5292 (class 2606 OID 42032)
-- Name: productcolors productcolors_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcolors
    ADD CONSTRAINT productcolors_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5293 (class 2606 OID 42037)
-- Name: productimages productimages_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages
    ADD CONSTRAINT productimages_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5294 (class 2606 OID 42237)
-- Name: products products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id);


--
-- TOC entry 5295 (class 2606 OID 42042)
-- Name: productsizes productsizes_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsizes
    ADD CONSTRAINT productsizes_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5296 (class 2606 OID 42047)
-- Name: returns returns_handled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.users(userid);


--
-- TOC entry 5297 (class 2606 OID 42052)
-- Name: returns returns_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid);


--
-- TOC entry 5298 (class 2606 OID 42057)
-- Name: returns returns_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid);


--
-- TOC entry 5299 (class 2606 OID 42062)
-- Name: returns returns_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5300 (class 2606 OID 42067)
-- Name: reviews reviews_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5301 (class 2606 OID 42072)
-- Name: reviews reviews_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5302 (class 2606 OID 42087)
-- Name: savedpaymentcards savedpaymentcards_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savedpaymentcards
    ADD CONSTRAINT savedpaymentcards_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5303 (class 2606 OID 42092)
-- Name: shipping shipping_addressid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT shipping_addressid_fkey FOREIGN KEY (addressid) REFERENCES public.addresses(addressid) ON DELETE CASCADE;


--
-- TOC entry 5304 (class 2606 OID 42097)
-- Name: shipping shipping_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT shipping_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid) ON DELETE CASCADE;


--
-- TOC entry 5310 (class 2606 OID 42178)
-- Name: staff_notes staff_notes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_notes
    ADD CONSTRAINT staff_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5311 (class 2606 OID 42173)
-- Name: staff_notes staff_notes_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_notes
    ADD CONSTRAINT staff_notes_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(userid) ON DELETE SET NULL;


--
-- TOC entry 5305 (class 2606 OID 42102)
-- Name: usercoupons usercoupons_couponid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usercoupons
    ADD CONSTRAINT usercoupons_couponid_fkey FOREIGN KEY (couponid) REFERENCES public.coupons(couponid);


--
-- TOC entry 5306 (class 2606 OID 42107)
-- Name: usercoupons usercoupons_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usercoupons
    ADD CONSTRAINT usercoupons_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5307 (class 2606 OID 42112)
-- Name: wishlistitems wishlistitems_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlistitems
    ADD CONSTRAINT wishlistitems_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE;


--
-- TOC entry 5308 (class 2606 OID 42117)
-- Name: wishlistitems wishlistitems_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlistitems
    ADD CONSTRAINT wishlistitems_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 5555 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-05-14 15:54:16

--
-- PostgreSQL database dump complete
--

\unrestrict 2wNlWEpnohP9FrHHRExDSHWnckhrU5ySV9K0qonBkHoTWBZKxcPhFiQy5NadoQG

