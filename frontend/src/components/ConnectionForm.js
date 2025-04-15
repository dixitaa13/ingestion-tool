import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

function ConnectionForm({ onConnect, onFileColumns }) {
    const [source, setSource] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState('');
    const [database, setDatabase] = useState('');
    const [user, setUser] = useState('');
    const [jwt, setJwt] = useState('');
    const [file, setFile] = useState(null);
    const [delimiter, setDelimiter] = useState(',');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (source === 'clickhouse') {
                const formData = new FormData();
                formData.append('host', host);
                formData.append('port', port);
                formData.append('database', database);
                formData.append('user', user);
                formData.append('jwt', jwt);
                const res = await axios.post('http://localhost:8000/connect/clickhouse', formData);
                console.log('ClickHouse connect response:', res.data);
                onConnect('clickhouse');
            } else if (source === 'flatfile') {
                if (!file) {
                    setError('Please upload a file');
                    return;
                }
                const formData = new FormData();
                formData.append('file', file);
                formData.append('delimiter', delimiter);
                const res = await axios.post('http://localhost:8000/connect/flatfile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('Flat file connect response:', res.data);
                onFileColumns(res.data.columns, file);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Connection failed';
            console.error('Connection error:', errorMsg);
            setError(errorMsg);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
                <Form.Label>Data Source</Form.Label>
                <div>
                    <Form.Check
                        inline
                        type="radio"
                        label="ClickHouse"
                        value="clickhouse"
                        checked={source === 'clickhouse'}
                        onChange={(e) => setSource(e.target.value)}
                    />
                    <Form.Check
                        inline
                        type="radio"
                        label="Flat File"
                        value="flatfile"
                        checked={source === 'flatfile'}
                        onChange={(e) => setSource(e.target.value)}
                    />
                </div>
            </Form.Group>

            {source === 'clickhouse' && (
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Host</Form.Label>
                        <Form.Control
                            type="text"
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            placeholder="e.g., localhost"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Port</Form.Label>
                        <Form.Control
                            type="text"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="e.g., 8123"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Database</Form.Label>
                        <Form.Control
                            type="text"
                            value={database}
                            onChange={(e) => setDatabase(e.target.value)}
                            placeholder="e.g., default"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>User</Form.Label>
                        <Form.Control
                            type="text"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            placeholder="e.g., default"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>JWT Token</Form.Label>
                        <Form.Control
                            type="password"
                            value={jwt}
                            onChange={(e) => setJwt(e.target.value)}
                            placeholder="Enter JWT token"
                            required
                        />
                    </Form.Group>
                </>
            )}

            {source === 'flatfile' && (
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Upload CSV File</Form.Label>
                        <Form.Control
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files[0])}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Delimiter</Form.Label>
                        <Form.Control
                            type="text"
                            value={delimiter}
                            onChange={(e) => setDelimiter(e.target.value)}
                            placeholder="e.g., ,"
                            required
                        />
                    </Form.Group>
                </>
            )}

            <Button variant="primary" type="submit" disabled={!source}>
                Connect
            </Button>

            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Form>
    );
}

export default ConnectionForm;