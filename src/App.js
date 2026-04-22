import { useState, useEffect, useCallback } from "react";
import { apiFetch, extract, THRESHOLDS } from "./api";
import { Spinner, daysSince, PER_PAGE } from "./components/ui";
import OverviewTab   from "./components/OverviewTab";
import EmployeesTab  from "./components/EmployeesTab";
import ProjectsTab   from "./components/ProjectsTab";
import CustomersTab  from "./components/CustomersTab";

export default function App() {
  const [loading, setLoading]       = useState(true);
  const [data, setData]             = useState(null);
  const [now, setNow]               = useState(() => new Date());
  const [tab, setTab]               = useState("overview");
  const [projPage, setProjPage]     = useState(0);
  const [empPage, setEmpPage]       = useState(0);
  const [custPage, setCustPage]     = useState(0);
  const [projSearch, setProjSearch] = useState("");
  const [projFilter, setProjFilter] = useState("all");
  const [custSearch, setCustSearch] = useState("");
  const [custFilter, setCustFilter] = useState("all");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, clockRes, projRes, custRes] = await Promise.allSettled([
        apiFetch("/general/employee?pageSize=500"),
        apiFetch("/TimeClock/entries?pageSize=500"),
        apiFetch("/project?pageSize=500"),
        apiFetch("/customer?pageSize=500"),
      ]);
      setData({
        employees: empRes.status   === "fulfilled" ? empRes.value   : null,
        clock:     clockRes.status === "fulfilled" ? clockRes.value : null,
        projects:  projRes.status  === "fulfilled" ? projRes.value  : null,
        customers: custRes.status  === "fulfilled" ? custRes.value  : null,
        errors: [empRes, clockRes, projRes, custRes]
          .filter(r => r.status !== "fulfilled")
          .map(r => r.reason?.message),
      });
      setProjPage(0);
      setEmpPage(0);
      setCustPage(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Raw lists ──
  const empList      = extract(data?.employees, ["employees","items","data"]);
  const clockList    = extract(data?.clock,     ["entries","items","data"]);
  const projectList  = extract(data?.projects,  ["projects","items","data"]);
  const customerList = extract(data?.customers, ["customers","items","data"]);

  // ── Derived metrics ──
  const activeEmp      = empList.filter(e => (e.Status ?? 0) === 0);
  const cut30          = Date.now() - THRESHOLDS.activityCriticalDays * 86400000;
  const recentClock    = clockList.filter(e => new Date(e.Start || 0).getTime() > cut30);
  const clockDates     = clockList.map(e => new Date(e.Start || 0)).filter(d => !isNaN(d) && d.getFullYear() > 2000);
  const latestClock    = clockDates.length ? new Date(Math.max(...clockDates.map(x => x.getTime()))) : null;
  const dSince         = latestClock ? daysSince(latestClock) : 999;
  const activeRecorders = new Set(recentClock.map(e => e.Employee));
  const totalHours     = clockList.reduce((s, e) => s + Number(e.TotalHours || 0), 0);
  const activeProjects = projectList.filter(p => (p.JobStatus ?? 0) === 0);
  const activeCustomers = customerList.filter(c => (c.Status ?? 0) === 0);

  // Per-employee last clock date (for activity column)
  const lastClockByEmployee = {};
  clockList.forEach(e => {
    if (!e.Employee) return;
    const t = new Date(e.Start || 0).getTime();
    if (!isNaN(t) && t > 946684800000 &&
        (!lastClockByEmployee[e.Employee] || t > lastClockByEmployee[e.Employee])) {
      lastClockByEmployee[e.Employee] = t;
    }
  });

  // Active employees with no clock entry in 90 days
  const cut90 = Date.now() - THRESHOLDS.inactiveDays * 86400000;
  const inactiveEmployees = activeEmp.filter(e =>
    !lastClockByEmployee[e.Number] || lastClockByEmployee[e.Number] < cut90
  );

  // Project hours map
  const projHoursMap = {};
  clockList.forEach(e => {
    if (e.Project) projHoursMap[e.Project] = (projHoursMap[e.Project] || 0) + Number(e.TotalHours || 0);
  });

  // Active projects with zero hours logged
  const activeProjectsNoHours = activeProjects.filter(p =>
    !(projHoursMap[p.Number] || projHoursMap[String(p.Id)])
  );

  // Customers with no linked projects (matched by name or number)
  const customersWithProjects = new Set();
  projectList.forEach(p => {
    if (p.CustomerNameToBill) customersWithProjects.add(p.CustomerNameToBill);
    if (p.CustomerNumber)     customersWithProjects.add(String(p.CustomerNumber));
    if (p.Customer)           customersWithProjects.add(String(p.Customer));
  });
  const customersNoProjects = customerList.filter(
    c => !customersWithProjects.has(c.Name) && !customersWithProjects.has(String(c.Number || ""))
  );

  const filteredProjects = projectList.filter(p => {
    const matchesSearch =
      (p.Name || "").toLowerCase().includes(projSearch.toLowerCase()) ||
      (p.Number || "").toLowerCase().includes(projSearch.toLowerCase()) ||
      (p.CustomerNameToBill || "").toLowerCase().includes(projSearch.toLowerCase());
    const isActive = (p.JobStatus ?? 0) === 0;
    const matchesFilter =
      projFilter === "all" ||
      (projFilter === "active" && isActive) ||
      (projFilter === "closed" && !isActive);
    return matchesSearch && matchesFilter;
  });


  // ── Business logic ──
  let actSt = "active", actNote = "Reglulegar tímaskráningar";
  if (dSince > THRESHOLDS.activityCriticalDays)     { actSt = "no_activity";  actNote = `Engar færslur síðustu ${THRESHOLDS.activityCriticalDays} daga`; }
  else if (dSince > THRESHOLDS.activityWarningDays) { actSt = "low_activity"; actNote = `Síðasta færsla fyrir ${dSince} dögum`; }

  const recorderPct = activeEmp.length > 0 ? (activeRecorders.size / activeEmp.length) * 100 : 100;
  let useSt = "active", useNote = "";
  if      (recorderPct >= THRESHOLDS.participationGoodPct)  { useSt = "active";       useNote = "Góð þátttaka — meirihluti skráir tíma"; }
  else if (recorderPct >= THRESHOLDS.participationLowPct)   { useSt = "low_activity"; useNote = "Undir meðallagi — yfir helmingur skráir"; }
  else if (recorderPct >= THRESHOLDS.participationIssuePct) { useSt = "issue";        useNote = "Athuga — minnihluti skráir"; }
  else                                                       { useSt = "no_activity";  useNote = "Mjög lág þátttaka — aðgerð gæti þurft"; }
  const useDetail = `${activeRecorders.size} af ${activeEmp.length} (${Math.round(recorderPct)}%) skráðu síðustu ${THRESHOLDS.activityCriticalDays} daga`;

  const pctBarColor = recorderPct >= THRESHOLDS.participationGoodPct  ? "#22c55e"
                    : recorderPct >= THRESHOLDS.participationLowPct   ? "#f59e0b"
                    : recorderPct >= THRESHOLDS.participationIssuePct ? "#f97316"
                    : "#ef4444";

  // ── Top 5 employees by total hours ──
  const empHoursMap = {};
  clockList.forEach(e => {
    if (e.Employee) empHoursMap[e.Employee] = (empHoursMap[e.Employee] || 0) + Number(e.TotalHours || 0);
  });
  const topEmployees = Object.entries(empHoursMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emp, hours]) => {
      const info = empList.find(e => e.Number === emp);
      return { emp, hours, name: info?.Name || emp };
    });

  // ── Top 5 customers by projects linked and total hours ──
  const custStatsMap = {};
  projectList.forEach(p => {
    const key = p.CustomerNameToBill || "—";
    if (!custStatsMap[key]) custStatsMap[key] = { projectCount: 0, totalHours: 0 };
    custStatsMap[key].projectCount++;
    custStatsMap[key].totalHours += projHoursMap[p.Number] || projHoursMap[String(p.Id)] || 0;
  });
  const topCustomersByActivity = Object.entries(custStatsMap)
    .sort((a, b) => b[1].totalHours - a[1].totalHours || b[1].projectCount - a[1].projectCount)
    .slice(0, 5)
    .map(([name, { projectCount, totalHours }]) => ({ name, projectCount, totalHours }));

  // Flag if one customer drives > 50% of all logged hours
  const topCust = topCustomersByActivity[0];
  const topCustomerDependency = topCust && totalHours > 0 && (topCust.totalHours / totalHours) > 0.5
    ? { name: topCust.name, pct: Math.round((topCust.totalHours / totalHours) * 100) }
    : null;

  const filteredCustomers = customerList.filter(c => {
    const q = custSearch.toLowerCase();
    const matchesSearch = (c.Name || "").toLowerCase().includes(q) ||
                          String(c.Number || "").toLowerCase().includes(q);
    const hasNoProjects = !customersWithProjects.has(c.Name) &&
                          !customersWithProjects.has(String(c.Number || ""));
    const matchesFilter =
      custFilter === "all" ||
      (custFilter === "active"     && (c.Status ?? 0) === 0) ||
      (custFilter === "no_project" && hasNoProjects);
    return matchesSearch && matchesFilter;
  });

  // ── Paginated slices ──
  const sortedClock    = [...clockList].sort((a, b) => new Date(b.Start || 0) - new Date(a.Start || 0));
  const empSlice       = empList.slice(empPage * PER_PAGE, empPage * PER_PAGE + PER_PAGE);
  const projSlice      = filteredProjects.slice(projPage * PER_PAGE, projPage * PER_PAGE + PER_PAGE);
  const custSlice      = filteredCustomers.slice(custPage * PER_PAGE, custPage * PER_PAGE + PER_PAGE);

  const tabs = [
    { id: "overview",   label: "Yfirlit" },
    { id: "employees",  label: `Starfsmenn (${empList.length})` },
    { id: "projects",   label: `Verkefni (${projectList.length})` },
    { id: "customers",  label: `Viðskiptavinir (${customerList.length})` },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "24px 32px", maxWidth: 980, margin: "0 auto", background: "#f9fafb", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>dk</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>dkPlus Dashboard</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>ERP yfirlit · Demo fyrirtæki · {now.toLocaleTimeString("is-IS")}</p>
          </div>
        </div>
        <button onClick={load} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>↻ Uppfæra</button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#e5e7eb", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? "#fff" : "transparent", border: "none", borderRadius: 7,
            padding: "6px 16px", fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? "#111827" : "#6b7280", cursor: "pointer",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && data && (
        <>
          {tab === "overview" && (
            <OverviewTab
              activeEmp={activeEmp}             empList={empList}
              clockList={clockList}             recentClock={recentClock}
              totalHours={totalHours}           sortedClock={sortedClock}
              activeProjects={activeProjects}   projectList={projectList}
              customerList={customerList}       activeCustomers={activeCustomers}
              customersNoProjects={customersNoProjects}
              latestClock={latestClock}
              actSt={actSt}   actNote={actNote}
              useSt={useSt}   useNote={useNote}   useDetail={useDetail}
              recorderPct={recorderPct}         pctBarColor={pctBarColor}
              topEmployees={topEmployees}         topCustomersByActivity={topCustomersByActivity}
              topCustomerDependency={topCustomerDependency}
              errors={data.errors}
            />
          )}
          {tab === "employees" && (
            <EmployeesTab
              empList={empList}               empSlice={empSlice}
              empPage={empPage}               setEmpPage={setEmpPage}
              activeEmp={activeEmp}           activeRecorders={activeRecorders}
              recorderPct={recorderPct}       pctBarColor={pctBarColor}
              lastClockByEmployee={lastClockByEmployee}
              inactiveEmployees={inactiveEmployees}
            />
          )}
          {tab === "projects" && (
            <ProjectsTab
              projectList={projectList}       filteredProjects={filteredProjects}
              projSlice={projSlice}           activeProjects={activeProjects}
              projPage={projPage}             setProjPage={setProjPage}
              projSearch={projSearch}         setProjSearch={setProjSearch}
              projFilter={projFilter}         setProjFilter={setProjFilter}
              projHoursMap={projHoursMap}     activeProjectsNoHours={activeProjectsNoHours}
            />
          )}
          {tab === "customers" && (
            <CustomersTab
              customerList={customerList}         custSlice={custSlice}
              filteredCustomers={filteredCustomers}
              custPage={custPage}                 setCustPage={setCustPage}
              activeCustomers={activeCustomers}
              customersNoProjects={customersNoProjects}
              custSearch={custSearch}             setCustSearch={setCustSearch}
              custFilter={custFilter}             setCustFilter={setCustFilter}
              topCustomerDependency={topCustomerDependency}
            />
          )}
        </>
      )}

      <div style={{ marginTop: 32, borderTop: "1px solid #e5e7eb", paddingTop: 16, color: "#9ca3af", fontSize: 11 }}>
        Endpoints: /general/employee · /TimeClock/entries · /project · /customer · dkPlus REST API v1
      </div>
    </div>
  );
}
