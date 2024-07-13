import "./App.css";
import * as pose from '@mediapipe/pose';
import smoothLandmarks from 'mediapipe-pose-smooth'; // Ensure it's properly imported
import * as cam from "@mediapipe/camera_utils";
import * as drawingUtils from "@mediapipe/drawing_utils";
import { useRef, useEffect, useState } from "react";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  let camera = null;
  const [didLoad, setDidLoad] = useState(false);

  function onResults(results) {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
      drawingUtils.drawConnectors(canvasCtx, results.poseLandmarks, pose.POSE_CONNECTIONS, { visibilityMin: 0.65, color: 'white' });
      drawingUtils.drawLandmarks(canvasCtx, Object.values(pose.POSE_LANDMARKS_LEFT)
          .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
      drawingUtils.drawLandmarks(canvasCtx, Object.values(pose.POSE_LANDMARKS_RIGHT)
          .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
      drawingUtils.drawLandmarks(canvasCtx, Object.values(pose.POSE_LANDMARKS_NEUTRAL)
          .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'white' });
    }
    canvasCtx.restore();
  }

  useEffect(() => {
    if (!didLoad) {
      const mpPose = new pose.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });
      mpPose.setOptions({
        selfieMode: true,
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      camera = new cam.Camera(webcamRef.current, {
        onFrame: async () => {
          const inputFrame = webcamRef.current; // Video element
          const canvasElement = canvasRef.current;
          const aspect = inputFrame.videoHeight / inputFrame.videoWidth;
          let width, height;
          
          width = 640;
          height = width * aspect;
          
          canvasElement.width = width;
          canvasElement.height = height;

          const ctx = canvasElement.getContext('2d');
          ctx.drawImage(inputFrame, 0, 0, width, height);
          await mpPose.send({ image: canvasElement });
        },
        width: 640,
        height: 480
      });
      camera.start();

      mpPose.onResults((results) => smoothLandmarks(results, onResults));
      setDidLoad(true);

      // Cleanup function
      return () => {
        camera.stop();
        mpPose.close();
      };
    }
  }, [didLoad]);

  return (
    <div className="App">
      <div className="container">
        <video className="input_video" ref={webcamRef} autoPlay muted playsInline />
        <canvas ref={canvasRef} className="output_canvas"></canvas>
      </div>
    </div>
  );
}

export default App;
