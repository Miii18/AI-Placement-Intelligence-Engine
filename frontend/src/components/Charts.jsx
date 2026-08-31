import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    LineChart,
    Line,
    CartesianGrid,
    YAxis,
} from "recharts";

function Charts({ result }) {
    if (!result) return null;

    const readinessData = [
        { name: "Ready", value: result.readiness_score },
        { name: "Remaining", value: 100 - result.readiness_score },
    ];

    const skillData = [
        {
            name: "Strengths",
            value: result.strengths?.length || 0,
        },
        {
            name: "Weaknesses",
            value: result.weaknesses?.length || 0,
        },
    ];

    const trendData = [
        { week: "Week 1", score: 50 },
        { week: "Week 2", score: 58 },
        { week: "Week 3", score: 65 },
        { week: "Week 4", score: result.readiness_score },
    ];

    const COLORS = ["#10B981", "#1E293B"];

    return (
        <div className="charts-grid">

            {/* Readiness Donut */}
            <div className="chart-card">
                <h3>🎯 Readiness Score</h3>

                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={readinessData}
                            dataKey="value"
                            innerRadius={70}
                            outerRadius={90}
                        >
                            {readinessData.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index]} />
                            ))}
                        </Pie>

                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>

                <h2>{result.readiness_score}% Ready</h2>
            </div>

            {/* Strength vs Weakness */}
            <div className="chart-card">
                <h3>📊 Strengths vs Weaknesses</h3>

                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={skillData}>
                        <XAxis dataKey="name" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Readiness Trend */}
            <div className="chart-card full-width">
                <h3>📈 Preparation Trend</h3>

                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trendData}>
                        <CartesianGrid stroke="#334155" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#A855F7"
                            strokeWidth={4}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}

export default Charts;