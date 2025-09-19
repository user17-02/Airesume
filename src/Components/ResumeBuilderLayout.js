import React, { useState } from "react";

export default function ResumeBuilderLayout() {
  const [formData, setFormData] = useState({
    jobRole: "",
    skills: "",
    name: "",
    email: "",
    phone: "",
    summary: "",
    experience: [],
    education: [{ degree: "", institution: "", graduation_year: "" }],
  });

  const [errors, setErrors] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [loadingPic, setLoadingPic] = useState(false);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear error
  };

  // Handle education row change
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index][field] = value;
    setFormData((prev) => ({ ...prev, education: updatedEducation }));
  };

  // Add/remove education row
  const addEducationRow = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", graduation_year: "" }],
    }));
  };

  const removeEducationRow = (index) => {
    const updatedEducation = formData.education.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, education: updatedEducation }));
  };

  // Validate required fields
  const validateFields = () => {
    const newErrors = {};
    const requiredFields = ["jobRole", "skills", "name", "email", "phone"];
    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = `${field} is required`;
      }
    });

    // Validate each education row
    formData.education.forEach((edu, idx) => {
      if (!edu.degree || !edu.institution || !edu.graduation_year) {
        newErrors[`education_${idx}`] = "All education fields are required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate resume
  const generateResume = async () => {
    if (!validateFields()) return;

    const skillsArray = formData.skills.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch("http://127.0.0.1:8000/generate_resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_role: formData.jobRole, skills: skillsArray }),
      });

      if (!res.ok) throw new Error("Failed to fetch resume");
      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        // Only update backend-generated fields
        experience: data.experience || prev.experience,
        education: data.education || prev.education,
        summary: data.summary || prev.summary,
        // Keep user inputs
        jobRole: prev.jobRole,
        skills: prev.skills,
        name: prev.name,
        email: prev.email,
        phone: prev.phone,
      }));
    } catch (err) {
      console.error(err);
      alert("⚠️ Backend not responding. Make sure it's running on port 8000.");
    }
  };

  // Generate profile picture
  const generateProfilePic = async () => {
    setLoadingPic(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch("http://127.0.0.1:8000/generate_avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || "Professional Avatar",
          job_role: formData.jobRole || "Employee",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("Failed to fetch profile picture");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProfilePic(data.image_url);
    } catch (err) {
      console.error(err);
      alert("⚠️ Avatar generation failed or timed out. Try again.");
    } finally {
      setLoadingPic(false);
    }
  };

  return (
    <div className="layout">
      {/* Left: Form */}
      <div className="formContainer">
        <h1 className="heading">🚀 AI Resume Builder</h1>
        <p className="subHeading">
          Enter your details and let AI help generate a professional resume.
        </p>

        {/* Profile Picture */}
        <div className="card">
          <h2 className="sectionTitle">Profile Picture</h2>
          {profilePic ? (
            <img src={profilePic} alt="Profile" className="profileImage" />
          ) : (
            <p className="placeholderText">No profile picture generated yet.</p>
          )}
          {loadingPic ? (
            <p>⏳ Generating your avatar...</p>
          ) : (
            <button onClick={generateProfilePic} className="button primary">
              🖼️ Generate Profile Picture
            </button>
          )}
        </div>

        {/* Basic Info & Resume Details */}
        <div className="card">
          <h2 className="sectionTitle">Basic Info & Resume Details</h2>
          {[
            { label: "Job Role", type: "text", name: "jobRole" },
            { label: "Skills (comma separated)", type: "text", name: "skills" },
            { label: "Name", type: "text", name: "name" },
            { label: "Email", type: "email", name: "email" },
            { label: "Phone", type: "text", name: "phone" },
          ].map((field) => (
            <div key={field.name} className="fieldGroup">
              <label className="label">{field.label}:</label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                className={`input ${errors[field.name] ? "error" : ""}`}
              />
              {errors[field.name] && (
                <p style={{ color: "red", fontSize: "12px" }}>{errors[field.name]}</p>
              )}
            </div>
          ))}

          {/* Education Fields */}
          <h3 className="sectionTitle">Education</h3>
          {formData.education.map((edu, idx) => (
            <div key={idx} className="educationRow">
              <input
                type="text"
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) => handleEducationChange(idx, "degree", e.target.value)}
                className={`input ${errors[`education_${idx}`] ? "error" : ""}`}
              />
              <input
                type="text"
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) => handleEducationChange(idx, "institution", e.target.value)}
                className={`input ${errors[`education_${idx}`] ? "error" : ""}`}
              />
              <input
                type="text"
                placeholder="Graduation Year"
                value={edu.graduation_year}
                onChange={(e) => handleEducationChange(idx, "graduation_year", e.target.value)}
                className={`input ${errors[`education_${idx}`] ? "error" : ""}`}
              />
              <button onClick={() => removeEducationRow(idx)} className="button danger">
                ❌
              </button>
              {errors[`education_${idx}`] && (
                <p style={{ color: "red", fontSize: "12px" }}>{errors[`education_${idx}`]}</p>
              )}
            </div>
          ))}
          <button onClick={addEducationRow} className="button secondary" style={{ marginBottom: "10px" }}>
            ➕ Add Education
          </button>

          <div className="fieldGroup">
            <label className="label">Summary:</label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              className="textarea"
              rows={4}
              placeholder="Write a brief professional summary"
            />
          </div>

          {/* Generate Resume Button */}
          <button onClick={generateResume} className="button secondary" style={{ marginTop: "10px" }}>
            ✨ Generate Resume
          </button>
        </div>
      </div>

      {/* Right: Resume Preview */}
      <div className="previewContainer">
        <div className="resumePreview">
          <div className="resumeHeader">
            {profilePic && <img src={profilePic} alt="Preview" className="previewAvatar" />}
            <div>
              <h1 className="resumeName">{formData.name || "Your Name"}</h1>
              <p className="resumeContact">
                {formData.email || "you@example.com"} | {formData.phone || "Phone"}
              </p>
            </div>
          </div>

          <div className="resumeBody">
            <div className="resumeSidebar">
              <h3 className="resumeSection">Education</h3>
              {formData.education.length > 0 ? (
                <ul>
                  {formData.education.map((edu, idx) => (
                    <li key={idx}>
                      <strong>{edu.degree}</strong> - {edu.institution} ({edu.graduation_year})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Education details...</p>
              )}

              <h3 className="resumeSection">Skills</h3>
              {formData.skills ? (
                <ul>
                  {formData.skills.split(",").map((skill, idx) => (
                    <li key={idx}>{skill.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p>Skills will be listed here...</p>
              )}
            </div>

            <div className="resumeMain">
              <h3 className="resumeSection">Summary</h3>
              <p>{formData.summary || "Your summary will appear here..."}</p>

              <h3 className="resumeSection">Experience</h3>
              {formData.experience.length > 0 ? (
                formData.experience.map((exp, idx) => (
                  <div key={idx} className="experienceItem">
                    <strong>{exp.job_title}</strong> - {exp.company} ({exp.start_date} – {exp.end_date})
                    {exp.responsibilities?.length > 0 && (
                      <ul>
                        {exp.responsibilities.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p>Work experience details...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        .layout { display: flex; gap: 20px; }
        .formContainer { flex: 1; padding: 20px; }
        .previewContainer { flex: 1; padding: 20px; background: #f9f9f9; border-left: 2px solid #ddd; overflow-y: auto; }
        .resumePreview { background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
        .resumeHeader { display: flex; align-items: center; gap: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
        .previewAvatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #ccc; }
        .resumeName { font-size: 22px; margin: 0; }
        .resumeContact { font-size: 14px; color: #555; }
        .resumeBody { display: flex; gap: 20px; }
        .resumeSidebar { flex: 1; border-right: 1px solid #eee; padding-right: 15px; }
        .resumeMain { flex: 2; }
        .resumeSection { margin-top: 15px; margin-bottom: 5px; border-bottom: 1px solid #ddd; font-size: 16px; font-weight: bold; padding-bottom: 3px; }
        .experienceItem { margin-bottom: 12px; }
        .fieldGroup { margin-bottom: 10px; }
        .input, .textarea { width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 4px; }
        .error { border-color: red; }
        .button { padding: 6px 12px; margin-top: 5px; cursor: pointer; border-radius: 4px; border: none; }
        .button.primary { background: #007bff; color: white; }
        .button.secondary { background: #28a745; color: white; }
        .button.danger { background: #dc3545; color: white; }
        .educationRow { display: flex; gap: 5px; align-items: center; margin-bottom: 5px; }
      `}</style>
    </div>
  );
}
