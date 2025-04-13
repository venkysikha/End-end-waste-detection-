import React, { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { detectVideo } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const VideoDetection = () => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [detections, setDetections] = useState([]);
    const [processingTime, setProcessingTime] = useState(null);
    const [confidenceData, setConfidenceData] = useState({
        labels: [],
        datasets: [{
            label: 'Confidence Score',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    });

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setDetections([]);
            setProcessingTime(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a video file first');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const response = await detectVideo(file);
            
            if (response.success) {
                setDetections(response.detections);
                setProcessingTime(response.processing_time);
                
                // Process confidence data with sampling
                const frameData = {};
                response.detections.forEach(detection => {
                    if (!frameData[detection.frame]) {
                        frameData[detection.frame] = [];
                    }
                    frameData[detection.frame].push(detection.confidence);
                });

                // Sample frames to reduce data points
                const frameKeys = Object.keys(frameData);
                const sampleSize = Math.min(50, frameKeys.length); // Limit to 50 data points
                const step = Math.max(1, Math.floor(frameKeys.length / sampleSize));
                
                const sampledLabels = [];
                const sampledData = [];
                
                for (let i = 0; i < frameKeys.length; i += step) {
                    const frame = frameKeys[i];
                    const confidences = frameData[frame];
                    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
                    
                    sampledLabels.push(`Frame ${frame}`);
                    sampledData.push(avgConfidence);
                }

                setConfidenceData({
                    labels: sampledLabels,
                    datasets: [{
                        label: 'Confidence Score',
                        data: sampledData,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        pointRadius: 2,
                        pointHoverRadius: 4
                    }]
                });
            } else {
                setError(response.error || 'Failed to process video');
            }
        } catch (error) {
            console.error('Error processing video:', error);
            setError(error.message || 'An error occurred while processing the video');
        } finally {
            setIsUploading(false);
        }
    };

    const getDetectionSummary = () => {
        if (detections.length === 0) return null;

        const weaponCounts = {};
        let totalConfidence = 0;

        detections.forEach(detection => {
            const weaponType = detection.class;
            weaponCounts[weaponType] = (weaponCounts[weaponType] || 0) + 1;
            totalConfidence += detection.confidence;
        });

        const averageConfidence = totalConfidence / detections.length;

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Detection Summary
                </Typography>
                <Typography variant="body1">
                    Total Detections: {detections.length}
                </Typography>
                <Typography variant="body1">
                    Average Confidence: {(averageConfidence * 100).toFixed(2)}%
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Weapon Types Detected:
                </Typography>
                <ul>
                    {Object.entries(weaponCounts).map(([weapon, count]) => (
                        <li key={weapon}>
                            {weapon}: {count} occurrences
                        </li>
                    ))}
                </ul>
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Video Weapon Detection
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <input
                        accept="video/*"
                        style={{ display: 'none' }}
                        id="video-upload"
                        type="file"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="video-upload">
                        <Button
                            variant="contained"
                            component="span"
                            startIcon={<UploadIcon />}
                            disabled={isUploading}
                        >
                            Select Video
                        </Button>
                    </label>
                    {file && (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            Selected file: {file.name}
                        </Typography>
                    )}
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    startIcon={isUploading ? <CircularProgress size={20} /> : null}
                >
                    {isUploading ? 'Processing...' : 'Process Video'}
                </Button>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            {processingTime && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Processing Results
                    </Typography>
                    <Typography variant="body1">
                        Processing Time: {processingTime.toFixed(2)} seconds
                    </Typography>
                    {getDetectionSummary()}
                </Paper>
            )}

            {confidenceData.labels.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Confidence Analysis
                    </Typography>
                    <Box sx={{ height: 300 }}>
                        <Line
                            data={confidenceData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                animation: {
                                    duration: 0 // Disable animations for better performance
                                },
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        display: false // Hide legend to reduce rendering overhead
                                    },
                                    title: {
                                        display: true,
                                        text: 'Confidence Scores Over Time'
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 1,
                                        title: {
                                            display: true,
                                            text: 'Confidence Score'
                                        }
                                    },
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Frame Number'
                                        },
                                        ticks: {
                                            maxRotation: 0,
                                            autoSkip: true,
                                            maxTicksLimit: 10
                                        }
                                    }
                                }
                            }}
                        />
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default VideoDetection;