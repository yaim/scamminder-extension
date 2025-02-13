import React from "react";
import "./Chart.css";

interface ChartProps {
  rate: number;
  className: string;
}

const Chart: React.FC<ChartProps> = ({ rate, className }) => {
  const clampedProgress = Math.max(0, Math.min(rate, 100));
  const angle = (clampedProgress / 100) * 180;

  // SVG path for the semi-circle progress bar
  const radius = 50; // Radius of the semi-circle
  const centerX = 60; // X-coordinate of the SVG center
  const centerY = 60; // Y-coordinate of the SVG center
  const circumference = Math.PI * radius; // Circumference of the semi-circle
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (angle / 180) * circumference;

  return (
    <div className={className} style={{ textAlign: "center", margin: "30px" }}>
      <svg width="200" height="100" viewBox="0 0 120 60">
        <path
          d="M10,60 A50,50 0 0,1 110,60"
          fill="none"
          stroke="rgba(215, 216, 222, 0.85)"
          strokeWidth="3"
        />

        <path
          d="M10,60 A50,50 0 0,1 110,60"
          fill="none"
          className="bar"
          strokeWidth="10"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ marginTop: "-55px", fontSize: "18px", fontWeight: "bold" }}>
        <div>Trust Score</div>
        <div>{clampedProgress}/100</div>
      </div>
    </div>
  );
};

export default Chart;
