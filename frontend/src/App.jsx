import Charts from "./components/Charts";
import Dashboard from "./components/Dashboard";
import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./App.css";

// UI updated: Dashboard and PDF report improvements (July 2026)

function App() {
  const [form, setForm] = useState({
    name: "Meet",
    target_role: "AI/ML Developer",
    target_company: "Shiprocket",
    preparation_days: 90,
    current_skills:
      "Python, Machine Learning, Deep Learning, NumPy, Pandas, Scikit-learn, SQL, TensorFlow, PyTorch",
    assessment_report:
      "Technical Skills: 72%, Problem Solving: 61%, Communication: 55%, Confidence: 70%. Strengths: Python, SQL. Weaknesses: Communication, Problem Solving.",
  });

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [result, setResult] = useState(null);

  // Student ID saved in PostgreSQL
  const [studentId, setStudentId] = useState(null);

  // Banner shown after loading saved analysis ({ type: 'success' | 'warning' | 'error', text: '' })
  const [banner, setBanner] = useState(null);

  // Analysis History state
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [fetchHistoryError, setFetchHistoryError] = useState("");

  // --------------------------------------------------
  // Handle form changes
  // --------------------------------------------------

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // --------------------------------------------------
  // Helper function: Date formatting
  // --------------------------------------------------

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return dateStr;
    }
  };

  // --------------------------------------------------
  // Helper function
  // Convert PostgreSQL JSON strings into JavaScript arrays/objects
  // --------------------------------------------------

  const parseSavedAnalysis = (analysis) => {
    if (!analysis) {
      return null;
    }

    const safeParse = (value, fallback = []) => {
      if (typeof value !== "string") {
        return value || fallback;
      }

      try {
        return JSON.parse(value);
      } catch (error) {
        console.error("JSON parse error:", error);
        return fallback;
      }
    };

    return {
      ...analysis,
      strengths: safeParse(analysis.strengths),
      weaknesses: safeParse(analysis.weaknesses),
      priorities: safeParse(analysis.priorities),
      roadmap: safeParse(analysis.roadmap),
      today_tasks: safeParse(analysis.today_tasks),
    };
  };

  // --------------------------------------------------
  // Analyze Student
  // --------------------------------------------------

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    setBanner(null);
    setFetchHistoryError("");

    try {
      // ------------------------------------------------
      // STEP 1: SAVE STUDENT TO POSTGRESQL
      // ------------------------------------------------

      const studentResponse = await axios.post(
        "http://127.0.0.1:8000/students",
        {
          name: form.name,
          target_role: form.target_role,
          target_company: form.target_company,
          preparation_days: Number(form.preparation_days),
          skills: form.current_skills,
        }
      );

      console.log("Student saved:", studentResponse.data);

      const newStudentId = studentResponse.data.student_id;
      setStudentId(newStudentId);

      console.log("Student ID:", newStudentId);

      // ------------------------------------------------
      // STEP 2: SEND DATA TO AI ANALYSIS
      // ------------------------------------------------

      const analysisResponse = await axios.post(
        "http://127.0.0.1:8000/analyze",
        {
          student_id: newStudentId,
          target_role: form.target_role,
          target_company: form.target_company,
          preparation_days: Number(form.preparation_days),
          current_skills: form.current_skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
          assessment_report: form.assessment_report,
        }
      );

      // ------------------------------------------------
      // STEP 3: SHOW AI RESULT WITH METADATA
      // ------------------------------------------------

      const aiAnalysis = analysisResponse.data.analysis;
      const analysisId = analysisResponse.data.analysis_id;

      setResult({
        ...aiAnalysis,
        id: analysisId,
        student_id: newStudentId,
        created_at: new Date().toISOString(),
      });
      setSelectedAnalysisId(analysisId);

      console.log("AI analysis:", aiAnalysis);
      console.log("Analysis saved with ID:", analysisId);

      // If history panel is currently visible, refresh history
      if (showHistory) {
        fetchAnalysisHistoryWithId(newStudentId);
      }
    } catch (error) {
      console.error("Error:", error);

      if (error.response) {
        console.error("Backend response:", error.response.data);
        alert(
          `Request failed (${error.response.status}). Check the browser console and backend terminal.`
        );
      } else {
        alert(
          "Cannot connect to the backend. Make sure FastAPI is running on port 8000."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // DOWNLOAD AI REPORT AS PDF
  // ===============================
  const downloadPDF = async () => {
    const report = document.getElementById("placement-report");

    if (!report) {
      alert("No placement report found. Please analyze first.");
      return;
    }

    try {
      const canvas = await html2canvas(report, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#081229",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 25;

      pdf.setFontSize(18);
      pdf.text("AI Placement Intelligence Report", 15, 15);

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - position;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("AI_Placement_Report.pdf");
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF.");
    }
  };
  // --------------------------------------------------
  // LOAD SAVED STUDENT HISTORY (Latest Analysis)
  // --------------------------------------------------

  const loadHistory = async () => {
    if (!studentId) {
      return;
    }

    setHistoryLoading(true);
    setBanner(null);

    try {
      console.log("Loading history for student:", studentId);

      const response = await axios.get(
        `http://127.0.0.1:8000/students/${studentId}`
      );

      console.log("Saved student data:", response.data);

      // ----------------------------------------------
      // Check if analysis exists
      // ----------------------------------------------

      if (!response.data || !response.data.analysis) {
        setBanner({
          type: "warning",
          text: "No saved analysis found for this student.",
        });
        return;
      }

      // ----------------------------------------------
      // Convert saved JSON strings
      // ----------------------------------------------

      const savedAnalysis = parseSavedAnalysis(response.data.analysis);
      savedAnalysis.student_id = response.data.student?.id || studentId;

      // ----------------------------------------------
      // Show saved analysis
      // ----------------------------------------------

      setResult(savedAnalysis);
      setSelectedAnalysisId(response.data.analysis.id);

      // ----------------------------------------------
      // Update form with saved student information
      // ----------------------------------------------

      if (response.data.student) {
        const savedStudent = response.data.student;

        setForm((prev) => ({
          ...prev,
          name: savedStudent.name || "",
          target_role: savedStudent.target_role || "",
          target_company: savedStudent.target_company || "",
          preparation_days: savedStudent.preparation_days || "",
          current_skills: savedStudent.skills || "",
        }));
      }

      // ----------------------------------------------
      // Show green success banner
      // ----------------------------------------------

      setBanner({
        type: "success",
        text: "Analysis loaded successfully from PostgreSQL.",
      });

      console.log("Loaded saved analysis:", savedAnalysis);
    } catch (error) {
      console.error("History error:", error);

      if (error.response) {
        console.error("Backend response:", error.response.data);
        setBanner({
          type: "error",
          text: `Could not load saved analysis (${error.response.status}).`,
        });
      } else {
        setBanner({
          type: "error",
          text: "Cannot connect to the backend server.",
        });
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // --------------------------------------------------
  // FETCH ALL ANALYSIS HISTORY
  // --------------------------------------------------

  const fetchAnalysisHistoryWithId = async (idToUse) => {
    const targetStudentId = idToUse || studentId;
    if (!targetStudentId) {
      alert("No student ID available. Analyze a student first.");
      return;
    }

    setHistoryLoading(true);
    setFetchHistoryError("");

    try {
      console.log("Fetching all analyses for student:", targetStudentId);

      const response = await axios.get(
        `http://127.0.0.1:8000/students/${targetStudentId}/analyses`
      );

      console.log("Analysis history list:", response.data);

      setAnalysisHistory(response.data.analyses || []);
      setShowHistory(true);
    } catch (error) {
      console.error("Error fetching analysis history:", error);

      if (error.response) {
        if (error.response.status === 404) {
          setFetchHistoryError("Student not found on server.");
        } else {
          setFetchHistoryError(
            `Failed to load history (${error.response.status}).`
          );
        }
      } else {
        setFetchHistoryError(
          "Cannot connect to the backend. Make sure FastAPI is running on port 8000."
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchAnalysisHistory = () => fetchAnalysisHistoryWithId(studentId);

  // --------------------------------------------------
  // SELECT HISTORICAL ITEM
  // --------------------------------------------------

  const handleSelectHistoryItem = (item) => {
    const parsedAnalysis = parseSavedAnalysis(item);
    setResult(parsedAnalysis);
    setSelectedAnalysisId(item.id);
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="container">
      {/* ------------------------------------------------
          HEADER
      ------------------------------------------------ */}

      <h1>🚀 AI Placement Intelligence Engine</h1>

      <Dashboard />

      {/* ------------------------------------------------
          STUDENT INPUT FORM
      ------------------------------------------------ */}

      <div className="card">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Student Name"
        />

        <input
          name="target_role"
          value={form.target_role}
          onChange={handleChange}
          placeholder="Target Role"
        />

        <input
          name="target_company"
          value={form.target_company}
          onChange={handleChange}
          placeholder="Target Company"
        />

        <input
          name="preparation_days"
          type="number"
          value={form.preparation_days}
          onChange={handleChange}
          placeholder="Preparation Days"
        />

        <textarea
          name="current_skills"
          value={form.current_skills}
          onChange={handleChange}
          placeholder="Skills separated by commas"
        />

        <textarea
          name="assessment_report"
          value={form.assessment_report}
          onChange={handleChange}
          placeholder="Paste assessment report"
          rows={6}
        />

        {/* Analyze Button */}

        <button type="button" onClick={analyze} disabled={loading}>
          {loading ? (
            <span className="btn-content">
              <span className="spinner"></span>
              Analyzing...
            </span>
          ) : (
            "Analyze My Placement Readiness"
          )}
        </button>

        {/* ------------------------------------------------
            SAVED STUDENT & LOAD ANALYSIS SECTION
        ------------------------------------------------ */}

        <div className="saved-student-panel">
          {studentId ? (
            <>
              <div className="student-status-header">
                <span className="saved-badge">✅ Student Saved</span>
                <span className="student-id-tag">Student ID: {studentId}</span>
              </div>

              <div className="action-buttons-group">
                {/* LOAD SAVED ANALYSIS BUTTON */}
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={!studentId || historyLoading}
                  className="action-btn load-saved-btn"
                >
                  {historyLoading ? (
                    <span className="btn-content">
                      <span className="spinner"></span>
                      Loading Saved Analysis...
                    </span>
                  ) : (
                    "📂 Load Saved Analysis"
                  )}
                </button>

                {/* VIEW ANALYSIS HISTORY BUTTON */}
                <button
                  type="button"
                  onClick={fetchAnalysisHistory}
                  disabled={historyLoading}
                  className="action-btn history-view-btn"
                >
                  {historyLoading ? (
                    <span className="btn-content">
                      <span className="spinner"></span>
                      Loading history...
                    </span>
                  ) : (
                    "📚 View Analysis History"
                  )}
                </button>
              </div>

              {/* BANNER NOTIFICATION */}
              {banner && (
                <div className={`banner-alert banner-${banner.type}`}>
                  {banner.type === "success" && "✅ "}
                  {banner.type === "warning" && "⚠️ "}
                  {banner.type === "error" && "❌ "}
                  {banner.text}
                </div>
              )}
            </>
          ) : (
            <div className="no-student-notice">
              <p>💡 Click "Analyze My Placement Readiness" first to create a student profile.</p>

              <button
                type="button"
                disabled={true}
                className="action-btn load-saved-btn disabled"
              >
                📂 Load Saved Analysis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------
          ANALYSIS HISTORY SECTION
      ------------------------------------------------ */}

      {showHistory && (
        <div className="card history-section">
          <h2>📚 Analysis History</h2>

          {fetchHistoryError && (
            <p style={{ color: "#f87171", fontWeight: "bold" }}>
              ❌ {fetchHistoryError}
            </p>
          )}

          {analysisHistory.length === 0 && !fetchHistoryError ? (
            <p style={{ color: "#94a3b8", textAlign: "center" }}>
              No saved analyses found for this student.
            </p>
          ) : (
            <div className="history-list">
              {analysisHistory.map((item) => {
                const isSelected = selectedAnalysisId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className={`history-item ${isSelected ? "selected" : ""}`}
                  >
                    <div className="history-header">
                      <strong>📊 Analysis #{item.id}</strong>
                      <span className="history-date">
                        {item.created_at ? formatDate(item.created_at) : ""}
                      </span>
                    </div>

                    <div className="history-score">
                      Readiness Score: <strong>{item.readiness_score}%</strong>
                    </div>

                    {item.readiness_reason && (
                      <p className="history-reason">
                        "{item.readiness_reason}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------
          RESULTS & METADATA
      ------------------------------------------------ */}

      {result && (
        <div className="results">
          <Charts result={result} />
          {/* ANALYSIS METADATA HEADER */}
          <div id="placement-report">
            <div className="card report-meta-card">
              <h3 className="meta-card-title">📋 Placement Intelligence Report</h3>
              <div className="meta-info-grid">
                <div className="meta-item">
                  <span className="meta-label">🆔 Student ID</span>
                  <span className="meta-value">#{result.student_id || studentId || "N/A"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">📊 Analysis ID</span>
                  <span className="meta-value">#{result.id || selectedAnalysisId || "N/A"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">📅 Date & Time</span>
                  <span className="meta-value">
                    {formatDate(result.created_at) || "Recent"}
                  </span>
                </div>
              </div>
            </div>

            {/* Strengths */}

            <div className="card">
              <h2>💪 Strengths</h2>

              <ul>
                {result.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="card">
              <h2>⚠️ Weaknesses</h2>

              <ul>
                {result.weaknesses?.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            {/* Priorities */}

            <div className="card">
              <h2>🎯 Priorities</h2>

              {result.priorities?.map((p, i) => (
                <div key={i} className="priority">
                  <strong>{p.skill}</strong>

                  <p>{p.reason}</p>
                </div>
              ))}
            </div>

            {/* Roadmap */}

            <div className="card">
              <h2>📅 Roadmap</h2>

              {result.roadmap?.map((r, i) => (
                <div key={i} className="roadmap-item">
                  <strong>Week {r.week}</strong>

                  <p>{r.focus}</p>
                </div>
              ))}
            </div>

            {/* Today's Tasks */}

            <div className="card">
              <h2>✅ Today's Tasks</h2>

              <ul>
                {result.today_tasks?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* Readiness Score */}

          <div className="card readiness">
            <h2>📊 Readiness Score</h2>

            <div className="score">{result.readiness_score}%</div>

            <p>{result.readiness_reason}</p>
          </div>
          <button onClick={downloadPDF} className="download-btn">
            📄 Download PDF Report
          </button>
        </div>
      )}
      <footer className="app-footer">
        <p>🚀 AI Placement Intelligence Engine • Version 1.2 MVP</p>
        <p>Built with React, FastAPI, PostgreSQL & Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;