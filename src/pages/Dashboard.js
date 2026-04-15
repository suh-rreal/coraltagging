import { Link } from 'react-router-dom';
import { corals } from '../data/corals';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard-hero">
        <h1 className="dashboard-title">Reef coral overview</h1>
        <p className="dashboard-subtitle">
          Snapshot of tagged species. Open any card for a dedicated page with its own URL you can
          bookmark or share.
        </p>
      </header>

      <section className="dashboard-grid" aria-label="Coral species">
        {corals.map((coral) => (
          <article key={coral.slug} className="dashboard-card">
            <div className="dashboard-card-head">
              <h2 className="dashboard-card-title">{coral.commonName}</h2>
              <span className={`dashboard-status dashboard-status--${statusClass(coral.status)}`}>
                {coral.status}
              </span>
            </div>
            <p className="dashboard-scientific">{coral.scientificName}</p>
            <dl className="dashboard-meta">
              <div>
                <dt>Region</dt>
                <dd>{coral.region}</dd>
              </div>
              <div>
                <dt>Depth (m)</dt>
                <dd>{coral.depthM}</dd>
              </div>
            </dl>
            <ul className="dashboard-tags">
              {coral.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <Link className="dashboard-link" to={`/coral/${coral.slug}`}>
              View page →
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

function statusClass(status) {
  if (status.includes('Critically')) return 'critical';
  if (status.includes('Endangered') || status.includes('Threatened')) return 'warn';
  return 'ok';
}
