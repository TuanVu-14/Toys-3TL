import { title } from "process";

const navBtns = [
    {name:"Home",isExtendable:false,extendables:[],catLink:'/'},
    {name:"Categories",isExtendable:false,extendables:[],catLink:'/categories'},
    {name:"Lego",isExtendable:true,extendables:[
        {
          title: "Boy's LEGO",
          link: "/sub-category/building-blocks/boy's-lego",
        },
        {
          title: "Girl's LEGO",
          link: "/sub-category/building-blocks/girl's-lego",
        },
        {
          title: "Kindergarten's LEGO",
          link: "/sub-category/building-blocks/kindergarten's-lego",
        },
        {
          title: "Adult LEGO",
          link: "/sub-category/building-blocks/adult-lego",
        },
      ],catLink:'/categories/building-blocks'},
    {name:"New arrival",isExtendable:false,extendables:[],catLink:'/categories/new-arrival'},
    {name:"Best sellers",isExtendable:false,extendables:[],catLink:'/categories/best-sellers'},
    {name:"Sale",isExtendable:true,extendables:[
          {
            title: "Up To 50% Off",
            link: "/sub-category/sale/50%-sale",
          },
          {
            title: "Long-term Offer",
            link: "/sub-category/sale/long-term-offer",
          },
    ],catLink:'/categories/sale'},
    {name:"Blog",isExtendable:false,extendables:[],catLink:'/blog'}
];
const leftStatus = [
    {
        imgLink:"/images/icon.png",
        title:"Building Block",
        links:[
            {
                title:"Boy's LEGO",
                link:"/sub-category/clothes/shirt",
            },
            {
                title:"Girl's LEGO",
                link:"/sub-category/clothes/shorts-&-jeans",
            },
            {
                title:"Kindergarten's LEGO",
                link:"/sub-category/clothes/jacket",
            },
            {
                title:"Adult's LEGO",
                link:"/sub-category/clothes/dress-&-frock",
            },
            {
                title:"Puzzle",
                link:"/sub-category/clothes/dress-&-frock",
            }
        ]
    },
    {
        imgLink:"/images/icon1.png",
        title:"Baby Supplies",
        links:[
            {
                title:"Baby Toys",
                link:"/sub-category/footwear/sport",
            }
        ]
    },
    {
        imgLink:"/images/icon2.png",
        title:"Vehicles",
        links:[
            {
                title:"Remote Controll Car",
                link:"/sub-category/jewellery/earrings",
            },
            {
                title:"Model Car",
                link:"/sub-category/jewellery/couple-rings",
            },
            {
                title:"Assembled Vehicles",
                link:"/sub-category/jewellery/necklace",
            },
            {
                title:"Playset & Accessory",
                link:"/sub-category/jewellery/necklace",
            },
            {
                title:"Others",
                link:"/sub-category/jewellery/necklace",
            }
        ]
    },
    {
        imgLink:"/images/icon3.jpg",
        title:"Ride-on Toys",
        links:[
            {
                title:"Electric Ride-on Car",
                link:"/sub-category/perfume/clothes-perfume",
            },
            {
                title:"Foot-to-Floor Ride-on",
                link:"/sub-category/perfume/deodorant",
            },
            {
                title:"Kids Electric Motorbike",
                link:"/sub-category/perfume/air-freshener",
            },
            {
                title:"Ride-on Construction Vehicle",
                link:"/sub-category/perfume/air-freshener",
            },
            {
                title:"Scooter",
                link:"/sub-category/perfume/air-freshener",
            },
        ]
    },
    {
        imgLink:"/images/icon4.png",
        title:"Movie-themed Toys",
        links:[
            {
                title:"Superhero",
                link:"/sub-category/cosmetics/shampoo",
            },
            {
                title:"Anime",
                link:"/sub-category/cosmetics/sunscreen",
            },
            {
                title:"Spinning",
                link:"/sub-category/cosmetics/bodywash",
            },
            {
                title:"Robot Superhero",
                link:"/sub-category/cosmetics/makeup-kit",
            },
            {
                title:"Others",
                link:"/sub-category/cosmetics/makeup-kit",
            }
        ]
    },
    {
        imgLink:"/images/icon5.png",
        title:"School Supplies",
        links:[
            {
                title:"School Backpack",
                link:"/sub-category/men/sunglasses",
            },
            {
                title:"Preschool Backpack",
                link:"/sub-category/men/casual",
            },
            {
                title:"Pencil Box",
                link:"/sub-category/men/casual",
            },
            {
                title:"Stationery",
                link:"/sub-category/men/casual",
            }
        ]
    },
    {
        imgLink:"/images/icon6.png",
        title:"Animal World",
        links:[
            {
                title:"Dinosaur",
                link:"/sub-category/women/bags",
            },
            {
                title:"Wildlife",
                link:"/sub-category/women/bags",
            },
            {
                title:"Dragon",
                link:"/sub-category/women/bags",
            },
            {
                title:"Farm Animals",
                link:"/sub-category/men/wallet",
            },
            {
                title:"Marine Animals",
                link:"/sub-category/men/wallet",
            }
        ]
    },
    {
        imgLink:"/images/icon7.png",
        title:"Creative Toys",
        links:[
            {
                title:"STEAM Science Toys",
                link:"/sub-category/women/bags",
            },
            {
                title:"Modeling Clay",
                link:"/sub-category/women/bags",
            },
            {
                title:"Dynamic Sand",
                link:"/sub-category/women/bags",
            },
            {
                title:"DIY",
                link:"/sub-category/men/wallet",
            },
            {
                title:"Slime",
                link:"/sub-category/men/wallet",
            }
        ]
    },
    {
        imgLink:"/images/icon8.png",
        title:"Doll",
        links:[
            {
                title:"Collectible Dolls",
                link:"/sub-category/women/bags",
            },
            {
                title:"Fashion Dolls",
                link:"/sub-category/women/bags",
            },
            {
                title:"Occupational Dolls",
                link:"/sub-category/women/bags",
            },
            {
                title:"Baby Dolls",
                link:"/sub-category/men/wallet",
            },
            {
                title:"Playset & Acessories",
                link:"/sub-category/men/wallet",
            }
        ]
    },
    {
        imgLink:"/images/icon9.png",
        title:"Simulation Toys",
        links:[
            {
                title:"Supermarket Toys",
                link:"/sub-category/women/bags",
            },
            {
                title:"Kitchen Toys",
                link:"/sub-category/women/bags",
            },
            {
                title:"Others",
                link:"/sub-category/women/bags",
            }
        ]
    },
    {
        imgLink:"/images/icon10.jpg",
        title:"Robot",
        links:[
            {
                title:"Remote-controlled Robot",
                link:"/sub-category/women/bags",
            },
            {
                title:"Autonomous Robot",
                link:"/sub-category/women/bags",
            }
        ]
    },
    {
        imgLink:"/images/icon11.png",
        title:"Flying Toys",
        links:[
            {
                title:"Drone",
                link:"/sub-category/women/bags",
            },
            {
                title:"Aircraft Launch Platform",
                link:"/sub-category/women/bags",
            }
        ]
    },
    {
        imgLink:"/images/icon12.png",
        title:"Motor Skills Toys",
        links:[
            {
                title:"Indoor Toys",
                link:"/sub-category/women/bags",
            },
            {
                title:"Water Spray Toys",
                link:"/sub-category/women/bags",
            },
            {
                title:"Swimming Float",
                link:"/sub-category/women/bags",
            }
        ]
    },
    {
        imgLink:"/images/icon13.png",
        title:"Fashion Items",
        links:[
            {
                title:"Fashionable Shoulder Bag",
                link:"/sub-category/women/bags",
            },
            {
                title:"Clock",
                link:"/sub-category/women/bags",
            },
            {
                title:"Glasses",
                link:"/sub-category/women/bags",
            },
            {
                title:"Paint",
                link:"/sub-category/women/bags",
            },
            {
                title:"Camera",
                link:"/sub-category/women/bags",
            },
            {
                title:"Fashion Design",
                link:"/sub-category/women/bags",
            },
            {
                title:"Makeup & Beauty",
                link:"/sub-category/women/bags",
            },
            {
                title:"Fashion Accessories",
                link:"/sub-category/women/bags",
            },
        ]
    },
    {
        imgLink:"/images/icon14.png",
        title:"Game",
        links:[
            {
                title:"Board Game",
                link:"/sub-category/women/bags",
            },
            {
                title:"Magic Toys",
                link:"/sub-category/women/bags",
            },
            {
                title:"Others",
                link:"/sub-category/women/bags",
            }
        ]
    },
    {
        imgLink:"/images/icon15.png",
        title:"Character Model",
        links:[
            {
                title:"Blindbox",
                link:"/sub-category/women/bags",
            },
            {
                title:"Card",
                link:"/sub-category/women/bags",
            },
            {
                title:"Figuring",
                link:"/sub-category/women/bags",
            }
        ]
    },
    {
        imgLink:"/images/icon16.png",
        title:"Plush Toys",
        links:[
            {
                title:"Interactive Plush Toys",
                link:"/sub-category/women/bags",
            },
            {
                title:"Stuffed Animals",
                link:"/sub-category/women/bags",
            }
        ]
    }
]

const footerSections = [
    {
        sectionName: "Popular Categories",
        items: [
            {
                title: "LEGO",
                link: "/categories/fashion"
            },
            {
                title: "Model Car",
                link: "/categories/electronics"
            },
            {
                title: "Doll",
                link: "/categories/cosmetics"
            },
            {
                title: "Robot",
                link: "/categories/footwear"
            },
            {
                title: "Game",
                link: "/categories/perfume"
            }
        ]
    },
    {
        sectionName: "Products",
        items: [
            {
                title: "Blog",
                link: "/blog"
            },
            {
                title: "Contact Us",
                link: "/contact"
            },
            {
                title: "Our Services",
                link: "/our-services"
            }
        ]
    },
    {
        sectionName: "Our Company",
        items: [
            {
                title: "About Us",
                link: "/about"
            },
            {
                title: "Privacy Policy",
                link: "/policy/privacypolicy"
            },
            {
                title: "Secure Payment",
                link: "/securepayment"
            },
            {
                title: "Terms And Conditions",
                link: "/policy/terms&conditions"
            },
            {
                title: "Refund & Cancellation",
                link: "/policy/refund&cancellation"
            }
        ]
    },
    {
        sectionName: 'Contact',
        items: [
            {title:'Location: SN 26B, Đường Nguyễn Thái Học, phường Vĩnh Phúc, tỉnh Phú Thọ',link:"#"},
            {title:'Phone: 0384361840',link:"#"},
            {title:'Email: uno22516@gmail.com',link:"#"}
        ]
    }
];
const featuresSec = [
    {
        title: "Worldwide Delivery",
        description: "For Order Over $100",
        siteLink:"",
        icon:'fa-solid fa-ship fa-2xl',
    },
    {
        title: "Next Day Delivery",
        description: "Tier-1 City Orders Only",
        siteLink:"",
        icon:'fa-solid fa-rocket fa-2xl',
    },
    {
        title: "Best Online Support",
        description: "Hours: 8AM - 11PM",
        siteLink:"",
        icon:'fa-solid fa-phone fa-2xl',
    },
    {
        title: "Return Policy",
        description: "Easy & Free Return",
        siteLink:"",
        icon:'fa-solid fa-backward fa-2xl',
    },
    {
        title: "30% Money Back",
        description: "For Order Over $100",
        siteLink:"",
        icon:'fa-solid fa-gift fa-2xl',
    }
];

const testimonial = {
    imgLink:'https://codewithsadee.github.io/anon-ecommerce-website/assets/images/testimonial-1.jpg',
    name:'ALAN DOE',
    position:'CEO & Founder Invision',
    description:'The service exceeded my expectations. The team was responsive, reliable, and delivered outstanding results.'
}
const categoryDropDown = [
    {
        title:'Building Block',
        catLink:"/building-blocks",
        imgLink:"/images/sale.jpg",
        imgAlt:"",
        imgRedirectLink:"categories/building-blocks",
        subCategories:[
            {
                title:"Boy's LEGO",
                link:"/sub-category/building-blocks/boy-lego",
            },
            {
                title:"Girl's LEGO",
                link:"/sub-category/building-blocks/girl-lego",
            },
            {
                title:"Kindergarten's LEGO",
                link:"/sub-category/building-blocks/kindergarten-lego",
            },
            {
                title:"Adult's LEGO",
                link:"/sub-category/building-blocks/adult-lego",
            },
            {
                title:"Puzzle",
                link:"/sub-category/building-blocks/puzzle",
            },
        ]
    },
    {
        title:"Vehicles",
        catLink:"/vehicles",
        imgLink:"/images/sale2.jpg",
        imgAlt:"",
        imgRedirectLink:"",
        subCategories:[
            {
                title:"Remote Control Car",
                link:"/sub-category/vehicles/remote-control-car",
            },
            {
                title:"Model Car",
                link:"/sub-category/vehicles/model-car",
            },
            {
                title:"Assembled Vehicle",
                link:"/sub-category/vehicles/assembled-vehicle", 
            },
            {
                title:"Playset & Accessory",
                link:"/sub-category/vehicles/playset-and-accessory",
            },
            {
                title:"Others",
                link:"/sub-category/vehicles/Others",
            },
        ]
    },
    {
        title:"Ride-on Toys",
        catLink:"/ride-on-toys",
        imgLink:"/images/sale3.jpg",
        imgAlt:"",
        imgRedirectLink:"",
        subCategories:[
            {
                title:"Electric Ride-On Car",
                link:"/sub-category/ride-on-toys/electric-ride-on-car",
            },
            {
                title:"Foot-to-Floor Ride-On",
                link:"/sub-category/ride-on-toys/foot-to-floor-ride-on", 
            },
            {
                title:"Kids Electric Motorbike",
                link:"/sub-category/ride-on-toys/kids-electric-motorbike",
            },
            {
                title:"Ride-On Construction Vehicle",
                link:"/sub-category/ride-on-toys/ride-on-construction-vehicle",
            },
            {
                title:"Scooter",
                link:"/sub-category/ride-on-toys/scooter",
            },
        ]
    },
    {
        title:'Movie-Themed Toys',
        catLink:"/movie-themed-toys",
        imgLink:"/images/sale4.png",
        imgAlt:"",
        imgRedirectLink:"",
        subCategories:[
            {
                title:"Superhero",
                link:"/sub-category/movie-themed-toys/superhero",
            },
            {
                title:"Anime",
                link:"/sub-category/movie-themed-toys/anime",
            },
            {
                title:"Spinning",
                link:"/sub-category/movie-themed-toys/spinning",
            },
            {
                title:"Robot Superhero",
                link:"/sub-category/movie-themed-toys/robot-superhero",
            },
            {
                title:"Others",
                link:"/sub-category/movie-themed-toys/others",
            },
            
        ]
    },
];
const paymentSecure = [
    {
        title:'Secure Payment',
        description:"We prioritize the security of your payment information. We understand the importance of ensuring that every transaction you make with us is safe and protected. That's why we have implemented robust security measures to safeguard your payment details and provide you with peace of mind throughout your shopping experience.",
        imgLink:'securepayment.jpg',
        imgAlt:'',
    },
    {
        title:'Cutting-Edge Encryption Technology',
        description:"We utilize cutting-edge encryption technology to protect your sensitive payment information. Our secure sockets layer (SSL) encryption ensures that all data transmitted between your browser and our servers remains encrypted and confidential. This means that your credit card details, personal information, and transaction data are shielded from unauthorized access by third parties.",
        imgLink:'securepayment-1.jpg',
        imgAlt:'',
    },
    {
        title:'PCI Compliance',
        description:"We are fully compliant with Payment Card Industry Data Security Standard (PCI DSS) requirements. This industry-standard framework sets forth stringent guidelines for securely handling credit card information during payment transactions. By adhering to PCI DSS standards, we maintain a secure environment for processing payment information, reducing the risk of data breaches and fraud.",
        imgLink:'securepayment-2.jpg',
        imgAlt:'',
    },
    {
        title:'Trusted Payment Partners',
        description:"We partner with trusted payment service providers that adhere to the highest security standards in the industry. Whether you choose to pay by credit card, debit card, or alternative payment methods, rest assured that your transaction is processed securely and efficiently.",
        imgLink:'securepayment-3.jpg',
        imgAlt:'',
    },
    {
        title:'Continuous Monitoring and Assessment',
        description:"Our dedicated security team continuously monitors and assesses our payment systems to identify and mitigate any potential vulnerabilities or threats. We stay vigilant against emerging security risks and implement proactive measures to ensure the ongoing security of your payment information.",
        imgLink:'securepayment-4.jpg',
        imgAlt:'',
    },
    {
        title:'Your Peace of Mind is Our Priority',
        description:"We are committed to providing you with a seamless and secure payment experience. Your peace of mind is our top priority, and we spare no effort in upholding the highest standards of security to protect your valuable information. Shop with confidence knowing that your payment details are in safe hands.",
        imgLink:'securepayment-5.jpg',
        imgAlt:'',
    },
]

const aboutUS= {
    section1:[
        {
            title:"About Us",
            description:"Welcome to [Your E-commerce Site Name], your ultimate destination for all things [your niche or industry]. Founded [year], we are passionate about delivering exceptional products and unparalleled shopping experiences to our customers worldwide.",
            imgLink:"about.jpg",
            imgAlt:""
        },
        {
            title:"Our Story",
            description:"At [Your E-commerce Site Name], our journey began with a simple yet powerful vision: to redefine the online shopping experience. What started as a small venture has grown into a thriving e-commerce platform, serving customers across the globe with a diverse range of high-quality products.",
            imgLink:"about-1.jpg",
            imgAlt:""
        },
        {
            title:"Our Mission",
            description:"Our mission is to empower individuals and communities by providing access to top-notch products that enhance their lives. We strive to create a seamless and enjoyable shopping environment where customers can discover new trends, find their favorite brands, and make informed purchasing decisions.",
            imgLink:"about-2.jpg",
            imgAlt:""
        },
        {
            title:"What Sets Us Apart",
            description:"What sets us apart is our unwavering commitment to excellence in every aspect of our business. From curating the finest selection of products to ensuring prompt and reliable delivery, we go above and beyond to exceed our customers' expectations.",
            imgLink:"about-3.jpg",
            imgAlt:""
        }

    ],
    section2:{
        title:"Our Values",
        imgLink:"about-5.jpg",
        imgAlt:"",
        listPoints:[
            {
                title:"Customer Satisfaction",
                description:"Your satisfaction is our top priority. We are dedicated to providing exceptional customer service and personalized support to ensure a smooth and enjoyable shopping experience."
            },
            {
                title:"Quality Assurance",
                description:"We stand behind the quality and authenticity of every product we offer. Each item undergoes rigorous quality control checks to meet our stringent standards of excellence."
            },
            {
                title:"Innovation",
                description:"We embrace innovation and continuously seek new ways to enhance our platform and elevate the shopping experience for our customers."
            },
            {
                title:"Sustainability",
                description:"We are committed to promoting sustainability and ethical practices throughout our supply chain. We prioritize eco-friendly products and strive to minimize our environmental footprint."
            }
        ],
    },
    section3:{
        title:"Get in Touch",
        description:[
            "We value transparency and open communication with our customers. If you have any questions, feedback, or inquiries, we encourage you to reach out to our dedicated customer support team. We are here to assist you every step of the way.",
            "Thank you for choosing [Your E-commerce Site Name]. We look forward to serving you and helping you discover the joy of shopping online."
        ]
    }
}

const loginFeatures = [
    {
        title: 'Track Your Orders',
        description: 'Keep tabs on your purchases with real-time order tracking and updates.',
        iconType: 'search',
    },
    {
        title: 'Personalized Recommendations',
        description: 'Log in to receive product suggestions tailored to your shopping preferences.',
        iconType: 'star',
    },
    {
        title: 'Wishlist Management',
        description: 'Save your favorite items to your wishlist for quick and easy future purchases.',
        iconType: 'heart',
    },
    {
        title: 'Secure Checkout',
        description: 'Enjoy a fast, secure, and hassle-free checkout process every time you shop with us.',
        iconType: 'lock',
    },
];
const serviceFeatures = [
    {
        title: 'Worldwide Delivery',
        description: "Enjoy our comprehensive global shipping services, designed to bring your favorite products right to your doorstep, no matter where you are. We partner with top logistics companies to ensure your order reaches you safely and promptly, providing you with a seamless shopping experience from anywhere in the world.",
        imgLink: 'https://cdn.pixabay.com/photo/2014/04/03/11/55/globe-312563_640.png',
        imgAlt: 'Globe with delivery arrows',
    },
    {
        title: 'Free Shipping on Orders Over $100',
        description: "Shop to your heart's content and take advantage of our special offer: free shipping on all orders over $100. Whether you're buying gifts for loved ones or treating yourself, you'll save on shipping costs, making your shopping experience even more enjoyable. Spend more, save more with us!",
        imgLink: 'https://img.freepik.com/premium-vector/delivery-order-illustration-modern-flat-style_529804-22.jpg',
        imgAlt: 'Shipping box with dollar sign',
    },
    {
        title: 'Next Day Delivery',
        description: "Need your items in a hurry? With our next day delivery service, you can receive your order the very next day! This service is available for orders in tier-1 cities, ensuring that you never have to wait long for your essential items. Fast, reliable, and convenient delivery right to your door.",
        imgLink: 'https://cdn-icons-png.freepik.com/512/1254/1254262.png',
        imgAlt: 'Clock with delivery truck',
    },
    {
        title: 'Next Day Delivery for Tier-1 Cities',
        description: "Our next day delivery service is exclusively available for customers in tier-1 cities. This means you can enjoy the speed and convenience of receiving your orders within 24 hours, perfect for those last-minute needs or urgent purchases. Experience the ultimate in fast delivery with our premium service.",
        imgLink: 'https://img.freepik.com/free-vector/gradient-international-trade_23-2149150716.jpg',
        imgAlt: 'Map highlighting tier-1 cities',
    },
    {
        title: 'Best Online Support',
        description: "Our customer support team is dedicated to providing you with the best service possible. Available from 8AM to 11PM, our knowledgeable and friendly representatives are here to assist you with any inquiries or issues you may have. We're committed to ensuring your shopping experience is smooth and enjoyable.",
        imgLink: 'https://img.freepik.com/free-vector/hand-drawn-flat-design-omnichannel-illustration_23-2149360245.jpg?size=626&ext=jpg&ga=GA1.1.1141335507.1718496000&semt=ais_user',
        imgAlt: 'Headset with customer service icon',
    },
    {
        title: 'Easy & Free Return',
        description: "Shop with confidence knowing that our easy and free return policy has you covered. If you're not completely satisfied with your purchase, you can return it hassle-free. We aim to make the return process as straightforward as possible, giving you peace of mind with every order.",
        imgLink: 'https://atlanticcourier.net/static/images/testimonials-atlantic-courier.jpg',
        imgAlt: 'Return package with arrow',
    },
    {
        title: '30% Money Back Guarantee',
        description: "Enjoy added assurance with our 30% money back guarantee on orders over $100. If you're not fully satisfied with your purchase, we'll refund 30% of your order value. This guarantee underscores our commitment to your satisfaction and ensures that you can shop with complete confidence.",
        imgLink: 'https://cdni.iconscout.com/illustration/premium/thumb/cashback-3465499-2912113.png?f=webp',
        imgAlt: 'Money back symbol',
    },
];
const allCategories = [{name:"Men's",link:'/categories/MEN'},{name:"Women's",link:'/categories/WOMEN'},{name:'Cosmetics',link:'/categories/Cosmetics'},{name:'Electronics',link:'/categories/electronics'},{name:'Perfume',link:'/categories/perfume'},{name:'Jewellery',link:'/categories/jewellery'},{name:'Footwear',link:'/categories/footwear'},{name:'Fashion',link:'/categories/fashion'}]
export {allCategories, serviceFeatures, loginFeatures,  navBtns,  aboutUS, paymentSecure, leftStatus, categoryDropDown, footerSections, featuresSec, testimonial};