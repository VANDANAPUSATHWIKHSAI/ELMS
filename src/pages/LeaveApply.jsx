import React, { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';

const LeaveApply = () => {
    const [leaveType, setLeaveType] = useState('CL');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ leaveType, fromDate, toDate, reason });
        alert('Leave Application Submitted (Mock)');
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Apply for Leave
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Leave Type</InputLabel>
                            <Select
                                value={leaveType}
                                label="Leave Type"
                                onChange={(e) => setLeaveType(e.target.value)}
                            >
                                <MenuItem value="CL">Casual Leave (CL)</MenuItem>
                                <MenuItem value="CCL">Compensatory Casual Leave (CCL)</MenuItem>
                                <MenuItem value="AL">Academic Leave (AL)</MenuItem>
                                <MenuItem value="OD">On Duty (OD)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            fullWidth
                            label="From Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            fullWidth
                            label="To Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            label="Reason"
                            multiline
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                        >
                            Submit Application
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

export default LeaveApply;
