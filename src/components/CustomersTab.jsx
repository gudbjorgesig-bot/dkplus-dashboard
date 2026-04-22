import { KpiCard, SectionHeader, Pagination, thStyle, PER_PAGE } from "./ui";

const FILTER_OPTIONS = [
  { id: "all",        label: "Öll" },
  { id: "active",     label: "Virk/ur" },
  { id: "no_project", label: "Engin verkefni" },
];

export default function CustomersTab({
  customerList, custSlice, filteredCustomers,
  custPage, setCustPage,
  activeCustomers, customersNoProjects,
  custSearch, setCustSearch,
  custFilter, setCustFilter,
  topCustomerDependency,
}) {
  const noProjectsSet = new Set(customersNoProjects.map(c => c.Name));
  const inactiveCount = customerList.length - activeCustomers.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Samtals"     value={customerList.length}          accent="#9ca3af" />
        <KpiCard label="Virkir"      value={activeCustomers.length}       accent="#10b981" />
        <KpiCard label="Óvirkir"     value={inactiveCount}                accent="#f59e0b" />
        <KpiCard label="Án verkefna" value={customersNoProjects.length}   sub="No active projects" accent={customersNoProjects.length > 0 ? "#ef4444" : "#9ca3af"} />
      </div>

      {topCustomerDependency && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 18px", fontSize: 13, color: "#991b1b" }}>
          ⚠️ <strong>Áhætta — einn viðskiptavinur stendur fyrir yfir 50% af skráðum tíma:</strong>
          {" "}{topCustomerDependency.name} · {topCustomerDependency.pct}%
        </div>
      )}

      {customersNoProjects.length > 0 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fcd34d", borderRadius: 10, padding: "12px 18px", fontSize: 13, color: "#92400e" }}>
          <strong>⚠️ {customersNoProjects.length} viðskiptavin(ar) án tengdra verkefna: </strong>
          {customersNoProjects.slice(0, 5).map(c => c.Name).join(", ")}
          {customersNoProjects.length > 5 && ` og ${customersNoProjects.length - 5} fleiri`}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={custSearch}
            onChange={e => { setCustSearch(e.target.value); setCustPage(0); }}
            placeholder="Leita að viðskiptavini..."
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
          />
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.id}
              onClick={() => { setCustFilter(f.id); setCustPage(0); }}
              style={{
                padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: custFilter === f.id ? "none" : "1px solid #e5e7eb",
                background: custFilter === f.id ? "#6366f1" : "#fff",
                color: custFilter === f.id ? "#fff" : "#374151",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        <SectionHeader title={`Viðskiptavinir (${filteredCustomers.length}${filteredCustomers.length !== customerList.length ? ` af ${customerList.length}` : ""})`} />
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead>
            <tr>{["Númer","Nafn","Staða","Verkefni"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {custSlice.map((c, i) => {
              const noProj = noProjectsSet.has(c.Name);
              return (
                <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: noProj ? "#fffbeb" : "transparent" }}>
                  <td style={{ padding: "8px 8px 8px 0", color: "#9ca3af" }}>{c.Number || "—"}</td>
                  <td style={{ padding: "8px 8px 8px 0", color: "#111827", fontWeight: 600 }}>{c.Name || "—"}</td>
                  <td style={{ padding: "8px 8px 8px 0" }}>
                    <span style={{
                      background: (c.Status ?? 0) === 0 ? "#dcfce7" : "#f3f4f6",
                      color:      (c.Status ?? 0) === 0 ? "#166534" : "#6b7280",
                      padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                    }}>
                      {(c.Status ?? 0) === 0 ? "Virk/ur" : "Óvirk/ur"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 0" }}>
                    {noProj
                      ? <span style={{ background: "#fef9c3", color: "#92400e", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Engin verkefni</span>
                      : <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>✓ Tengt</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={custPage} setPage={setCustPage} total={filteredCustomers.length} perPage={PER_PAGE} />
      </div>
    </div>
  );
}
