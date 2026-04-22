import { KpiCard, StatusBadge, SectionHeader, thStyle, formatDate } from "./ui";
import { THRESHOLDS } from "../api";

export default function OverviewTab({
  activeEmp, empList,
  clockList, recentClock, totalHours, sortedClock,
  activeProjects, projectList,
  customerList, activeCustomers, customersNoProjects,
  latestClock,
  actSt, actNote,
  useSt, useNote, useDetail,
  recorderPct, pctBarColor,
  topEmployees, topCustomersByActivity, topCustomerDependency,
  errors,
}) {
  const custSt   = customersNoProjects.length === 0 ? "active" : customersNoProjects.length < 3 ? "low_activity" : "issue";
  const custNote = customersNoProjects.length === 0
    ? "Allir viðskiptavinir tengjast verkefnum"
    : `${customersNoProjects.length} viðskm. án verkefna`;
  const custDetail = `${activeCustomers.length} virkir af ${customerList.length} samtals`;

  const statusCards = [
    {
      title: "Tímaskráningavirkni",
      status: actSt,
      note: actNote,
      detail: latestClock ? `Síðasta: ${formatDate(latestClock)}` : "Engar skráningar",
      icon: "⏱",
    },
    {
      title: "Þátttaka starfsmanna",
      status: useSt,
      note: useNote,
      detail: useDetail,
      icon: "👥",
    },
    {
      title: "Viðskiptavinir",
      status: custSt,
      note: custNote,
      detail: custDetail,
      icon: "🏢",
    },
    {
      title: "Gagnagæði",
      status: clockList.length > 0 && empList.length > 0 ? "active" : "low_activity",
      note: "API tenging virk",
      detail: `${empList.length} starfsm · ${projectList.length} verk · ${customerList.length} viðskm · ${clockList.length} skr.`,
      icon: "✓",
    },
  ];

  const statusBg     = { active: "#f0fdf4", low_activity: "#fffbeb", no_activity: "#fef2f2", healthy: "#eff6ff", warning: "#fef2f2", issue: "#fffbeb" };
  const statusBorder = { active: "#86efac", low_activity: "#fcd34d", no_activity: "#fca5a5", healthy: "#93c5fd", warning: "#fca5a5", issue: "#fcd34d" };

  const topEmpMax  = topEmployees[0]?.hours || 1;
  const topCustMax = topCustomersByActivity[0]?.totalHours || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KpiCard label="Starfsmenn (virkir)"    value={activeEmp.length}       sub={`${empList.length} samtals`}            accent="#6366f1" />
        <KpiCard label="Tímaskr. síðustu 30 d." value={recentClock.length}     sub={`${Math.round(totalHours)}h samtals`}   accent="#10b981" />
        <KpiCard label="Virk verkefni"           value={activeProjects.length}  sub={`${projectList.length} samtals`}        accent="#3b82f6" />
        <KpiCard label="Viðskiptavinir (virkir)" value={activeCustomers.length} sub={`${customerList.length} samtals`}       accent="#f59e0b" />
      </div>

      {/* Stöðumat */}
      <div>
        <SectionHeader title="Stöðumat" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {statusCards.map(({ title, status, note, detail, icon }) => (
            <div key={title} style={{ background: statusBg[status] || "#f9fafb", border: `1px solid ${statusBorder[status] || "#e5e7eb"}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#374151" }}>{title}</p>
                  <StatusBadge status={status} />
                </div>
                <span style={{ fontSize: 22 }}>{icon}</span>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "#374151" }}>{note}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Þátttaka progress bar */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
        <SectionHeader title="Þátttaka starfsmanna síðustu 30 daga" />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 999, height: 14 }}>
            <div style={{ width: `${Math.min(recorderPct, 100)}%`, height: "100%", borderRadius: 999, background: pctBarColor, transition: "width 0.5s ease" }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", minWidth: 56 }}>{Math.round(recorderPct)}%</span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#16a34a", fontWeight: 600 }}>🟢 ≥{THRESHOLDS.participationGoodPct}% Góð þátttaka</span>
          <span style={{ color: "#d97706", fontWeight: 600 }}>🟡 {THRESHOLDS.participationLowPct}–{THRESHOLDS.participationGoodPct - 1}% Undir meðallagi</span>
          <span style={{ color: "#ea580c", fontWeight: 600 }}>🟠 {THRESHOLDS.participationIssuePct}–{THRESHOLDS.participationLowPct - 1}% Athuga</span>
          <span style={{ color: "#dc2626", fontWeight: 600 }}>🔴 &lt;{THRESHOLDS.participationIssuePct}% Mjög lág</span>
        </div>
      </div>

      {/* Top employees + top customers — side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Virkustu starfsmenn */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
          <SectionHeader title="Virkustu starfsmenn" />
          {topEmployees.length === 0
            ? <p style={{ color: "#9ca3af", fontSize: 13 }}>Engar skráningar</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topEmployees.map(({ emp, hours, name }) => (
                  <div key={emp}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#374151", fontWeight: 600 }}>{name}</span>
                      <span style={{ color: "#6b7280", fontWeight: 700 }}>{Math.round(hours)}h</span>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8 }}>
                      <div style={{ width: `${(hours / topEmpMax) * 100}%`, height: "100%", borderRadius: 999, background: "#6366f1" }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Virkustu viðskiptavinir */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
          <SectionHeader title="Virkustu viðskiptavinir" />
          {topCustomersByActivity.length === 0
            ? <p style={{ color: "#9ca3af", fontSize: 13 }}>Engar skráningar</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topCustomersByActivity.map(({ name, projectCount, totalHours }) => (
                  <div key={name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#374151", fontWeight: 600 }}>{name}</span>
                      <span style={{ color: "#6b7280", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {projectCount} verk · {Math.round(totalHours)}h
                      </span>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8 }}>
                      <div style={{ width: `${(totalHours / topCustMax) * 100}%`, height: "100%", borderRadius: 999, background: "#f59e0b" }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Mini tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
          <SectionHeader title="Nýjustu skráningar" />
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead><tr>{["Starfsm.","Upphaf","Tímar"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {sortedClock.slice(0, 6).map((e, i) => {
                const sus = Number(e.TotalHours || 0) > THRESHOLDS.suspiciousHours;
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: sus ? "#fef9c3" : "transparent" }}>
                    <td style={{ padding: "7px 8px 7px 0", color: "#374151", fontWeight: 500 }}>{e.Employee || "—"}</td>
                    <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{formatDate(e.Start)}</td>
                    <td style={{ padding: "7px 0", color: sus ? "#b45309" : "#111827", fontWeight: 700 }}>
                      {e.TotalHours != null ? `${Number(e.TotalHours).toFixed(1)}h` : "—"}{sus && " ⚠️"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
          <SectionHeader title="Viðskiptavinir án verkefna" />
          {customersNoProjects.length === 0
            ? <p style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>✓ Allir viðskiptavinir tengjast verkefnum</p>
            : (
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead><tr>{["Nafn","Staða"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {customersNoProjects.slice(0, 6).map((c, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "7px 8px 7px 0", color: "#374151", fontWeight: 500 }}>{c.Name || "—"}</td>
                      <td style={{ padding: "7px 0" }}>
                        <span style={{ background: "#fef9c3", color: "#92400e", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          Engin verkefni
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>

      {errors?.length > 0 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#92400e" }}>
          <strong>Sumir endpoints svöruðu ekki: </strong>{errors.join(" | ")}
        </div>
      )}
    </div>
  );
}
