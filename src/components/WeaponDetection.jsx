import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Grid, 
    Button, 
    CircularProgress, 
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import { PhotoCamera, Videocam, Security as SecurityIcon } from '@mui/icons-material';
import { detectImage, detectVideo } from '../services/api';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const WeaponDetection = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const [processedImageUrl, setProcessedImageUrl] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setIsVideo(file.type.startsWith('video/'));
            setError(null);
            setResults(null);
            setProcessedImageUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let response;
            if (isVideo) {
                response = await detectVideo(selectedFile);
            } else {
                response = await detectImage(selectedFile);
            }
            setResults(response);
            if (!isVideo && response.processed_image_url) {
                setProcessedImageUrl(response.processed_image_url);
            }
        } catch (err) {
            setError(err.message || 'Failed to process the file');
        } finally {
            setLoading(false);
        }
    };

    const getWeaponTypeDistribution = () => {
        if (!results?.detections || results.detections.length === 0) return null;

        const weaponTypes = {};
        results.detections.forEach(detection => {
            weaponTypes[detection.class] = (weaponTypes[detection.class] || 0) + 1;
        });

        return {
            labels: Object.keys(weaponTypes),
            datasets: [{
                label: 'Number of Detections',
                data: Object.values(weaponTypes),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };
    };

    const getConfidenceDistribution = () => {
        if (!results?.detections || results.detections.length === 0) return null;

        const confidenceRanges = {
            '0-20%': 0,
            '21-40%': 0,
            '41-60%': 0,
            '61-80%': 0,
            '81-100%': 0
        };

        results.detections.forEach(detection => {
            const confidence = detection.confidence * 100;
            if (confidence <= 20) confidenceRanges['0-20%']++;
            else if (confidence <= 40) confidenceRanges['21-40%']++;
            else if (confidence <= 60) confidenceRanges['41-60%']++;
            else if (confidence <= 80) confidenceRanges['61-80%']++;
            else confidenceRanges['81-100%']++;
        });

        return {
            labels: Object.keys(confidenceRanges),
            datasets: [{
                label: 'Number of Detections',
                data: Object.values(confidenceRanges),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        };
    };

    const renderResults = () => {
        if (!results) return null;

        return (
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Analysis Results
                </Typography>
                
                {!isVideo && processedImageUrl && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Processed Image:
                        </Typography>
                        <img
                            src={processedImageUrl}
                            alt="Processed"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                        />
                    </Box>
                )}

                {results.detections && results.detections.length > 0 ? (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Detected Weapons: {results.detections.length}
                                </Typography>
                                <List>
                                    {results.detections.map((detection, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <SecurityIcon color="error" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={detection.class}
                                                    secondary={`Confidence: ${(detection.confidence * 100).toFixed(1)}%`}
                                                />
                                            </ListItem>
                                            {index < results.detections.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Weapon Type Distribution
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <Bar
                                        data={getWeaponTypeDistribution()}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    title: {
                                                        display: true,
                                                        text: 'Number of Detections'
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Confidence Score Distribution
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <Bar
                                        data={getConfidenceDistribution()}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    title: {
                                                        display: true,
                                                        text: 'Number of Detections'
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                ) : (
                    <Typography variant="body1">
                        No weapons detected in the {isVideo ? 'video' : 'image'}.
                    </Typography>
                )}

                {results.processing_time && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Processing time: {results.processing_time.toFixed(2)} seconds
                    </Typography>
                )}
            </Paper>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Weapon Detection
            </Typography>
            <Typography variant="body1" paragraph>
                Upload an image or video to detect weapons. The system will analyze the content and identify any potential weapons.
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12}>
                        <input
                            accept={isVideo ? "video/*" : "image/*"}
                            style={{ display: 'none' }}
                            id="file-upload"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={isVideo ? <Videocam /> : <PhotoCamera />}
                            >
                                Select {isVideo ? 'Video' : 'Image'}
                            </Button>
                        </label>
                        {selectedFile && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Selected file: {selectedFile.name}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleUpload}
                            disabled={!selectedFile || loading}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? 'Processing...' : 'Analyze'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {renderResults()}
        </Box>
    );
};

export default WeaponDetection; 