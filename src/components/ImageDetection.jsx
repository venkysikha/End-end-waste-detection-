import React, { useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityIcon from '@mui/icons-material/Security';
import { detectImage } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

function ImageDetection() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [processedImageUrl, setProcessedImageUrl] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
            setProcessedImageUrl(null);
        }
    };

    const handleDetect = async () => {
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await detectImage(selectedFile);
            console.log('Detection response:', response);
            
            if (response.error) {
                setError(response.error);
                return;
            }
            
            setResult(response);
            
            if (response.processed_image_url) {
                const fullUrl = `http://localhost:5000${response.processed_image_url}`;
                setProcessedImageUrl(fullUrl);
            }
        } catch (err) {
            console.error('Detection error:', err);
            setError(err.response?.data?.error || err.message || 'An error occurred during detection');
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceDistribution = (detections) => {
        if (!detections || detections.length === 0) return null;

        const confidenceRanges = {
            '0-20%': 0,
            '21-40%': 0,
            '41-60%': 0,
            '61-80%': 0,
            '81-100%': 0
        };

        detections.forEach(detection => {
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
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };
    };

    const getWeaponTypeDistribution = (detections) => {
        if (!detections || detections.length === 0) return null;

        const weaponTypes = {};
        detections.forEach(detection => {
            weaponTypes[detection.class] = (weaponTypes[detection.class] || 0) + 1;
        });

        return {
            labels: Object.keys(weaponTypes),
            datasets: [{
                label: 'Number of Detections',
                data: Object.values(weaponTypes),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        };
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
            <Typography variant="h4" gutterBottom>
                Weapon Detection in Images
            </Typography>
            
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                    >
                        Upload Image
                        <VisuallyHiddenInput 
                            type="file" 
                            onChange={handleFileSelect} 
                            accept="image/*"
                        />
                    </Button>

                    {preview && (
                        <Box sx={{ width: '100%', mt: 2 }}>
                            <img 
                                src={preview} 
                                alt="Preview" 
                                style={{ maxWidth: '100%', maxHeight: '400px' }} 
                            />
                        </Box>
                    )}

                    {selectedFile && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleDetect}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                            fullWidth
                        >
                            {loading ? 'Detecting...' : 'Detect Weapons'}
                        </Button>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </Paper>

            {result && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Detection Results
                            </Typography>
                            {processedImageUrl && (
                                <Box sx={{ mt: 2, mb: 3 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Processed Image with Detections:
                                    </Typography>
                                    <img 
                                        src={processedImageUrl} 
                                        alt="Processed" 
                                        style={{ maxWidth: '100%', maxHeight: '400px' }} 
                                    />
                                </Box>
                            )}
                            
                            {result.detections && result.detections.length > 0 ? (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Detected Weapons
                                                </Typography>
                                                <List>
                                                    {result.detections.map((detection, index) => (
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
                                                            {index < result.detections.length - 1 && <Divider />}
                                                        </React.Fragment>
                                                    ))}
                                                </List>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Confidence Distribution
                                                </Typography>
                                                <Bar 
                                                    data={getConfidenceDistribution(result.detections)}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: { position: 'top' },
                                                            title: { display: false }
                                                        }
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Weapon Type Distribution
                                                </Typography>
                                                <Bar 
                                                    data={getWeaponTypeDistribution(result.detections)}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: { position: 'top' },
                                                            title: { display: false }
                                                        }
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Typography color="text.secondary">
                                    No weapons detected in the image.
                                </Typography>
                            )}
                            
                            {result.processing_time && (
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    Processing time: {result.processing_time.toFixed(2)} seconds
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}

export default ImageDetection; 