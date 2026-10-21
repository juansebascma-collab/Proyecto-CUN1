import Fastify from 'fastify';
import cors from '@fastify/cors';
import { DemoStore } from '../infrastructure/demo-repositories.js';
import { EventBus } from '../application/event-bus.js';
import { createDomainEvent } from '../domain/contracts.js';
import { calculateInventorySummary, validateUnit } from '../domain/inventory.js';
import { DomainEventModel } from '../infrastructure/mongo.js';

export function buildApp(store: any = new DemoStore(), bus = new EventBus()) {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: true });

  app.get('/api/health', async () => ({
    status: 'ok',
    dataMode: store.mode,
  }));

  app.get('/api/dashboard/summary', async () => {
    const units = store.getUnits ? await store.getUnits() : store.units;
    const requests = store.getRequests ? await store.getRequests() : store.requests;
    const donors = store.getDonors ? await store.getDonors() : store.donors;
    const summary = calculateInventorySummary(units);

    return {
      inventory: summary,
      requests: {
        pending: requests.filter((r: any) => r.status === 'pending').length,
      },
      donors: donors.length,
      alerts: summary.expiringSoon,
    };
  });

  app.get('/api/blood-units', async () => {
    return store.getUnits ? await store.getUnits() : store.units;
  });

  app.post('/api/blood-units', async (req, res) => {
    const input = req.body as any;
    const errors = validateUnit(input);
    if (errors.length) {
      return res.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Unidad inválida',
        details: errors,
      });
    }
    const unit = { ...input, id: crypto.randomUUID(), status: 'available' };
    if (store.addUnit) {
      await store.addUnit(unit);
    } else {
      store.units.push(unit);
    }
    bus.publish(createDomainEvent('BloodUnitRegistered', unit.id, { code: unit.code }));
    return res.code(201).send(unit);
  });

  app.get('/api/donors', async () => {
    return store.getDonors ? await store.getDonors() : store.donors;
  });

  app.post('/api/donors', async (req, res) => {
    const input = req.body as any;
    if (!input.name || !input.bloodGroup) {
      return res.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Nombre y grupo sanguíneo son obligatorios',
        details: [],
      });
    }
    const donor = {
      ...input,
      id: crypto.randomUUID(),
      documentMasked: '*** *** ' + String(input.document || '0000').slice(-4),
    };
    delete donor.document;
    if (store.addDonor) {
      await store.addDonor(donor);
    } else {
      store.donors.push(donor);
    }
    bus.publish(createDomainEvent('DonorRegistered', donor.id, { name: donor.name }));
    return res.code(201).send(donor);
  });

  app.get('/api/transfusion-requests', async () => {
    return store.getRequests ? await store.getRequests() : store.requests;
  });

  app.post('/api/transfusion-requests', async (req, res) => {
    const input = req.body as any;
    if (!input.institution || !input.component || !input.bloodGroup || !input.quantity) {
      return res.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Solicitud incompleta',
        details: [],
      });
    }
    const item = {
      ...input,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    if (store.addRequest) {
      await store.addRequest(item);
    } else {
      store.requests.push(item);
    }
    bus.publish(
      createDomainEvent('TransfusionRequestCreated', item.id, {
        institution: item.institution,
        priority: item.priority,
      })
    );
    return res.code(201).send(item);
  });

  app.get('/api/events', async () => {
    if (store.mode === 'mongo') {
      try {
        const persisted = await DomainEventModel.find({}, { _id: 0, __v: 0 })
          .sort({ occurredAt: -1 })
          .limit(20)
          .lean();
        if (persisted && persisted.length > 0) return persisted;
      } catch (err) {
        // En caso de fallo de lectura de eventos en Mongo, recurre al bus en memoria
      }
    }
    return bus.list().slice(-20).reverse();
  });

  return app;
}
