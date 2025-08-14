import React, { useState, useEffect } from "react";
import "./Dice.css";

const Dice = ({ type = "d6", size = 50, className = "", rolling = false, finalValue }) => {
  const [currentValue, setCurrentValue] = useState(finalValue || parseInt(type.slice(1)));
  const sides = parseInt(type.slice(1));
  const radius = size / 2;
  const fontSize = Math.max(8, size / 5);

  // Animate number during roll
  useEffect(() => {
    if (!rolling) {
      setCurrentValue(finalValue || sides);
      return;
    }

    const interval = setInterval(() => {
      setCurrentValue(Math.floor(Math.random() * sides) + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [rolling, finalValue, sides]);

  const getPoints = () => {
    switch (type) {
      case "d4": return `${radius},0 ${size},${size} 0,${size}`;
      case "d6": return `${0},0 ${size},0 ${size},${size} 0,${size}`;
      case "d8": return `${radius},0 ${size},${radius} ${radius},${size} 0,${radius}`;
      case "d10": return `${radius},0 ${size*0.85},${size*0.35} ${size*0.65},${size} ${size*0.35},${size} ${size*0.15},${size*0.35}`;
      case "d20":
        const points = [];
        for (let i=0;i<20;i++){
          const angle = (2*Math.PI*i)/20 - Math.PI/2;
          const x = radius + radius*0.9*Math.cos(angle);
          const y = radius + radius*0.9*Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return points.join(" ");
      case "d50":
        const points50 = [];
        for (let i=0;i<50;i++){
          const angle = (2*Math.PI*i)/50 - Math.PI/2;
          const x = radius + radius*0.95*Math.cos(angle);
          const y = radius + radius*0.95*Math.sin(angle);
          points50.push(`${x},${y}`);
        }
        return points50.join(" ");
      default: return `${0},0 ${size},0 ${size},${size} 0,${size}`;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
      className={`${className} ${rolling ? "rolling" : ""}`}
    >
      <polygon
        points={getPoints()}
        fill="#ffcc00"
        stroke="#333"
        strokeWidth="2"
      />
      <text
        x={radius}
        y={radius + fontSize / 3}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="bold"
        fill="#000"
      >
        {currentValue}
      </text>
    </svg>
  );
};

export default Dice;
