import { Routes, Route, Navigate } from "react-router-dom";
import Upload from "./pages/Upload.jsx";
import Editor from "./pages/Editor.jsx";
import Share from "./pages/Share.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/edit" element={<Editor />} />
        <Route path="/share" element={<Share />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
