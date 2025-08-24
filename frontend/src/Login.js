import { useState, useContext } from "react";
import { connectSocket } from "./socket";
import { UserContext } from "./UserContext";
import axios from "axios";
import "./Login.css";

export default function Login() {
  const { user, setUser } = useContext(UserContext);
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setError("");
    setMessage("");

    // Normalize role for backend
    // "creator & host" -> "creator-host"
    const backendRole = role.toLowerCase().replace(/ & /, "-");

    try {
      const res = await axios.post("http://localhost:5000/login", {
        role: backendRole,
        username,
        password,
        dualRole: backendRole === "creator-host", // flag for backend
      });

      if (res.data.success) {
        // Keep displayRole for UI purposes
        const displayRole = role;
        setUser({ name: username, role: backendRole, displayRole });
        connectSocket(username, backendRole);
        setMessage(res.data.message);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Server error");
    }
  };

  const handleLogout = async () => {
    if (!user) return;
    try {
      await axios.post("http://localhost:5000/logout", {
        role: user.role,
        username: user.name,
      });
      setUser(null);
      setUsername("");
      setPassword("");
      setRole("");
      setMessage("Logged out successfully");
    } catch (err) {
      setError("Failed to logout");
    }
  };

  return (
    <div className="login-page">
      <h1>Welcome to Horizon</h1>

      {!user ? (
        <div className="login-form">
          <label>
            Select Role:
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">--Select--</option>
              <option value="creator">Creator</option>
              <option value="creator & host">Creator & Host</option>
              <option value="host">Host</option>
              <option value="player">Player</option>
            </select>
          </label>

          {(role === "creator" ||
            role === "host" ||
            role === "creator & host") && (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}

          {role === "player" && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <button onClick={handleLogin}>Login</button>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
        </div>
      ) : (
        <div className="logout-section">
          <p>
            Logged in as: {user.name} ({user.displayRole})
          </p>
          <button onClick={handleLogout}>Logout</button>
          {message && <p className="success">{message}</p>}
        </div>
      )}
    </div>
  );
}
