import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";

const STATUS_CONFIG = {
  pending:    { label: "Pendente",       color: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B" },
  done:       { label: "Fatto ✓",        color: "#059669", bg: "#D1FAE5", dot: "#059669" },
  impossible: { label: "Non eseguibile", color: "#DC2626", bg: "#FEE2E2", dot: "#DC2626" },
  reviewing:  { label: "In revisione…",  color: "#6366F1", bg: "#EEF2FF", dot: "#6366F1" },
};

const STORAGE_KEY = "errori_checks_v1";

export default function App() {
  const [catalogs, setCatalogs]   = useState([]);
  const [checks, setChecks]       = useState({});
  const [selected, setSelected]   = useState(null);
  const [loaded, setLoaded]       = useState(false);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState("all");
  const [exportMsg, setExportMsg] = useState("");
  const [fileName, setFileName]   = useState("");

  // Load saved checks from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecks(JSON.parse(saved));
    } catch {}
  }, []);

  // Persist checks to localStorage whenever they change
  const saveChecks = useCallback((newChecks) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newChecks)); } catch {}
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const list = data.map((row) => {
        const id = String(row["id"] || "").trim();
        const errors = Object.keys(row)
          .filter((k) => k.startsWith("errore_"))
          .sort((a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1]))
          .map((k) => String(row[k] || "").trim())
          .filter(Boolean);
        return { id, errors };
      }).filter((c) => c.id && c.errors.length > 0);
      setCatalogs(list);
      setLoaded(true);
      if (list.length > 0) setSelected(list[0].id);
    };
    reader.readAsArrayBuffer(file);
  };

  const setStatus = (catalogId, errIdx, status) => {
    const key = `${catalogId}__${errIdx}`;
    const next = { ...checks, [key]: status };
    setChecks(next);
    saveChecks(next);
  };

  const getStatus = (catalogId, errIdx) =>
    checks[`${catalogId}__${errIdx}`] || "pending";

  const getCatalogProgress = (cat) => {
    const done = cat.errors.filter((_, i) => getStatus(cat.id, i) === "done").length;
    return { done, total: cat.errors.length };
  };

  const filtered = catalogs.filter((c) => {
    if (search && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all") {
      const { done, total } = getCatalogProgress(c);
      if (filterStatus === "complete" && done !== total) return false;
      if (filterStatus === "incomplete" && done === total) return false;
    }
    return true;
  });

  const selectedCatalog = catalogs.find((c) => c.id === selected);
  const totalDone = catalogs.reduce((acc, c) => acc + getCatalogProgress(c).done, 0);
  const totalAll  = catalogs.reduce((acc, c) => acc + c.errors.length, 0);
  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  const currentIndex = filtered.findIndex((c) => c.id === selected);

  const exportLog = () => {
    if (!catalogs.length) return;
    const rows = [];
    catalogs.forEach((c) => {
      c.errors.forEach((err, i) => {
        rows.push({
          Catalogo: c.id,
          Errore: err,
          Status: STATUS_CONFIG[getStatus(c.id, i)].label,
        });
      });
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Log");
    XLSX.writeFile(wb, "errori_log.xlsx");
    setExportMsg("Esportato!");
    setTimeout(() => setExportMsg(""), 2500);
  };

  const resetChecks = () => {
    if (!window.confirm("Vuoi azzerare tutti i check? L'azione è irreversibile.")) return;
    setChecks({});
    saveChecks({});
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    app: {
      fontFamily: "'DM Mono', 'Courier New', monospace",
      background: "#0F0F0F",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      color: "#E8E8E0",
    },
    header: {
      background: "#1A1A1A",
      borderBottom: "1px solid #2A2A2A",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      gap: 20,
      flexWrap: "wrap",
    },
    logo: {
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "#555",
      fontWeight: 600,
      flexShrink: 0,
    },
    logoAccent: { color: "#E8E8E0" },
    progressWrap: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 10,
      minWidth: 180,
    },
    barTrack: { flex: 1, height: 3, background: "#2A2A2A", borderRadius: 2 },
    barFill: {
      height: "100%",
      background: "#86EFAC",
      borderRadius: 2,
      transition: "width .5s ease",
    },
    pct: { fontSize: 11, color: "#555", minWidth: 32, textAlign: "right" },
    headerBtn: {
      background: "transparent",
      border: "1px solid #2A2A2A",
      color: "#666",
      padding: "6px 14px",
      borderRadius: 5,
      cursor: "pointer",
      fontSize: 11,
      fontFamily: "inherit",
      letterSpacing: "0.07em",
      textTransform: "uppercase",
    },
    fileLabel: { fontSize: 11, color: "#444", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    body: {
      display: "flex",
      flex: 1,
      overflow: "hidden",
      height: "calc(100vh - 53px)",
    },
    sidebar: {
      width: 270,
      minWidth: 270,
      background: "#141414",
      borderRight: "1px solid #1E1E1E",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    sidebarTop: { padding: "14px 12px 10px", borderBottom: "1px solid #1E1E1E" },
    searchInput: {
      width: "100%",
      background: "#1C1C1C",
      border: "1px solid #2A2A2A",
      borderRadius: 6,
      color: "#D0D0C8",
      padding: "7px 10px",
      fontSize: 12,
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
      marginBottom: 8,
    },
    filterRow: { display: "flex", gap: 4 },
    filterBtn: (active) => ({
      fontSize: 10,
      padding: "3px 9px",
      borderRadius: 4,
      border: "1px solid",
      cursor: "pointer",
      fontFamily: "inherit",
      letterSpacing: "0.05em",
      background: active ? "#E8E8E0" : "transparent",
      color: active ? "#0F0F0F" : "#555",
      borderColor: active ? "#E8E8E0" : "#2A2A2A",
      transition: "all .15s",
    }),
    catalogList: { flex: 1, overflowY: "auto", padding: "4px 0" },
    catalogItem: (active) => ({
      padding: "10px 14px",
      cursor: "pointer",
      background: active ? "#1E1E1E" : "transparent",
      borderLeft: `3px solid ${active ? "#86EFAC" : "transparent"}`,
    }),
    catId: { fontSize: 11, color: "#D0D0C8", letterSpacing: "0.04em", marginBottom: 5 },
    catMini: { display: "flex", alignItems: "center", gap: 6 },
    miniDots: { display: "flex", gap: 3, flexWrap: "wrap" },
    miniCount: { fontSize: 10, color: "#444" },
    main: { flex: 1, overflowY: "auto", padding: "32px 40px" },
    uploadZone: {
      margin: "80px auto",
      maxWidth: 420,
      border: "2px dashed #222",
      borderRadius: 14,
      padding: "52px 36px",
      textAlign: "center",
    },
    uploadIcon: { fontSize: 36, marginBottom: 16 },
    uploadTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em" },
    uploadSub: { fontSize: 12, color: "#444", marginBottom: 28, lineHeight: 1.7 },
    uploadBtn: {
      display: "inline-block",
      background: "#E8E8E0",
      color: "#0F0F0F",
      border: "none",
      padding: "11px 26px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 12,
      fontFamily: "inherit",
      letterSpacing: "0.09em",
      textTransform: "uppercase",
      fontWeight: 700,
    },
    catHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 24,
      gap: 12,
    },
    catTitle: { fontSize: 20, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 },
    catSub: { fontSize: 11, color: "#555" },
    errorCard: (status) => ({
      background: "#161616",
      border: `1px solid ${status === "done" ? "#14532D55" : "#222"}`,
      borderRadius: 8,
      padding: "14px 18px",
      marginBottom: 8,
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      opacity: status === "done" ? 0.55 : 1,
      transition: "opacity .2s, border-color .2s",
    }),
    errNum: {
      minWidth: 26,
      height: 26,
      borderRadius: "50%",
      background: "#1E1E1E",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      color: "#444",
      fontWeight: 700,
      flexShrink: 0,
      marginTop: 2,
    },
    errText: (done) => ({
      flex: 1,
      fontSize: 12,
      lineHeight: 1.7,
      color: done ? "#3A3A3A" : "#B0B0A8",
      fontFamily: "'DM Mono', monospace",
      wordBreak: "break-word",
      textDecoration: done ? "line-through" : "none",
    }),
    statusCol: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 6,
      flexShrink: 0,
    },
    statusBadge: (status) => ({
      fontSize: 10,
      padding: "3px 10px",
      borderRadius: 20,
      background: STATUS_CONFIG[status].bg,
      color: STATUS_CONFIG[status].color,
      fontWeight: 700,
      letterSpacing: "0.05em",
      whiteSpace: "nowrap",
    }),
    select: {
      background: "#1E1E1E",
      border: "1px solid #2A2A2A",
      color: "#777",
      borderRadius: 5,
      padding: "4px 8px",
      fontSize: 11,
      fontFamily: "inherit",
      cursor: "pointer",
      outline: "none",
    },
    navRow: {
      display: "flex",
      gap: 8,
      marginTop: 24,
      paddingTop: 20,
      borderTop: "1px solid #1A1A1A",
      alignItems: "center",
    },
    navBtn: (disabled) => ({
      background: disabled ? "#141414" : "#1E1E1E",
      border: "1px solid #242424",
      color: disabled ? "#2A2A2A" : "#777",
      padding: "8px 16px",
      borderRadius: 5,
      cursor: disabled ? "default" : "pointer",
      fontSize: 11,
      fontFamily: "inherit",
      letterSpacing: "0.07em",
      textTransform: "uppercase",
    }),
    counter: { marginLeft: "auto", fontSize: 11, color: "#333" },
  };

  const renderDot = (status) => (
    <div style={{
      width: 6, height: 6, borderRadius: "50%",
      background: STATUS_CONFIG[status]?.dot || "#333",
    }} />
  );

  return (
    <div style={s.app}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logo}><span style={s.logoAccent}>ERRORI</span> CHECKER</div>

        {loaded && (
          <>
            <div style={s.progressWrap}>
              <div style={s.barTrack}>
                <div style={{ ...s.barFill, width: `${pct}%` }} />
              </div>
              <span style={s.pct}>{pct}%</span>
              <span style={{ fontSize: 11, color: "#333" }}>{totalDone}/{totalAll}</span>
            </div>
            <span style={s.fileLabel}>{fileName}</span>
            <button style={s.headerBtn} onClick={exportLog}>{exportMsg || "↓ Export"}</button>
            <button style={{ ...s.headerBtn, color: "#4A2020", borderColor: "#2A1A1A" }} onClick={resetChecks}>Reset</button>
          </>
        )}

        {/* Always show file picker to reload */}
        <label style={{ cursor: "pointer" }}>
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
          <span style={{ ...s.headerBtn, color: loaded ? "#555" : "#E8E8E0", borderColor: loaded ? "#222" : "#444" }}>
            {loaded ? "↺ Ricarica" : "Carica xlsx"}
          </span>
        </label>
      </div>

      <div style={s.body}>
        {/* SIDEBAR */}
        {loaded && (
          <div style={s.sidebar}>
            <div style={s.sidebarTop}>
              <input
                style={s.searchInput}
                placeholder="Cerca ID catalogo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div style={s.filterRow}>
                {[["all","Tutti"],["incomplete","Da fare"],["complete","Fatti"]].map(([v,l]) => (
                  <button key={v} style={s.filterBtn(filterStatus===v)} onClick={() => setFilter(v)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={s.catalogList}>
              {filtered.map((cat) => {
                const { done, total } = getCatalogProgress(cat);
                const active = cat.id === selected;
                return (
                  <div key={cat.id} style={s.catalogItem(active)} onClick={() => setSelected(cat.id)}>
                    <div style={s.catId}>{cat.id}</div>
                    <div style={s.catMini}>
                      <div style={s.miniDots}>
                        {cat.errors.map((_, i) => renderDot(getStatus(cat.id, i)))}
                      </div>
                      <span style={s.miniCount}>{done}/{total}</span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding: 24, fontSize: 11, color: "#333", textAlign: "center" }}>
                  Nessun risultato
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={s.main}>
          {!loaded ? (
            <div style={s.uploadZone}>
              <div style={s.uploadIcon}>📋</div>
              <div style={s.uploadTitle}>Errori Checker</div>
              <div style={s.uploadSub}>
                Carica il file <strong>Errori_table_normalizado.xlsx</strong><br />
                generato dallo script di normalizzazione.<br />
                I progressi vengono salvati automaticamente nel browser.
              </div>
              <label>
                <input type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
                <span style={s.uploadBtn}>Scegli file .xlsx</span>
              </label>
            </div>
          ) : selectedCatalog ? (
            <>
              <div style={s.catHeader}>
                <div>
                  <div style={s.catTitle}>{selectedCatalog.id}</div>
                  <div style={s.catSub}>
                    {getCatalogProgress(selectedCatalog).done} / {selectedCatalog.errors.length} errori controllati
                    &nbsp;·&nbsp; {filtered.length} cataloghi visibili
                  </div>
                </div>
              </div>

              {selectedCatalog.errors.map((err, i) => {
                const status = getStatus(selectedCatalog.id, i);
                return (
                  <div key={i} style={s.errorCard(status)}>
                    <div style={s.errNum}>{i + 1}</div>
                    <div style={s.errText(status === "done")}>{err}</div>
                    <div style={s.statusCol}>
                      <div style={s.statusBadge(status)}>{STATUS_CONFIG[status].label}</div>
                      <select
                        style={s.select}
                        value={status}
                        onChange={(e) => setStatus(selectedCatalog.id, i, e.target.value)}
                      >
                        <option value="pending">Pendente</option>
                        <option value="reviewing">In revisione</option>
                        <option value="done">Fatto ✓</option>
                        <option value="impossible">Non eseguibile</option>
                      </select>
                    </div>
                  </div>
                );
              })}

              <div style={s.navRow}>
                <button
                  style={s.navBtn(currentIndex <= 0)}
                  disabled={currentIndex <= 0}
                  onClick={() => setSelected(filtered[currentIndex - 1]?.id)}
                >← Prec.</button>
                <button
                  style={s.navBtn(currentIndex >= filtered.length - 1)}
                  disabled={currentIndex >= filtered.length - 1}
                  onClick={() => setSelected(filtered[currentIndex + 1]?.id)}
                >Succ. →</button>
                <span style={s.counter}>{currentIndex + 1} / {filtered.length}</span>
              </div>
            </>
          ) : (
            <div style={{ color: "#333", fontSize: 13, marginTop: 80, textAlign: "center" }}>
              Seleziona un catalogo dalla lista
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
