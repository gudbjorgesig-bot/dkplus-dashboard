import { SectionHeader, Pagination, thStyle, formatDate, PER_PAGE } from "./ui";
import { THRESHOLDS } from "../api";

function activityLabel(lastMs) {
  if (!lastMs) return { label: "Engin virkni", bg: "#fce7f3", color: "#9d174d" };
  const days = Math.floor((Date.now() - lastMs) / 86400000);
  if (days > THRESHOLDS.inactiveDays)         return { label: `${days} d. síðan`, bg: "#fce7f3", color: "#9d174d" };
  if (days > THRESHOLDS.activityCriticalDays) return { label: `${days} d. síðan`, bg: "#fee2e2", color: "#991b1b" };
  if (days > THRESHOLDS.activityWarningDays)  return { label: `${days} d. síðan`, bg: "#fef3c7", color: "#92400e" };
  return { label: formatDate(new Date(lastMs)), bg: "#dcfce7", color: "#166534" };
}

export default function EmployeesTab({
  empList, empSlice,
  empPage, setEmpPage,
  activeEmp, activeRecorders,
  recorderPct, pctBarColor,
  lastClockByEmployee, inactiveEmployees,
}) {
  const inactiveSet = new Set(inactiveEmployees.map(e => e.Number));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Participation bar + warnings */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>Þátttaka síðustu 30 daga:</span>
          <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 999, height: 10 }}>
            <div style={{ width: `${Math.min(recorderPct, 100)}%`, height: "100%", borderRadius: 999, background: pctBarColor }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>
            {activeRecorders.size}/{activeEmp.length} ({Math.round(recorderPct)}%)
          </span>
        </div>
        {recorderPct < THRESHOLDS.participationLowPct && (
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#92400e", fontWeight: 600 }}>
            ⚠️ Möguleg vandamál — færri en 50% starfsmanna skrá tíma
          </p>
        )}
        {inactiveEmployees.length > 0 && (
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#9d174d", fontWeight: 600 }}>
            ⚠️ {inactiveEmployees.length} virkir starfsmenn án skráningar síðustu {THRESHOLDS.inactiveDays} daga — merkt með bleiku
          </p>
        )}
      </div>

      {/* Employee table */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
        <SectionHeader title={`Starfsmenn (${empList.length})`} />
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead>
            <tr>{["Númer","Nafn","Staða","Skráði síðustu 30 d.","Síðasta skráning"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {empSlice.map((e, i) => {
              const recorded  = activeRecorders.has(e.Number);
              const act       = activityLabel(lastClockByEmployee[e.Number]);
              const isInactive = inactiveSet.has(e.Number);
              return (
                <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: isInactive ? "#fdf2f8" : "transparent" }}>
                  <td style={{ padding: "8px 8px 8px 0", color: "#9ca3af" }}>{e.Number || "—"}</td>
                  <td style={{ padding: "8px 8px 8px 0", color: "#111827", fontWeight: 600 }}>{e.Name || "—"}</td>
                  <td style={{ padding: "8px 8px 8px 0" }}>
                    <span style={{ background: e.Status === 0 ? "#dcfce7" : "#f3f4f6", color: e.Status === 0 ? "#166534" : "#6b7280", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {e.Status === 0 ? "Virk/ur" : "Óvirk/ur"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 8px 8px 0" }}>
                    <span style={{ background: recorded ? "#dcfce7" : "#fef9c3", color: recorded ? "#166534" : "#92400e", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {recorded ? "✓ Já" : "✗ Nei"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 0" }}>
                    <span style={{ background: act.bg, color: act.color, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                      {act.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={empPage} setPage={setEmpPage} total={empList.length} perPage={PER_PAGE} />
      </div>
    </div>
  );
}
