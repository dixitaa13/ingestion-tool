import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import ConnectionForm from './components/ConnectionForm';
import TableSelector from './components/TableSelector';
import ColumnSelector from './components/ColumnSelector';
import IngestionControl from './components/IngestionControl';
import './App.css';

function App() {
    const [source, setSource] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [tables, setTables] = useState([]);
    const [columns, setColumns] = useState([]);
    const [fileColumns, setFileColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [filePath, setFilePath] = useState(null);

    const resetState = () => {
        setTables([]);
        setColumns([]);
        setFileColumns([]);
        setSelectedColumns([]);
        setFilePath(null);
    };

    const handleConnect = (newSource) => {
        console.log('Connecting to source:', newSource);
        resetState();
        setSource(newSource);
        setIsConnected(!!newSource);
    };

    const handleSelectTable = (selectedTables) => {
        console.log('Tables selected:', selectedTables);
        setTables(selectedTables);
        setColumns([]);
        setSelectedColumns([]);
    };

    const handleSelectColumns = (selectedCols) => {
        console.log('Columns selected:', selectedCols);
        setSelectedColumns(selectedCols);
    };

    const handleFileColumns = (columns, file) => {
        console.log('Setting fileColumns:', columns, 'file:', file);
        resetState();
        setFileColumns(columns);
        setSelectedColumns([]);
        setFilePath(file);
        setSource('flatfile');
        setIsConnected(true);
    };

    const handleReset = () => {
        console.log('Resetting UI');
        resetState();
        setSource('');
        setIsConnected(false);
    };

    return (
        <Container fluid className="py-4" style={{ backgroundColor: '#f1f4f8', minHeight: '100vh' }}>
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="card mb-4">
                        <Card.Body>
                            <h2 className="text-center mb-4">Data Ingestion Tool</h2>
                            <ConnectionForm
                                onConnect={handleConnect}
                                onFileColumns={handleFileColumns}
                            />
                        </Card.Body>
                    </Card>
                    {isConnected && source === 'clickhouse' && (
                        <Card className="card mb-4">
                            <Card.Body>
                                <TableSelector onSelectTable={handleSelectTable} />
                                {tables.length > 0 && (
                                    <ColumnSelector
                                        table={tables[0]}
                                        tables={tables}
                                        onSelectColumns={handleSelectColumns}
                                        columns={columns}
                                        source={source}
                                    />
                                )}
                            </Card.Body>
                        </Card>
                    )}
                    {isConnected && source === 'flatfile' && (
                        <Card className="card mb-4">
                            <Card.Body>
                                <ColumnSelector
                                    table=""
                                    tables={[]}
                                    onSelectColumns={handleSelectColumns}
                                    columns={fileColumns}
                                    source={source}
                                />
                            </Card.Body>
                        </Card>
                    )}
                    {isConnected && (
                        <Card className="card">
                            <Card.Body>
                                <IngestionControl
                                    source={source}
                                    tables={source === 'clickhouse' ? tables : []}
                                    columns={source === 'clickhouse' ? selectedColumns : []}
                                    fileColumns={source === 'flatfile' ? selectedColumns : []}
                                    filePath={source === 'flatfile' ? filePath : null}
                                    onReset={handleReset}
                                />
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default App;