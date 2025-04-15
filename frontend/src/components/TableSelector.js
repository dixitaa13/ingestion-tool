import React, { useState, useEffect } from 'react';
import { Form, Alert } from 'react-bootstrap';
import axios from 'axios';

function TableSelector({ onSelectTable }) {
    const [tables, setTables] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const res = await axios.get('http://localhost:8000/tables');
                console.log('Tables fetched:', res.data.tables);
                setTables(res.data.tables);
                setError('');
            } catch (err) {
                const errorMsg = err.response?.data?.detail || 'Failed to fetch tables';
                console.error('Table fetch error:', errorMsg);
                setError(errorMsg);
                setTables([]);
            }
        };
        fetchTables();
    }, []);

    const handleChange = (e) => {
        const options = Array.from(e.target.selectedOptions).map(option => option.value);
        console.log('Tables selected:', options);
        setSelectedTables(options);
        onSelectTable(options);
    };

    return (
        <div>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            <Form.Group className="mb-3">
                <Form.Label>Select Tables (Ctrl+Click to select multiple)</Form.Label>
                <Form.Control
                    as="select"
                    multiple
                    value={selectedTables}
                    onChange={handleChange}
                    disabled={tables.length === 0}
                    size={Math.min(tables.length || 5, 10)}
                    className="form-select"
                    style={{ minHeight: '120px', fontSize: '0.9rem' }}
                >
                    {tables.map((table) => (
                        <option key={table} value={table}>{table}</option>
                    ))}
                </Form.Control>
            </Form.Group>
        </div>
    );
}

export default TableSelector;