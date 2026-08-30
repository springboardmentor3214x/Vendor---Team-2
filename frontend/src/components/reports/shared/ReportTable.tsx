/**
 * ReportTable — shared sortable, paginated, searchable data table
 * Used by all 6 report body components.
 */
import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface ColDef<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
  total?: (rows: T[]) => React.ReactNode;
}

interface ReportTableProps<T extends Record<string, unknown>> {
  columns: ColDef<T>[];
  rows: T[];
  pageSize?: number;
  accentColor?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  rowClassName?: (row: T) => React.CSSProperties;
  onReset?: () => void;
}

function getValue<T extends Record<string, unknown>>(row: T, key: string): unknown {
  return key.split('.').reduce((o: unknown, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), row);
}

const PAGE_SIZE_DEFAULT = 15;

export function ReportTable<T extends Record<string, unknown>>({
  columns, rows, pageSize = PAGE_SIZE_DEFAULT, accentColor = '#1565C0',
  searchable, searchPlaceholder = 'Search…', defaultSortKey, defaultSortDir = 'desc',
  rowClassName, onReset,
}: ReportTableProps<T>) {
  const [sortKey, setSortKey]   = useState<string>(defaultSortKey ?? '');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>(defaultSortDir);
  const [search,  setSearch]    = useState('');
  const [page,    setPage]      = useState(1);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const thStyle = (col: ColDef<T>): React.CSSProperties => ({
    padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.4px',
    borderBottom: '1px solid #E4E7EC', background: '#F9FAFB',
    whiteSpace: 'nowrap', textAlign: col.align ?? 'left', width: col.width,
    cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none',
  });

  const tdStyle = (col: ColDef<T>): React.CSSProperties => ({
    padding: '10px 14px', fontSize: 12, color: '#374151',
    textAlign: col.align ?? 'left', verticalAlign: 'middle',
    borderBottom: '1px solid #F1F5F9',
  });

  const hasTotals = columns.some(c => c.total);

  return (
    <div>
      {searchable && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
            {filtered.length} of {rows.length} records
          </span>
        </div>
      )}

      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E4E7EC' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} style={thStyle(col)} onClick={() => col.sortable && handleSort(String(col.key))}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.header}
                    {col.sortable && (
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 0, opacity: sortKey === String(col.key) ? 1 : 0.3 }}>
                        <ChevronUp  size={9} color={sortDir === 'asc'  && sortKey === String(col.key) ? accentColor : '#9CA3AF'} style={{ marginBottom: -3 }} />
                        <ChevronDown size={9} color={sortDir === 'desc' && sortKey === String(col.key) ? accentColor : '#9CA3AF'} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Inbox size={32} color="#D1D5DB" />
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No records match your filters</div>
                    {onReset && (
                      <button onClick={onReset} style={{ fontSize: 12, color: accentColor, background: 'none', border: `1px solid ${accentColor}`, borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontWeight: 600 }}>
                        Reset Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, ri) => (
                <tr key={ri} style={rowClassName ? rowClassName(row) : undefined}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  {columns.map(col => (
                    <td key={String(col.key)} style={tdStyle(col)}>
                      {col.render ? col.render(row) : String(getValue(row, String(col.key)) ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {hasTotals && paginated.length > 0 && (
            <tfoot>
              <tr style={{ background: '#F1F5F9' }}>
                {columns.map(col => (
                  <td key={String(col.key)} style={{ ...tdStyle(col), fontWeight: 700, color: '#111827', borderTop: '2px solid #E4E7EC' }}>
                    {col.total ? col.total(sorted) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '4px 8px', border: '1px solid #E4E7EC', borderRadius: 6, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding: '4px 10px', border: '1px solid', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    borderColor: p === page ? accentColor : '#E4E7EC',
                    background: p === page ? accentColor : '#fff',
                    color: p === page ? '#fff' : '#374151',
                  }}>{p}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '4px 8px', border: '1px solid #E4E7EC', borderRadius: 6, background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
