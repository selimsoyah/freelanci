import sequelize from '../config/database';
import User from '../models/User';
import Profile from '../models/Profile';
import bcrypt from 'bcrypt';
import { UserRole, VerificationStatus } from '../types';

interface TestUser {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  full_name: string;
}

const testUsers: TestUser[] = [
  {
    username: 'test_client',
    email: 'client@test.com',
    password: 'Test123!@#',
    role: UserRole.CLIENT,
    full_name: 'Test Client User'
  },
  {
    username: 'test_freelancer',
    email: 'freelancer@test.com',
    password: 'Test123!@#',
    role: UserRole.FREELANCER,
    full_name: 'Test Freelancer User'
  },
  {
    username: 'test_admin',
    email: 'admin@test.com',
    password: 'Test123!@#',
    role: UserRole.ADMIN,
    full_name: 'Test Admin User'
  }
];

async function createTestUsers() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await User.create({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        verification_status: VerificationStatus.VERIFIED // Set as verified for testing
      });

      // Create profile
      await Profile.create({
        user_id: user.id,
        full_name: userData.full_name
      });

      console.log(`✅ Created ${userData.role}: ${userData.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${userData.username}\n`);
    }

    console.log('\n🎉 All test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────────────────────────');
    testUsers.forEach(user => {
      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });
    console.log('\n─────────────────────────────────────────');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

createTestUsers();
