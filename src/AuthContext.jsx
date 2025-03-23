import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("userToken") ? true : false; 
  });

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem("userToken", "your-token"); 
    } else {
      localStorage.removeItem("userToken"); 
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};
