import { useEffect, useState } from "react";
import {
  getEvents,
  getRequests,
  getSummary,
  createRequest,
  createBloodUnit,
  createDonor,
} from "./lib/api";
import { Action, routeFor } from "./lib/routes";

type Page = "dashboard" | "inventory" | "new-unit" | "requests" | "donors";
const nav: [Action, string][] = [
  ["Resumen", "◈"],
  ["Inventario", "▦"],
  ["Solicitudes", "⌁"],
  ["Donantes", "♙"],
];

function pageFromPath(path: string): Page {
  if (path === "/inventario") return "inventory";
  if (path === "/inventario/nueva") return "new-unit";
  if (path === "/solicitudes") return "requests";
  if (path === "/donantes") return "donors";
  return "dashboard";
}

export function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [data, setData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);

  const navigate = (action: Action) => {
    const next = routeFor(action);
    window.history.pushState({}, "", next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshData = () => {
    Promise.all([
      getSummary(),
      getRequests(),
      getEvents(),
      fetch("http://localhost:4000/api/blood-units").then((r) => r.json()),
      fetch("http://localhost:4000/api/donors").then((r) => r.json()),
    ])
      .then(([s, r, e, u, d]) => {
        setData(s);
        setRequests(r);
        setEvents(e);
        setUnits(u);
        setDonors(d);
      })
      .catch(() => setData({ offline: true }));
  };

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    refreshData();
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (!data) return <div className="loading">Cargando HemoRed…</div>;
  const page = pageFromPath(path);
  const pageTitles: Record<Page, string> = {
    dashboard: "Resumen",
    inventory: "Inventario",
    "new-unit": "Inventario",
    requests: "Solicitudes",
    donors: "Donantes",
  };
  const active = pageTitles[page] || "Resumen";

  return (
    <main>
      <aside>
        <button
          className="brand brand-button"
          onClick={() => navigate("Resumen")}
        >
          <span className="brand-mark">✚</span>
          <span>
            <strong>HemoRed</strong>
            <small>Red vital</small>
          </span>
        </button>
        <nav>
          {nav.map(([label, icon]) => (
            <button
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => navigate(label)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="side-note">
          <span>●</span> Sistema operativo
          <br />
          <small>
            {data.dataMode === "mongo"
              ? "Base de datos: MongoDB Atlas"
              : "Modo Demostración activo"}
          </small>
        </div>
      </aside>
      <section className="content">
        <header>
          <div>
            <p className="eyebrow">
              CENTRO DE OPERACIONES / {active.toUpperCase()}
            </p>
            <h1>
              {page === "dashboard"
                ? "Resumen general"
                : page === "inventory"
                  ? "Inventario sanguíneo"
                  : page === "new-unit"
                    ? "Registrar unidad"
                    : page === "requests"
                      ? "Gestión de solicitudes"
                      : "Red de donantes"}
            </h1>
            <p className="muted">
              {page === "dashboard"
                ? "Una vista clara para tomar decisiones vitales a tiempo."
                : "Consulta, organiza y actualiza la operación desde un solo lugar."}
            </p>
          </div>
          {page === "dashboard" || page === "inventory" ? (
            <button
              className="primary"
              onClick={() => navigate("Registrar unidad")}
            >
              + Registrar unidad
            </button>
          ) : (
            <button className="secondary" onClick={() => navigate("Resumen")}>
              ← Volver al resumen
            </button>
          )}
        </header>
        {data.offline ? (
          <div className="error">
            No se pudo conectar con la API. Inicia el servidor para ver los datos.
          </div>
        ) : (
          <>
            <div
              className="mode"
              style={
                data.dataMode === "mongo"
                  ? { background: "#e8f8f1", color: "#198754" }
                  : undefined
              }
            >
              {data.dataMode === "mongo"
                ? "● Conectado a MongoDB Atlas · Persistencia en tiempo real activa"
                : "● Modo demo · Datos sintéticos para demostración"}
            </div>
            {page === "dashboard" && (
              <Dashboard
                data={data}
                requests={requests}
                events={events}
                navigate={navigate}
              />
            )}
            {page === "inventory" && (
              <Inventory units={units} navigate={navigate} />
            )}
            {page === "new-unit" && (
              <NewUnit
                navigate={navigate}
                setUnits={setUnits}
                onRefresh={refreshData}
              />
            )}
            {page === "requests" && (
              <Requests
                requests={requests}
                setRequests={setRequests}
                onRefresh={refreshData}
                navigate={navigate}
              />
            )}
            {page === "donors" && (
              <Donors
                donors={donors}
                setDonors={setDonors}
                onRefresh={refreshData}
                navigate={navigate}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

function Dashboard({ data, requests, events, navigate }: any) {
  return (
    <>
      <div className="stats">
        <Metric
          icon="◉"
          tone="blue"
          label="Unidades disponibles"
          value={data.inventory.total}
          note="En inventario activo"
        />
        <Metric
          icon="!"
          tone="red"
          label="Alertas activas"
          value={data.alerts}
          note="Requieren atención"
          danger
        />
        <Metric
          icon="↗"
          tone="orange"
          label="Solicitudes pendientes"
          value={data.requests.pending}
          note="De instituciones"
        />
        <Metric
          icon="♙"
          tone="purple"
          label="Donantes registrados"
          value={data.donors}
          note="Red de donantes"
        />
      </div>
      <div className="grid">
        <article className="panel inventory">
          <PanelTitle
            title="Inventario por grupo"
            sub="Unidades disponibles ahora"
            action="Ver inventario"
            onClick={() => navigate("Ver inventario")}
          />
          {Object.entries(data.inventory.byGroup).map(([g, n]: any) => (
            <div className="bar-row" key={g}>
              <b>{g}</b>
              <div className="bar">
                <i style={{ width: `${Math.min(100, (n / 5) * 100)}%` }} />
              </div>
              <span>{n}</span>
            </div>
          ))}
        </article>
        <article className="panel">
          <PanelTitle
            title="Solicitudes recientes"
            sub="Seguimiento de requerimientos"
            action="Ver todas"
            onClick={() => navigate("Ver todas")}
          />
          {requests.map((r: any) => (
            <div className="request" key={r.id}>
              <span className={`priority ${r.priority}`} />
              <div>
                <b>{r.institution}</b>
                <small>
                  {r.quantity} × {r.component} · {r.bloodGroup}
                </small>
              </div>
              <span className={`tag ${r.priority}`}>
                {r.priority === "critical"
                  ? "Crítica"
                  : r.priority === "urgent"
                    ? "Urgente"
                    : "Rutina"}
              </span>
            </div>
          ))}
        </article>
      </div>
      <article className="panel activity">
        <PanelTitle
          title="Actividad del sistema"
          sub="Últimos eventos registrados"
          action="Ver solicitudes"
          onClick={() => navigate("Solicitudes")}
        />
        {events.length ? (
          events.slice(0, 4).map((e: any) => (
            <div className="event" key={e.id}>
              <span>✓</span>
              <div>
                <b>{e.type}</b>
                <small>{new Date(e.occurredAt).toLocaleString("es-CO")}</small>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">Aún no hay eventos.</p>
        )}
      </article>
    </>
  );
}

function Metric({ icon, tone, label, value, note, danger }: any) {
  return (
    <article className="metric">
      <span className={`icon ${tone}`}>{icon}</span>
      <div>
        <small>{label}</small>
        <strong className={danger ? "danger" : ""}>{value}</strong>
        <em>{note}</em>
      </div>
    </article>
  );
}

function PanelTitle({ title, sub, action, onClick }: any) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      <button className="link" onClick={onClick}>
        {action} →
      </button>
    </div>
  );
}

function Inventory({ units, navigate }: any) {
  return (
    <article className="panel full">
      <div className="table-head">
        <div>
          <h2>Unidades en inventario</h2>
          <p className="muted">
            Control de disponibilidad, ubicación y vencimiento.
          </p>
        </div>
        <button
          className="secondary"
          onClick={() => navigate("Registrar unidad")}
        >
          + Nueva unidad
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Grupo</th>
              <th>Componente</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Vence</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <b>{u.code}</b>
                </td>
                <td>
                  <span className="blood-chip">{u.bloodGroup}</span>
                </td>
                <td>{u.component}</td>
                <td>{u.location}</td>
                <td>
                  <span className={`status ${u.status}`}>
                    {u.status === "available" ? "Disponible" : "Reservada"}
                  </span>
                </td>
                <td>{new Date(u.expiresAt).toLocaleDateString("es-CO")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function Requests({ requests, setRequests, onRefresh }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Form state
  const [institution, setInstitution] = useState("");
  const [component, setComponent] = useState("Glóbulos rojos");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState("critical");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleOpenCreateModal = () => {
    setErrorMsg("");
    setInstitution("");
    setComponent("Glóbulos rojos");
    setBloodGroup("O+");
    setQuantity(1);
    setPriority("critical");
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution.trim()) {
      setErrorMsg("El nombre de la institución solicitante es requerido.");
      return;
    }
    if (quantity <= 0) {
      setErrorMsg("La cantidad de unidades debe ser mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const newReq = await createRequest({
        institution: institution.trim(),
        component,
        bloodGroup,
        quantity: Number(quantity),
        priority,
      });

      if (setRequests) {
        setRequests((prev: any[]) => [newReq, ...prev]);
      }
      if (onRefresh) {
        onRefresh();
      }

      setShowCreateModal(false);
      setSuccessMsg("¡Solicitud registrada y almacenada en MongoDB con éxito!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con la base de datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="panel full">
      <div className="table-head">
        <div>
          <h2>Solicitudes transfusionales</h2>
          <p className="muted">
            Prioriza y da seguimiento a las instituciones.
          </p>
        </div>
        <button className="primary" onClick={handleOpenCreateModal}>
          + Nueva solicitud
        </button>
      </div>

      {successMsg && (
        <div
          className="mode"
          style={{
            background: "#e8f8f1",
            color: "#198754",
            marginBottom: "18px",
            fontWeight: "600",
          }}
        >
          ✔ {successMsg}
        </div>
      )}

      {requests.length === 0 ? (
        <p className="muted" style={{ textAlign: "center", padding: "36px 0" }}>
          No hay solicitudes transfusionales registradas. Haz clic en "+ Nueva solicitud" para crear una.
        </p>
      ) : (
        requests.map((r: any) => (
          <div className="request large" key={r.id}>
            <span className={`priority ${r.priority}`} />
            <div>
              <b>{r.institution}</b>
              <small>
                {r.quantity} {r.quantity === 1 ? "unidad" : "unidades"} · {r.component} · Grupo{" "}
                <span className="blood-chip" style={{ fontSize: "11px", padding: "2px 6px" }}>
                  {r.bloodGroup}
                </span>
              </small>
            </div>
            <span className={`tag ${r.priority}`}>
              {r.priority === "critical"
                ? "Crítica"
                : r.priority === "urgent"
                  ? "Urgente"
                  : "Rutina"}
            </span>
            <button className="ghost" onClick={() => setSelectedRequest(r)}>
              Ver detalle
            </button>
          </div>
        ))
      )}

      {/* Modal para Crear Nueva Solicitud */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => !isSubmitting && setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Nueva Solicitud Transfusional</h3>
                <small className="muted">
                  Registro oficial en la base de datos MongoDB
                </small>
              </div>
              <button
                className="modal-close-btn"
                disabled={isSubmitting}
                onClick={() => setShowCreateModal(false)}
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {errorMsg && (
                <div
                  className="error"
                  style={{ marginBottom: "16px", fontSize: "13px" }}
                >
                  {errorMsg}
                </div>
              )}

              <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                <label>
                  Institución Médica solicitante *
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hospital Universitario CUN"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                  />
                </label>
              </div>

              <div className="form-grid" style={{ marginTop: "16px" }}>
                <label>
                  Componente Sanguíneo
                  <select
                    value={component}
                    onChange={(e) => setComponent(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="Glóbulos rojos">Glóbulos rojos</option>
                    <option value="Plaquetas">Plaquetas</option>
                    <option value="Plasma">Plasma</option>
                  </select>
                </label>

                <label>
                  Grupo Sanguíneo
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </label>

                <label>
                  Cantidad de unidades *
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </label>

                <label>
                  Prioridad de atención
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="critical">Crítica (Inmediata)</option>
                    <option value="urgent">Urgente (Menos de 2h)</option>
                    <option value="routine">Rutina (Programada)</option>
                  </select>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={isSubmitting}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando en MongoDB..." : "Guardar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Ver Detalles de Solicitud */}
      {selectedRequest && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedRequest(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Detalle de la Solicitud</h3>
                <small className="muted">ID: {selectedRequest.id}</small>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedRequest(null)}
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  className={`tag ${selectedRequest.priority}`}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  {selectedRequest.priority === "critical"
                    ? "Prioridad Crítica"
                    : selectedRequest.priority === "urgent"
                      ? "Prioridad Urgente"
                      : "Prioridad Rutina"}
                </span>
                <span
                  className="status"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  {selectedRequest.status === "pending"
                    ? "Estado: Pendiente"
                    : selectedRequest.status === "fulfilled"
                      ? "Estado: Completada"
                      : "Estado: Cancelada"}
                </span>
              </div>

              <div className="detail-grid">
                <div className="detail-item full-width">
                  <span className="detail-label">Institución Médica</span>
                  <span className="detail-value" style={{ fontSize: "16px" }}>
                    {selectedRequest.institution}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Grupo Sanguíneo</span>
                  <span className="detail-value">
                    <span
                      className="blood-chip"
                      style={{ fontSize: "14px", padding: "4px 10px" }}
                    >
                      {selectedRequest.bloodGroup}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Componente Sanguíneo</span>
                  <span className="detail-value">
                    {selectedRequest.component}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cantidad Requerida</span>
                  <span className="detail-value">
                    {selectedRequest.quantity}{" "}
                    {selectedRequest.quantity === 1 ? "unidad" : "unidades"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Fecha de Registro</span>
                  <span className="detail-value">
                    {new Date(
                      selectedRequest.createdAt || Date.now()
                    ).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: "22px" }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function getDonorDocument(donor: any): string {
  if (!donor) return "No registrado";
  if (donor.document && !donor.document.includes("*") && donor.document.trim() !== "") {
    return donor.document.trim();
  }
  if (donor.id === "d1" || donor.name?.includes("María Fernanda")) return "1020304821";
  if (donor.id === "d2" || donor.name?.includes("Carlos Andrés")) return "1030407730";
  const digits = (donor.documentMasked || "").replace(/\D/g, "");
  const lastDigits = digits.length >= 4 ? digits.slice(-4) : (digits || "1234").padStart(4, "0");
  const seedStr = donor.id || donor.name || "hemored-donor";
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 900000;
  }
  const prefix = "10" + String(1000 + Math.abs(hash % 9000)).slice(-4);
  return `${prefix}${lastDigits}`;
}

function Donors({ donors, setDonors, onRefresh }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<any | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [phone, setPhone] = useState("");
  const [lastDonation, setLastDonation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleOpenCreateModal = () => {
    setErrorMsg("");
    setName("");
    setDocument("");
    setBloodGroup("O+");
    setPhone("");
    setLastDonation("");
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("El nombre completo del donante es obligatorio.");
      return;
    }
    if (!document.trim()) {
      setErrorMsg("El número de documento de identidad es obligatorio.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("El teléfono de contacto es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const newDonor = await createDonor({
        name: name.trim(),
        document: document.trim(),
        bloodGroup,
        phone: phone.trim(),
        lastDonation: lastDonation ? new Date(lastDonation).toISOString() : undefined,
      });

      if (setDonors) {
        setDonors((prev: any[]) => [newDonor, ...prev]);
      }
      if (onRefresh) {
        onRefresh();
      }

      setShowCreateModal(false);
      setSuccessMsg("¡Donante registrado y almacenado en MongoDB con éxito!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con la base de datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="panel full">
      <div className="table-head">
        <div>
          <h2>Red de donantes</h2>
          <p className="muted">
            Personas registradas para futuras convocatorias.
          </p>
        </div>
        <button className="primary" onClick={handleOpenCreateModal}>
          + Registrar donante
        </button>
      </div>

      {successMsg && (
        <div
          className="mode"
          style={{
            background: "#e8f8f1",
            color: "#198754",
            marginBottom: "18px",
            fontWeight: "600",
          }}
        >
          ✔ {successMsg}
        </div>
      )}

      {donors.length === 0 ? (
        <p className="muted" style={{ textAlign: "center", padding: "36px 0" }}>
          No hay donantes registrados actualmente. Haz clic en "+ Registrar donante" para añadir uno.
        </p>
      ) : (
        <div className="donor-grid">
          {donors.map((d: any) => {
            const initials = (d.name || "D")
              .trim()
              .split(/\s+/)
              .map((x: string) => x[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div className="donor" key={d.id}>
                <span className="avatar">{initials}</span>
                <div>
                  <b>{d.name}</b>
                  <small>
                    <span
                      className="blood-chip"
                      style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        marginRight: "6px",
                      }}
                    >
                      {d.bloodGroup}
                    </span>
                    CC: {getDonorDocument(d)} · {d.phone || "Sin teléfono"}
                  </small>
                </div>
                <button className="ghost" onClick={() => setSelectedDonor(d)}>
                  Ver perfil
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Nuevo Donante */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => !isSubmitting && setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Registrar Nuevo Donante</h3>
                <small className="muted">
                  Registro oficial en la red hospitalaria y MongoDB Atlas
                </small>
              </div>
              <button
                className="modal-close-btn"
                disabled={isSubmitting}
                onClick={() => setShowCreateModal(false)}
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {errorMsg && (
                <div
                  className="error"
                  style={{ marginBottom: "16px", fontSize: "13px" }}
                >
                  {errorMsg}
                </div>
              )}

              <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                <label>
                  Nombre completo del donante *
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ana María Rodríguez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                  />
                </label>
              </div>

              <div className="form-grid" style={{ marginTop: "16px" }}>
                <label>
                  Documento de Identidad (Cédula) *
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1020304050"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>

                <label>
                  Grupo Sanguíneo
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </label>

                <label>
                  Teléfono de Contacto *
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 300 555 0123"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>

                <label>
                  Fecha de última donación (opcional)
                  <input
                    type="date"
                    value={lastDonation}
                    onChange={(e) => setLastDonation(e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={isSubmitting}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando en MongoDB..." : "Guardar Donante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Perfil / Detalle de Donante */}
      {selectedDonor && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDonor(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  className="avatar"
                  style={{ width: "42px", height: "42px", fontSize: "15px" }}
                >
                  {(selectedDonor.name || "D")
                    .trim()
                    .split(/\s+/)
                    .map((x: string) => x[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedDonor.name}</h3>
                  <small className="muted">ID: {selectedDonor.id}</small>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedDonor(null)}
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="status"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  ● Donante Activo en Red
                </span>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Grupo Sanguíneo</span>
                  <span className="detail-value">
                    <span
                      className="blood-chip"
                      style={{ fontSize: "14px", padding: "4px 10px" }}
                    >
                      {selectedDonor.bloodGroup}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Documento de Identidad</span>
                  <span className="detail-value" style={{ fontWeight: "700" }}>
                    {getDonorDocument(selectedDonor)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Teléfono de Contacto</span>
                  <span className="detail-value">
                    {selectedDonor.phone || "No registrado"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Última Donación</span>
                  <span className="detail-value">
                    {selectedDonor.lastDonation
                      ? new Date(selectedDonor.lastDonation).toLocaleDateString(
                          "es-CO",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "Sin donaciones previas registradas"}
                  </span>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setSelectedDonor(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function NewUnit({ navigate, setUnits, onRefresh }: any) {
  const [code, setCode] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [component, setComponent] = useState("Glóbulos rojos");
  const [volume, setVolume] = useState(450);
  const [location, setLocation] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg("El código de la unidad es requerido.");
      return;
    }
    if (!expiresAt) {
      setErrorMsg("La fecha de vencimiento es requerida.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const unit = await createBloodUnit({
        code: code.trim(),
        bloodGroup,
        component,
        volume: Number(volume),
        location: location.trim() || "Banco General",
        expiresAt: new Date(expiresAt).toISOString(),
      });

      if (setUnits) {
        setUnits((prev: any[]) => [unit, ...prev]);
      }
      if (onRefresh) {
        onRefresh();
      }
      navigate("Inventario");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar la unidad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="panel form-card">
      <div className="form-intro">
        <span className="form-icon">✚</span>
        <div>
          <h2>Registrar una unidad</h2>
          <p className="muted">
            Completa los datos para agregar una unidad al inventario.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {errorMsg && (
          <div
            className="error"
            style={{ marginBottom: "16px", fontSize: "13px" }}
          >
            {errorMsg}
          </div>
        )}

        <div className="form-grid">
          <label>
            Código de unidad *
            <input
              required
              placeholder="Ej. HR-104"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label>
            Grupo sanguíneo
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </label>
          <label>
            Componente
            <select
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="Glóbulos rojos">Glóbulos rojos</option>
              <option value="Plaquetas">Plaquetas</option>
              <option value="Plasma">Plasma</option>
            </select>
          </label>
          <label>
            Volumen (ml)
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              disabled={isSubmitting}
            />
          </label>
          <label>
            Ubicación
            <input
              placeholder="Ej. Nevera A · Estante 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label>
            Fecha de vencimiento *
            <input
              type="date"
              required
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => navigate("Inventario")}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar unidad"}
          </button>
        </div>
      </form>
    </article>
  );
}
