import React from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Box,
    Grid,
} from '@mui/material';

const LeaveLedger = () => {
    // Mock Data
    const balances = [
        { type: 'CL', balance: 4, total: 12 },
        { type: 'CCL', balance: 2, total: 5 },
        { type: 'AL', balance: 5, total: 5 },
        { type: 'SV', balance: 15, total: 30 },
    ];

    const transactions = [
        {
            id: 1,
            date: '2023-10-15',
            type: 'CL',
            debit: 1,
            credit: 0,
            balance: 3,
            reason: 'Personal work',
            status: 'Approved',
        },
        {
            id: 2,
            date: '2023-11-01',
            type: 'CCL',
            debit: 0,
            credit: 1,
            balance: 2,
            reason: 'Exam Duty',
            status: 'Credited',
        },
        {
            id: 3,
            date: '2023-11-20',
            type: 'CL',
            debit: 1,
            credit: 0,
            balance: 2,
            reason: 'Sick leave',
            status: 'Pending',
        },
    ];

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Leave Ledger
            </Typography>

            {/* Balances Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {balances.map((item) => (
                    <Grid item xs={6} sm={3} key={item.type}>
                        <Paper
                            elevation={2}
                            sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}
                        >
                            <Typography variant="h6" color="primary">
                                {item.type}
                            </Typography>
                            <Typography variant="h4">{item.balance}</Typography>
                            <Typography variant="caption" color="textSecondary">
                                / {item.total} Total
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Transactions Table */}
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="leave ledger table">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Credit (+)</TableCell>
                            <TableCell align="right">Debit (-)</TableCell>
                            <TableCell align="right">Balance</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {row.date}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.type}
                                        size="small"
                                        color={row.type === 'CL' ? 'primary' : 'secondary'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {row.credit > 0 ? row.credit : '-'}
                                </TableCell>
                                <TableCell align="right">
                                    {row.debit > 0 ? row.debit : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {row.balance}
                                </TableCell>
                                <TableCell>{row.reason}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.status}
                                        size="small"
                                        color={
                                            row.status === 'Approved'
                                                ? 'success'
                                                : row.status === 'Pending'
                                                    ? 'warning'
                                                    : 'default'
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default LeaveLedger;
