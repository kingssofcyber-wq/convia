export default function Loading() {
  return <main className="page-container route-loading" aria-label="Loading page"><div className="loading-line loading-title"/><div className="loading-line loading-copy"/><div className="loading-card-grid">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="loading-card"/>)}</div><span>Loading your Convia workspace…</span></main>;
}
