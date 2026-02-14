import React from 'react';
import { Box, Grid, Paper, Typography, IconButton, Divider } from '@mui/material';
import { NotificationsOutlined, DescriptionOutlined, CalendarTodayOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

const Dashboard = () => {
    const { user } = useAuth();
    const currentDate = new Date(2026, 1, 7); // Feb 7, 2026

    const LeaveRow = ({ type, fullName, count }) => (
        <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
            <Box>
                <Typography variant="body1" fontWeight="700" color="#374151" sx={{ fontSize: '1.1rem' }}>
                    {type}
                </Typography>
                <Typography variant="body2" color="#9ca3af" fontWeight="500">
                    ({fullName})
                </Typography>
            </Box>
            <Typography variant="h3" fontWeight="800" color="#111827" sx={{ fontSize: '2.5rem' }}>
                {String(count).padStart(2, '0')}
            </Typography>
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ maxWidth: '100%', mx: 'auto', px: 2, pt: 1 }}>

                {/* Header Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                    <Typography variant="h4" sx={{ fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>
                        Welcome, <span style={{ color: '#ea580c' }}>{user?.name || 'Faculty Member'}</span>
                    </Typography>
                    <IconButton sx={{ bgcolor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', p: 1.2 }}>
                        <NotificationsOutlined sx={{ color: '#ea580c' }} />
                    </IconButton>
                </Box>

                <Grid container spacing={4}>
                    {/* Left Column: Available Leaves Card */}
                    <Grid item xs={12} md={5}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                borderRadius: 6,
                                border: '1px solid #e5e7eb', // Slightly darker border for definition
                                height: '100%',
                                bgcolor: '#ffffff'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <DescriptionOutlined sx={{ color: '#ea580c', mr: 1.5 }} />
                                <Typography variant="h6" fontWeight="700" color="#374151">
                                    Available Leaves
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <LeaveRow type="CL" fullName="Casual Leave" count={12} />
                                <LeaveRow type="CCL" fullName="Compensatory CL" count={4} />

                                <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body1" fontWeight="700" color="#374151" sx={{ fontSize: '1.1rem' }}>
                                            AL
                                        </Typography>
                                        <Typography variant="body2" color="#9ca3af" fontWeight="500">
                                            (Academic Leaves)
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" fontWeight="800" color="#111827" sx={{ fontSize: '2.5rem' }}>
                                        06
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right Column: Calendar */}
                    <Grid item xs={12} md={7}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                borderRadius: 6,
                                border: '1px solid #e5e7eb',
                                height: '100%',
                                bgcolor: '#ffffff'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CalendarTodayOutlined sx={{ color: '#ea580c', mr: 1.5 }} />
                                <Typography variant="h6" fontWeight="700" color="#374151">
                                    February 2026
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <DateCalendar
                                    defaultValue={currentDate}
                                    readOnly
                                    views={['day']}
                                    sx={{
                                        width: '100%',
                                        // Hide default header to key visual clean or match screenshot
                                        '& .MuiPickersCalendarHeader-root': {
                                            // display: 'none', // Uncomment if we want strictly no header interaction
                                            pl: 0,
                                        },
                                        '& .MuiDayCalendar-weekDayLabel': {
                                            color: '#9ca3af',
                                            fontWeight: '500',
                                            fontSize: '0.9rem',
                                            width: 40,
                                            height: 40,
                                        },
                                        '& .MuiPickersDay-root': {
                                            fontSize: '0.95rem',
                                            color: '#4b5563',
                                            fontWeight: 600,
                                            width: 40,
                                            height: 40,
                                        },
                                        '& .MuiPickersDay-root.Mui-selected': {
                                            backgroundColor: '#fff7ed !important',
                                            color: '#ea580c !important',
                                            border: '1px solid #ea580c',
                                            fontWeight: '800'
                                        },
                                        '& .MuiPickersDay-today': {
                                            border: '1px solid #e5e7eb',
                                        }
                                    }}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default Dashboard;
