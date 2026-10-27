import mongoose, { Schema } from 'mongoose';
import { BloodUnit, Donor, TransfusionRequest, DomainEvent } from '../domain/contracts.js';

const BloodUnitSchema = new Schema<BloodUnit>(
  {
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    component: { type: String, required: true },
    volume: { type: Number, required: true },
    status: { type: String, required: true },
    location: { type: String, required: true },
    expiresAt: { type: String, required: true },
  },
  { timestamps: true, collection: 'blood_units' }
);

const DonorSchema = new Schema<Donor>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    document: { type: String },
    documentMasked: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    phone: { type: String, required: true },
    lastDonation: { type: String },
  },
  { timestamps: true, collection: 'donors' }
);

const TransfusionRequestSchema = new Schema<TransfusionRequest>(
  {
    id: { type: String, required: true, unique: true },
    institution: { type: String, required: true },
    component: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    quantity: { type: Number, required: true },
    priority: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: true, collection: 'transfusion_requests' }
);

const DomainEventSchema = new Schema<DomainEvent>(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    aggregateId: { type: String, required: true },
    occurredAt: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'domain_events' }
);

export const BloodUnitModel =
  mongoose.models.BloodUnit || mongoose.model<BloodUnit>('BloodUnit', BloodUnitSchema);
export const DonorModel =
  mongoose.models.Donor || mongoose.model<Donor>('Donor', DonorSchema);
export const TransfusionRequestModel =
  mongoose.models.TransfusionRequest ||
  mongoose.model<TransfusionRequest>('TransfusionRequest', TransfusionRequestSchema);
export const DomainEventModel =
  mongoose.models.DomainEvent || mongoose.model<DomainEvent>('DomainEvent', DomainEventSchema);

export async function connectMongo(
  uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hemored'
) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
