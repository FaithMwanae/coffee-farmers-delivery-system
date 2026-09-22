import { useState, useRef, useEffect } from 'react';
import { Form, ListGroup, Badge } from 'react-bootstrap';

const FarmerSearchSelect = ({ farmers, value, onChange, required }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Selected farmer object
  const selectedFarmer = farmers.find((f) => String(f.id) === String(value));

  // Filter farmers by member no, name, or phone
  const filtered = farmers.filter((f) => {
    if (!search) return true;
    const term = search.toLowerCase().trim();
    const memberNo = (f.memberNo || f.member_no || '').toLowerCase();
    const name = (f.name || '').toLowerCase();
    const phone = (f.phone || '').toLowerCase();
    return memberNo.includes(term) || name.includes(term) || phone.includes(term);
  });

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (farmer) => {
    onChange(String(farmer.id));
    setSearch('');
    setOpen(false);
    setHighlighted(0);
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted]) handleSelect(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <Form.Label className="small fw-semibold text-secondary">
        Farmer {required && <span className="text-danger">*</span>}
      </Form.Label>

      {/* Hidden input for required validation */}
      <input
        type="text"
        value={value || ''}
        onChange={() => {}}
        required={required}
        style={{
          position: 'absolute',
          opacity: 0,
          height: 0,
          width: 0,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
      />

      {selectedFarmer ? (
        // Selected state — show card
        <div
          className="border rounded p-2 d-flex justify-content-between align-items-center"
          style={{ cursor: 'pointer', background: '#f8f9fa' }}
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <div>
            <Badge
              bg="success"
              className="me-2"
              style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
            >
              {selectedFarmer.memberNo || selectedFarmer.member_no}
            </Badge>
            <strong style={{ fontSize: '0.9rem' }}>{selectedFarmer.name}</strong>
            {selectedFarmer.location && (
              <small className="text-muted ms-2">({selectedFarmer.location})</small>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            style={{ fontSize: '0.75rem', padding: '2px 10px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          >
            Change
          </button>
        </div>
      ) : (
        // Search state — no icon
        <Form.Control
          ref={inputRef}
          type="text"
          placeholder="Search by member ID, name, or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          style={{ fontSize: '0.9rem' }}
        />
      )}

      {/* Dropdown results */}
      {open && !selectedFarmer && (
        <ListGroup
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1050,
            maxHeight: '280px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {filtered.length === 0 ? (
            <ListGroup.Item className="text-muted text-center small">
              No farmers match "{search}"
            </ListGroup.Item>
          ) : (
            filtered.slice(0, 20).map((f, idx) => (
              <ListGroup.Item
                key={f.id}
                action
                active={idx === highlighted}
                onClick={() => handleSelect(f)}
                onMouseEnter={() => setHighlighted(idx)}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <Badge
                    bg={idx === highlighted ? 'light' : 'success'}
                    text={idx === highlighted ? 'dark' : undefined}
                    className="me-2"
                    style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                  >
                    {f.memberNo || f.member_no}
                  </Badge>
                  <strong>{f.name}</strong>
                  {f.location && (
                    <small
                      className={
                        idx === highlighted ? 'text-light ms-2' : 'text-muted ms-2'
                      }
                    >
                      ({f.location})
                    </small>
                  )}
                </div>
                {f.phone && (
                  <small
                    className={idx === highlighted ? 'text-light' : 'text-muted'}
                  >
                    {f.phone}
                  </small>
                )}
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      )}

      <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
        Type a member ID (e.g., KFCS-00123), name, or phone number
      </Form.Text>
    </div>
  );
};

export default FarmerSearchSelect;