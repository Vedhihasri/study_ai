import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Target,
  ClipboardCheck,
  FileQuestion,
  Brain,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/common/PageHeader";
import "../styles/analytics.css";

import {
  getAnalyticsOverview,
  getAnalyticsPerformance,
  getAnalyticsTopics,
  getAnalyticsWeakAreas,
  getAnalyticsStudyActivity,
} from "../services/analyticsService";

const getLearningRecommendation = (item) => {
  const accuracy = Number(item.accuracy || 0);

  if (accuracy < 60) {
    return {
      title: "Needs attention",
      message: "Focus on this topic before moving to harder questions.",
      className: "text-danger",
    };
  }

  if (accuracy < 80) {
    return {
      title: "Keep practicing",
      message: "You are improving. Practice a few more questions to strengthen this topic.",
      className: "text-warning",
    };
  }

  return {
    title: "Strong topic",
    message: "You are performing well here. Try advanced questions to maintain your progress.",
    className: "text-success",
  };
};
const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [topics, setTopics] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const [studyActivity, setStudyActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const performanceChartData = performance.map((item, index) => {
  const date = new Date(item.date);

  return {
    label: `${date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    })} #${index + 1}`,

    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),

    score: item.score,

    quizScore:
      item.type?.toLowerCase() === "quiz" ? item.score : null,

    examScore:
      item.type?.toLowerCase() === "exam" ? item.score : null,

    type: item.type,
  };
});
  const studyActivityChartData = studyActivity.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    quizAttempts: item.quiz_attempts,
    examAttempts: item.exam_attempts,
    totalAttempts: item.total_attempts,
  }));
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          overviewResponse,
          performanceResponse,
          topicsResponse,
          weakAreasResponse,
          studyActivityResponse,
        ] = await Promise.all([
          getAnalyticsOverview(),
          getAnalyticsPerformance(),
          getAnalyticsTopics(),
          getAnalyticsWeakAreas(),
          getAnalyticsStudyActivity(),
        ]);

        setOverview(overviewResponse);
        setPerformance(performanceResponse?.data || []);
        setTopics(topicsResponse?.data || []);
        setWeakAreas(weakAreasResponse?.data || []);
        setStudyActivity(studyActivityResponse?.data || []);
      } catch (err) {
        console.error("Failed to load analytics:", err);

        setError(
          err?.response?.data?.detail ||
            "Unable to load analytics. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Learning Analytics"
          subtitle="Track study time, quiz accuracy, and topic strengths."
        />

        <div className="analytics-placeholder">
          <Activity size={40} className="mb-3" />
          <h5>Loading analytics...</h5>
          <p className="mb-0">
            We are collecting your learning activity.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Learning Analytics"
          subtitle="Track study time, quiz accuracy, and topic strengths."
        />

        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Learning Analytics"
        subtitle="Track study time, quiz accuracy, and topic strengths."
      />

      {/* =========================
          OVERVIEW
      ========================== */}
      <div className="row g-4 mb-4">
        <AnalyticsCard
          title="Average Score"
          value={`${Number(overview?.average_score || 0).toFixed(1)}%`}
          icon={<Target size={22} />}
        />

        <AnalyticsCard
          title="Quizzes Completed"
          value={overview?.quizzes_completed || 0}
          icon={<ClipboardCheck size={22} />}
        />

        <AnalyticsCard
          title="Exams Completed"
          value={overview?.exams_completed || 0}
          icon={<FileQuestion size={22} />}
        />

        <AnalyticsCard
          title="Questions Answered"
          value={overview?.questions_answered || 0}
          icon={<Brain size={22} />}
        />
      </div>

      {/* =========================
          PERFORMANCE OVER TIME
      ========================== */}
      <AnalyticsSection
        title="Performance Over Time"
        icon={<TrendingUp size={20} />}
      >
        {performance.length === 0 ? (
          <EmptyAnalyticsMessage
            text="Complete a quiz or exam to see your performance over time."
          />
        ) : (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="label"
                  tickFormatter={(value) => value.split(" #")[0]}
                />

                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />

                <Tooltip
                  formatter={(value, name) => [
                    `${value}%`,
                    name === "quizScore" ? "Quiz" : "Exam",
                  ]}
                  labelFormatter={(label) => {
                    const item = performanceChartData.find(
                      (data) => data.label === label
                    );

                    return item
                      ? `${item.date} • ${item.type}`
                      : label;
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="quizScore"
                  name="Quiz"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />

                <Line
                  type="monotone"
                  dataKey="examScore"
                  name="Exam"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnalyticsSection>

{/* Topic Performance */}
<AnalyticsSection
  icon={<Brain size={18} />}
  title="Topic Performance"
  subtitle="See how you are performing across different topics"
>
  {topics.length === 0 ? (
    <EmptyAnalyticsMessage
      text="Complete a quiz or exam to see topic performance."
    />
  ) : (
    <div className="topic-list">
      {topics.map((item) => {
        const accuracy = Number(item.accuracy || 0);

        let status = "Needs attention";
        let statusClass = "text-danger";

        if (accuracy >= 80) {
          status = "Strong";
          statusClass = "text-success";
        } else if (accuracy >= 60) {
          status = "Improving";
          statusClass = "text-warning";
        }

        return (
          <div
            key={item.topic}
            className="topic-row"
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-semibold">
                  {item.topic}
                </div>

                <small className="text-muted">
                  {item.questions} questions ·{" "}
                  {item.attempts} attempt
                  {item.attempts !== 1 ? "s" : ""}
                </small>
              </div>

              <div className="text-end">
                <div className="fw-bold">
                  {accuracy.toFixed(1)}%
                </div>

                <small className={statusClass}>
                  {status}
                </small>
              </div>
            </div>

            <div
  className="progress"
  style={{
    height: "8px",
    borderRadius: "10px",
    backgroundColor: "#e9ecef",
  }}
>
  <div
    className="progress-bar"
    role="progressbar"
    style={{
      width: `${Math.min(Math.max(accuracy, 0), 100)}%`,
      backgroundColor:
        accuracy >= 80
          ? "#198754"
          : accuracy >= 60
          ? "#ffc107"
          : "#dc3545",
      borderRadius: "10px",
      transition: "width 0.5s ease",
    }}
    aria-valuenow={accuracy}
    aria-valuemin="0"
    aria-valuemax="100"
  />
</div>
          </div>
        );
      })}
    </div>
  )}
</AnalyticsSection>
{/* Topic Strengths */}
<AnalyticsSection
  icon={<Target size={18} />}
  title="Topic Strengths"
  subtitle="Identify weak, improving, and strong areas"
>
  {weakAreas.length === 0 ? (
    <EmptyAnalyticsMessage
      text="Complete a quiz or exam to see your topic strengths."
    />
  ) : (
    <div className="weak-area-list">

      {weakAreas.map((item) => {
        const statusConfig = {
          weak: {
            label: "Needs attention",
            className: "text-danger",
          },

          improving: {
            label: "Improving",
            className: "text-warning",
          },

          strong: {
            label: "Strong",
            className: "text-success",
          },
        };

        const config =
          statusConfig[item.status] || statusConfig.improving;

        return (
          <div
            key={item.topic}
            className="weak-area-item py-3 border-bottom"
          >

            <div className="d-flex justify-content-between align-items-start">

              <div>
                <div className="fw-semibold">
                  {item.topic}
                </div>

                <small className="text-muted">
                  {item.questions} questions ·{" "}
                  {item.attempts} attempt
                  {item.attempts !== 1 ? "s" : ""}
                </small>
              </div>

              <div className="text-end">

                <div className="fw-bold">
                  {item.accuracy}%
                </div>

                <small className={config.className}>
                  {config.label}
                </small>

              </div>

            </div>

            <div
              className="progress mt-2"
              style={{
                height: "6px",
                borderRadius: "10px",
              }}
            >
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${Math.min(item.accuracy, 100)}%`,
                }}
                aria-valuenow={item.accuracy}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>

          </div>
        );
      })}

    </div>
  )}
</AnalyticsSection>

{/* =========================
    PERSONALIZED FOCUS
========================== */}
<AnalyticsSection
  title="Recommended Focus"
  icon={<Target size={20} />}
  subtitle="Based on your recent topic performance"
>
  {weakAreas.length === 0 ? (
    <EmptyAnalyticsMessage
      text="Complete a quiz or exam to receive personalized study recommendations."
    />
  ) : (
    <div className="recommended-focus-list">
      {weakAreas.slice(0, 3).map((item, index) => {
        const recommendation = getLearningRecommendation(item);

        return (
          <div
            key={item.topic}
            className="p-3 border rounded-3 mb-3"
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-light text-dark">
                    #{index + 1}
                  </span>

                  <h6 className="mb-0">
                    {item.topic}
                  </h6>
                </div>

                <p className="text-muted small mb-0 mt-2">
                  {recommendation.message}
                </p>
              </div>

              <div className="text-end">
                <div className="fw-bold">
                  {Number(item.accuracy || 0).toFixed(1)}%
                </div>

                <small className={recommendation.className}>
                  {recommendation.title}
                </small>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</AnalyticsSection>
      {/* =========================
          STUDY ACTIVITY
      ========================== */}
{/* =========================
    STUDY ACTIVITY
========================== */}
<AnalyticsSection
  title="Study Activity"
  icon={<Activity size={20} />}
>
  {studyActivity.length === 0 ? (
    <EmptyAnalyticsMessage
      text="Complete a quiz or exam to see your study activity."
    />
  ) : (
    <>
      {/* Activity Chart */}
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={studyActivityChartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="date" />

            <YAxis
              allowDecimals={false}
              label={{
                value: "Attempts",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="quizAttempts"
              name="Quiz Attempts"
              fill="#0d6efd"
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="examAttempts"
              name="Exam Attempts"
              fill="#6f42c1"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Table */}
      <div className="table-responsive mt-4">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Quiz Attempts</th>
              <th>Exam Attempts</th>
              <th>Total Attempts</th>
            </tr>
          </thead>

          <tbody>
            {studyActivity.map((activity) => (
              <tr key={activity.date}>
                <td>
                  {new Date(activity.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>

                <td>{activity.quiz_attempts}</td>

                <td>{activity.exam_attempts}</td>

                <td className="fw-semibold">
                  {activity.total_attempts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}
</AnalyticsSection>
    </PageContainer>
  );
};

/* =========================
   REUSABLE COMPONENTS
========================== */

const AnalyticsCard = ({ title, value, icon }) => {
  return (
    <div className="col-12 col-md-6 col-xl-3">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <p className="text-muted mb-2">{title}</p>

              <h3 className="mb-0 fw-bold">{value}</h3>
            </div>

            <div className="text-primary">{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsSection = ({ title, subtitle, icon, children }) => {
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <div className="text-primary">{icon}</div>
          <h5 className="mb-0">{title}</h5>
        </div>

        {subtitle && (
          <p className="text-muted small mb-4">
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </div>
  );
};

const EmptyAnalyticsMessage = ({ text }) => {
  return (
    <div className="analytics-placeholder">
      <BarChart3 size={36} className="mb-3" />

      <p className="mb-0">{text}</p>
    </div>
  );
};

export default Analytics;