"use client";

import {
  ArrowLeft,
  ArrowRight,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  Button,
  Card,
  EmptyState,
  Metric,
  Metrics,
  PageHeader,
  StatusBadge,
} from "@/components/hub/ui";

import {
  formatPreviewAmount,
  previewClients,
  previewOwners,
  previewStatuses,
  type PreviewClient,
  type PreviewStatus,
} from "../preview-data";
import type { PreviewSectionId } from "../preview-sections";
import styles from "../preview.module.css";

const pageSize = 5;

const statusTone: Record<PreviewStatus, "success" | "info" | "warning"> = {
  Active: "success",
  Prospect: "info",
  "At risk": "warning",
};

function ClientIdentity({ client }: { client: PreviewClient }) {
  return (
    <span className={styles.recordIdentity}>
      <span className={styles.recordAvatar}>{client.initials}</span>
      <span>
        <strong>{client.company}</strong>
        <small>{client.contact}</small>
      </span>
    </span>
  );
}

export function CollectionSection({
  onNavigate,
}: {
  onNavigate: (section: PreviewSectionId) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof previewStatuses)[number]>("All");
  const [owner, setOwner] = useState<(typeof previewOwners)[number]>("All owners");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return previewClients.filter((client) => {
      const matchesQuery =
        !normalized ||
        [client.company, client.contact, client.email, client.nextStep]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesStatus = status === "All" || client.status === status;
      const matchesOwner = owner === "All owners" || client.owner === owner;
      return matchesQuery && matchesStatus && matchesOwner;
    });
  }, [owner, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const pageEnd = Math.min(start + pageSize, filtered.length);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        previewStatuses.map((option) => [
          option,
          option === "All"
            ? previewClients.length
            : previewClients.filter((client) => client.status === option).length,
        ]),
      ) as Record<(typeof previewStatuses)[number], number>,
    [],
  );

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatus(value: (typeof previewStatuses)[number]) {
    setStatus(value);
    setPage(1);
  }

  function updateOwner(value: (typeof previewOwners)[number]) {
    setOwner(value);
    setPage(1);
  }

  function resetFilters() {
    setQuery("");
    setStatus("All");
    setOwner("All owners");
    setPage(1);
  }

  return (
    <div className={styles.sectionStack}>
      <PageHeader
        className={styles.pageHeader}
        eyebrow="CRM / CLIENTS"
        title="Clients"
        description="A single collection contract for search, status, ownership, table density and mobile cards."
        action={
          <Button type="button" onClick={() => onNavigate("forms")}>
            New client
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        }
      />

      <Metrics label="Client collection summary">
        <Metric label="All clients" value="12" description="Across three owners" icon={<UserRound size={18} />} />
        <Metric label="Active" value="7" description="Delivery or retainer" icon={<SlidersHorizontal size={18} />} />
        <Metric label="At risk" value="3" description="Need intervention" icon={<ArrowLeft size={18} />} />
      </Metrics>

      <Card padding="none" className={styles.collectionCard}>
        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <span className={styles.srOnly}>Search clients</span>
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search company, contact or next step"
            />
          </label>

          <label className={styles.selectField}>
            <span className={styles.srOnly}>Filter by owner</span>
            <select value={owner} onChange={(event) => updateOwner(event.target.value as typeof owner)}>
              {previewOwners.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.collectionFilterBar}>
          <div className={styles.filterTabs} role="group" aria-label="Filter by client status">
            {previewStatuses.map((option) => (
              <button
                key={option}
                type="button"
                className={`${styles.filterButton} ${status === option ? styles.filterActive : ""}`}
                aria-pressed={status === option}
                onClick={() => updateStatus(option)}
              >
                {option}
                <strong>{counts[option]}</strong>
              </button>
            ))}
          </div>
          <span className={styles.resultCount} aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "record" : "records"}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className={styles.emptyWrap}>
            <EmptyState
              title="No clients match those filters"
              description="Try another search term, owner or status. The preview data is static and nothing was changed."
              icon={<Search size={20} />}
              action={
                <Button type="button" variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>Client collection preview</caption>
                <thead>
                  <tr>
                    <th scope="col">Company</th>
                    <th scope="col">Status</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Value</th>
                    <th scope="col">Next step</th>
                    <th scope="col"><span className={styles.srOnly}>Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((client) => (
                    <tr key={client.id}>
                      <th scope="row"><ClientIdentity client={client} /></th>
                      <td><StatusBadge tone={statusTone[client.status]}>{client.status}</StatusBadge></td>
                      <td>{client.owner}</td>
                      <td className={styles.amountCell}>{formatPreviewAmount(client.value)}</td>
                      <td>
                        <span className={styles.nextStep}>{client.nextStep}</span>
                        <small>{client.updated}</small>
                      </td>
                      <td>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => onNavigate("detail")}
                          aria-label={`Open ${client.company}`}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileCards}>
              {visible.map((client) => (
                <Card key={client.id} padding="sm" className={styles.recordCard}>
                  <div className={styles.recordTop}>
                    <ClientIdentity client={client} />
                    <StatusBadge tone={statusTone[client.status]}>{client.status}</StatusBadge>
                  </div>
                  <dl className={styles.recordFacts}>
                    <div><dt>Owner</dt><dd>{client.owner}</dd></div>
                    <div><dt>Value</dt><dd>{formatPreviewAmount(client.value)}</dd></div>
                    <div><dt>Next step</dt><dd>{client.nextStep}</dd></div>
                    <div><dt>Updated</dt><dd>{client.updated}</dd></div>
                  </dl>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    block
                    onClick={() => onNavigate("detail")}
                    aria-label={`Open ${client.company}`}
                  >
                    Open client
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className={styles.pagination}>
          <span>
            {filtered.length === 0 ? "0 records" : `${start + 1}–${pageEnd} of ${filtered.length}`}
          </span>
          <div className={styles.paginationActions}>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <span className={styles.pageIndicator}>Page {currentPage} of {totalPages}</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={currentPage === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <p className={styles.dataNote}>
        Fictional client data only. Search, filters and pagination run entirely in local state.
      </p>
    </div>
  );
}
