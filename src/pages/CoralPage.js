import { Link, useParams } from 'react-router-dom';
import { getCoralBySlug } from '../data/corals';
import './CoralPage.css';

export default function CoralPage() {
  const { slug } = useParams();
  const coral = getCoralBySlug(slug);

  if (!coral) {
    return (
      <div className="coral-page coral-page--empty">
        <p>We don’t have a coral with that link.</p>
        <Link to="/">← Back to dashboard</Link>
      </div>
    );
  }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <article className="coral-page">
      <nav className="coral-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <span aria-hidden="true"> / </span>
        <span>{coral.commonName}</span>
      </nav>

      <header className="coral-header">
        <h1 className="coral-title">{coral.commonName}</h1>
        <p className="coral-scientific">{coral.scientificName}</p>
      </header>

      <div className="coral-share">
        <span className="coral-share-label">Page link</span>
        <code className="coral-share-url">{pageUrl || `/coral/${coral.slug}`}</code>
        <p className="coral-share-hint">Copy the URL from your browser’s address bar to share this page.</p>
      </div>

      <dl className="coral-facts">
        <div>
          <dt>Region</dt>
          <dd>{coral.region}</dd>
        </div>
        <div>
          <dt>Depth (m)</dt>
          <dd>{coral.depthM}</dd>
        </div>
        <div>
          <dt>Conservation status</dt>
          <dd>{coral.status}</dd>
        </div>
        <div>
          <dt>Tags</dt>
          <dd>
            <ul className="coral-tags">
              {coral.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <section className="coral-notes">
        <h2 className="coral-notes-title">Notes</h2>
        <p className="coral-notes-body">{coral.notes}</p>
      </section>

      <Link className="coral-back" to="/">
        ← All corals
      </Link>
    </article>
  );
}
