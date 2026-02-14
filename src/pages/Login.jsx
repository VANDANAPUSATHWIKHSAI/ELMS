import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Paper,
    InputAdornment
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const [role, setRole] = useState('employee'); // Defaulting to Employee for flow
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simple logic for demo
        let assignedRole = 'employee';
        if (email.includes('admin')) assignedRole = 'admin';
        else if (email.includes('hod')) assignedRole = 'hod';
        else if (email.includes('dean')) assignedRole = 'dean';

        const userData = {
            name: email.split('@')[0] || 'Faculty Member',
            email,
            role: assignedRole,
        };
        login(userData);
        navigate('/');
    };

    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                backgroundImage: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)', // College building placeholder
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Dark overlay for better text contrast */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)'
                }}
            />

            <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={6}
                    sx={{
                        p: 5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.1)', // Glass effect
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            bgcolor: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            color: 'black',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            border: '4px solid #ea580c'
                        }}
                    >
                        Kmit
                    </Box>

                    <Typography component="h1" variant="h4" gutterBottom sx={{ color: '#ea580c', fontWeight: 'bold' }}>
                        Welcome to KMIT ELMS
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Employee ID / Email"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '&:hover fieldset': { borderColor: 'white' },
                                    '&.Mui-focused fieldset': { borderColor: '#ea580c' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#ea580c' }
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '&:hover fieldset': { borderColor: 'white' },
                                    '&.Mui-focused fieldset': { borderColor: '#ea580c' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#ea580c' }
                            }}
                        />
                        {/* Hidden role selection to simplify UI, logic handles role based on email */}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 4,
                                mb: 2,
                                py: 1.5,
                                fontSize: '1.1rem',
                                bgcolor: '#ea580c',
                                '&:hover': { bgcolor: '#c2410c' }
                            }}
                        >
                            Log In
                        </Button>
                        <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
                            © 2026 KMIT-ELMS Management
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
