/**
 * Admin Seeder Script
 *
 * This script connects to the MongoDB database and creates a default
 * admin user if one does not already exist with the specified email.
 *
 * HOW TO USE:
 * 1. Customize the ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_FULLNAME below.
 * 2. Run the script from your terminal: `node seed.js`
 * 3. After successful creation, DELETE THIS FILE for security.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User'); // Make sure the path to your User model is correct

// Load environment variables from .env file
dotenv.config();

// --- START CUSTOMIZATION ---
const ADMIN_EMAIL = 'admin@123.com';
const ADMIN_PASSWORD = 'admin'; // Choose a strong password
const ADMIN_FULLNAME = 'Admin';
// --- END CUSTOMIZATION ---

const seedAdmin = async () => {
    try {
        // 1. Connect to the database
        await mongoose.connect(process.env.DATABASE_URI);
        console.log('MongoDB connected for seeding...');

        // 2. Check if the admin user already exists
        const adminExists = await User.findOne({ email: ADMIN_EMAIL });
        if (adminExists) {
            console.log('Admin user already exists. Aborting seed process.');
            return;
        }

        console.log('Admin user not found. Creating a new admin...');

        // 3. Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

        // 4. Create the new admin user object
        const newAdmin = new User({
            fullName: ADMIN_FULLNAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'Admin',
            status: 'Approved', // Admins are automatically approved
        });

        // 5. Save the new admin to the database
        await newAdmin.save();
        console.log('✅ Admin user created successfully!');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: The one you set in the script.`);

    } catch (error) {
        console.error('❌ Error during admin seeding:', error);
    } finally {
        // 6. Disconnect from the database
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

// Execute the seeding function
seedAdmin();