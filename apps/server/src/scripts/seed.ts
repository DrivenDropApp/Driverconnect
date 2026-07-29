import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User } from '../models/User';
import { Driver } from '../models/Driver';
import { Admin } from '../models/Admin';
import { Booking } from '../models/Booking';

// Chhatrapati Sambhajinagar (Aurangabad), Maharashtra
const CSN_CENTER = { lat: 19.8762, lng: 75.3433 };

function randomOffset(range = 0.05): number {
  return (Math.random() - 0.5) * range * 2;
}

function randomLocation() {
  return {
    lat: CSN_CENTER.lat + randomOffset(0.08),
    lng: CSN_CENTER.lng + randomOffset(0.08),
  };
}

const DRIVER_NAMES = [
  'Rajesh Patil', 'Amit Deshmukh', 'Suresh Gaikwad', 'Vikram Shinde', 'Ravi Jadhav',
  'Manoj Kulkarni', 'Anil Dhamane', 'Deepak Bhor', 'Sanjay Wagh', 'Arjun Salunke',
  'Prakash Munde', 'Ramesh Kamble', 'Santosh Pawar', 'Nilesh Bhalerao', 'Kiran Bankar',
];

const VEHICLE_SKILLS = ['sedan', 'suv', 'hatchback', 'luxury'];

const CUSTOMER_NAMES = [
  { name: 'Priya Patil', phone: '9876543210' },
  { name: 'Anita Deshmukh', phone: '9876543211' },
  { name: 'Kavya Shinde', phone: '9876543212' },
  { name: 'Meera Jadhav', phone: '9876543213' },
  { name: 'Pooja Kulkarni', phone: '9876543214' },
];

const CSN_ADDRESSES = [
  'Jalna Road, Chhatrapati Sambhajinagar',
  'Garkheda, Chhatrapati Sambhajinagar',
  'Cidco, Chhatrapati Sambhajinagar',
  'Bajaj Nagar, Chhatrapati Sambhajinagar',
  'Prozone Mall, Chhatrapati Sambhajinagar',
  'MIT College Area, Chhatrapati Sambhajinagar',
  'Osmanpura, Chhatrapati Sambhajinagar',
  'Nirala Bazar, Chhatrapati Sambhajinagar',
];

async function seed() {
  console.log('🌱 Starting seed...');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Driver.deleteMany({}),
    Admin.deleteMany({}),
    Booking.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── Create Admin ────────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD || 'AdminPass@123', 12);
  const admin = await Admin.create({
    email: env.ADMIN_EMAIL || 'admin@driverconnect.com',
    name: 'Super Admin',
    passwordHash: adminPasswordHash,
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // ─── Create Drivers ───────────────────────────────────────────────────────────
  const drivers = [];
  for (let i = 0; i < 15; i++) {
    const loc = randomLocation();
    const otpHash = await bcrypt.hash('1234', 10);
    const phone = `98765${String(i).padStart(5, '0')}`;
    const driver = await Driver.create({
      phone,
      name: DRIVER_NAMES[i],
      kyc: {
        licenseUrl: 'https://placehold.co/600x400?text=License',
        aadhaarUrl: 'https://placehold.co/600x400?text=Aadhaar',
        photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${DRIVER_NAMES[i]}`,
        status: i < 12 ? 'verified' : 'pending', // 12 verified, 3 pending
      },
      vehicleSkills: [VEHICLE_SKILLS[i % VEHICLE_SKILLS.length]],
      isOnline: i < 8, // 8 online
      location: {
        type: 'Point',
        coordinates: [loc.lng, loc.lat],
      },
      rating: parseFloat((4.0 + Math.random()).toFixed(1)),
      totalRatings: Math.floor(Math.random() * 500) + 50,
      totalTrips: Math.floor(Math.random() * 1000) + 100,
      otp: otpHash,
      otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    drivers.push(driver);
  }
  console.log(`🚗 Created ${drivers.length} drivers (12 verified, 8 online)`);

  // ─── Create Customers ─────────────────────────────────────────────────────────
  const customers = [];
  for (const c of CUSTOMER_NAMES) {
    const otpHash = await bcrypt.hash('1234', 10);
    const customer = await User.create({
      phone: c.phone,
      name: c.name,
      email: `${c.name.toLowerCase().replace(' ', '.')}@example.com`,
      rating: parseFloat((4.0 + Math.random()).toFixed(1)),
      addresses: [
        {
          label: 'Home',
          lat: CSN_CENTER.lat + randomOffset(0.03),
          lng: CSN_CENTER.lng + randomOffset(0.03),
          address: CSN_ADDRESSES[Math.floor(Math.random() * CSN_ADDRESSES.length)],
        },
        {
          label: 'Office',
          lat: CSN_CENTER.lat + randomOffset(0.03),
          lng: CSN_CENTER.lng + randomOffset(0.03),
          address: CSN_ADDRESSES[Math.floor(Math.random() * CSN_ADDRESSES.length)],
        },
      ],
      vehicles: [
        { make: 'Honda', model: 'City', transmission: 'automatic', year: 2020 },
      ],
      otp: otpHash,
      otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    customers.push(customer);
  }
  console.log(`👥 Created ${customers.length} customers`);

  // ─── Create Sample Bookings ───────────────────────────────────────────────────
  const sampleBookings = [
    { status: 'completed', customerId: customers[0]._id, driverId: drivers[0]._id },
    { status: 'completed', customerId: customers[1]._id, driverId: drivers[1]._id },
    { status: 'searching', customerId: customers[2]._id },
    { status: 'assigned', customerId: customers[3]._id, driverId: drivers[2]._id },
  ];

  for (const b of sampleBookings) {
    const pickup = randomLocation();
    const drop = randomLocation();
    await Booking.create({
      ...b,
      type: 'local',
      pickup: { ...pickup, address: CSN_ADDRESSES[Math.floor(Math.random() * CSN_ADDRESSES.length)] },
      drop: { ...drop, address: CSN_ADDRESSES[Math.floor(Math.random() * CSN_ADDRESSES.length)] },
      fare: { base: 50, distance: 140, time: 30, tolls: 0, total: 220, currency: 'INR' },
      distance: 10,
      duration: 20,
      timestamps: {
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        ...(b.driverId && { assignedAt: new Date(Date.now() - 45 * 60 * 1000) }),
        ...(b.status === 'completed' && { startedAt: new Date(Date.now() - 30 * 60 * 1000), completedAt: new Date() }),
      },
    });
  }
  console.log(`📋 Created ${sampleBookings.length} sample bookings`);

  console.log('\n✅ Seed complete!');
  console.log('\n─── Login Credentials ───');
  console.log('Admin: admin@driverconnect.com / AdminPass@123');
  console.log('Customer: 9876543210 / OTP: 1234');
  console.log('Driver: 9876500000 / OTP: 1234');
  console.log('─────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
