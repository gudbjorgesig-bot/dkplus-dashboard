import { KpiCard, SectionHeader, Pagination, thStyle, formatDate, PER_PAGE } from "./ui";
import { THRESHOLDS } from "../api";

export default function ClockTab({
  clockList, clockSlice,
  clockPage, setClockPage,
  recentClock, totalHours,
  suspiciousEntries,
}) {
  const maxSuspicious = suspiciousEntries.length > 0
    ? Math.round(Number(suspiciousEntries[0].TotalHours))
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="Samtals"          value={clockList.length}              accent="#6366f1" />
        <KpiCard label="Síðustu 30 dagar" value={recentClock.length}           accent="#10b981" />
        <KpiCard label="Heildartímar"     value={`${Math.round(totalHours)}h`} accent="#f59e0b" />
      </div>

      {suspiciousEntries.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#991b1b" }}>
          <strong>⚠️ Athugið: </strong>
          {suspiciousEntries.length} skráning(ar) með yfir {THRESHOLDS.suspiciousHours} tíma.
          Hæsta: <strong>{maxSuspicious}h</strong> — starfsmaður {suspiciousEntries[0]?.Employee}. Merktar með gulum bakgrunni.
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
        <SectionHeader title="Tímaskráningar" />
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead>
            <tr>{["Starfsmaður","Upphaf","Lok","Tímar","Verkefni","Athugasemd"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {clockSlice.map((e, i) => {
              const sus = Number(e.TotalHours || 0) > THRESHOLDS.suspiciousHours;
              return (
                <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: sus ? "#fef9c3" : "transparent" }}>
                  <td style={{ padding: "7px 8px 7px 0", color: "#374151", fontWeight: 600 }}>{e.Employee || "—"}</td>
                  <td style={{ padding: "7px 8px 7px 0", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(e.Start)}</td>
                  <td style={{ padding: "7px 8px 7px 0", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(e.End)}</td>
                  <td style={{ padding: "7px 8px 7px 0", fontWeight: 700, color: sus ? "#b45309" : "#111827" }}>
                    {e.TotalHours != null ? `${Number(e.TotalHours).toFixed(1)}h` : "—"}{sus && " ⚠️"}
                  </td>
                  <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{e.Project || "—"}</td>
                  <td style={{ padding: "7px 0", color: "#9ca3af", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.Comment || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={clockPage} setPage={setClockPage} total={clockList.length} perPage={PER_PAGE} />
      </div>
    </div>
  );
}
