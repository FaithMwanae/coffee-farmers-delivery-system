import { useState } from 'react';
import { Table, Form, Pagination, Card, Row, Col, Badge } from 'react-bootstrap';

const DataTable = ({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  itemsPerPage = 10,
  emptyMessage = 'No records found',
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = data.filter((row) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return searchKeys.some((key) =>
      String(row[key] || '').toLowerCase().includes(term)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-3">
        <Form.Control
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={handleSearchChange}
          style={{ maxWidth: '100%' }}
        />
      </div>

      {/* ===== DESKTOP: TABLE VIEW ===== */}
      <div className="table-responsive d-none d-md-block">
        <Table hover className="align-middle bg-white">
          <thead className="table-light">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-4">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* ===== MOBILE: CARD VIEW ===== */}
      <div className="d-md-none">
        {paginatedData.length === 0 ? (
          <div className="text-center text-muted py-4">{emptyMessage}</div>
        ) : (
          <Row className="g-2">
            {paginatedData.map((row, idx) => (
              <Col xs={12} key={row.id || idx}>
                <Card className="shadow-sm border-0">
                  <Card.Body className="p-3">
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className="d-flex justify-content-between align-items-start py-1 border-bottom"
                        style={{ fontSize: '14px' }}
                      >
                        <span className="text-muted fw-semibold me-2" style={{ minWidth: '40%' }}>
                          {col.label}
                        </span>
                        <span className="text-end" style={{ flex: 1 }}>
                          {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                        </span>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">
          <small className="text-muted text-center text-md-start">
            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}
          </small>
          <Pagination className="mb-0" size="sm">
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            />
            {[...Array(Math.min(totalPages, 5))].map((_, i) => (
              <Pagination.Item
                key={i + 1}
                active={currentPage === i + 1}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default DataTable;