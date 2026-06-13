import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Username:', existingAdmin.username);
            console.log('Email:', existingAdmin.email);
            process.exit(0);
        }

        // Create admin user
        const adminUser = await User.create({
            username: 'admin',
            email: 'admin@docmind.com',
            password: 'Admin@123', // Will be hashed by the model
            first_name: 'Admin',
            last_name: 'User',
            role: 'SUPER_ADMIN',
            department: 'Administration',
            login_count: 0,
            must_change_password: false
        });

        console.log('\n✅ Admin user created successfully!');
        console.log('=====================================');
        console.log('Username:', adminUser.username);
        console.log('Email:', adminUser.email);
        console.log('Password: Admin@123');
        console.log('Role:', adminUser.role);
        console.log('=====================================');
        console.log('\n⚠️  Please change the password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
