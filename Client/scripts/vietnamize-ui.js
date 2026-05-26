/*
  Chạy: cd Client && node scripts/vietnamize-ui.js
  Script này thay các chuỗi tiếng Anh phổ biến còn sót trong file .tsx/.ts.
  Nên commit code trước khi chạy để dễ so sánh thay đổi.
*/
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const targets = ['app', 'components'];
const dictionary = new Map([
  ['Home', 'Trang chủ'],
  ['Categories', 'Danh mục'],
  ['New arrival', 'Sản phẩm mới'],
  ['New Arrival', 'Sản phẩm mới'],
  ['Best sellers', 'Bán chạy'],
  ['Best Sellers', 'Bán chạy'],
  ['Sale', 'Khuyến mãi'],
  ['Blog', 'Bài viết'],
  ['Contact', 'Liên hệ'],
  ['About Us', 'Giới thiệu'],
  ['Our Services', 'Dịch vụ'],
  ['Products', 'Sản phẩm'],
  ['Product', 'Sản phẩm'],
  ['Checkout', 'Thanh toán'],
  ['Order summary', 'Tóm tắt đơn hàng'],
  ['PLACE ORDER', 'ĐẶT HÀNG'],
  ['Place Order', 'Đặt hàng'],
  ['View All Orders', 'Xem tất cả đơn hàng'],
  ['Go to Account Settings', 'Đi tới cài đặt tài khoản'],
  ['GET OUR UPDATES', 'NHẬN TIN MỚI'],
  ['FOLLOW US', 'THEO DÕI CHÚNG TÔI'],
  ['Dashboard', 'Bảng điều khiển'],
  ['Sales Management', 'Quản lý bán hàng'],
  ['Warehouse Management', 'Quản trị kho'],
  ['Orders', 'Đơn hàng'],
  ['Users', 'Người dùng'],
  ['Brands', 'Thương hiệu'],
  ['Collections', 'Bộ sưu tập'],
  ['Reviews', 'Đánh giá'],
  ['Shipping', 'Vận chuyển'],
  ['Payments', 'Thanh toán'],
  ['Content', 'Nội dung'],
  ['Reports', 'Báo cáo'],
  ['Settings', 'Cài đặt'],
  ['Order Fulfillment', 'Xử lý đơn hàng'],
  ['Pending', 'Chờ xử lý'],
  ['Confirmed', 'Đã xác nhận'],
  ['Packed', 'Đã đóng gói'],
  ['Shipped', 'Đang giao hàng'],
  ['Delivered', 'Đã giao hàng'],
  ['Cancelled', 'Đã hủy'],
]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts)$/.test(full)) files.push(full);
  }
  return files;
}

for (const base of targets) {
  for (const file of walk(path.join(root, base))) {
    let text = fs.readFileSync(file, 'utf8');
    let next = text;
    for (const [en, vi] of dictionary) {
      next = next.split(en).join(vi);
    }
    if (next !== text) {
      fs.writeFileSync(file, next);
      console.log('Đã Việt hóa:', path.relative(root, file));
    }
  }
}
