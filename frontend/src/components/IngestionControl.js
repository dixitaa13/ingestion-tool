import React, { useState, useEffect } from 'react';
import { Button, Form, Table, Alert, ProgressBar } from 'react-bootstrap';
import axios from 'axios';

function IngestionControl({ source, tables, columns, fileColumns, filePath, onReset }) {
    const [previewData, setPreviewData] = useState([]);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [recordCount, setRecordCount] = useState(null);
    const [outputFile, setOutputFile] = useState('');
    const [outputTable, setOutputTable] = useState('');
    const [joinCondition, setJoinCondition] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log('IngestionControl source changed:', source);
        setPreviewData([]);
        setStatus('');
        setError('');
        setRecordCount(null);
        setOutputFile('');
        setOutputTable('');
        setJoinCondition('');
    }, [source, tables, columns, fileColumns]);

    const validateJoinCondition = (condition) => {
        if (!condition || tables.length < 2) return true;
        const pattern = new RegExp(`^${tables[0]}\\.[a-zA-Z_]+\\s*=\\s*${tables[1]}\\.[a-zA-Z_]+$`);
        return pattern.test(condition);
    };

    const handlePreview = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setStatus('Fetching preview...');
        setError('');

        if (source === 'clickhouse') {
            if (!tables.length) {
                setError('No table selected');
                setStatus('');
                setIsLoading(false);
                return;
            }
            if (!columns.length) {
                setError('No columns selected');
                setStatus('');
                setIsLoading(false);
                return;
            }
            if (tables.length > 1 && !joinCondition) {
                setError('Join condition required for multiple tables');
                setStatus('');
                setIsLoading(false);
                return;
            }
            if (tables.length > 1 && !validateJoinCondition(joinCondition)) {
                setError('Invalid join condition. Use: table1.column = table2.column');
                setStatus('');
                setIsLoading(false);
                return;
            }
        } else {
            if (!filePath) {
                setError('No file uploaded');
                setStatus('');
                setIsLoading(false);
                return;
            }
            if (!fileColumns.length) {
                setError('No columns selected');
                setStatus('');
                setIsLoading(false);
                return;
            }
        }

        try {
            if (source === 'clickhouse') {
                const formData = new FormData();
                formData.append('table', tables[0] || '');
                formData.append('columns', JSON.stringify(columns));
                if (tables.length > 1) {
                    formData.append('tables', JSON.stringify(tables));
                    formData.append('join_condition', joinCondition);
                }
                console.log('ClickHouse preview columns:', columns);
                const res = await axios.post('http://localhost:8000/preview', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('Preview response (ClickHouse):', res.data);
                setPreviewData(res.data.data || []);
                setStatus(res.data.count ? `Preview: ${res.data.count} records` : 'Preview: 0 records');
            } else {
                const formData = new FormData();
                formData.append('file', filePath);
                formData.append('columns', JSON.stringify(fileColumns));
                formData.append('delimiter', ',');
                console.log('Flat file preview columns:', fileColumns);
                const res = await axios.post('http://localhost:8000/preview/flatfile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('Preview response (Flat File):', res.data);
                setPreviewData(res.data.data || []);
                setStatus(res.data.count ? `Preview: ${res.data.count} records` : 'Preview: 0 records');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to fetch preview';
            console.error('Preview error:', errorMsg);
            setError(errorMsg);
            setStatus('');
            setPreviewData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleIngest = async () => {
        if (isLoading) return;
        setIsLoading(true);
        if (source === 'clickhouse') {
            if (tables.length === 0) {
                setError('No table selected');
                setIsLoading(false);
                return;
            }
            if (columns.length === 0) {
                setError('No columns selected');
                setIsLoading(false);
                return;
            }
            if (!outputFile) {
                setError('Output file path is required');
                setIsLoading(false);
                return;
            }
            if (tables.length > 1 && !joinCondition) {
                setError('Join condition is required for multiple tables');
                setIsLoading(false);
                return;
            }
            if (tables.length > 1 && !validateJoinCondition(joinCondition)) {
                setError('Invalid join condition. Use: table1.column = table2.column');
                setIsLoading(false);
                return;
            }
        } else {
            if (!filePath) {
                setError('No file uploaded');
                setIsLoading(false);
                return;
            }
            if (fileColumns.length === 0) {
                setError('No columns selected');
                setIsLoading(false);
                return;
            }
            if (!outputTable) {
                setError('Output table name is required');
                setIsLoading(false);
                return;
            }
        }
        setStatus('Ingesting...');
        setError('');
        try {
            if (source === 'clickhouse') {
                const endpoint = tables.length > 1 ? 'ingest/clickhouse-join-to-flatfile' : 'ingest/clickhouse-to-flatfile';
                const formData = new FormData();
                if (tables.length > 1) {
                    formData.append('tables', JSON.stringify(tables));
                    formData.append('columns', JSON.stringify(columns));
                    formData.append('join_condition', joinCondition);
                    formData.append('file_path', outputFile);
                    formData.append('delimiter', ',');
                } else {
                    formData.append('table', tables[0]);
                    formData.append('columns', JSON.stringify(columns));
                    formData.append('file_path', outputFile);
                    formData.append('delimiter', ',');
                }
                console.log('ClickHouse ingest columns:', columns);
                const res = await axios.post(`http://localhost:8000/${endpoint}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('Ingestion response (ClickHouse):', res.data);
                setRecordCount(res.data.record_count);
                setStatus('Ingestion complete');
                setPreviewData([]);
                setOutputFile('');
                setJoinCondition('');
            } else {
                const formData = new FormData();
                formData.append('file', filePath);
                formData.append('delimiter', ',');
                formData.append('table', outputTable);
                formData.append('columns', JSON.stringify(fileColumns));
                console.log('Flat file ingest columns:', fileColumns);
                const res = await axios.post('http://localhost:8000/ingest/flatfile-to-clickhouse', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('Ingestion response (Flat File):', res.data);
                setRecordCount(res.data.record_count);
                setStatus('Ingestion complete');
                setPreviewData([]);
                setOutputTable('');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Ingestion failed';
            console.error('Ingestion error:', errorMsg);
            setError(errorMsg);
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {source === 'clickhouse' ? (
                <Form.Group className="mb-3">
                    <Form.Label>Output File Path</Form.Label>
                    <Form.Control
                        type="text"
                        value={outputFile}
                        onChange={(e) => setOutputFile(e.target.value)}
                        placeholder="e.g., output.csv"
                        required
                        disabled={isLoading}
                    />
                </Form.Group>
            ) : (
                <Form.Group className="mb-3">
                    <Form.Label>Output Table Name</Form.Label>
                    <Form.Control
                        type="text"
                        value={outputTable}
                        onChange={(e) => setOutputTable(e.target.value)}
                        placeholder="e.g., new_table"
                        required
                        disabled={isLoading}
                    />
                </Form.Group>
            )}
            {source === 'clickhouse' && tables.length > 1 && (
                <Form.Group className="mb-3">
                    <Form.Label>Join Condition</Form.Label>
                    <Form.Control
                        type="text"
                        value={joinCondition}
                        onChange={(e) => setJoinCondition(e.target.value)}
                        placeholder="e.g., test_table.name = test_table2.name"
                        required
                        disabled={isLoading}
                    />
                </Form.Group>
            )}
            <div className="d-flex gap-2 mb-3">
                <Button
                    variant="primary"
                    onClick={handlePreview}
                    disabled={isLoading || 
                              (source === 'clickhouse' && (tables.length === 0 || columns.length === 0)) ||
                              (source === 'flatfile' && (!filePath || fileColumns.length === 0))}
                >
                    Preview
                </Button>
                <Button
                    variant="primary"
                    onClick={handleIngest}
                    disabled={isLoading || 
                              (source === 'clickhouse' && (tables.length === 0 || columns.length === 0 || !outputFile)) ||
                              (source === 'flatfile' && (!filePath || fileColumns.length === 0 || !outputTable))}
                >
                    Start Ingestion
                </Button>
                {recordCount !== null && (
                    <Button
                        variant="secondary"
                        onClick={onReset}
                        disabled={isLoading}
                    >
                        Reset
                    </Button>
                )}
            </div>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            {status && <Alert variant="info" className="mt-3">{status}</Alert>}
            {recordCount !== null && (
                <Alert variant="success" className="mt-3">Records processed: {recordCount}</Alert>
            )}
            {status === 'Ingesting...' && <ProgressBar animated now={100} className="mt-3" />}
            {previewData.length > 0 && (
                <Table striped bordered hover className="mt-3">
                    <thead>
                        <tr>
                            {(source === 'clickhouse' ? columns : fileColumns).map(col => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {previewData.map((row, idx) => (
                            <tr key={idx}>
                                {(source === 'clickhouse' ? columns : fileColumns).map(col => (
                                    <td key={col}>{row[col]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

export default IngestionControl;