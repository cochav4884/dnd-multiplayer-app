import React, { useState, useEffect } from "react";
import { socket } from "../socket";
import "./Battlefield.css";

const ROOM = "game-room-1";

const Battlefield = ({
  user,
  background,
  setHasJoinedBattlefield,
  setGameStarted,
}) => {
  const [hasJoinedLocal, setHasJoinedLocal] = useState(false);
  const [gameStartedLocal, setGameStartedLocal] = useState(false);

  useEffect(() => {
    console.log("Selected background:", background);
  }, [background]);

  useEffect(() => {
    socket.on("gameStarted", () => {
      setGameStartedLocal(true);
      setGameStarted(true);

      // Auto join battlefield if host
      if (user && user.role === "host") {
        socket.emit("joinBattleField", { room: ROOM });
      }
    });

    socket.on("playerJoinedBattlefield", (player) => {
      if (player.id === socket.id) {
        setHasJoinedLocal(true);
        setHasJoinedBattlefield(true);
      }
    });

    socket.on("playerLeftBattlefield", (player) => {
      if (player.id === socket.id) {
        setHasJoinedLocal(false);
        setHasJoinedBattlefield(false);
      }
    });

    socket.on("gameEnded", () => {
      setGameStartedLocal(false);
      setGameStarted(false);
      setHasJoinedLocal(false);
      setHasJoinedBattlefield(false);
    });

    return () => {
      socket.off("gameStarted");
      socket.off("playerJoinedBattlefield");
      socket.off("playerLeftBattlefield");
      socket.off("gameEnded");
    };
  }, [setHasJoinedBattlefield, setGameStarted, user]);

  const handleJoinBattlefield = () => {
    socket.emit("joinBattleField", { room: ROOM });
  };

  const handleBackToLobby = () => {
    socket.emit("leaveBattlefield", { room: ROOM });
  };

  return (
    <div className="battlefield">
      {background ? (
        <div
          className="background-image"
          style={{ backgroundImage: `url(${background})` }}
        >
          <div className="grid-overlay" />
          <div className="battlefield-controls">
            {!hasJoinedLocal && gameStartedLocal && user.role !== "host" && (
              <button onClick={handleJoinBattlefield}>Join Battlefield</button>
            )}

            {hasJoinedLocal && (
              <button onClick={handleBackToLobby}>Back to Lobby</button>
            )}
          </div>
        </div>
      ) : (
        <div className="battlefield-placeholder">No background selected</div>
      )}
    </div>
  );
};

export default Battlefield;
