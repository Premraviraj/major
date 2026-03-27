import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Superseded by Home.jsx — redirect to keep old links working
export default function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/", { replace: true }); }, [navigate]);
  return null;
}
