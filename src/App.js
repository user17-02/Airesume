import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ResumeBuilderLayout from "./Components/ResumeBuilderLayout";
import "./App.css";

// ---- Preview Page ----
function ResumePreview() {
  return (
    <div className="previewContainer">
      <h1 className="previewHeading">Resume Preview</h1>
      <p>This is where the formatted resume will be displayed.</p>
      <img
        src="https://via.placeholder.com/600x800?text=Resume+Preview"
        alt="Resume Preview"
        className="previewImage"
      />
    </div>
  );
}

// ---- App with Navbar + Routing ----
export default function App() {
  return (
    <Router>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navBrand">AI Resume Builder</div>
        <div className="navLinks">
          <Link to="/builder" className="navLink">
            Builder
          </Link>
          <Link to="/preview" className="navLink">
            Preview
          </Link>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<ResumeBuilderLayout />} />
        <Route path="/builder" element={<ResumeBuilderLayout />} />
        <Route path="/preview" element={<ResumePreview />} />
      </Routes>
    </Router>
  );
}
