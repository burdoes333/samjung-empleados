import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";

export default function App() {
  const [empleado, setEmpleado] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("empleado_session");
    if(saved) setEmpleado(JSON.parse(saved));
  }, []);

  const handleLogin = (emp) => {
    localStorage.setItem("empleado_session", JSON.stringify(emp));
    setEmpleado(emp);
  };

  const handleLogout = () => {
    localStorage.removeItem("empleado_session");
    setEmpleado(null);
  };

  if(!empleado) return <Login onLogin={handleLogin}/>;
  return <Home empleado={empleado} onLogout={handleLogout}/>;
}