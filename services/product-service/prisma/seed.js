const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Xóa dữ liệu cũ
  // await prisma.product.deleteMany();
  // console.log('🗑️  Đã xóa dữ liệu cũ');

  const products = [
    // iPhone
    {
      name: "iPhone 15 Pro Max",
      price: 32990000,
      oldPrice: 35990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/iphone15promax.jpg",
      hoverImage: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/iphone15promax_2.jpg",
      badge: "Mới",
      badgeColor: "green",
      colors: ["Titan Đen", "Titan Trắng", "Titan Xanh"],
      category: "iphone",
      stock: 50,
      screenSize: "6.7 inches",
      screenTechnology: "Super Retina XDR",
      rearCamera: "48MP + 12MP + 12MP",
      frontCamera: "12MP",
      chipset: "A17 Pro",
      ram: "8GB",
      storage: "256GB",
      battery: "4422 mAh",
      charging: "20W có dây, 15W MagSafe",
      waterResistance: "IP68"
    },
    {
      name: "iPhone 15 Pro",
      price: 28990000,
      oldPrice: 30990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/iphone15pro.jpg",
      badge: "Hot",
      badgeColor: "orange",
      colors: ["Đen", "Trắng", "Xanh", "Vàng"],
      category: "iphone",
      stock: 45,
      screenSize: "6.1 inches",
      screenTechnology: "Super Retina XDR",
      rearCamera: "48MP + 12MP + 12MP",
      frontCamera: "12MP",
      chipset: "A17 Pro",
      ram: "8GB",
      storage: "256GB",
      battery: "3274 mAh",
      charging: "20W có dây, 15W MagSafe",
      waterResistance: "IP68"
    },
    {
      name: "iPhone 15 Plus",
      price: 25990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/iphone15plus.jpg",
      colors: ["Hồng", "Xanh", "Vàng", "Đen"],
      category: "iphone",
      stock: 60,
      screenSize: "6.7 inches",
      screenTechnology: "Super Retina XDR",
      rearCamera: "48MP + 12MP",
      frontCamera: "12MP",
      chipset: "A16 Bionic",
      ram: "6GB",
      storage: "256GB",
      battery: "4383 mAh",
      charging: "20W có dây",
      waterResistance: "IP68"
    },
    // Samsung
    {
      name: "Samsung Galaxy S24 Ultra",
      price: 28990000,
      oldPrice: 31990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/s24ultra.jpg",
      hoverImage: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/s24ultra_2.jpg",
      badge: "Hot",
      badgeColor: "orange",
      colors: ["Titan Tím", "Titan Đen", "Titan Vàng"],
      category: "samsung",
      stock: 30,
      screenSize: "6.8 inches",
      screenTechnology: "Dynamic AMOLED 2X",
      rearCamera: "200MP + 50MP + 12MP + 10MP",
      frontCamera: "12MP",
      chipset: "Snapdragon 8 Gen 3",
      ram: "12GB",
      storage: "256GB",
      battery: "5000 mAh",
      charging: "45W có dây, 15W không dây",
      waterResistance: "IP68"
    },
    {
      name: "Samsung Galaxy S24 Plus",
      price: 22990000,
      oldPrice: 24990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/s24plus.jpg",
      colors: ["Xám", "Đen", "Tím"],
      category: "samsung",
      stock: 40,
      screenSize: "6.7 inches",
      screenTechnology: "Dynamic AMOLED 2X",
      rearCamera: "50MP + 12MP + 10MP",
      frontCamera: "12MP",
      chipset: "Snapdragon 8 Gen 3",
      ram: "12GB",
      storage: "256GB",
      battery: "4900 mAh",
      charging: "45W có dây",
      waterResistance: "IP68"
    },
    {
      name: "Samsung Galaxy Z Fold5",
      price: 39990000,
      oldPrice: 44990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/zfold5.jpg",
      badge: "Cao cấp",
      badgeColor: "purple",
      colors: ["Xanh", "Đen"],
      category: "samsung",
      stock: 15,
      screenSize: "7.6 inches (mở), 6.2 inches (gập)",
      screenTechnology: "Dynamic AMOLED 2X",
      rearCamera: "50MP + 12MP + 10MP",
      frontCamera: "10MP (màn ngoài), 4MP (màn trong)",
      chipset: "Snapdragon 8 Gen 2",
      ram: "12GB",
      storage: "512GB",
      battery: "4400 mAh",
      charging: "25W có dây",
      waterResistance: "IPX8"
    },
    // Xiaomi
    {
      name: "Xiaomi 14 Ultra",
      price: 19990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/xiaomi14ultra.jpg",
      badge: "Giảm giá",
      badgeColor: "red",
      colors: ["Trắng", "Đen"],
      category: "xiaomi",
      stock: 45,
      screenSize: "6.73 inches",
      screenTechnology: "AMOLED LTPO",
      rearCamera: "50MP + 50MP + 50MP",
      frontCamera: "32MP",
      chipset: "Snapdragon 8 Gen 3",
      ram: "16GB",
      storage: "512GB",
      battery: "5000 mAh",
      charging: "90W có dây, 50W không dây",
      waterResistance: "IP68"
    },
    {
      name: "Xiaomi 14 Pro",
      price: 15990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/xiaomi14pro.jpg",
      colors: ["Xanh", "Đen", "Trắng"],
      category: "xiaomi",
      stock: 50,
      screenSize: "6.73 inches",
      screenTechnology: "AMOLED LTPO",
      rearCamera: "50MP + 50MP + 50MP",
      frontCamera: "32MP",
      chipset: "Snapdragon 8 Gen 3",
      ram: "12GB",
      storage: "256GB",
      battery: "4880 mAh",
      charging: "120W có dây",
      waterResistance: "IP68"
    },
    // Google
    {
      name: "Google Pixel 8 Pro",
      price: 22990000,
      oldPrice: 25990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/pixel8pro.jpg",
      badge: "New",
      badgeColor: "blue",
      colors: ["Xanh", "Đen", "Trắng"],
      category: "google",
      stock: 25,
      screenSize: "6.7 inches",
      screenTechnology: "LTPO OLED",
      rearCamera: "50MP + 48MP + 48MP",
      frontCamera: "10.5MP",
      chipset: "Google Tensor G3",
      ram: "12GB",
      storage: "256GB",
      battery: "5050 mAh",
      charging: "30W có dây, 23W không dây",
      waterResistance: "IP68"
    },
    {
      name: "Google Pixel 8",
      price: 17990000,
      image: "https://res.cloudinary.com/dxkfusgxs/image/upload/v1743000000/pixel8.jpg",
      colors: ["Hồng", "Đen", "Xanh"],
      category: "google",
      stock: 35,
      screenSize: "6.2 inches",
      screenTechnology: "OLED",
      rearCamera: "50MP + 12MP",
      frontCamera: "10.5MP",
      chipset: "Google Tensor G3",
      ram: "8GB",
      storage: "128GB",
      battery: "4575 mAh",
      charging: "27W có dây",
      waterResistance: "IP68"
    }
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
    console.log(`✅ Đã thêm: ${product.name}`);
  }

  const count = await prisma.product.count();
  console.log(`\n🎉 Hoàn thành! Đã thêm ${count} sản phẩm vào database.`);
}

main()
  .catch(e => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
