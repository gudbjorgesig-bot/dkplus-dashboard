import { KpiCard, SectionHeader, Pagination, thStyle, formatDate, PER_PAGE } from "./ui";

const FILTER_OPTIONS = [
  { id: "all",    label: "Öll" },
  { id: "active", label: "Virk" },
  { id: "closed", label: "Lokið" },
];

export default function ProjectsTab({
  projectList, filteredProjects, projSlice,
  activeProjects, activeProjectsNoHours,
  projPage, setProjPage,
  projSearch, setProjSearch,
  projFilter, setProjFilter,
  projHoursMap,
}) {
  const totalLoggedHours   = Object.values(projHoursMap).reduce((s, h) => s + h, 0);
  const noHoursSet         = new Set(activeProjectsNoHours.map(p => p.Number || String(p.Id)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Samtals"       value={projectList.length}                         accent="#9ca3af" />
        <KpiCard label="Virk"          value={activeProjects.length}                      accent="#3b82f6" />
        <KpiCard label="Lokið"         value={projectList.length - activeProjects.length} accent="#f59e0b" />
        <KpiCard label="Engin virkni"  value={activeProjectsNoHours.length}               sub="Virk, 0 tímar skráðir" accent={activeProjectsNoHours.length > 0 ? "#ef4444" : "#9ca3af"} />
      </div>

      {activeProjectsNoHours.length > 0 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fcd34d", borderRadius: 10, padding: "12px 18px", fontSize: 13, color: "#92400e" }}>
          <strong>⚠️ {activeProjectsNoHours.length} virk verkefni með engar tímaskráningar</strong>
          {" — "}samtals {Math.round(totalLoggedHours)}h skráð á öll verkefni. Merktar með gulum bakgrunni.
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={projSearch}
            onChange={e => { setProjSearch(e.target.value); setProjPage(0); }}
            placeholder="Leita að verkefni..."
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
          />
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.id}
              onClick={() => { setProjFilter(f.id); setProjPage(0); }}
              style={{
                padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: projFilter === f.id ? "none" : "1px solid #e5e7eb",
                background: projFilter === f.id ? "#6366f1" : "#fff",
                color: projFilter === f.id ? "#fff" : "#374151",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        <SectionHeader title="Verkefni" />
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead>
            <tr>{["Númer","Heiti","Viðskiptavinur","Skr. tímar","Staða","Stofnað"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {projSlice.map((p, i) => {
              const hours    = projHoursMap[p.Number] || projHoursMap[String(p.Id)] || 0;
              const noHours  = noHoursSet.has(p.Number || String(p.Id));
              return (
                <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: noHours ? "#fefce8" : "transparent" }}>
                  <td style={{ padding: "7px 8px 7px 0", color: "#9ca3af" }}>{p.Number || "—"}</td>
                  <td style={{ padding: "7px 8px 7px 0", color: "#111827", fontWeight: 600 }}>{p.Name || "—"}</td>
                  <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{p.CustomerNameToBill || "—"}</td>
                  <td style={{ padding: "7px 8px 7px 0" }}>
                    {noHours
                      ? <span style={{ background: "#fef9c3", color: "#92400e", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Engin virkni</span>
                      : <span style={{ color: "#374151", fontWeight: 700 }}>{Math.round(hours)}h</span>
                    }
                  </td>
                  <td style={{ padding: "7px 8px 7px 0" }}>
                    <span style={{ background: p.JobStatus === 0 ? "#dbeafe" : "#f3f4f6", color: p.JobStatus === 0 ? "#1e40af" : "#6b7280", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {p.JobStatus === 0 ? "Virkt" : "Lokið"}
                    </span>
                  </td>
                  <td style={{ padding: "7px 0", color: "#9ca3af" }}>{formatDate(p.FoundingDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={projPage} setPage={setProjPage} total={filteredProjects.length} perPage={PER_PAGE} />
      </div>
    </div>
  );
}
