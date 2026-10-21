import { BloodUnit, Donor, TransfusionRequest } from '../domain/contracts.js';
import {
  BloodUnitModel,
  DonorModel,
  TransfusionRequestModel,
} from './mongo.js';

export class MongoStore {
  mode: 'demo' | 'mongo' = 'mongo';

  async getUnits(): Promise<BloodUnit[]> {
    return BloodUnitModel.find({}, { _id: 0, __v: 0 }).lean() as Promise<BloodUnit[]>;
  }

  async addUnit(unit: BloodUnit): Promise<void> {
    await BloodUnitModel.create(unit);
  }

  async getDonors(): Promise<Donor[]> {
    return DonorModel.find({}, { _id: 0, __v: 0 }).lean() as Promise<Donor[]>;
  }

  async addDonor(donor: Donor): Promise<void> {
    await DonorModel.create(donor);
  }

  async getRequests(): Promise<TransfusionRequest[]> {
    return TransfusionRequestModel.find({}, { _id: 0, __v: 0 }).lean() as Promise<
      TransfusionRequest[]
    >;
  }

  async addRequest(request: TransfusionRequest): Promise<void> {
    await TransfusionRequestModel.create(request);
  }

  async seedIfEmpty(
    demoUnits: BloodUnit[],
    demoDonors: Donor[],
    demoRequests: TransfusionRequest[]
  ): Promise<void> {
    const count = await BloodUnitModel.countDocuments();
    if (count === 0) {
      if (demoUnits.length) await BloodUnitModel.insertMany(demoUnits);
      if (demoDonors.length) await DonorModel.insertMany(demoDonors);
      if (demoRequests.length) await TransfusionRequestModel.insertMany(demoRequests);
      console.log('🌱 Base de datos en MongoDB Atlas inicializada con datos semilla.');
    }
  }
}
