import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import Home from './components/Home';
import ImageDetection from './components/ImageDetection';
import VideoDetection from './components/VideoDetection';

function App() {
    return (
        <Router>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component={Link} to="/" sx={{ 
                        flexGrow: 1, 
                        textDecoration: 'none', 
                        color: 'inherit' 
                    }}>
                        Weapon Detection System
                    </Typography>
                    <Button color="inherit" component={Link} to="/image">
                        Image Detection
                    </Button>
                    <Button color="inherit" component={Link} to="/video">
                        Video Detection
                    </Button>
                </Toolbar>
            </AppBar>
            <Container>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/image" element={<ImageDetection />} />
                    <Route path="/video" element={<VideoDetection />} />
                </Routes>
            </Container>
        </Router>
    );
}

export default App; 