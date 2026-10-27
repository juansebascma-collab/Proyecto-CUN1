import { BloodUnit, Donor, TransfusionRequest, DomainEvent, resolveDonorDocument } from '../domain/contracts.js';

const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export class DemoStore {
  units: BloodUnit[] = [
    {
      id: 'u1',
      code: 'HR-001',
      bloodGroup: 'O-',
      component: 'Glóbulos rojos',
      volume: 450,
      status: 'available',
      location: 'Nevera A · Estante 2',
      expiresAt: future(3),
    },
    {
      id: 'u2',
      code: 'HR-002',
      bloodGroup: 'A+',
      component: 'Plaquetas',
      volume: 300,
      status: 'available',
      location: 'Nevera B · Estante 1',
      expiresAt: future(12),
    },
    {
      id: 'u3',
      code: 'HR-003',
      bloodGroup: 'O+',
      component: 'Plasma',
      volume: 250,
      status: 'reserved',
      location: 'Nevera A · Estante 4',
      expiresAt: future(20),
    },
  ];

  donors: Donor[] = [
    {
      id: 'd1',
      name: 'María Fernanda López',
      document: '1020304821',
      documentMasked: '*** *** 4821',
      bloodGroup: 'O+',
      phone: '300 555 0198',
    },
    {
      id: 'd2',
      name: 'Carlos Andrés Ruiz',
      document: '1030407730',
      documentMasked: '*** *** 7730',
      bloodGroup: 'A-',
      phone: '310 555 0142',
    },
  ];

  requests: TransfusionRequest[] = [
    {
      id: 'r1',
      institution: 'Hospital Universitario CUN',
      component: 'Glóbulos rojos',
      bloodGroup: 'O-',
      quantity: 2,
      priority: 'critical',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  events: DomainEvent[] = [];
  mode: 'demo' | 'mongo' = 'demo';

  async getUnits(): Promise<BloodUnit[]> {
    return this.units;
  }

  async addUnit(unit: BloodUnit): Promise<void> {
    this.units.push(unit);
  }

  async getDonors(): Promise<Donor[]> {
    return this.donors.map((d) => ({
      ...d,
      document: resolveDonorDocument(d),
    }));
  }

  async addDonor(donor: Donor): Promise<void> {
    const full = resolveDonorDocument(donor);
    this.donors.push({
      ...donor,
      document: full,
    });
  }

  async getRequests(): Promise<TransfusionRequest[]> {
    return this.requests;
  }

  async addRequest(request: TransfusionRequest): Promise<void> {
    this.requests.push(request);
  }
}
