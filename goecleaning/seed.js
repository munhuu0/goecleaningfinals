const mongoose = require('mongoose');
const Service = require('./models/Service');
const Portfolio = require('./models/Portfolio');
require('dotenv').config();

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goecleaning');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Service.deleteMany({});
    await Portfolio.deleteMany({});
    console.log('Cleared existing data');

    // Seed services
    const services = [
      {
        title: 'Барилгын дараах',
        description: 'Барилгын дараах цэвэрлэгээ нь барилгын ажлын явцад үүссэн тоос, шороо, үлдэгдэл хог хаягдлыг бүрэн арилгаж, орчныг цэвэр, аюулгүй, ашиглахад бүрэн бэлэн болгох цогц үйлчилгээ юм. Манай мэргэжлийн баг стандартын дагуу чанартай гүйцэтгэнэ.',
        icon: 'hammer',
        featured: true,
        order: 1
      },
      {
        title: 'Оффис',
        description: 'Оффисын цэвэрлэгээ нь ажлын орчны тав тух, эрүүл ахуйг хангаж, ажилчдын бүтээмжийг нэмэгдүүлэхэд чухал үүрэгтэй. Манай туршлагатай хамт олон оффисын бүх талбайг мэргэжлийн түвшинд цэвэрлэж, цэвэр, эмх цэгцтэй ажлын орчныг бүрдүүлнэ.',
        icon: 'briefcase',
        featured: true,
        order: 2
      },
      {
        title: 'Айл гэр',
        description: 'Таны гэр бүлийн эрүүл, тав тухтай амьдрах орчныг бүрдүүлэх зорилгоор айл гэрийн цэвэрлэгээг чанарын өндөр түвшинд гүйцэтгэнэ. Бид таны цагийг хэмнэж, цэвэр тохилог орчинг бий болгоход анхааран ажилладаг.',
        icon: 'home',
        featured: true,
        order: 3
      },
      {
        title: 'Цонх, Фасад',
        description: 'Цонх болон фасадын цэвэрлэгээг өндөрт ажиллах зориулалтын мэргэжлийн тоног төхөөрөмж, аюулгүй ажиллагааны стандартын дагуу гүйцэтгэж, барилгын өнгө үзэмжийг сэргээнэ.',
        icon: 'maximize',
        featured: true,
        order: 4
      }
    ];

    const createdServices = await Service.insertMany(services);
    console.log('Services seeded:', createdServices.length);

    // Create sample portfolio items (without images for now)
    const portfolioItems = [
      {
        title: 'Оффисын төв цэвэрлэгээ',
        description: 'Улаанбаатар хотын төв дэх орчин үеийн оффисын байрны бүрэн цэвэрлэгээ',
        category: 'office',
        featured: true,
        order: 1,
        images: []
      },
      {
        title: 'Орон сууцны барилга цэвэрлэгээ',
        description: 'Шинэ баригдсан орон сууцны комплексийн барилгын дараах цэвэрлэгээ',
        category: 'post-construction',
        featured: true,
        order: 2,
        images: []
      },
      {
        title: 'Хувь орон сууц цэвэрлэгээ',
        description: '3 өрөө байрны гүн цэвэрлэгээ, тавилга шилжүүлсний дараа',
        category: 'residential',
        featured: true,
        order: 3,
        images: []
      },
      {
        title: 'Төв байрны фасад цэвэрлэгээ',
        description: '15 давхар төв байрны гадна фасадын мэргэжлийн цэвэрлэгээ',
        category: 'window-facade',
        featured: true,
        order: 4,
        images: []
      }
    ];

    const createdPortfolio = await Portfolio.insertMany(portfolioItems);
    console.log('Portfolio items seeded:', createdPortfolio.length);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
