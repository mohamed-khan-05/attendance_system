import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

const FaceCapture = ({ onFaceData }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        setLoading(false);
      } catch (err) {
        console.error("Error loading models:", err);
        setStreamError("Failed to load models.");
      }
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam error:", err);
        setStreamError("Unable to access webcam. Please allow permission.");
      }
    };

    loadModels().then(startVideo);

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    const detect = async () => {
      if (!videoRef.current) return;
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection && onFaceData) {
        onFaceData(Array.from(detection.descriptor));
      }
    };

    if (!loading && !streamError) {
      interval = setInterval(detect, 2000); // auto detect every 2 seconds
    }

    return () => clearInterval(interval);
  }, [loading, streamError, onFaceData]);

  return (
    <div className="space-y-2">
      {loading ? (
        <p>Loading face detection models...</p>
      ) : streamError ? (
        <p className="text-red-600">{streamError}</p>
      ) : (
        <video
          ref={videoRef}
          width="320"
          height="240"
          muted
          autoPlay
          playsInline
          className="rounded border"
          style={{ backgroundColor: "#000" }}
        />
      )}
    </div>
  );
};

export default FaceCapture;
