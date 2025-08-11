import React, { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "./UserContext";
import { socket } from "./socket";
import { useNavigate } from "react-router-dom";
import "./LobbySidebar.css";

const ROOM = "game-room-1";

export default function LobbySidebar({
  setGameStarted,
  setHasJoinedBattlefield,
  gameStarted,
  hasJoinedBattlefield,
}) {
  const { user, setUser } = useContext(UserContext);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const navigate = useNavigate();
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }

    if (!hasJoined.current || !socket.connected) {
      socket.emit("joinRoom", { room: ROOM, user });
      hasJoined.current = true;
    }

    const onPlayerList = (list) => {
      setPlayers(list);
    };

    const onHostStatus = (status) => {
      setIsHost(status);
    };

    const onJoinError = (message) => {
      alert(message);
      setUser(null);
      socket.disconnect();
      navigate("/");
    };

    const onGameStarted = () => {
      setGameStarted(true);
    };

    const onGameEnded = () => {
      setGameStarted(false);
      setHasJoinedBattlefield(false);
    };

    socket.on("playerList", onPlayerList);
    socket.on("hostStatus", onHostStatus);
    socket.on("joinError", onJoinError);
    socket.on("gameStarted", onGameStarted);
    socket.on("gameEnded", onGameEnded);

    const handleDisconnect = () => {
      hasJoined.current = false;
    };

    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("playerList", onPlayerList);
      socket.off("hostStatus", onHostStatus);
      socket.off("joinError", onJoinError);
      socket.off("gameStarted", onGameStarted);
      socket.off("gameEnded", onGameEnded);
      socket.off("disconnect", handleDisconnect);
    };
  }, [user, navigate, setUser, setGameStarted, setHasJoinedBattlefield]);

  const handleLeave = () => {
    socket.disconnect();
    setUser(null);
    navigate("/");
  };

  const handleRemovePlayer = (socketId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this player from the lobby?"
      )
    ) {
      socket.emit("removePlayer", { room: ROOM, socketIdToRemove: socketId });
    }
  };

  const handleJoinBattlefield = () => {
    socket.emit("joinBattleField", { room: ROOM });
  };

  const handleBackToLobby = () => {
    socket.emit("leaveBattlefield", { room: ROOM });
    setHasJoinedBattlefield(false);
  };

  const handleStartGame = () => {
    socket.emit("startGame", { room: ROOM });
    setGameStarted(true);
  };

  const handleEndGame = () => {
    socket.emit("endGame", { room: ROOM });
    setGameStarted(false);
    setHasJoinedBattlefield(false);
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  // Store count of players who are role 'player' once
  const playersCount = players.filter((p) => p.role === "player").length;

  return (
    <div className="lobby-sidebar">
      <h3>Welcome, {user.name}!</h3>
      <p>
        Role: <strong>{user.role}</strong>
      </p>

      <h4>Players in Lobby:</h4>
      {players.length === 0 ? (
        <p>No one in the lobby yet.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {players.map((p) => (
            <li
              key={p.socketId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                {p.name} — <em>{p.role}</em>
              </span>

              <div>
                {/* Remove button for host Samuel */}
                {user.role === "host" &&
                  user.name.trim().toLowerCase() === "samuel" &&
                  isHost &&
                  p.socketId !== socket.id && (
                    <button
                      className="remove-player-button margin-left"
                      onClick={() => handleRemovePlayer(p.socketId)}
                      aria-label={`Remove player ${p.name}`}
                    >
                      Remove
                    </button>
                  )}

                {/* Join Battlefield button ONLY for current player if game started and not joined battlefield */}
                {p.socketId === socket.id &&
                  gameStarted &&
                  user.role === "player" &&
                  !hasJoinedBattlefield && (
                    <button
                      className="join-battlefield-button margin-left"
                      onClick={handleJoinBattlefield}
                    >
                      Join Battlefield
                    </button>
                  )}

                {/* Back to Lobby button ONLY for current player if game started and has joined battlefield */}
                {p.socketId === socket.id &&
                  gameStarted &&
                  user.role === "player" &&
                  hasJoinedBattlefield && (
                    <button
                      className="back-to-lobby-button margin-left"
                      onClick={handleBackToLobby}
                    >
                      Back to Lobby
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Start Game button */}
      {!gameStarted && user.role === "host" && isHost && (
        <button
          className="start-game-button"
          onClick={handleStartGame}
          disabled={playersCount === 0}
          title={playersCount === 0 ? "No players to start the game" : ""}
        >
          Start Game
        </button>
      )}

      {/* End Game button */}
      {gameStarted && user.role === "host" && isHost && (
        <button className="end-game-button" onClick={handleEndGame}>
          End Game
        </button>
      )}

      {/* Leave Lobby button */}
      <button className="leave-button" onClick={handleLeave}>
        Leave Lobby
      </button>
    </div>
  );
}
