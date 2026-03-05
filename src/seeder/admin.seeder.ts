import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from 'src/users/entity/user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@chemlab.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123';

  const existing = await userModel.findOne({ email: adminEmail });

  if (existing) {
    console.log('✅ Admin already exists:', adminEmail);
    await app.close();
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);

  await userModel.create({
    name: 'Admin',
    email: adminEmail,
    password: hashed,
    role: UserRole.ADMIN,
    isVerified: true,
  });

  console.log('✅ Admin seeded successfully');
  console.log('   Email:   ', adminEmail);
  console.log('   Password:', adminPassword);

  await app.close();
}

seed().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});