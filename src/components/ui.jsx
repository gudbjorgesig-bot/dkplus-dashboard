export const PER_PAGE = 60;

export const thStyle = {
  textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: 11,
  textTransform: "uppercase", padding: "0 8px 10px 0", letterSpacing: "0.05em",
};

export function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt) || dt.getFullYear() < 2000) return "—";
  return dt.toLocaleDateString("is-IS", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function daysSince(d) {
  if (!d) return 999;
  const dt = new Date(d);
  if (isNaN(dt)) return 999;
  return Math.floor((Date.now() - dt.getTime()) / 86400000);
}

export function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", borderLeft: `4px solid ${accent}`, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 13, color: "#6b7280" }}>{sub}</span>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const cfg = {
    active:       { bg: "#d1fae5", color: "#065f46", label: "Virkt" },
    low_activity: { bg: "#fef3c7", color: "#92400e", label: "Lítil virkni" },
    no_activity:  { bg: "#fee2e2", color: "#991b1b", label: "Engin virkni" },
    healthy:      { bg: "#dbeafe", color: "#1e3a8a", label: "Eðlilegt" },
    warning:      { bg: "#fee2e2", color: "#991b1b", label: "Athugið" },
    issue:        { bg: "#fef3c7", color: "#92400e", label: "Möguleg vandamál" },
  }[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

export function SectionHeader({ title }) {
  return <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h2>;
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

export function Pagination({ page, setPage, total, perPage }) {
  const totalPages = Math.ceil(total / perPage);
  if (total <= perPage) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13 }}>
      <button
        onClick={() => setPage(p => Math.max(0, p - 1))}
        disabled={page === 0}
        style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: page === 0 ? "not-allowed" : "pointer", color: page === 0 ? "#9ca3af" : "#374151", fontWeight: 600 }}>
        ← Fyrri
      </button>
      <span style={{ color: "#6b7280" }}>Síða {page + 1} af {totalPages}</span>
      <button
        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
        disabled={page >= totalPages - 1}
        style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", color: page >= totalPages - 1 ? "#9ca3af" : "#374151", fontWeight: 600 }}>
        Næsta →
      </button>
      <span style={{ color: "#9ca3af", marginLeft: 4 }}>{total} samtals</span>
    </div>
  );
}
