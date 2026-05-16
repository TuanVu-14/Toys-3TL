const navBtns = [
  { name: 'Home', isExtendable: false, extendables: [], catLink: '/' },
  { name: 'Categories', isExtendable: false, extendables: [], catLink: '/categories' },
  {
    name: 'Lego',
    isExtendable: true,
    extendables: [
      { title: 'LEGO lắp ráp', link: '/categories/lego-building' },
      { title: 'Đồ chơi xây dựng', link: '/categories/lego-building' },
      { title: 'Tư duy logic', link: '/categories/lego-building' },
    ],
    catLink: '/categories/lego-building',
  },
  { name: 'New arrival', isExtendable: false, extendables: [], catLink: '/categories/new-arrival' },
  { name: 'Best sellers', isExtendable: false, extendables: [], catLink: '/categories/best-sellers' },
  {
    name: 'Sale',
    isExtendable: true,
    extendables: [
      { title: 'Đang giảm giá', link: '/categories/sale' },
      { title: 'Khuyến mãi theo mùa', link: '/categories/sale' },
    ],
    catLink: '/categories/sale',
  },
  { name: 'Blog', isExtendable: false, extendables: [], catLink: '/blog' },
];

const categoryDropDown = [
  {
    title: 'LEGO & Building',
    catLink: '/categories/lego-building',
    imgLink: '/images/sale.jpg',
    imgAlt: 'LEGO & Building',
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
    title: 'STEM & Science',
    catLink: '/categories/stem-science',
    imgLink: '/images/sale2.jpg',
    imgAlt: 'STEM & Science',
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
    title: 'Remote Control',
    catLink: '/categories/remote-control',
    imgLink: '/images/sale3.jpg',
    imgAlt: 'Remote Control',
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
    title: 'Dolls & Figures',
    catLink: '/categories/dolls-figures',
    imgLink: '/images/sale4.png',
    imgAlt: 'Dolls & Figures',
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
    title: 'Board Games',
    catLink: '/categories/board-games',
    imgLink: '/images/sale.jpg',
    imgAlt: 'Board Games',
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
    title: 'Outdoor & Baby',
    catLink: '/categories/outdoor-toys',
    imgLink: '/images/sale2.jpg',
    imgAlt: 'Outdoor & Baby',
    imgRedirectLink: '/categories/outdoor-toys',
    subCategories: [
      { title: 'Outdoor Toys', link: '/categories/outdoor-toys' },
      { title: 'Baby Toys', link: '/categories/baby-toys' },
      { title: 'Vận động ngoài trời', link: '/categories/outdoor-toys' },
      { title: 'Đồ chơi 0-2 tuổi', link: '/categories/baby-toys' },
      { title: 'An toàn cho bé', link: '/categories/baby-toys' },
    ],
  },
  {
    title: 'Creative & Puzzle',
    catLink: '/categories/arts-crafts',
    imgLink: '/images/sale3.jpg',
    imgAlt: 'Creative & Puzzle',
    imgRedirectLink: '/categories/arts-crafts',
    subCategories: [
      { title: 'Arts & Crafts', link: '/categories/arts-crafts' },
      { title: 'Puzzles', link: '/categories/puzzles' },
      { title: 'Mỹ thuật', link: '/categories/arts-crafts' },
      { title: 'Sáng tạo thủ công', link: '/categories/arts-crafts' },
      { title: 'Rèn trí nhớ', link: '/categories/puzzles' },
    ],
  },
  {
    title: 'Musical Toys',
    catLink: '/categories/musical-toys',
    imgLink: '/images/sale4.png',
    imgAlt: 'Musical Toys',
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
  { imgLink: '/images/icon.png', title: 'LEGO & Building', links: [{ title: 'LEGO lắp ráp', link: '/categories/lego-building' }] },
  { imgLink: '/images/icon1.png', title: 'STEM & Science', links: [{ title: 'Đồ chơi STEM', link: '/categories/stem-science' }] },
  { imgLink: '/images/icon2.png', title: 'Remote Control', links: [{ title: 'Xe điều khiển', link: '/categories/remote-control' }] },
  { imgLink: '/images/icon3.jpg', title: 'Dolls & Figures', links: [{ title: 'Búp bê', link: '/categories/dolls-figures' }] },
  { imgLink: '/images/icon4.png', title: 'Board Games', links: [{ title: 'Cờ bàn', link: '/categories/board-games' }] },
  { imgLink: '/images/icon5.png', title: 'Outdoor Toys', links: [{ title: 'Vận động ngoài trời', link: '/categories/outdoor-toys' }] },
  { imgLink: '/images/icon6.png', title: 'Baby Toys', links: [{ title: 'Đồ chơi 0-2 tuổi', link: '/categories/baby-toys' }] },
  { imgLink: '/images/icon7.png', title: 'Arts & Crafts', links: [{ title: 'Mỹ thuật', link: '/categories/arts-crafts' }] },
  { imgLink: '/images/icon8.png', title: 'Puzzles', links: [{ title: 'Rèn trí nhớ', link: '/categories/puzzles' }] },
  { imgLink: '/images/icon9.png', title: 'Musical Toys', links: [{ title: 'Nhạc cụ trẻ em', link: '/categories/musical-toys' }] },
];

const footerSections = [
  {
    sectionName: 'Popular Categories',
    items: [
      { title: 'LEGO & Building', link: '/categories/lego-building' },
      { title: 'STEM & Science', link: '/categories/stem-science' },
      { title: 'Remote Control', link: '/categories/remote-control' },
      { title: 'Dolls & Figures', link: '/categories/dolls-figures' },
      { title: 'Board Games', link: '/categories/board-games' },
    ],
  },
  {
    sectionName: 'Products',
    items: [
      { title: 'Blog', link: '/blog' },
      { title: 'Contact Us', link: '/contact' },
      { title: 'Our Services', link: '/our-services' },
    ],
  },
  {
    sectionName: 'Our Company',
    items: [
      { title: 'About Us', link: '/about' },
      { title: 'Privacy Policy', link: '/policy/privacypolicy' },
      { title: 'Secure Payment', link: '/securepayment' },
      { title: 'Terms And Conditions', link: '/policy/terms&conditions' },
      { title: 'Refund & Cancellation', link: '/policy/refund&cancellation' },
    ],
  },
  {
    sectionName: 'Contact',
    items: [
      { title: 'Location: SN 26B, Đường Nguyễn Thái Học, phường Vĩnh Phúc, tỉnh Phú Thọ', link: '#' },
      { title: 'Phone: 0384361840', link: '#' },
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

const paymentSecure = [];
const aboutUS = { section1: [], section2: { title: '', imgLink: '', imgAlt: '', listPoints: [] }, section3: { title: '', description: [] } };
const loginFeatures = [];
const serviceFeatures = [];
const allCategories = [
  { name: 'LEGO & Building', link: '/categories/lego-building' },
  { name: 'STEM & Science', link: '/categories/stem-science' },
  { name: 'Remote Control', link: '/categories/remote-control' },
  { name: 'Dolls & Figures', link: '/categories/dolls-figures' },
  { name: 'Board Games', link: '/categories/board-games' },
  { name: 'Outdoor Toys', link: '/categories/outdoor-toys' },
  { name: 'Baby Toys', link: '/categories/baby-toys' },
  { name: 'Arts & Crafts', link: '/categories/arts-crafts' },
  { name: 'Puzzles', link: '/categories/puzzles' },
  { name: 'Musical Toys', link: '/categories/musical-toys' },
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
};
