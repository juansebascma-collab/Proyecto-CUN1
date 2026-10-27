const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function getSummary() {
  const r = await fetch(base + '/api/dashboard/summary');
  return r.json();
}

export async function getRequests() {
  const r = await fetch(base + '/api/transfusion-requests');
  return r.json();
}

export async function createRequest(payload: {
  institution: string;
  component: string;
  bloodGroup: string;
  quantity: number;
  priority: string;
}) {
  const r = await fetch(base + '/api/transfusion-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'Error al crear la solicitud');
  }
  return r.json();
}

export async function getEvents() {
  const r = await fetch(base + '/api/events');
  return r.json();
}

export async function getBloodUnits() {
  const r = await fetch(base + '/api/blood-units');
  return r.json();
}

export async function createBloodUnit(payload: any) {
  const r = await fetch(base + '/api/blood-units', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'Error al registrar unidad');
  }
  return r.json();
}

export async function getDonors() {
  const r = await fetch(base + '/api/donors');
  return r.json();
}

export async function createDonor(payload: any) {
  const r = await fetch(base + '/api/donors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'Error al registrar donante');
  }
  return r.json();
}
