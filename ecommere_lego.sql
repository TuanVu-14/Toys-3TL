-- ============================================================
--  BaseCore – SQL Server Script
--  Tương thích: SQL Server 2016+
--  Chạy lần lượt từng phần (hoặc toàn bộ)
-- ============================================================

USE master;
GO

-- Tạo database nếu chưa có
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BaseCoreDB')
BEGIN
    CREATE DATABASE BaseCoreDB;
END
GO

USE BaseCoreDB;
GO

-- ============================================================
-- 1. BẢNG Users
-- ============================================================
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        UserName    NVARCHAR(100)       NOT NULL UNIQUE,
        PasswordHash NVARCHAR(256)      NOT NULL,   -- BCrypt hash
        Name        NVARCHAR(200)       NOT NULL,
        Email       NVARCHAR(200)       NOT NULL,
        Phone       NVARCHAR(20)        NULL,
        UserType    INT                 NOT NULL DEFAULT 0, -- 0=Customer, 1=Admin
        IsActive    BIT                 NOT NULL DEFAULT 1,
        Image       NVARCHAR(500)       NULL,
        CreatedAt   DATETIME2           NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- ============================================================
-- 2. BẢNG Categories
-- ============================================================
IF OBJECT_ID('dbo.Categories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        Id          INT                 NOT NULL IDENTITY(1,1) PRIMARY KEY,
        Name        NVARCHAR(200)       NOT NULL,
        Description NVARCHAR(500)       NULL
    );
END
GO

-- ============================================================
-- 3. BẢNG Products
-- ============================================================
IF OBJECT_ID('dbo.Products', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        Id              INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
        Name            NVARCHAR(300)   NOT NULL,
        Price           DECIMAL(18,2)   NOT NULL,
        DiscountPercent DECIMAL(5,2)    NOT NULL DEFAULT 0,
        Stock           INT             NOT NULL DEFAULT 0,
        CategoryId      INT             NOT NULL,
        Description     NVARCHAR(MAX)   NULL,
        ImageUrl        NVARCHAR(500)   NULL,
        CreatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_Products_Category FOREIGN KEY (CategoryId)
            REFERENCES dbo.Categories(Id)
    );
END
GO

-- ============================================================
-- 4. BẢNG Orders
--    Status: 0=Pending | 1=Confirmed | 2=Paid | 3=Completed | 4=Cancelled
-- ============================================================
IF OBJECT_ID('dbo.Orders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        Id              INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
        UserId          UNIQUEIDENTIFIER NULL,           -- NULL = khách vãng lai
        RecipientName   NVARCHAR(200)   NOT NULL,
        RecipientPhone  NVARCHAR(20)    NULL,
        ShippingAddress NVARCHAR(500)   NULL,
        Note            NVARCHAR(500)   NULL,
        TotalAmount     DECIMAL(18,2)   NOT NULL,
        Status          INT             NOT NULL DEFAULT 0,
        -- 0 Pending / 1 Confirmed / 2 Paid / 3 Completed / 4 Cancelled
        CancelledBy     NVARCHAR(50)    NULL,   -- 'customer' | 'admin'
        CancelReason    NVARCHAR(300)   NULL,
        OrderDate       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_Orders_User FOREIGN KEY (UserId)
            REFERENCES dbo.Users(Id)
    );
END
GO

-- ============================================================
-- 5. BẢNG OrderDetails
-- ============================================================
IF OBJECT_ID('dbo.OrderDetails', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderDetails (
        Id          INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
        OrderId     INT             NOT NULL,
        ProductId   INT             NOT NULL,
        ProductName NVARCHAR(300)   NOT NULL,   -- snapshot tên tại thời điểm đặt
        ImageUrl    NVARCHAR(500)   NULL,        -- snapshot ảnh
        UnitPrice   DECIMAL(18,2)   NOT NULL,    -- giá sau giảm tại thời điểm đặt
        Quantity    INT             NOT NULL,

        CONSTRAINT FK_Details_Order   FOREIGN KEY (OrderId)   REFERENCES dbo.Orders(Id),
        CONSTRAINT FK_Details_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
    );
END
GO

-- ============================================================
-- 6. BẢNG Suppliers (đã có trong project)
-- ============================================================
IF OBJECT_ID('dbo.Suppliers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Suppliers (
        Id      INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
        Name    NVARCHAR(200)   NOT NULL,
        Email   NVARCHAR(200)   NULL,
        Phone   NVARCHAR(20)    NULL,
        Address NVARCHAR(500)   NULL
    );
END
GO

-- ============================================================
-- INDEX hỗ trợ tìm kiếm & phân trang
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Products_CategoryId')
    CREATE INDEX IX_Products_CategoryId ON dbo.Products(CategoryId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Products_Name')
    CREATE INDEX IX_Products_Name       ON dbo.Products(Name);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Orders_UserId')
    CREATE INDEX IX_Orders_UserId       ON dbo.Orders(UserId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Orders_Status')
    CREATE INDEX IX_Orders_Status       ON dbo.Orders(Status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_OrderDetails_OrderId')
    CREATE INDEX IX_OrderDetails_OrderId ON dbo.OrderDetails(OrderId);
GO

-- ============================================================
-- 7. STORED PROCEDURE: Tìm kiếm + Phân trang sản phẩm (backend)
--    Tham số:
--      @SearchType   : 'name' | 'category' | 'price'
--      @Keyword      : từ khóa (name / category)
--      @PriceMin     : giá tối thiểu (price mode)
--      @PriceMax     : giá tối đa   (price mode)
--      @CategoryId   : lọc category cụ thể (0 = tất cả)
--      @Page         : trang hiện tại (bắt đầu từ 1)
--      @PageSize     : số dòng mỗi trang
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_SearchProducts
    @SearchType  NVARCHAR(20)   = 'name',
    @Keyword     NVARCHAR(300)  = '',
    @PriceMin    DECIMAL(18,2)  = NULL,
    @PriceMax    DECIMAL(18,2)  = NULL,
    @CategoryId  INT            = 0,
    @Page        INT            = 1,
    @PageSize    INT            = 8
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;

    WITH Filtered AS (
        SELECT
            p.Id,
            p.Name,
            p.Price,
            p.DiscountPercent,
            p.Stock,
            p.CategoryId,
            p.Description,
            p.ImageUrl,
            c.Name AS CategoryName,
            -- Giá sau giảm
            ROUND(p.Price * (1.0 - p.DiscountPercent / 100.0), 0) AS SalePrice,
            COUNT(*) OVER() AS TotalCount
        FROM dbo.Products p
        JOIN dbo.Categories c ON c.Id = p.CategoryId
        WHERE
            -- Lọc theo danh mục (nếu có)
            (@CategoryId = 0 OR p.CategoryId = @CategoryId)
            AND
            -- Lọc theo loại tìm kiếm
            (
                (@SearchType = 'name'     AND (@Keyword = '' OR p.Name     LIKE N'%' + @Keyword + '%'))
             OR (@SearchType = 'category' AND (@Keyword = '' OR c.Name     LIKE N'%' + @Keyword + '%'))
             OR (@SearchType = 'price'    AND (
                    (@PriceMin IS NULL OR ROUND(p.Price * (1.0 - p.DiscountPercent/100.0),0) >= @PriceMin)
                    AND
                    (@PriceMax IS NULL OR ROUND(p.Price * (1.0 - p.DiscountPercent/100.0),0) <= @PriceMax)
                ))
            )
    )
    SELECT *
    FROM   Filtered
    ORDER  BY Id
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- ============================================================
-- 8. SEED DATA – Users (password hash tương đương '123456')
--    Ghi chú: Trong môi trường thực, hash được tạo bởi BCrypt
--    ở tầng C# Application, KHÔNG lưu plain text.
--    Ở đây dùng placeholder; thay bằng hash thật khi deploy.
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserName = 'admin')
BEGIN
    INSERT INTO dbo.Users (Id, UserName, PasswordHash, Name, Email, Phone, UserType, IsActive)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin',
        '$2a$11$PLACEHOLDER_ADMIN_HASH',   -- thay bằng BCrypt hash của '123456'
        N'Quản trị viên',
        'admin@phoneshop.vn',
        '0901000001',
        1, 1
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserName = 'user')
BEGIN
    INSERT INTO dbo.Users (Id, UserName, PasswordHash, Name, Email, Phone, UserType, IsActive)
    VALUES (
        '00000000-0000-0000-0000-000000000002',
        'user',
        '$2a$11$PLACEHOLDER_USER_HASH',    -- thay bằng BCrypt hash của '123456'
        N'Nguyễn Văn A',
        'user@phoneshop.vn',
        '0901000002',
        0, 1
    );
END
GO

-- ============================================================
-- 9. SEED DATA – Categories
-- ============================================================
SET IDENTITY_INSERT dbo.Categories ON;
IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Id = 1)
    INSERT INTO dbo.Categories (Id, Name, Description)
    VALUES
    (1, N'Cáp sạc',         N'Cáp sạc điện thoại các loại'),
    (2, N'Ốp lưng',         N'Ốp lưng thời trang và chống sốc'),
    (3, N'Kính cường lực',  N'Kính cường lực bảo vệ màn hình'),
    (4, N'Sạc dự phòng',    N'Pin sạc dự phòng chính hãng'),
    (5, N'Tai nghe',        N'Tai nghe có dây, không dây và gaming');
SET IDENTITY_INSERT dbo.Categories OFF;
GO

-- ============================================================
-- 10. SEED DATA – Products (37 sản phẩm từ mockDB)
-- ============================================================
SET IDENTITY_INSERT dbo.Products ON;

IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Id = 1)
INSERT INTO dbo.Products (Id, Name, Price, DiscountPercent, Stock, CategoryId, Description, ImageUrl) VALUES
(1,  N'Cáp sạc tiêu chuẩn',                50000,  0,  100, 1, N'Cáp sạc độ bền cao, dòng điện ổn định.',                                                              '/images/products/capsac.jpg'),
(2,  N'Cáp sạc nhanh 20W',                120000, 10,   50, 1, N'Hỗ trợ sạc nhanh chuẩn PD 20W.',                                                                      '/images/products/capsacnhanh.jpg'),
(3,  N'Kính cường lực chống nhìn trộm',    80000,  5,  200, 3, N'Kính cường lực full viền, chống nhìn trộm hiệu quả.',                                                  '/images/products/kinhcuongluc.jpg'),
(4,  N'Kính cường lực chống vân tay',      90000,  0,  150, 3, N'Phủ nano chống bám vân tay cực mượt.',                                                                  '/images/products/kinhcuongluc2.jpg'),
(5,  N'Ốp lưng trong suốt',               40000,  0,  300, 2, N'Ốp lưng silicon dẻo trong suốt, không ố vàng.',                                                        '/images/products/oplung.jpg'),
(6,  N'Ốp lưng chống sốc',                95000, 15,   80, 2, N'Ốp lưng viền TPU chống sốc chuẩn quân đội.',                                                           '/images/products/oplung2.jpg'),
(7,  N'Sạc dự phòng 10000mAh',           350000, 10,   40, 4, N'Pin sạc dự phòng dung lượng thực 10000mAh, nhỏ gọn.',                                                  '/images/products/sacduphong.jpg'),
(8,  N'Cáp sạc Type-C to Lightning 1m',  145000, 10,   60, 1, N'Tương thích iPhone/iPad, hỗ trợ sạc nhanh PD 20W, dây bọc nylon chống rối bền chắc.',                  'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=400'),
(9,  N'Cáp Micro USB 2m dây dù',          65000,  0,  120, 1, N'Dây dù siêu bền, dài 2m tiện dụng, tốc độ truyền dữ liệu USB 2.0 480Mbps.',                           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
(10, N'Cáp 3-in-1 đa năng',              189000, 15,   45, 1, N'Một cáp tích hợp đầu Lightning, Micro USB và Type-C, sạc đồng thời nhiều thiết bị.',                   'https://images.unsplash.com/photo-1609692814858-f7cd2f0afa4f?w=400'),
(11, N'Cáp sạc từ tính 360° Type-C',     210000, 10,   35, 1, N'Đầu nối từ tính xoay 360°, cắm nhanh không cần nhìn, hỗ trợ sạc nhanh 5A.',                            'https://images.unsplash.com/photo-1601972599748-39c0d7e98cad?w=400'),
(12, N'Cáp USB-C 100W sạc laptop',       280000,  5,   30, 1, N'Hỗ trợ PD 100W sạc laptop MacBook, Dell, HP. Truyền dữ liệu USB 3.1 tốc độ 10Gbps.',                  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400'),
(13, N'Cáp sạc MagSafe tương thích',     320000,  0,   25, 1, N'Cáp sạc không dây chuẩn MagSafe tương thích iPhone 12 trở lên, sạc tối đa 15W.',                       'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1d?w=400'),
(14, N'Ốp lưng da PU cao cấp',           180000, 10,   70, 2, N'Da PU vân gỗ sang trọng, có ngăn đựng thẻ tích hợp, bảo vệ 4 góc chống va đập.',                      'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400'),
(15, N'Ốp lưng carbon fiber siêu mỏng',  250000,  0,   40, 2, N'Chất liệu carbon fiber thực, siêu nhẹ chỉ 15g, độ dày 0.8mm không làm dày máy.',                       'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400'),
(16, N'Ốp lưng nước lỏng hình động',      75000,  5,  200, 2, N'Bên trong chứa chất lỏng màu có hình động độc đáo, silicon dẻo chống sốc tốt.',                         'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=400'),
(17, N'Ốp lưng đứng tự đứng kiêm ví',   195000, 15,   55, 2, N'Có chân đỡ dựng ngang xem video, ngăn đựng 3 thẻ và tiền mặt, chất liệu PU bền đẹp.',                  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400'),
(18, N'Ốp lưng kính cường lực sau',      120000,  0,   90, 2, N'Mặt lưng kính cường lực 9H chống xước, viền TPU hấp thụ va đập, trong suốt sang trọng.',                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'),
(19, N'Ốp lưng chống nước IP68',         350000, 10,   20, 2, N'Chống nước chuẩn IP68, ngâm nước sâu 2m trong 30 phút, chống sốc từ độ cao 2m.',                       'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400'),
(20, N'Kính cường lực full màn hình',     70000,  0,  300, 3, N'Phủ kín toàn bộ màn hình, keo tự dàn đều 100%, không bong bóng, độ cứng 9H.',                           'https://images.unsplash.com/photo-1592286927505-1def25115558?w=400'),
(21, N'Kính cường lực lọc ánh sáng xanh',110000, 10, 150, 3, N'Lọc 99% tia UV và ánh sáng xanh từ màn hình, bảo vệ mắt khi dùng điện thoại ban đêm.',                  'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400'),
(22, N'Kính cường lực nhám chống lóa',    95000,  5,  120, 3, N'Bề mặt nhám mờ chống phản chiếu ánh sáng, cảm giác viết như giấy cho Apple Pencil.',                   'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400'),
(23, N'Kính cường lực bảo vệ camera sau', 55000,  0,  400, 3, N'Bảo vệ cụm camera sau khỏi trầy xước, độ cứng 9H, không làm ảnh hưởng chất lượng ảnh.',               'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400'),
(24, N'Kính cường lực 3D full viền đen',  130000, 10,  80, 3, N'Uốn cong 3D ôm sát cạnh màn hình, viền đen sang trọng, chống vỡ khi rơi từ 1.5m.',                     'https://images.unsplash.com/photo-1558618048-fbd3e1b5f410?w=400'),
(25, N'Kính cường lực Privacy chống nhìn trộm 2 chiều', 150000, 5, 60, 3, N'Chống nhìn trộm 2 chiều, màn hình chỉ nhìn rõ khi đứng trực diện, lọc tia UV hiệu quả.', 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400'),
(26, N'Sạc dự phòng siêu mỏng 5000mAh',  220000,  0,  50, 4, N'Mỏng chỉ 7mm bỏ túi thoải mái, sạc 1 lần đầy điện thoại, cổng USB-A + Type-C.',                       'https://images.unsplash.com/photo-1609592424952-d66b85ee6c8d?w=400'),
(27, N'Sạc dự phòng 20000mAh sạc nhanh 65W', 650000, 15, 25, 4, N'Dung lượng khủng 20000mAh, sạc nhanh 65W sạc được laptop, 3 cổng ra dùng đồng thời.',               'https://images.unsplash.com/photo-1609592424952-d66b85ee6c8d?w=400'),
(28, N'Sạc dự phòng không dây MagSafe 10000mAh', 450000, 10, 30, 4, N'Sạc không dây 15W chuẩn MagSafe, gắn vào lưng iPhone tiện lợi, đồng thời sạc qua cáp.',         'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'),
(29, N'Sạc dự phòng năng lượng mặt trời 15000mAh', 380000, 5, 20, 4, N'Tấm pin mặt trời gập 3 sạc khi ngoài trời, dung lượng 15000mAh, chống nước IPX4.',              'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400'),
(30, N'Sạc dự phòng mini tích hợp cáp 8000mAh', 280000, 0, 70, 4, N'Tích hợp cáp Type-C + Lightning thu gọn, dung lượng 8000mAh, không cần mang thêm cáp.',           'https://images.unsplash.com/photo-1617360028485-5aba7e4ec0fc?w=400'),
(31, N'Sạc dự phòng màn hình LED 30000mAh', 520000, 10, 15, 4, N'Màn hình LED hiển thị % pin chính xác, dung lượng 30000mAh cho chuyến du lịch dài ngày.',              'https://images.unsplash.com/photo-1619697945627-3c91ad5a04c3?w=400'),
(32, N'Tai nghe Bluetooth 5.3 ANC chống ồn', 890000, 15, 20, 5, N'Chống ồn chủ động ANC 40dB, pin 30h, kết nối đa điểm 2 thiết bị cùng lúc, âm thanh Hi-Fi.',         'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
(33, N'Tai nghe TWS True Wireless chống nước IPX5', 420000, 10, 45, 5, N'Chống nước IPX5, pin tai 6h + hộp sạc 18h, trễ âm thanh thấp 60ms cho game và video.',        'https://images.unsplash.com/photo-1572636583073-f3ecaadf5a57?w=400'),
(34, N'Tai nghe có dây Type-C Hi-Res Audio', 195000, 0, 80, 5, N'Chuẩn Hi-Res Audio, jack Type-C tương thích Android, dây dù 1.2m không rối, driver 10mm.',             'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400'),
(35, N'Tai nghe gaming RGB 7.1 Surround có mic', 650000, 5, 30, 5, N'Đệm tai nhớ bông siêu êm, mic khử ồn 270°, đèn RGB 16 triệu màu, âm thanh 7.1 surround.',         'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'),
(36, N'Tai nghe in-ear có dây jack 3.5mm', 85000, 0, 200, 5, N'Driver 10mm cho bass sâu, tích hợp mic đàm thoại, nút điều khiển âm lượng trên dây.',                   'https://images.unsplash.com/photo-1491927570842-0261e477d937?w=400'),
(37, N'Tai nghe dẫn âm qua xương bone conduction', 750000, 10, 15, 5, N'Dẫn âm qua xương gò má, không che tai vẫn nghe được xung quanh, lý tưởng khi tập thể thao.',   'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400');

SET IDENTITY_INSERT dbo.Products OFF;
GO

-- ============================================================
-- 11. VIEW: Chi tiết đơn hàng kèm thông tin sản phẩm
-- ============================================================
CREATE OR ALTER VIEW dbo.vw_OrderDetails AS
    SELECT
        od.Id,
        od.OrderId,
        od.ProductId,
        od.ProductName,
        od.ImageUrl,
        od.UnitPrice,
        od.Quantity,
        od.UnitPrice * od.Quantity AS LineTotal
    FROM dbo.OrderDetails od;
GO

-- ============================================================
-- 12. VIEW: Danh sách đơn hàng + thông tin khách hàng
-- ============================================================
CREATE OR ALTER VIEW dbo.vw_Orders AS
    SELECT
        o.Id,
        o.UserId,
        u.Name       AS CustomerName,
        u.Email      AS CustomerEmail,
        o.RecipientName,
        o.RecipientPhone,
        o.ShippingAddress,
        o.Note,
        o.TotalAmount,
        o.Status,
        CASE o.Status
            WHEN 0 THEN N'Chờ xử lý'
            WHEN 1 THEN N'Đã xác nhận'
            WHEN 2 THEN N'Đã thanh toán'
            WHEN 3 THEN N'Hoàn tất'
            WHEN 4 THEN N'Đã hủy'
        END AS StatusName,
        o.CancelledBy,
        o.CancelReason,
        o.OrderDate,
        o.UpdatedAt
    FROM dbo.Orders o
    LEFT JOIN dbo.Users u ON u.Id = o.UserId;
GO

PRINT '✅  BaseCoreDB setup hoàn tất!';
GO