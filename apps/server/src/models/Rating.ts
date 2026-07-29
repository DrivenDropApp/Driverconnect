import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
  bookingId: mongoose.Types.ObjectId;
  raterId: mongoose.Types.ObjectId;
  rateeId: mongoose.Types.ObjectId;
  stars: number;
  tags: string[];
  comment?: string;
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  raterId: { type: Schema.Types.ObjectId, required: true, index: true },
  rateeId: { type: Schema.Types.ObjectId, required: true, index: true },
  stars: { type: Number, min: 1, max: 5, required: true },
  tags: [{ type: String }],
  comment: { type: String, maxlength: 500 },
}, {
  timestamps: true,
});

RatingSchema.index({ bookingId: 1, raterId: 1 }, { unique: true }); // one rating per booking per rater

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
