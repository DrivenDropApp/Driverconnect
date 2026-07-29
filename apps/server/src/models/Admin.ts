import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin';
  refreshToken?: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, default: 'admin' },
  refreshToken: { type: String, select: false },
}, {
  timestamps: true,
});

AdminSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

AdminSchema.statics.createAdmin = async function (email: string, name: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return this.create({ email, name, passwordHash });
};

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
