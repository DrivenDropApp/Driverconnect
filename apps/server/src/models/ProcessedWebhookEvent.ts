import mongoose, { Document, Schema } from 'mongoose';

// Used for idempotent payment webhook processing
export interface IProcessedWebhookEvent extends Document {
  eventId: string;
  processedAt: Date;
}

const ProcessedWebhookEventSchema = new Schema<IProcessedWebhookEvent>({
  eventId: { type: String, required: true, unique: true }, // unique index = the idempotency guarantee
  processedAt: { type: Date, default: Date.now },
});

export const ProcessedWebhookEvent = mongoose.model<IProcessedWebhookEvent>(
  'ProcessedWebhookEvent',
  ProcessedWebhookEventSchema,
);
