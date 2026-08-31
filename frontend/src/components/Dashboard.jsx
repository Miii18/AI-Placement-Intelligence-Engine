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

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await axios.get(
                    "http://127.0.0.1:8000/dashboard/stats"
                );

                console.log("Dashboard API Response:", response.data);
                setStats(response.data);
            } catch (error) {
                console.error("Dashboard API Error:", error);

                if (error.response) {
                    console.log("Response Data:", error.response.data);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

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
                <p style={{ color: "red" }}>Failed to load dashboard.</p>
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

                <div className="dashboard-card red">
                    <h4>⚠️ Top Weakness</h4>
                    <h3>{stats.most_common_weakness}</h3>
                </div>

                <div className="dashboard-card cyan">
                    <h4>🏢 Top Company</h4>
                    <h3>{stats.most_target_company}</h3>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                {/* Bar Chart */}
                <div className="chart-card">
                    <h3>📊 Top Weaknesses</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.weakness_chart}>
                            <XAxis dataKey="name" stroke="#ffffff" />
                            <YAxis stroke="#ffffff" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Line Chart */}
                <div className="chart-card">
                    <h3>📈 Readiness Trend</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={stats.readiness_chart}>
                            <XAxis dataKey="analysis" stroke="#ffffff" />
                            <YAxis stroke="#ffffff" />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#10B981"
                                strokeWidth={3}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="chart-card">
                    <h3>🥧 Target Companies</h3>

                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.company_chart}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                label
                            >
                                {stats.company_chart.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>

                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;