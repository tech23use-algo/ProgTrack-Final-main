import { useEffect, useState, useMemo } from 'react';
import { Link, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('goal_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !localStorage.getItem('goal_demo')) {
      localStorage.clear();
      window.location = '/login';
    }
    return Promise.reject(e);
  }
);

const error = (e) =>
  e.response?.data?.message ||
  (e.code === 'ERR_NETWORK'
    ? 'Cannot reach backend on port 8080. You can switch to Demo Mode to test the full interface!'
    : 'Request failed. Please try again.');

const user = () => JSON.parse(localStorage.getItem('goal_user') || 'null');
const isDemoMode = () => localStorage.getItem('goal_demo') === 'true';

// ==========================================
// CLEAN SVG ICONS (REPLACING EMOJIS)
// ==========================================
const Icons = {
  Target: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Chart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Calendar: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Bolt: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
};

// ==========================================
// DEMO DATA STORE FOR OFFLINE / INSTANT DEMO
// ==========================================
const INITIAL_DEMO_GOALS = [
  {
    id: 1,
    title: 'Launch ProgTrack Web Experience',
    description: 'Design executive UI dashboard, milestone tracking, and responsive role workspaces.',
    targetDate: '2026-10-25',
    hoursPerDay: 2.0,
    completion: 80,
    assignedByManagerId: null,
    milestones: [
      { id: 101, title: 'Wireframe and visual tokens', description: 'Design palette, fonts and layout grid', status: 'DONE', estimatedMinutes: 45, dayNumber: 1 },
      { id: 102, title: 'Interactive KPI stat cards & progress ring', description: 'Visual metrics and animations', status: 'DONE', estimatedMinutes: 60, dayNumber: 2 },
      { id: 103, title: 'Real-time milestone toggle checklist', description: 'Allow inline milestone completions', status: 'DONE', estimatedMinutes: 30, dayNumber: 3 },
      { id: 104, title: 'Cross-browser responsive testing', description: 'Verify mobile drawers and tablet breakpoints', status: 'DONE', estimatedMinutes: 40, dayNumber: 4 },
      { id: 105, title: 'Production build optimization & audit', description: 'Lighthouse audit and bundle review', status: 'PENDING', estimatedMinutes: 30, dayNumber: 5 }
    ]
  },
  {
    id: 2,
    title: 'Master TypeScript & Modern React 19',
    description: 'Deep dive into concurrent features, Server Actions, and strict typing patterns.',
    targetDate: '2026-11-15',
    hoursPerDay: 1.5,
    completion: 50,
    assignedByManagerId: 10,
    milestones: [
      { id: 201, title: 'Advanced Generics & Utility Types', description: 'Mapped types, conditional types, template literals', status: 'DONE', estimatedMinutes: 90, dayNumber: 1 },
      { id: 202, title: 'React 19 Actions & useActionState', description: 'Migrate state flows to native React 19 hooks', status: 'DONE', estimatedMinutes: 60, dayNumber: 2 },
      { id: 203, title: 'Optimistic UI Updates with useOptimistic', description: 'Build zero-latency client state patterns', status: 'PENDING', estimatedMinutes: 45, dayNumber: 3 },
      { id: 204, title: 'Full-stack end-to-end type safety project', description: 'Connect types to backend API schema', status: 'PENDING', estimatedMinutes: 120, dayNumber: 4 }
    ]
  },
  {
    id: 3,
    title: '5K Running Milestone & Cadence',
    description: 'Consistency training, cadence pacing, and weekly endurance progression.',
    targetDate: '2026-10-30',
    hoursPerDay: 0.75,
    completion: 33,
    assignedByManagerId: null,
    milestones: [
      { id: 301, title: 'Baseline 2km steady jog', description: 'Zone 2 heart rate baseline check', status: 'DONE', estimatedMinutes: 25, dayNumber: 1 },
      { id: 302, title: 'Interval sprints (4x400m)', description: 'Speed build and recovery tracking', status: 'PENDING', estimatedMinutes: 30, dayNumber: 2 },
      { id: 303, title: '5km continuous outdoor run', description: 'Target pace under 5:45 min/km', status: 'PENDING', estimatedMinutes: 35, dayNumber: 3 }
    ]
  },
  {
    id: 4,
    title: 'AI Prompt Engineering & LLM Workflows',
    description: 'Structured outputs, Groq Llama-3 integrations, few-shot prompting, and evaluation loops.',
    targetDate: '2026-12-01',
    hoursPerDay: 1.0,
    completion: 100,
    assignedByManagerId: null,
    milestones: [
      { id: 401, title: 'System prompt constraint engineering', description: 'Build deterministic schema extractors', status: 'DONE', estimatedMinutes: 45, dayNumber: 1 },
      { id: 402, title: 'JSON mode schema enforcement', description: 'Strict typing and retries with fallback', status: 'DONE', estimatedMinutes: 60, dayNumber: 2 }
    ]
  }
];

function getDemoGoals() {
  const saved = localStorage.getItem('progtrack_demo_goals');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('progtrack_demo_goals', JSON.stringify(INITIAL_DEMO_GOALS));
  return INITIAL_DEMO_GOALS;
}

function saveDemoGoals(goals) {
  localStorage.setItem('progtrack_demo_goals', JSON.stringify(goals));
}

function toggleDemoMilestone(milestoneId) {
  const goals = getDemoGoals();
  let updated = false;
  const newGoals = goals.map(g => {
    const ms = g.milestones.map(m => {
      if (m.id === milestoneId) {
        updated = true;
        return { ...m, status: m.status === 'DONE' ? 'PENDING' : 'DONE' };
      }
      return m;
    });
    const doneCount = ms.filter(m => m.status === 'DONE').length;
    const completion = ms.length ? Math.round((doneCount / ms.length) * 100) : 0;
    return { ...g, milestones: ms, completion };
  });
  if (updated) {
    saveDemoGoals(newGoals);
  }
  return newGoals;
}

function getDemoDashboard() {
  const goals = getDemoGoals();
  const totalGoals = goals.length;
  const avg = totalGoals ? goals.reduce((a, b) => a + b.completion, 0) / totalGoals : 0;
  const upcoming = [...goals]
    .filter(g => g.completion < 100 && g.targetDate)
    .sort((a, b) => (a.targetDate > b.targetDate ? 1 : -1));
  return {
    goals,
    totalGoals,
    completion: avg,
    upcoming
  };
}

// ==========================================
// CIRCULAR PROGRESS RING COMPONENT
// ==========================================
function ProgressRing({ radius = 26, stroke = 4.5, progress = 0 }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="progress-ring-wrap">
      <svg height={radius * 2} width={radius * 2} className="progress-ring">
        <circle
          stroke="rgba(0, 0, 0, 0.07)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
        </defs>
      </svg>
      <span className="progress-ring-text">{Math.round(progress)}%</span>
    </div>
  );
}

// ==========================================
// APP LAYOUT & NAVIGATION
// ==========================================
function Layout({ kind, children }) {
  const nav = useNavigate();
  const location = useLocation();
  const u = user();
  const isDemo = isDemoMode();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('goal_theme') === 'dark');

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('goal_theme', theme);
  }, [isDarkMode]);

  const links =
    kind === 'user'
      ? [
          ['/app', 'Dashboard'],
          ['/app/goals', 'My Goals'],
          ['/app/new', 'New Goal'],
          ['/app/learn', 'Learn a Skill'],
        ]
      : kind === 'manager'
      ? [
          ['/manager', 'Team Overview'],
          ['/manager/team', 'Team Members'],
          ['/manager/analytics', 'Analytics'],
        ]
      : [
          ['/admin', 'System Overview'],
          ['/admin/users', 'User Management'],
          ['/admin/audit', 'Audit Log'],
        ];

  return (
    <div className={`role-app ${kind}`}>
      <aside>
        <div className="brand-wrapper">
          <Link className="brand" to={kind === 'user' ? '/app' : `/${kind}`}>
            Prog<span>Track</span>
          </Link>
          <span className="brand-version">v1.2</span>
        </div>

        <div className="role-label">{kind.toUpperCase()} SPACE</div>

        <nav>
          {links.map(([path, label]) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path} className={`nav-link ${isActive ? 'active' : ''}`}>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="aside-footer">
          <div className={`demo-mode-pill ${!isDemo ? 'connected' : ''}`}>
            <span className="pulse-dot"></span>
            <span>{isDemo ? 'Interactive Demo Mode' : 'Connected to Backend'}</span>
          </div>

          <button
            className="signout"
            onClick={() => {
              localStorage.clear();
              nav('/login');
            }}
          >
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="role-main">
        <header>
          <div className="header-left">
            <span className="workspace-badge">
              <span>{kind.toUpperCase()} WORKSPACE</span>
            </span>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="theme-toggle"
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              onClick={() => setIsDarkMode((dark) => !dark)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {isDarkMode ? (
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l-1.42-1.42m11.3-11.3 1.42-1.42" />
                  </>
                ) : (
                  <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
                )}
              </svg>
              <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <div className="profile-pill">
              <div className="profile-avatar">
                {u?.displayName ? u.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="profile-info">
                <span className="profile-name">{u?.displayName || 'Planner'}</span>
                <span className="profile-role-tag">{u?.role || 'USER'}</span>
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

function Guard({ role, children }) {
  const u = user();
  if (!u) return <Navigate to="/login" replace />;
  if (role && u.role !== role)
    return <Navigate to={u.role === 'USER' ? '/app' : `/${u.role.toLowerCase()}`} replace />;
  return <Layout kind={role.toLowerCase()}>{children}</Layout>;
}

// ==========================================
// AUTHENTICATION & QUICK DEMO ENTRY
// ==========================================
function Auth({ register = false }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [message, setMessage] = useState('');

  const startDemo = (role = 'USER') => {
    localStorage.setItem('goal_demo', 'true');
    localStorage.setItem('goal_token', 'demo-token-active');
    const demoUser = {
      displayName: role === 'USER' ? 'Alex Morgan' : role === 'MANAGER' ? 'Sarah Jenkins' : 'David Chen',
      email: `${role.toLowerCase()}@progtrack.io`,
      role: role
    };
    localStorage.setItem('goal_user', JSON.stringify(demoUser));
    nav(role === 'USER' ? '/app' : `/${role.toLowerCase()}`);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post(`/auth/${register ? 'register' : 'login'}`, form);
      localStorage.removeItem('goal_demo');
      localStorage.setItem('goal_token', r.data.token);
      localStorage.setItem('goal_user', JSON.stringify(r.data));
      nav(r.data.role === 'USER' ? '/app' : `/${r.data.role.toLowerCase()}`);
    } catch (e) {
      setMessage(error(e));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-art">
        <span>ProgTrack</span>
        <h1>
          Master your goals.<br />
          <i>One milestone</i> at a time.
        </h1>
        <p>
          Make meaningful progress visible with intuitive planning, intelligent AI curriculum breakdowns, and visual execution tracking.
        </p>
      </div>

      <div className="auth-card">
        <form onSubmit={submit}>
          <div className="eyebrow">{register ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</div>
          <h2>{register ? 'Start tracking.' : 'Good to see you.'}</h2>

          {register && (
            <input
              placeholder="Full Name"
              required
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Work or personal email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            minLength="8"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {message && <div className="error">{message}</div>}

          <button className="btn-primary" type="submit">
            <span>{register ? 'Create account' : 'Sign in to dashboard'}</span>
            <span className="btn-arrow">→</span>
          </button>
        </form>

        <div className="demo-divider">
          <span>OR EXPLORE INSTANTLY</span>
        </div>

        <button type="button" className="demo-quick-btn" onClick={() => startDemo('USER')}>
          <span>Launch User Dashboard (Interactive Demo)</span>
        </button>

        <div className="demo-roles-row">
          <button type="button" className="demo-role-btn" onClick={() => startDemo('MANAGER')}>
            Explore Manager View →
          </button>
          <button type="button" className="demo-role-btn" onClick={() => startDemo('ADMIN')}>
            Explore Admin View →
          </button>
        </div>

        <p className="switch">
          {register ? 'Already have an account?' : 'New here?'}{' '}
          <Link to={register ? '/login' : '/register'}>
            {register ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// ENHANCED USER DASHBOARD (NO EMOJIS)
// ==========================================
function UserDashboard() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [offlineNotice, setOfflineNotice] = useState(false);

  const u = user();

  const loadData = () => {
    if (isDemoMode()) {
      setD(getDemoDashboard());
      setLoading(false);
      return;
    }

    api.get('/user/dashboard')
      .then((r) => {
        setD(r.data);
        setOfflineNotice(false);
      })
      .catch(() => {
        setD(getDemoDashboard());
        setOfflineNotice(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMilestoneToggle = async (milestoneId) => {
    if (isDemoMode() || offlineNotice) {
      toggleDemoMilestone(milestoneId);
      setD(getDemoDashboard());
      return;
    }

    try {
      await api.patch(`/user/milestones/${milestoneId}`, { toggle: true });
      loadData();
    } catch (e) {
      toggleDemoMilestone(milestoneId);
      setD(getDemoDashboard());
    }
  };

  // Derived metrics
  const totalGoals = d?.totalGoals || 0;
  const overallCompletion = Math.round(d?.completion || 0);
  const completedGoals = d?.goals?.filter(g => g.completion === 100).length || 0;
  const activeGoals = totalGoals - completedGoals;
  
  const allMilestones = useMemo(() => {
    return d?.goals?.flatMap(g => g.milestones || []) || [];
  }, [d]);

  const completedMilestonesCount = allMilestones.filter(m => m.status === 'DONE').length;
  const totalMilestonesCount = allMilestones.length;

  // Immediate Next Steps (top 3 pending milestones from active goals)
  const nextActions = useMemo(() => {
    if (!d?.goals) return [];
    const actions = [];
    for (const g of d.goals) {
      if (g.completion < 100 && g.milestones) {
        for (const m of g.milestones) {
          if (m.status !== 'DONE') {
            actions.push({ ...m, goalTitle: g.title, goalId: g.id });
            if (actions.length >= 3) break;
          }
        }
      }
      if (actions.length >= 3) break;
    }
    return actions;
  }, [d]);

  // Filter and search goals
  const filteredGoals = useMemo(() => {
    if (!d?.goals) return [];
    return d.goals.filter(g => {
      const matchSearch = search.trim() === '' || 
        g.title.toLowerCase().includes(search.toLowerCase()) || 
        (g.description && g.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (filterTab === 'IN_PROGRESS') return g.completion < 100;
      if (filterTab === 'COMPLETED') return g.completion === 100;
      if (filterTab === 'ASSIGNED') return !!g.assignedByManagerId;
      return true;
    });
  }, [d, search, filterTab]);

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (loading || !d) return <Loading />;

  return (
    <>
      {offlineNotice && (
        <div className="offline-alert">
          <div>
            <b>Offline Mode Active:</b> Spring Boot is not reachable on port 8080. Displaying interactive preview data with full offline persistence!
          </div>
          <button onClick={() => loadData()}>Retry Backend</button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-text">
          <h1>{greeting}, {u?.displayName || 'Planner'}</h1>
          <p>You have {activeGoals} active {activeGoals === 1 ? 'goal' : 'goals'} in flight. One focused milestone moves the needle today.</p>
          <div className="welcome-metrics">
            <span className="metric-pill streak">5-Day Streak</span>
            <span className="metric-pill pace">Pace: On Track</span>
            <span className="metric-pill">Daily Focus: 4.25 hrs</span>
          </div>
        </div>

        <div className="welcome-actions">
          <Link className="btn-ai" to="/app/learn">
            <span>AI Skill Curriculum</span>
          </Link>
          <Link className="btn-primary" to="/app/new">
            <span>+ New Goal</span>
            <span className="btn-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* KPI Stats Cards */}
      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap target"><Icons.Target /></div>
            <span className="stat-tag positive">+1 this month</span>
          </div>
          <div className="stat-label">Total Goals</div>
          <div className="stat-body">
            <span className="stat-number">{totalGoals}</span>
          </div>
          <div className="stat-footer-text">
            <span>{completedGoals} completed</span>
            <span>{activeGoals} in progress</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap progress"><Icons.Chart /></div>
            <ProgressRing progress={overallCompletion} />
          </div>
          <div className="stat-label">Overall Completion</div>
          <div className="stat-body">
            <span className="stat-number">{overallCompletion}%</span>
          </div>
          <div className="stat-footer-text">
            <span>{completedMilestonesCount} of {totalMilestonesCount} steps done</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap calendar"><Icons.Calendar /></div>
            <span className="stat-tag">Priority</span>
          </div>
          <div className="stat-label">Next Target Deadline</div>
          <div className="stat-body">
            <span className="stat-number" style={{ fontSize: '24px', letterSpacing: '-0.5px' }}>
              {d.upcoming[0]?.targetDate || 'Flexible'}
            </span>
          </div>
          <div className="stat-footer-text">
            <span>{d.upcoming[0]?.title ? d.upcoming[0].title.slice(0, 24) + '...' : 'All caught up'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap bolt"><Icons.Bolt /></div>
            <span className="stat-tag positive">Active</span>
          </div>
          <div className="stat-label">Milestone Velocity</div>
          <div className="stat-body">
            <span className="stat-number">
              {totalMilestonesCount - completedMilestonesCount}
            </span>
            <small style={{ color: 'var(--muted)', fontSize: '13px' }}>left to do</small>
          </div>
          <div className="stat-footer-text">
            <span>High completion rate</span>
            <span>Momentum steady</span>
          </div>
        </div>
      </section>

      {/* Focus: Today's Immediate Next Steps Widget */}
      {nextActions.length > 0 && (
        <section className="focus-widget">
          <div className="focus-widget-head">
            <div className="focus-title">
              <h3>Today's Immediate Next Steps</h3>
              <span className="focus-badge">{nextActions.length} Pending</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Check off steps directly to advance progress</span>
          </div>

          <div className="focus-steps-list">
            {nextActions.map((item) => (
              <div key={item.id} className="focus-step-card">
                <button
                  type="button"
                  className="step-check-btn"
                  title="Mark step completed"
                  onClick={() => handleMilestoneToggle(item.id)}
                >
                  <Icons.Check />
                </button>
                <div className="step-content">
                  <div className="step-goal-label">{item.goalTitle}</div>
                  <div className="step-title">{item.title}</div>
                  <div className="step-meta">
                    <Icons.Clock />
                    <span>{item.estimatedMinutes ? `${item.estimatedMinutes} mins` : 'Flexible'}</span>
                    {item.dayNumber && <span>· Day {item.dayNumber}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Goals Filter & Search Toolbar */}
      <div className="goals-section-header">
        <div className="section-title-wrap">
          <h2>Active Goals & Workspaces</h2>
          <p>Track roadmaps, daily hours, and progressive outcomes</p>
        </div>

        <div className="filter-toolbar">
          <div className="search-input-wrap">
            <span className="search-icon"><Icons.Search /></span>
            <input
              type="text"
              placeholder="Search goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterTab('ALL')}
            >
              All ({totalGoals})
            </button>
            <button
              className={`filter-tab ${filterTab === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setFilterTab('IN_PROGRESS')}
            >
              In Progress ({activeGoals})
            </button>
            <button
              className={`filter-tab ${filterTab === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setFilterTab('COMPLETED')}
            >
              Completed ({completedGoals})
            </button>
          </div>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="goal-grid">
        {filteredGoals.map((g) => (
          <EnhancedGoalCard
            key={g.id}
            g={g}
            onToggleMilestone={handleMilestoneToggle}
          />
        ))}

        {!filteredGoals.length && (
          <div className="empty-goals-state">
            <h3>No goals found</h3>
            <p>{search ? 'Try clearing your search query.' : 'Create your first outcome to start tracking progress.'}</p>
            <Link className="btn-primary" to="/app/new">
              <span>+ Create your first goal</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

// ==========================================
// ENHANCED GOAL CARD COMPONENT
// ==========================================
function EnhancedGoalCard({ g, onToggleMilestone }) {
  const [showSteps, setShowSteps] = useState(false);

  const isCompleted = g.completion === 100;
  const isDueSoon = g.targetDate && !isCompleted;
  const doneMilestones = g.milestones.filter(m => m.status === 'DONE').length;

  return (
    <div className="goal-card-enhanced">
      <div className="goal-card-top">
        <span className="goal-index-badge">GOAL #0{g.id}</span>
        <div className="goal-badges">
          {g.assignedByManagerId && (
            <span className="effort-badge" style={{ color: '#0369a1', background: '#e0f2fe' }}>
              Assigned by Manager
            </span>
          )}
          {g.hoursPerDay && (
            <span className="effort-badge">{g.hoursPerDay}h/day</span>
          )}
          <span className={`status-badge ${isCompleted ? 'completed' : isDueSoon ? 'due-soon' : 'in-progress'}`}>
            {isCompleted ? 'Completed' : isDueSoon ? 'Active' : 'In Progress'}
          </span>
        </div>
      </div>

      <div className="goal-title-wrap">
        <h3>{g.title}</h3>
      </div>
      <p>{g.description || 'No detailed description provided yet.'}</p>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-meta">
          <span className="progress-percentage">{Math.round(g.completion)}% Complete</span>
          <span className="progress-steps-count">{doneMilestones} of {g.milestones.length} milestones done</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${isCompleted ? 'completed' : ''}`}
            style={{ width: `${Math.max(4, g.completion)}%` }}
          />
        </div>
      </div>

      {/* Inline Accordion for Milestones */}
      {g.milestones.length > 0 && (
        <div>
          <button
            type="button"
            className="milestones-accordion-btn"
            onClick={(e) => {
              e.preventDefault();
              setShowSteps(!showSteps);
            }}
          >
            <span>{showSteps ? 'Hide milestone steps' : `View ${g.milestones.length} milestone steps`}</span>
            <span>{doneMilestones}/{g.milestones.length} done</span>
          </button>

          {showSteps && (
            <div className="milestone-preview-list">
              {g.milestones.map((m) => (
                <div key={m.id} className={`milestone-preview-item ${m.status === 'DONE' ? 'done' : ''}`}>
                  <button
                    type="button"
                    className={`mini-check ${m.status === 'DONE' ? 'done' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onToggleMilestone && onToggleMilestone(m.id);
                    }}
                  >
                    {m.status === 'DONE' ? <Icons.Check /> : null}
                  </button>
                  <span style={{ flex: 1 }}>{m.title}</span>
                  {m.estimatedMinutes && (
                    <small style={{ color: 'var(--muted-light)', fontSize: '11px' }}>
                      {m.estimatedMinutes}m
                    </small>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card Footer */}
      <div className="goal-card-footer">
        <span className="deadline-tag">
          <Icons.Calendar />
          <span style={{ marginLeft: '6px' }}>{g.targetDate ? `Due ${g.targetDate}` : 'Open deadline'}</span>
        </span>

        <Link to={`/app/goals/${g.id}`} className="view-details-link">
          <span>Details</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

// ==========================================
// USER GOALS VIEW
// ==========================================
function UserGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setGoals(getDemoGoals());
      setLoading(false);
      return;
    }

    api.get('/user/goals')
      .then((r) => setGoals(r.data))
      .catch(() => setGoals(getDemoGoals()))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (mId) => {
    if (isDemoMode()) {
      const updated = toggleDemoMilestone(mId);
      setGoals(updated);
    } else {
      api.patch(`/user/milestones/${mId}`, { toggle: true })
        .then(() => api.get('/user/goals').then(r => setGoals(r.data)))
        .catch(() => {
          const updated = toggleDemoMilestone(mId);
          setGoals(updated);
        });
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">YOUR WORKSPACE</div>
          <h1>All Tracked Goals</h1>
          <p className="muted">Review milestones, deadlines, and daily scheduled commitments.</p>
        </div>
        <Link className="btn-primary" to="/app/new">
          <span>+ New Goal</span>
          <span className="btn-arrow">→</span>
        </Link>
      </div>

      <div className="goal-grid">
        {goals.map((g) => (
          <EnhancedGoalCard key={g.id} g={g} onToggleMilestone={handleToggle} />
        ))}
      </div>
    </>
  );
}

// ==========================================
// NEW GOAL / AI SKILL CREATION
// ==========================================
function NewGoal({ learn = false }) {
  const nav = useNavigate();
  const [form, setForm] = useState(
    learn
      ? { skill: '', days: 14, hoursPerDay: 1 }
      : { title: '', description: '', targetDate: '', hoursPerDay: 1 }
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    if (isDemoMode()) {
      setTimeout(() => {
        const goals = getDemoGoals();
        const newId = goals.length + 1;
        const newGoal = {
          id: newId,
          title: learn ? `Learn ${form.skill.trim()}` : form.title.trim(),
          description: learn
            ? `Structured ${form.days}-day AI learning path for ${form.skill.trim()}.`
            : form.description || 'Target outcome.',
          targetDate: form.targetDate || '2026-12-31',
          hoursPerDay: Number(form.hoursPerDay) || 1,
          completion: 0,
          assignedByManagerId: null,
          milestones: [
            { id: newId * 100 + 1, title: 'Foundational concepts & initial setup', description: 'Core principles and tools', status: 'PENDING', estimatedMinutes: 45, dayNumber: 1 },
            { id: newId * 100 + 2, title: 'Hands-on practice exercises', description: 'Practical implementation', status: 'PENDING', estimatedMinutes: 60, dayNumber: 2 },
            { id: newId * 100 + 3, title: 'Capstone milestone delivery', description: 'Synthesize knowledge into working deliverable', status: 'PENDING', estimatedMinutes: 90, dayNumber: 3 }
          ]
        };
        saveDemoGoals([newGoal, ...goals]);
        setBusy(false);
        nav(`/app/goals/${newId}`);
      }, 500);
      return;
    }

    try {
      const payload = learn
        ? { skill: form.skill.trim(), days: Number(form.days), hoursPerDay: Number(form.hoursPerDay) }
        : {
            title: form.title.trim(),
            description: form.description,
            targetDate: form.targetDate || null,
            hoursPerDay: form.hoursPerDay ? Number(form.hoursPerDay) : 1,
          };
      const r = await api.post(learn ? '/user/skill-plans' : '/user/goals', payload);
      nav(`/app/goals/${r.data.id}`);
    } catch (e) {
      setMessage(error(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-wrap">
      <Link className="back" to="/app">
        ← Back to Dashboard
      </Link>
      <div className="eyebrow">{learn ? 'AI SKILL CURRICULUM' : 'NEW TARGET GOAL'}</div>
      <h1>{learn ? 'Learn something new.' : 'Define your outcome.'}</h1>
      <p className="muted">
        {learn
          ? 'Turn any topic into an actionable day-by-day practice curriculum adjusted to your daily time.'
          : 'Clarify your target output and daily cadence. The milestone system handles execution.'}
      </p>

      <form className="goal-form" onSubmit={submit}>
        {learn ? (
          <>
            <label>
              What skill do you want to master?
              <input
                required
                minLength="2"
                placeholder="e.g. Next.js 15, Public Speaking, System Design..."
                value={form.skill}
                onChange={(e) => setForm({ ...form, skill: e.target.value })}
              />
            </label>
            <div className="two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <label>
                Target duration (Days)
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
                />
              </label>
              <label>
                Daily focus (Hours/day)
                <input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={form.hoursPerDay}
                  onChange={(e) => setForm({ ...form, hoursPerDay: Number(e.target.value) })}
                />
              </label>
            </div>
          </>
        ) : (
          <>
            <label>
              Goal Title
              <input
                required
                minLength="2"
                maxLength="120"
                placeholder="e.g. Launch SaaS Product MVP"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Description & Success Criteria
              <textarea
                placeholder="Describe your desired result and what success looks like..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <label>
                Target Completion Date
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                />
              </label>
              <label>
                Hours / Day Committed
                <input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={form.hoursPerDay}
                  onChange={(e) => setForm({ ...form, hoursPerDay: Number(e.target.value) })}
                />
              </label>
            </div>
          </>
        )}

        {message && <div className="error">{message}</div>}

        <button className="btn-primary" disabled={busy} type="submit" style={{ marginTop: '20px' }}>
          <span>{busy ? 'Building curriculum...' : learn ? 'Build my AI curriculum' : 'Create goal'}</span>
          <span className="btn-arrow">→</span>
        </button>
      </form>
    </div>
  );
}

// ==========================================
// GOAL DETAIL VIEW
// ==========================================
function GoalDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [g, setG] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (isDemoMode()) {
      const goals = getDemoGoals();
      const found = goals.find(x => x.id === Number(id));
      setG(found || goals[0]);
      return;
    }

    api.get(`/user/goals/${id}`)
      .then((r) => setG(r.data))
      .catch(() => {
        const goals = getDemoGoals();
        setG(goals.find(x => x.id === Number(id)) || goals[0]);
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  const toggle = async (m) => {
    if (isDemoMode()) {
      toggleDemoMilestone(m.id);
      load();
      return;
    }

    try {
      await api.patch(`/user/milestones/${m.id}`, { toggle: true });
      load();
    } catch (e) {
      toggleDemoMilestone(m.id);
      load();
    }
  };

  const ai = async () => {
    setBusy(true);
    setMessage('');
    if (isDemoMode()) {
      setTimeout(() => {
        setBusy(false);
        setMessage('AI generation simulated in Demo Mode: Milestones refreshed successfully!');
      }, 700);
      return;
    }

    try {
      await api.post(`/user/goals/${id}/ai-breakdown`);
      load();
    } catch (e) {
      setMessage(error(e));
    } finally {
      setBusy(false);
    }
  };

  if (!g) return <Loading />;

  const doneCount = g.milestones.filter(m => m.status === 'DONE').length;

  return (
    <div className="detail">
      <Link className="back" to="/app">
        ← Back to Dashboard
      </Link>
      <div className="detail-head">
        <div>
          <div className="eyebrow">
            GOAL #0{g.id} {g.hoursPerDay ? `· ${g.hoursPerDay} HR/DAY` : ''}
          </div>
          <h1>{g.title}</h1>
          <p className="muted">{g.description}</p>
        </div>
        <button
          className="danger"
          onClick={async () => {
            if (isDemoMode()) {
              const goals = getDemoGoals().filter(x => x.id !== Number(id));
              saveDemoGoals(goals);
              nav('/app');
              return;
            }
            try {
              await api.delete(`/user/goals/${id}`);
            } catch (e) {}
            nav('/app');
          }}
        >
          Delete Goal
        </button>
      </div>

      <div className="detail-progress">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{Math.round(g.completion)}%</strong>
            <span style={{ marginLeft: '12px' }}>
              {doneCount} of {g.milestones.length} milestones completed
            </span>
          </div>
          <ProgressRing progress={g.completion} radius={32} stroke={5} />
        </div>
        <div className="progress-track" style={{ marginTop: '16px' }}>
          <div
            className="progress-fill"
            style={{ width: `${Math.max(4, g.completion)}%` }}
          />
        </div>
      </div>

      <div className="detail-actions">
        <button className="btn-ai" onClick={ai} disabled={busy}>
          <span>{busy ? 'Regenerating with AI...' : 'Regenerate Milestones with AI'}</span>
        </button>
      </div>

      {message && <div className="error">{message}</div>}

      <div className="milestones">
        {g.milestones.map((m) => (
          <div className={`milestone ${m.status === 'DONE' ? 'done' : ''}`} key={m.id}>
            <button className="check" onClick={() => toggle(m)}>
              {m.status === 'DONE' ? <Icons.Check /> : null}
            </button>
            <div>
              <strong>{m.title}</strong>
              <p>{m.description}</p>
            </div>
            <span>{m.estimatedMinutes ? `${m.estimatedMinutes} min` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// MANAGER DASHBOARD & TEAM VIEWS
// ==========================================
const DEMO_TEAM = [
  { id: 1, displayName: 'Alex Morgan', email: 'alex@progtrack.io', completion: 82, goalCount: 4 },
  { id: 2, displayName: 'Sophia Chen', email: 'sophia@progtrack.io', completion: 65, goalCount: 3 },
  { id: 3, displayName: 'Marcus Vance', email: 'marcus@progtrack.io', completion: 45, goalCount: 5 }
];

function ManagerDashboard() {
  const [team, setTeam] = useState([]);
  const [a, setA] = useState(null);

  useEffect(() => {
    if (isDemoMode()) {
      setTeam(DEMO_TEAM);
      setA({ averageCompletion: 64, overdueGoals: 1 });
      return;
    }

    Promise.all([api.get('/manager/team'), api.get('/manager/analytics')])
      .then(([t, x]) => {
        setTeam(t.data);
        setA(x.data);
      })
      .catch(() => {
        setTeam(DEMO_TEAM);
        setA({ averageCompletion: 64, overdueGoals: 1 });
      });
  }, []);

  if (!a) return <Loading />;

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">TEAM MANAGEMENT</div>
          <h1>Guide Team Progress</h1>
          <p className="muted">Monitor execution velocity, unblock team members, and review shared goals.</p>
        </div>
        <Link className="btn-primary" to="/manager/team">
          <span>View Team Members</span>
          <span className="btn-arrow">→</span>
        </Link>
      </div>

      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap target"><Icons.Users /></div>
          </div>
          <div className="stat-label">Active Team Members</div>
          <div className="stat-body">
            <span className="stat-number">{team.length}</span>
          </div>
          <div className="stat-footer-text">
            <span>All members active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap progress"><Icons.Chart /></div>
            <ProgressRing progress={a.averageCompletion} />
          </div>
          <div className="stat-label">Team Average Completion</div>
          <div className="stat-body">
            <span className="stat-number">{Math.round(a.averageCompletion)}%</span>
          </div>
          <div className="stat-footer-text">
            <span>Overall velocity on track</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap calendar"><Icons.Calendar /></div>
          </div>
          <div className="stat-label">Overdue Goals</div>
          <div className="stat-body">
            <span className="stat-number">{a.overdueGoals}</span>
          </div>
          <div className="stat-footer-text">
            <span>Needs attention</span>
          </div>
        </div>
      </section>

      <h2>Team Roster Pulse</h2>
      <div className="team-grid">
        {team.map((m) => (
          <div className="member-card" key={m.id}>
            <div className="member-avatar">{m.displayName[0]}</div>
            <h3>{m.displayName}</h3>
            <p>{m.email}</p>
            <div className="progress-track" style={{ margin: '14px 0 8px' }}>
              <div className="progress-fill" style={{ width: `${m.completion}%` }} />
            </div>
            <small style={{ color: 'var(--muted)' }}>
              {Math.round(m.completion)}% complete · {m.goalCount} active goals
            </small>
            <Link to={`/manager/team/${m.id}`} style={{ display: 'block', marginTop: '14px', fontWeight: 600, color: 'var(--ink)' }}>
              Inspect goals →
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

function ManagerTeam() {
  const [team, setTeam] = useState([]);

  useEffect(() => {
    if (isDemoMode()) {
      setTeam(DEMO_TEAM);
      return;
    }
    api.get('/manager/team')
      .then((r) => setTeam(r.data))
      .catch(() => setTeam(DEMO_TEAM));
  }, []);

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">TEAM ROSTER</div>
          <h1>Team Members</h1>
          <p className="muted">Direct individual reports, goal counts, and milestone velocity.</p>
        </div>
      </div>
      <div className="table">
        {team.map((m) => (
          <Link to={`/manager/team/${m.id}`} key={m.id}>
            <b>{m.displayName}</b>
            <span>{m.email}</span>
            <span>{Math.round(m.completion)}% Complete</span>
            <span>{m.goalCount} Active Goals</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function MemberGoals() {
  const { id } = useParams();
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    if (isDemoMode()) {
      setGoals(getDemoGoals());
      return;
    }
    api.get(`/manager/team/${id}/goals`)
      .then((r) => setGoals(r.data))
      .catch(() => setGoals(getDemoGoals()));
  }, [id]);

  return (
    <>
      <Link className="back" to="/manager/team">
        ← Back to Team
      </Link>
      <h1>Member Goals Overview</h1>
      <div className="goal-grid">
        {goals.map((g) => (
          <EnhancedGoalCard key={g.id} g={g} />
        ))}
      </div>
    </>
  );
}

// ==========================================
// ADMIN DASHBOARD & AUDIT VIEWS
// ==========================================
function AdminDashboard() {
  const [s, setS] = useState(null);

  useEffect(() => {
    if (isDemoMode()) {
      setS({ users: 18, managers: 4, goals: 32, overallCompletion: 74 });
      return;
    }
    api.get('/admin/stats')
      .then((r) => setS(r.data))
      .catch(() => setS({ users: 18, managers: 4, goals: 32, overallCompletion: 74 }));
  }, []);

  if (!s) return <Loading />;

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">SYSTEM ADMIN</div>
          <h1>Platform Overview</h1>
          <p className="muted">System metrics, security audit history, and role allocations.</p>
        </div>
        <Link className="btn-primary" to="/admin/users">
          <span>Manage Users</span>
          <span className="btn-arrow">→</span>
        </Link>
      </div>

      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap target"><Icons.User /></div>
          </div>
          <div className="stat-label">Total Users</div>
          <div className="stat-body">
            <span className="stat-number">{s.users}</span>
          </div>
          <div className="stat-footer-text">
            <span>{s.managers} Managers</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap progress"><Icons.Target /></div>
          </div>
          <div className="stat-label">Total Goals</div>
          <div className="stat-body">
            <span className="stat-number">{s.goals}</span>
          </div>
          <div className="stat-footer-text">
            <span>Across all spaces</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrap bolt"><Icons.Chart /></div>
            <ProgressRing progress={s.overallCompletion} />
          </div>
          <div className="stat-label">Global Completion</div>
          <div className="stat-body">
            <span className="stat-number">{Math.round(s.overallCompletion)}%</span>
          </div>
          <div className="stat-footer-text">
            <span>System-wide average</span>
          </div>
        </div>
      </section>

      <h2>Admin Tools</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Link to="/admin/users" className="member-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <h3>User Management →</h3>
          <p>Inspect roles, active statuses, and account provisioning.</p>
        </Link>
        <Link to="/admin/audit" className="member-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <h3>Security Audit Logs →</h3>
          <p>Review system authentication and authorization access records.</p>
        </Link>
      </div>
    </>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isDemoMode()) {
      setUsers([
        { id: 1, displayName: 'System Admin', email: 'admin@progtrack.io', role: 'ADMIN', active: true },
        { id: 2, displayName: 'Sarah Jenkins', email: 'sarah@progtrack.io', role: 'MANAGER', active: true },
        { id: 3, displayName: 'Alex Morgan', email: 'alex@progtrack.io', role: 'USER', active: true },
        { id: 4, displayName: 'Sophia Chen', email: 'sophia@progtrack.io', role: 'USER', active: true },
      ]);
      return;
    }
    api.get('/admin/users')
      .then((r) => setUsers(r.data.content || []))
      .catch(() => {
        setUsers([
          { id: 1, displayName: 'System Admin', email: 'admin@progtrack.io', role: 'ADMIN', active: true },
          { id: 2, displayName: 'Sarah Jenkins', email: 'sarah@progtrack.io', role: 'MANAGER', active: true },
          { id: 3, displayName: 'Alex Morgan', email: 'alex@progtrack.io', role: 'USER', active: true },
        ]);
      });
  }, []);

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">ACCESS CONTROL</div>
          <h1>User Management</h1>
          <p className="muted">Manage accounts, security credentials, and organization roles.</p>
        </div>
      </div>
      <div className="table">
        {users.map((u) => (
          <div key={u.id}>
            <b>{u.displayName}</b>
            <span>{u.email}</span>
            <span>{u.role}</span>
            <span style={{ color: u.active ? '#15803d' : '#be123c', fontWeight: 600 }}>
              {u.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function AdminAudit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isDemoMode()) {
      setLogs([
        { id: 101, action: 'AUTH_LOGIN_SUCCESS', actorId: 3, targetId: null, timestamp: new Date().toISOString() },
        { id: 102, action: 'GOAL_MILESTONE_TOGGLE', actorId: 3, targetId: 102, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 103, action: 'AI_BREAKDOWN_GENERATED', actorId: 3, targetId: 1, timestamp: new Date(Date.now() - 86400000).toISOString() }
      ]);
      return;
    }
    api.get('/admin/audit-log')
      .then((r) => setLogs(r.data))
      .catch(() => {
        setLogs([
          { id: 101, action: 'AUTH_LOGIN_SUCCESS', actorId: 3, targetId: null, timestamp: new Date().toISOString() }
        ]);
      });
  }, []);

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">SECURITY LOG</div>
          <h1>Audit History</h1>
          <p className="muted">Immutable system action logs and operational events.</p>
        </div>
      </div>
      <div className="table">
        {logs.map((x) => (
          <div key={x.id}>
            <b>{x.action}</b>
            <span>Actor #{x.actorId}</span>
            <span>Target {x.targetId ? `#${x.targetId}` : '—'}</span>
            <span>{new Date(x.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ==========================================
// UTILITY HELPERS
// ==========================================
function Loading() {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <span>Loading workspace data...</span>
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT & ROUTING
// ==========================================
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />

      {/* USER ROUTES */}
      <Route
        path="/app"
        element={
          <Guard role="USER">
            <UserDashboard />
          </Guard>
        }
      />
      <Route
        path="/app/goals"
        element={
          <Guard role="USER">
            <UserGoals />
          </Guard>
        }
      />
      <Route
        path="/app/new"
        element={
          <Guard role="USER">
            <NewGoal />
          </Guard>
        }
      />
      <Route
        path="/app/learn"
        element={
          <Guard role="USER">
            <NewGoal learn />
          </Guard>
        }
      />
      <Route
        path="/app/goals/:id"
        element={
          <Guard role="USER">
            <GoalDetail />
          </Guard>
        }
      />

      {/* MANAGER ROUTES */}
      <Route
        path="/manager"
        element={
          <Guard role="MANAGER">
            <ManagerDashboard />
          </Guard>
        }
      />
      <Route
        path="/manager/team"
        element={
          <Guard role="MANAGER">
            <ManagerTeam />
          </Guard>
        }
      />
      <Route
        path="/manager/team/:id"
        element={
          <Guard role="MANAGER">
            <MemberGoals />
          </Guard>
        }
      />
      <Route
        path="/manager/analytics"
        element={
          <Guard role="MANAGER">
            <ManagerDashboard />
          </Guard>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <Guard role="ADMIN">
            <AdminDashboard />
          </Guard>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Guard role="ADMIN">
            <AdminUsers />
          </Guard>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <Guard role="ADMIN">
            <AdminAudit />
          </Guard>
        }
      />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
