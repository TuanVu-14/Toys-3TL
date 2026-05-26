type NavOption = { title: string; link: string };
type NavButton = {
  name: string;
  isExtendable: boolean;
  extendables: NavOption[];
  catLink: string;
};

const navBtns: NavButton[] = [
  { name: 'Trang chủ', isExtendable: false, extendables: [], catLink: '/' },
  { name: 'Danh mục', isExtendable: false, extendables: [], catLink: '/categories/lego-building' },
  { name: 'Lego', isExtendable: false, extendables: [], catLink: '/categories/lego-building' },
  { name: 'Sản phẩm mới', isExtendable: false, extendables: [], catLink: '/categories/new-arrival' },
  { name: 'Bán chạy', isExtendable: false, extendables: [], catLink: '/categories/best-sellers' },
  { name: 'Khuyến mãi', isExtendable: false, extendables: [], catLink: '/categories/sale' },
  { name: 'Bài viết', isExtendable: false, extendables: [], catLink: '/blog' },
];
const categoryDropDown = [
  {
    title: 'LEGO & Lắp ráp',
    catLink: '/categories/lego-building',
    imgLink: '/images/sale.jpg',
    imgAlt: 'LEGO & Lắp ráp',
    imgRedirectLink: '/categories/lego-building',
    subCategories: [
      { title: 'LEGO lắp ráp', link: '/categories/lego-building' },
      { title: 'Đồ chơi xây dựng', link: '/categories/lego-building' },
      { title: 'Tư duy logic', link: '/categories/lego-building' },
      { title: 'Sáng tạo', link: '/categories/lego-building' },
      { title: 'Unisex', link: '/categories/lego-building' },
    ],
  },
  {
    title: 'STEM & Khoa học',
    catLink: '/categories/stem-science',
    imgLink: '/images/sale2.jpg',
    imgAlt: 'STEM & Khoa học',
    imgRedirectLink: '/categories/stem-science',
    subCategories: [
      { title: 'Đồ chơi STEM', link: '/categories/stem-science' },
      { title: 'Khoa học', link: '/categories/stem-science' },
      { title: 'Robot mini', link: '/categories/stem-science' },
      { title: 'Học tập', link: '/categories/stem-science' },
      { title: 'Tư duy', link: '/categories/stem-science' },
    ],
  },
  {
    title: 'Điều khiển từ xa',
    catLink: '/categories/remote-control',
    imgLink: '/images/sale3.jpg',
    imgAlt: 'Điều khiển từ xa',
    imgRedirectLink: '/categories/remote-control',
    subCategories: [
      { title: 'Xe điều khiển', link: '/categories/remote-control' },
      { title: 'Xe mô hình', link: '/categories/remote-control' },
      { title: 'Đồ chơi điện tử', link: '/categories/remote-control' },
      { title: 'Điều khiển từ xa', link: '/categories/remote-control' },
      { title: 'Kỹ năng vận động', link: '/categories/remote-control' },
    ],
  },
  {
    title: 'Búp bê & Mô hình',
    catLink: '/categories/dolls-figures',
    imgLink: '/images/sale4.png',
    imgAlt: 'Búp bê & Mô hình',
    imgRedirectLink: '/categories/dolls-figures',
    subCategories: [
      { title: 'Búp bê', link: '/categories/dolls-figures' },
      { title: 'Mô hình nhân vật', link: '/categories/dolls-figures' },
      { title: 'Nhập vai', link: '/categories/dolls-figures' },
      { title: 'Cho bé gái', link: '/categories/dolls-figures' },
      { title: 'Phụ kiện', link: '/categories/dolls-figures' },
    ],
  },
  {
    title: 'Board game',
    catLink: '/categories/board-games',
    imgLink: '',
    imgAlt: 'Board game',
    imgRedirectLink: '/categories/board-games',
    subCategories: [
      { title: 'Đồ chơi gia đình', link: '/categories/board-games' },
      { title: 'Cờ bàn', link: '/categories/board-games' },
      { title: 'Thẻ bài', link: '/categories/board-games' },
      { title: 'Tương tác xã hội', link: '/categories/board-games' },
      { title: 'Giải trí nhóm', link: '/categories/board-games' },
    ],
  },
  {
    title: 'Ngoài trời & Em bé',
    catLink: '/categories/outdoor-toys',
    imgLink: '',
    imgAlt: 'Ngoài trời & Em bé',
    imgRedirectLink: '/categories/outdoor-toys',
    subCategories: [
      { title: 'Đồ chơi ngoài trời', link: '/categories/outdoor-toys' },
      { title: 'Đồ chơi em bé', link: '/categories/baby-toys' },
      { title: 'Vận động ngoài trời', link: '/categories/outdoor-toys' },
      { title: 'Đồ chơi 0-2 tuổi', link: '/categories/baby-toys' },
      { title: 'An toàn cho bé', link: '/categories/baby-toys' },
    ],
  },
  {
    title: 'Sáng tạo & Xếp hình',
    catLink: '/categories/arts-crafts',
    imgLink: '',
    imgAlt: 'Sáng tạo & Xếp hình',
    imgRedirectLink: '/categories/arts-crafts',
    subCategories: [
      { title: 'Mỹ thuật & Thủ công', link: '/categories/arts-crafts' },
      { title: 'Xếp hình', link: '/categories/puzzles' },
      { title: 'Mỹ thuật', link: '/categories/arts-crafts' },
      { title: 'Sáng tạo thủ công', link: '/categories/arts-crafts' },
      { title: 'Rèn trí nhớ', link: '/categories/puzzles' },
    ],
  },
  {
    title: 'Đồ chơi âm nhạc',
    catLink: '/categories/musical-toys',
    imgLink: '',
    imgAlt: 'Đồ chơi âm nhạc',
    imgRedirectLink: '/categories/musical-toys',
    subCategories: [
      { title: 'Đồ chơi âm nhạc', link: '/categories/musical-toys' },
      { title: 'Nhạc cụ trẻ em', link: '/categories/musical-toys' },
      { title: 'Ngôn ngữ', link: '/categories/musical-toys' },
      { title: 'Cảm thụ âm thanh', link: '/categories/musical-toys' },
      { title: 'Mầm non', link: '/categories/musical-toys' },
    ],
  },
];

const leftStatus = [
  { imgLink: '/images/icon.png', title: 'LEGO & Lắp ráp', links: [{ title: 'LEGO lắp ráp', link: '/categories/lego-building' }] },
  { imgLink: '/images/icon1.png', title: 'STEM & Khoa học', links: [{ title: 'Đồ chơi STEM', link: '/categories/stem-science' }] },
  { imgLink: '/images/icon2.png', title: 'Điều khiển từ xa', links: [{ title: 'Xe điều khiển', link: '/categories/remote-control' }] },
  { imgLink: '/images/icon3.jpg', title: 'Búp bê & Mô hình', links: [{ title: 'Búp bê', link: '/categories/dolls-figures' }] },
  { imgLink: '/images/icon4.png', title: 'Board game', links: [{ title: 'Cờ bàn', link: '/categories/board-games' }] },
  { imgLink: '/images/icon5.png', title: 'Đồ chơi ngoài trời', links: [{ title: 'Vận động ngoài trời', link: '/categories/outdoor-toys' }] },
  { imgLink: '/images/icon6.png', title: 'Đồ chơi em bé', links: [{ title: 'Đồ chơi 0-2 tuổi', link: '/categories/baby-toys' }] },
  { imgLink: '/images/icon7.png', title: 'Mỹ thuật & Thủ công', links: [{ title: 'Mỹ thuật', link: '/categories/arts-crafts' }] },
  { imgLink: '/images/icon8.png', title: 'Xếp hình', links: [{ title: 'Rèn trí nhớ', link: '/categories/puzzles' }] },
  { imgLink: '/images/icon9.png', title: 'Đồ chơi âm nhạc', links: [{ title: 'Nhạc cụ trẻ em', link: '/categories/musical-toys' }] },
];

const footerSections = [
  {
    sectionName: 'Danh mục phổ biến',
    items: [
      { title: 'LEGO & Lắp ráp', link: '/categories/lego-building' },
      { title: 'STEM & Khoa học', link: '/categories/stem-science' },
      { title: 'Điều khiển từ xa', link: '/categories/remote-control' },
      { title: 'Búp bê & Mô hình', link: '/categories/dolls-figures' },
      { title: 'Board game', link: '/categories/board-games' },
    ],
  },
  {
    sectionName: 'Sản phẩm',
    items: [
      { title: 'Blog', link: '/blog' },
      { title: 'Liên hệ', link: '/contact' },
      { title: 'Dịch vụ', link: '/our-services' },
    ],
  },
  {
    sectionName: 'Cửa hàng',
    items: [
      { title: 'Giới thiệu', link: '/about' },
      { title: 'Chính sách bảo mật', link: '/policy/privacypolicy' },
      { title: 'Thanh toán an toàn', link: '/securepayment' },
      { title: 'Điều khoản sử dụng', link: '/policy/terms&conditions' },
      { title: 'Đổi trả & Hủy đơn', link: '/policy/refund&cancellation' },
    ],
  },
  {
    sectionName: 'Liên hệ',
    items: [
      { title: 'Địa chỉ: SN 26B, Đường Nguyễn Thái Học, phường Vĩnh Phúc, tỉnh Phú Thọ', link: '#' },
      { title: 'Số điện thoại: 0384361840', link: '#' },
      { title: 'Email: uno22516@gmail.com', link: '#' },
    ],
  },
];

const featuresSec = [
  { title: 'Giao hàng toàn quốc', description: 'Miễn phí từ 500K', siteLink: '', icon: 'fa-solid fa-ship fa-2xl' },
  { title: 'Giao nhanh', description: 'Nội thành trong ngày', siteLink: '', icon: 'fa-solid fa-rocket fa-2xl' },
  { title: 'Hỗ trợ online', description: '8AM - 11PM', siteLink: '', icon: 'fa-solid fa-phone fa-2xl' },
  { title: 'Đổi trả dễ dàng', description: 'Theo chính sách cửa hàng', siteLink: '', icon: 'fa-solid fa-backward fa-2xl' },
  { title: 'Ưu đãi định kỳ', description: 'Khuyến mãi theo mùa', siteLink: '', icon: 'fa-solid fa-gift fa-2xl' },
];

const testimonial = {
  imgLink: 'https://codewithsadee.github.io/anon-ecommerce-website/assets/images/testimonial-1.jpg',
  name: '3TL Store',
  position: 'Toy Store',
  description: 'Đồ chơi an toàn, phù hợp độ tuổi và phát triển kỹ năng cho trẻ.',
};

type InfoFeature = {
  title: string;
  description: string;
  imgLink: string;
  imgAlt: string;
};

const paymentSecure: InfoFeature[] = [];
type AboutSection = InfoFeature;
type AboutPoint = { title: string; description: string };

const aboutUS: {
  section1: AboutSection[];
  section2: InfoFeature & { listPoints: AboutPoint[] };
  section3: { title: string; description: string[] };
} = {
  section1: [],
  section2: { title: '', description: '', imgLink: '', imgAlt: '', listPoints: [] },
  section3: { title: '', description: [] },
};
export type LoginFeature = {
  title: string;
  description: string;
  iconType: string;
};

const loginFeatures: LoginFeature[] = [
  {
    title: "Track Your Orders",
    description: "Keep tabs on your purchases with real-time order tracking and updates.",
    iconType: "search",
  },
  {
    title: "Personalized Recommendations",
    description: "Log in to receive product suggestions tailored to your shopping preferences.",
    iconType: "star",
  },
  {
    title: "Wishlist Management",
    description: "Save your favorite items to your wishlist for quick and easy future purchases.",
    iconType: "heart",
  },
  {
    title: "Secure Checkout",
    description: "Enjoy a fast, secure, and hassle-free checkout process every time you shop with us.",
    iconType: "lock",
  },
];
const serviceFeatures: InfoFeature[] = [];
const currentEvent = {};
const footerCategories = footerSections;
const allCategories = [
  { name: 'LEGO & Lắp ráp', link: '/categories/lego-building' },
  { name: 'STEM & Khoa học', link: '/categories/stem-science' },
  { name: 'Điều khiển từ xa', link: '/categories/remote-control' },
  { name: 'Búp bê & Mô hình', link: '/categories/dolls-figures' },
  { name: 'Board game', link: '/categories/board-games' },
  { name: 'Đồ chơi ngoài trời', link: '/categories/outdoor-toys' },
  { name: 'Đồ chơi em bé', link: '/categories/baby-toys' },
  { name: 'Mỹ thuật & Thủ công', link: '/categories/arts-crafts' },
  { name: 'Xếp hình', link: '/categories/puzzles' },
  { name: 'Đồ chơi âm nhạc', link: '/categories/musical-toys' },
];

export {
  allCategories,
  serviceFeatures,
  loginFeatures,
  navBtns,
  aboutUS,
  paymentSecure,
  leftStatus,
  categoryDropDown,
  footerSections,
  featuresSec,
  testimonial,
  currentEvent,
  footerCategories,
};
