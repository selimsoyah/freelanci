import sequelize from '../config/database';
import Category from '../models/Category';

const categories = [
  {
    name: 'Web Development',
    description: 'Full-stack development, frontend, backend, APIs',
    icon: '💻',
  },
  {
    name: 'Mobile Development',
    description: 'iOS, Android, React Native, Flutter apps',
    icon: '📱',
  },
  {
    name: 'UI/UX Design',
    description: 'User interface and experience design',
    icon: '🎨',
  },
  {
    name: 'Graphic Design',
    description: 'Logos, branding, illustrations, print design',
    icon: '🖼️',
  },
  {
    name: 'Content Writing',
    description: 'Articles, blog posts, copywriting, translation',
    icon: '✍️',
  },
  {
    name: 'Digital Marketing',
    description: 'SEO, social media, email marketing, ads',
    icon: '📊',
  },
  {
    name: 'Video & Animation',
    description: 'Video editing, motion graphics, 3D animation',
    icon: '🎬',
  },
  {
    name: 'Data Entry & Admin',
    description: 'Data entry, virtual assistant, administrative tasks',
    icon: '📋',
  },
  {
    name: 'Consulting',
    description: 'Business consulting, strategy, advice',
    icon: '💼',
  },
  {
    name: 'Other',
    description: 'Other services not listed above',
    icon: '📁',
  },
];

async function seedCategories() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create categories
    for (const category of categories) {
      await Category.findOrCreate({
        where: { name: category.name },
        defaults: category,
      });
    }

    console.log('✅ Categories seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
