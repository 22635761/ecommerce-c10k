const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Xóa dữ liệu cũ
  await prisma.discount.deleteMany();
  console.log('🗑️  Đã xóa dữ liệu cũ');

  const discounts = [
    {
      code: 'WELCOME10',
      name: 'Chào mừng thành viên mới',
      description: 'Giảm 10% cho đơn hàng đầu tiên',
      type: 'percentage',
      value: 10,
      minOrderAmount: 100000,
      maxDiscountAmount: 100000,
      usageLimit: 100,
      perUserLimit: 1,
      isActive: true
    },
    {
      code: 'FREESHIP',
      name: 'Miễn phí vận chuyển',
      description: 'Miễn phí vận chuyển cho đơn hàng từ 500k',
      type: 'free_shipping',
      value: 0,
      minOrderAmount: 500000,
      usageLimit: 50,
      perUserLimit: 1,
      isActive: true
    },
    {
      code: 'SALE20',
      name: 'Giảm 20% toàn bộ',
      description: 'Giảm 20% tối đa 150k',
      type: 'percentage',
      value: 20,
      minOrderAmount: 200000,
      maxDiscountAmount: 150000,
      usageLimit: 200,
      perUserLimit: 2,
      isActive: true
    },
    {
      code: 'GIAM50K',
      name: 'Giảm 50.000đ',
      description: 'Giảm trực tiếp 50.000đ cho đơn hàng từ 300k',
      type: 'fixed',
      value: 50000,
      minOrderAmount: 300000,
      usageLimit: 100,
      perUserLimit: 1,
      isActive: true
    },
    {
      code: 'BLACKFRIDAY',
      name: 'Black Friday Sale',
      description: 'Giảm 30% tối đa 300k',
      type: 'percentage',
      value: 30,
      minOrderAmount: 500000,
      maxDiscountAmount: 300000,
      usageLimit: 500,
      perUserLimit: 1,
      isActive: true,
      startDate: new Date('2026-11-25'),
      endDate: new Date('2026-11-30')
    }
  ];

  for (const discount of discounts) {
    await prisma.discount.create({ data: discount });
    console.log(`✅ Đã thêm: ${discount.code} - ${discount.name}`);
  }

  console.log(`\n🎉 Hoàn thành! Đã thêm ${discounts.length} mã giảm giá.`);
}

main()
  .catch(e => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
