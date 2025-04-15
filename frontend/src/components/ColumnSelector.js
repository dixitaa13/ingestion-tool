import React, { useState, useEffect } from 'react';
import { Form, Alert } from 'react-bootstrap';
import axios from 'axios';

function ColumnSelector({ table, tables, onSelectColumns, columns: initialColumns, source }) {
    const [columns, setColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('ColumnSelector props:', { table, tables, initialColumns, source });
        const fetchColumns = async () => {
            try {
                let allColumns = [];
                if (source === 'clickhouse' && (tables.length > 0 || table)) {
                    if (tables.length > 0) {
                        for (const tbl of tables) {
                            const res = await axios.get(`http://localhost:8000/columns/${tbl}`);
                            const tableColumns = res.data.columns.map(col => `${tbl}.${col}`);
                            allColumns = [...allColumns, ...tableColumns];
                        }
                    } else if (table) {
                        const res = await axios.get(`http://localhost:8000/columns/${table}`);
                        allColumns = res.data.columns;
                    }
                } else if (source === 'flatfile') {
                    allColumns = initialColumns || [];
                }
                console.log('Columns set:', allColumns);
                setColumns(allColumns);
                setSelectedColumns([]);
                setError('');
            } catch (err) {
                const errorMsg = err.response?.data?.detail || 'Failed to fetch columns';
                console.error('Column fetch error:', errorMsg);
                setError(errorMsg);
                setColumns(source === 'flatfile' ? initialColumns || [] : []);
                setSelectedColumns([]);
            }
        };
        fetchColumns();
    }, [table, tables, initialColumns, source]);

    const handleChange = (e) => {
        const options = Array.from(e.target.selectedOptions).map(option => option.value);
        console.log('Columns selected:', options);
        setSelectedColumns(options);
        onSelectColumns(options);
    };

    return (
        <div>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            <Form.Group className="mb-3">
                <Form.Label>Select Columns (Ctrl+Click for multiple)</Form.Label>
                <Form.Control
                    as="select"
                    multiple
                    value={selectedColumns}
                    onChange={handleChange}
                    disabled={columns.length === 0}
                    size={10}
                    className="form-select"
                    style={{ minHeight: '150px', fontSize: '0.9rem' }}
                >
                    {columns.map((column) => (
                        <option key={column} value={column}>
                            {column}
                        </option>
                    ))}
                </Form.Control>
            </Form.Group>
        </div>
    );
}

export default ColumnSelector;