import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

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

            <div className="dashboard-grid">
                <div className="dashboard-card blue">
                    <h4>Total Students</h4>
                    <h1>{stats.total_students}</h1>
                </div>

                <div className="dashboard-card green">
                    <h4>Total Analyses</h4>
                    <h1>{stats.total_analyses}</h1>
                </div>

                <div className="dashboard-card orange">
                    <h4>Average Readiness</h4>
                    <h1>{stats.average_readiness}%</h1>
                </div>

                <div className="dashboard-card purple">
                    <h4>Highest Score</h4>
                    <h1>{stats.highest_readiness}%</h1>
                </div>

                <div className="dashboard-card red">
                    <h4>Top Weakness</h4>
                    <h3>{stats.most_common_weakness}</h3>
                </div>

                <div className="dashboard-card cyan">
                    <h4>Top Company</h4>
                    <h3>{stats.most_target_company}</h3>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;