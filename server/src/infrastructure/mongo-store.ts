import { BloodUnit, Donor, TransfusionRequest, resolveDonorDocument } from '../domain/contracts.js';
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
    const list = (await DonorModel.find({}, { _id: 0, __v: 0 }).lean()) as any[];
    return list.map((d) => ({
      ...d,
      document: resolveDonorDocument(d),
    }));
  }

  async addDonor(donor: Donor): Promise<void> {
    const fullDoc = resolveDonorDocument(donor);
    await DonorModel.create({
      ...donor,
      document: fullDoc,
    });
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
      if (demoDonors.length) {
        const enriched = demoDonors.map((d) => ({
          ...d,
          document: resolveDonorDocument(d),
        }));
        await DonorModel.insertMany(enriched);
      }
      if (demoRequests.length) await TransfusionRequestModel.insertMany(demoRequests);
      console.log('🌱 Base de datos en MongoDB Atlas inicializada con datos semilla.');
    } else {
      // Migrar donantes existentes en MongoDB para que todos tengan su cédula completa
      try {
        const legacyDonors = await DonorModel.find({
          $or: [
            { document: { $exists: false } },
            { document: null },
            { document: '' },
            { document: { $regex: /\*/ } },
          ],
        });
        for (const doc of legacyDonors) {
          const resolved = resolveDonorDocument(doc);
          await DonorModel.updateOne({ _id: doc._id }, { $set: { document: resolved } });
        }
        if (legacyDonors.length > 0) {
          console.log(`✅ ${legacyDonors.length} donante(s) existente(s) en MongoDB actualizados con documento de identidad completo.`);
        }
      } catch (err) {
        console.warn('Nota: migración de donantes en Mongo:', err);
      }
    }
  }
}
