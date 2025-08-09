import React, { createContext, useState } from "react";

// Create UserContext with named export
export const UserContext = createContext();

// UserProvider component to wrap your app and provide user state
export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // user shape: { name: '', role: 'player' | 'host' }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
