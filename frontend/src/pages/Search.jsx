import React, { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/common/PageHeader';
import { searchDocuments } from '../services/api';
import {
  Search as SearchIcon,
  FileText,
  LoaderCircle,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) return;

    setLoading(true);
    setError('');
    setSearchedQuery(trimmedQuery);

    try {
      const data = await searchDocuments(trimmedQuery, 5);
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      setResults([]);
      setError(
        err.response?.data?.detail ||
          'Unable to search your documents. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Global Search"
        subtitle="Find relevant passages across your uploaded documents."
      />

      <div className="card-sa p-3 p-md-4 mb-4">
        <form onSubmit={handleSearch}>
          <label htmlFor="global-search" className="form-label fw-semibold">
            What do you want to learn?
          </label>

          <div className="d-flex gap-2">
            <div className="position-relative flex-grow-1">
              <SearchIcon
                size={19}
                className="position-absolute text-secondary"
                style={{
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                id="global-search"
                type="search"
                className="form-control ps-5 py-3"
                placeholder="Search concepts, topics, or questions..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary-sa px-3"
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <LoaderCircle size={18} className="spin" />
              ) : (
                <SearchIcon size={18} />
              )}
              <span className="ms-2 d-none d-sm-inline">
                {loading ? 'Searching...' : 'Search'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2">
          <AlertCircle size={20} className="flex-shrink-0 mt-1" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="card-sa p-5 text-center">
          <LoaderCircle
            size={30}
            className="spin mx-auto mb-3"
          />
          <p className="mb-0">Searching your documents...</p>
        </div>
      )}

      {!loading && searchedQuery && !error && (
        <section>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Search results</h5>
            <span className="text-secondary small">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="card-sa p-5 text-center">
              <SearchIcon
                size={34}
                className="text-secondary mx-auto mb-3"
              />
              <h5>No matching passages found</h5>
              <p className="text-secondary mb-0">
                Try different keywords or ask your question another way.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {results.map((result, index) => {
                const filename =
                  result.filename ||
                  result.metadata?.filename ||
                  result.source ||
                  'Document';

                const pageNumber =
                  result.page_number ?? result.metadata?.page_number;

                const content =
                  result.text ||
                  result.content ||
                  result.chunk_text ||
                  result.metadata?.text ||
                  result.metadata?.content ||
                  '';

                const score =
                  result.hybrid_score ??
                  result.score ??
                  result.semantic_score;

                return (
                  <article
                    className="card-sa p-3 p-md-4"
                    key={result.id || result.chunk_id || index}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <div className="rounded-3 p-2 bg-light">
                        <FileText size={22} />
                      </div>

                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                          <h6 className="mb-0 text-break">
                            {filename}
                          </h6>

                          {pageNumber != null && (
                            <span className="badge text-bg-light">
                              Page {pageNumber}
                            </span>
                          )}
                        </div>

                        <p className="mb-3 text-secondary text-break">
                          {content || 'No text preview available for this result.'}
                        </p>

                        {score != null && (
                          <small className="text-secondary">
                            Relevance score: {Number(score).toFixed(3)}
                          </small>
                        )}
                      </div>

                      <ArrowUpRight
                        size={18}
                        className="text-secondary flex-shrink-0"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!loading && !searchedQuery && (
        <div className="card-sa p-5 text-center">
          <SearchIcon
            size={38}
            className="text-secondary mx-auto mb-3"
          />
          <h5>Search your study materials</h5>
          <p className="text-secondary mb-0">
            Enter a topic or question to find relevant passages from your documents.
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default Search;