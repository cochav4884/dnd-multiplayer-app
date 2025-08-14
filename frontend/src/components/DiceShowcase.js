import React, { useState } from "react";
import Dice from "./Dice";
import "./DiceShowcase.css";

export default function DiceShowcase() {
  const diceTypes = ["d4","d6","d8","d10","d20","d50"];
  const [selectedDie, setSelectedDie] = useState("d6");

  return (
    <div className="dice-showcase">
      {diceTypes.map(die => (
        <div key={die} className="dice-wrapper" onClick={() => setSelectedDie(die)}>
          <Dice type={die} size={50} className={selectedDie===die ? "selected" : ""}/>
          <div className="dice-label">{die.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}
