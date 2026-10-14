import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  Clock,
  Award,
  Upload,
  RefreshCw,
} from 'lucide-react';

import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import ContinueLearning from '../components/dashboard/ContinueLearning';
import QuickActions from '../components/dashboard/QuickActions';
import RecentDocuments from '../components/dashboard/RecentDocuments';
import WeakTopics from '../components/dashboard/WeakTopics';
import LoadingSpinner from '../components/common/LoadingSpinner';

import useAuth from '../hooks/useAuth';
import {
  getDashboardStats,
  getAnalyticsWeakAreas,
} from '../services/api';

const DashboardSkeleton = () => (
  <PageContainer>
    <div className="placeholder-glow mb-4">
      <span className="placeholder col-4 py-3 mb-2 rounded-2 d-block bg-secondary opacity-25" />
      <span className="placeholder col-6 py-2 rounded-2 d-block bg-secondary opacity-25" />
    </div>

    <div className="row g-3 mb-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="col-12 col-sm-6 col-lg-3">
          <div className="card-sa p-4 h-100 placeholder-glow">
            <span className="placeholder col-6 py-2 mb-3 rounded-1 d-block bg-secondary opacity-25" />
            <span className="placeholder col-4 py-3 rounded-2 d-block bg-secondary opacity-25" />
          </div>
        </div>
      ))}
    </div>

    <div className="d-flex justify-content-center p-5">
      <LoadingSpinner label="Loading dashboard..." />
    </div>
  </PageContainer>
);

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  const loadDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError('');

    try {
      const [dashboardData, weakAreasData] = await Promise.all([
        getDashboardStats(),
        getAnalyticsWeakAreas(),
      ]);

      setStats(dashboardData);

      const areas = Array.isArray(weakAreasData)
        ? weakAreasData
        : weakAreasData?.data ?? [];

      setWeakTopics(areas);
    } catch (error) {
      console.error('Failed to load dashboard:', error);

      setDashboardError(
        error.response?.data?.detail ||
          'Unable to load dashboard data. Please try again.'
      );
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboard();
    }
  }, [authLoading, user]);

  if (authLoading || !user) {
    return <DashboardSkeleton />;
  }

  if (dashboardLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Good morning, ${user.name || 'there'} 👋`}
        subtitle="Continue learning where you left off."
        action={
          <button
            type="button"
            className="btn-primary-sa"
            onClick={() => navigate('/documents')}
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        }
      />

      {dashboardError && (
        <div
          className="alert alert-danger d-flex justify-content-between align-items-center gap-3"
          role="alert"
        >
          <span>{dashboardError}</span>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={loadDashboard}
          >
            <RefreshCw size={14} className="me-1" />
            Retry
          </button>
        </div>
      )}

      {/* Quick statistics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FileText}
            title="Documents"
            value={stats?.documents_count ?? 0}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={MessageSquare}
            title="Questions Asked"
            value={stats?.questions_asked ?? 0}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={Clock}
            title="Study Sessions"
            value={stats?.study_sessions ?? 0}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={Award}
            title="Quiz Accuracy"
            value={`${stats?.quiz_accuracy ?? 0}%`}
          />
        </div>
      </div>

      {/* Continue learning and quick actions */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <ContinueLearning session={null} />
        </div>

        <div className="col-12 col-lg-5">
          <QuickActions />
        </div>
      </div>

      {/* Recent documents and weak topics */}
      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <RecentDocuments
            documents={stats?.recent_documents ?? []}
          />
        </div>

        <div className="col-12 col-lg-4">
          <WeakTopics topics={weakTopics} />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;