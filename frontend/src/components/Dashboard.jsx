import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const COLORS = [
    "#2563EB",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
];

const API_BASE_URL = `http://${window.location.hostname || "127.0.0.1"}:8000`;

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await axios.get(
                    `${API_BASE_URL}/dashboard/stats`
                );

                console.log("Dashboard API Response:", response.data);
                setStats(response.data);
            } catch (error) {
                console.error("Dashboard API Error:", error);

                if (error.response) {
                    console.error("Dashboard Response Status:", error.response.status);
                    console.error("Dashboard Response Data:", error.response.data);
                } else if (error.request) {
                    console.error("Dashboard Network Error - No response received:", error.request);
                } else {
                    console.error("Dashboard Request Setup Error:", error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
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
        } catch {
            return dateStr;
        }
    };

    const getScoreColorClass = (score) => {
        if (score >= 75) return "score-high";
        if (score >= 60) return "score-medium";
        return "score-low";
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <p style={{ color: "white" }}>Loading Dashboard...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="dashboard-loading">
                <p style={{ color: "#ef4444" }}>Failed to load dashboard.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-section">
            <h2>📊 Placement Dashboard</h2>

            {/* KPI Cards */}
            <div className="dashboard-grid">
                <div className="dashboard-card blue">
                    <h4>👨‍🎓 Total Students</h4>
                    <h1>{stats.total_students}</h1>
                </div>

                <div className="dashboard-card green">
                    <h4>📝 Total Analyses</h4>
                    <h1>{stats.total_analyses}</h1>
                </div>

                <div className="dashboard-card orange">
                    <h4>📊 Average Readiness</h4>
                    <h1>{stats.average_readiness}%</h1>
                </div>

                <div className="dashboard-card purple">
                    <h4>🏆 Highest Score</h4>
                    <h1>{stats.highest_readiness}%</h1>
                </div>

                <div className="dashboard-card emerald">
                    <h4>💪 Top Strength</h4>
                    <h3>{stats.most_common_strength || "N/A"}</h3>
                </div>

                <div className="dashboard-card red">
                    <h4>⚠️ Top Weakness</h4>
                    <h3>{stats.most_common_weakness || "N/A"}</h3>
                </div>

                <div className="dashboard-card cyan">
                    <h4>🏢 Top Company</h4>
                    <h3>{stats.most_target_company || "N/A"}</h3>
                </div>
            </div>

            {/* Analytics Charts Section */}
            <div className="charts-section">
                {/* Top Strengths Chart */}
                <div className="chart-card">
                    <h3>💪 Top Strengths</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.strength_chart || []}>
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }} />
                            <Legend />
                            <Bar dataKey="count" name="Frequency" fill="#10B981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Weaknesses Chart */}
                <div className="chart-card">
                    <h3>⚠️ Top Weaknesses</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.weakness_chart || []}>
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }} />
                            <Legend />
                            <Bar dataKey="count" name="Frequency" fill="#EF4444" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Average Readiness by Target Role */}
                <div className="chart-card">
                    <h3>🎯 Avg Readiness by Target Role</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.role_readiness_chart || []}>
                            <XAxis dataKey="role" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }} />
                            <Legend />
                            <Bar dataKey="avg_score" name="Avg Readiness %" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Readiness Score Distribution */}
                <div className="chart-card">
                    <h3>📊 Readiness Score Distribution</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.readiness_distribution_chart || []}>
                            <XAxis dataKey="range" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }} />
                            <Legend />
                            <Bar dataKey="count" name="Students" fill="#06B6D4" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Readiness Trend */}
                <div className="chart-card">
                    <h3>📈 Overall Readiness Trend</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={stats.readiness_chart || []}>
                            <XAxis dataKey="analysis" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="score"
                                name="Readiness Score %"
                                stroke="#F59E0B"
                                strokeWidth={3}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="chart-card">
                    <h3>🥧 Target Companies</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={stats.company_chart || []}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={90}
                                label
                            >
                                {(stats.company_chart || []).map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>

                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 5. Recent Analyses Table */}
            <div className="recent-analyses-card">
                <h3>📋 Recent Analyses</h3>

                {(!stats.recent_analyses || stats.recent_analyses.length === 0) ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
                        No recent analyses recorded yet.
                    </p>
                ) : (
                    <div className="recent-table-container">
                        <table className="recent-table">
                            <thead>
                                <tr>
                                    <th>Candidate Name</th>
                                    <th>Target Company</th>
                                    <th>Target Role</th>
                                    <th>Readiness Score</th>
                                    <th>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent_analyses.map((item) => (
                                    <tr key={item.id}>
                                        <td className="candidate-name-cell">
                                            <strong>{item.name}</strong>
                                        </td>
                                        <td>{item.target_company}</td>
                                        <td>{item.target_role}</td>
                                        <td>
                                            <span className={`score-badge ${getScoreColorClass(item.readiness_score)}`}>
                                                {item.readiness_score}%
                                            </span>
                                        </td>
                                        <td className="date-cell">
                                            {formatDate(item.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;