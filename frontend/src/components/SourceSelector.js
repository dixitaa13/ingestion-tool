 
import React from 'react';
import { Form } from 'react-bootstrap';

function SourceSelector({ source, setSource }) {
    return (
        <Form.Group className="mb-3">
            <Form.Label>Select Source</Form.Label>
            <Form.Select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="clickhouse">ClickHouse</option>
                <option value="flatfile">Flat File</option>
            </Form.Select>
        </Form.Group>
    );
}

export default SourceSelector;