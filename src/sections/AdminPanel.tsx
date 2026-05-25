import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  Shield,
  LogIn,
  RefreshCw,
  Calendar,
  Filter,
  FileText,
  Eye,
  Globe,
  MapPin,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  BarChart3,
  Users,
  MousePointerClick,
  TrendingUp,
  Lock,
  Unlock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface LogEntry {
  key: string;
  event: string;
  page: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  ip: string;
  country: string;
  city: string;
  region: string;
  userAgent: string;
  acceptLang: string;
}

interface StatsData {
  total: number;
  uniqueSessions: number;
  eventBreakdown: Record<string, number>;
  dailyBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'optoreview2025';
const API_KEY = import.meta.env.VITE_ANALYTICS_API_KEY || '';
const WORKER_URL = import.meta.env.VITE_ANALYTICS_WORKER_URL || '';

const EVENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  page_view: { label: '页面访问', color: '#0E6B5E', bg: '#E8F3F1' },
  file_upload: { label: '文件上传', color: '#2E5A8C', bg: '#F0F3F7' },
  start_analysis: { label: '开始分析', color: '#8B5E34', bg: '#F9F4EF' },
  report_view: { label: '查看报告', color: '#6B4E9E', bg: '#F3EFF7' },
  export_md: { label: '导出 MD', color: '#5A7D3C', bg: '#EFF5EA' },
  export_pdf: { label: '导出 PDF', color: '#B84949', bg: '#FFF5F5' },
  config_model: { label: '配置模型', color: '#A67B2E', bg: '#FFFDF5' },
};

const PAGE_SIZE = 50;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
};

/* ------------------------------------------------------------------ */
/*  Login Component                                                    */
/* ------------------------------------------------------------------ */
function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('optoreview_admin', '1');
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F7F4F0' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#E8F3F1' }}
          >
            <Shield size={28} style={{ color: '#0E6B5E' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#2A2926' }}>
            OptoReview 管理后台
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8E8A83' }}>
            请输入管理员密码
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: '#8E8A83' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="管理员密码"
              autoFocus
              className="w-full rounded-xl border px-10 py-3 text-sm outline-none transition-all duration-200"
              style={{
                borderColor: error ? '#B84949' : '#E6E1DA',
                background: '#FAF8F5',
                color: '#2A2926',
              }}
              onFocus={(e) => {
                if (!error) e.currentTarget.style.borderColor = '#0E6B5E';
              }}
              onBlur={(e) => {
                if (!error) e.currentTarget.style.borderColor = '#E6E1DA';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              style={{ color: '#8E8A83' }}
              tabIndex={-1}
            >
              {showPassword ? <Unlock size={14} /> : <Lock size={14} />}
            </button>
          </div>

          {error && (
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: '#B84949' }}>
              <AlertCircle size={12} />
              密码错误，请重试
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl transition-all duration-200 focus:outline-none"
            style={{
              background: 'linear-gradient(180deg, #0E6B5E 0%, #0A5248 100%)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <LogIn size={16} />
            登录
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.history.back()}
            className="text-xs inline-flex items-center gap-1 transition-colors hover:underline"
            style={{ color: '#8E8A83' }}
          >
            <ChevronLeft size={12} />
            返回网站
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: '#FFFFFF', border: '1px solid #E6E1DA' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs" style={{ color: '#8E8A83' }}>{label}</p>
        <p className="text-lg font-bold" style={{ color: '#2A2926' }}>{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Admin Panel                                                   */
/* ------------------------------------------------------------------ */
export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    sessionStorage.getItem('optoreview_admin') === '1'
  );

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [eventFilter, setEventFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // Expanded log detail
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  /* ---- Check login ---- */
  useEffect(() => {
    if (!isLoggedIn) {
      sessionStorage.removeItem('optoreview_admin');
    }
  }, [isLoggedIn]);

  /* ---- Fetch data ---- */
  const fetchData = useCallback(async () => {
    if (!WORKER_URL || !API_KEY) {
      setError('未配置 Worker URL 或 API Key，请在环境变量中设置 VITE_ANALYTICS_WORKER_URL 和 VITE_ANALYTICS_API_KEY');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch(`${WORKER_URL}/query?key=${API_KEY}&limit=500${eventFilter ? `&event=${eventFilter}` : ''}`),
        fetch(`${WORKER_URL}/stats?key=${API_KEY}`),
      ]);

      if (!logsRes.ok) {
        const data = await logsRes.json().catch(() => ({}));
        throw new Error(data.error || `查询失败 (${logsRes.status})`);
      }
      if (!statsRes.ok) {
        const data = await statsRes.json().catch(() => ({}));
        throw new Error(data.error || `统计失败 (${statsRes.status})`);
      }

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      setLogs(logsData.logs || []);
      setStats(statsData);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, fetchData]);

  /* ---- Apply client-side filters (date + search) ---- */
  useEffect(() => {
    let result = [...logs];

    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      result = result.filter((l) => new Date(l.timestamp).getTime() >= fromTime);
    }
    if (dateTo) {
      const toTime = new Date(dateTo).getTime() + 86400000;
      result = result.filter((l) => new Date(l.timestamp).getTime() < toTime);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.ip.toLowerCase().includes(term) ||
          l.country.toLowerCase().includes(term) ||
          l.city.toLowerCase().includes(term) ||
          l.event.toLowerCase().includes(term) ||
          JSON.stringify(l.metadata).toLowerCase().includes(term)
      );
    }

    setFilteredLogs(result);
    setPage(1);
  }, [logs, dateFrom, dateTo, searchTerm]);

  /* ---- Pagination ---- */
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, page]);

  /* ---- Logout ---- */
  const logout = () => {
    sessionStorage.removeItem('optoreview_admin');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginGate onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: '#F7F4F0' }}>
      {/* ====== Header ====== */}
      <header
        className="sticky top-0 z-10 border-b px-4 md:px-8 py-3"
        style={{ background: '#FFFFFF', borderColor: '#E6E1DA' }}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: '#E8F3F1' }}
            >
              <Shield size={18} style={{ color: '#0E6B5E' }} />
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: '#2A2926' }}>
                OptoReview 访问日志
              </h1>
              <p className="text-[11px]" style={{ color: '#8E8A83' }}>
                实时监控与分析
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none"
              style={{
                borderColor: '#E6E1DA',
                color: '#2A2926',
                background: '#FAF8F5',
                opacity: loading ? 0.5 : 1,
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none"
              style={{
                borderColor: '#E6E1DA',
                color: '#8E8A83',
                background: 'transparent',
              }}
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: '#FFF5F5', border: '1px solid #E8B4B4' }}
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#B84949' }} />
            <p className="text-sm" style={{ color: '#B84949' }}>{error}</p>
          </div>
        )}

        {/* ====== Stats Cards ====== */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<Database size={18} />}
              label="总日志数"
              value={stats.total.toLocaleString()}
              color="#0E6B5E"
            />
            <StatCard
              icon={<Users size={18} />}
              label="独立会话"
              value={stats.uniqueSessions.toLocaleString()}
              color="#2E5A8C"
            />
            <StatCard
              icon={<MousePointerClick size={18} />}
              label="今日事件"
              value={(
                stats.dailyBreakdown[new Date().toISOString().split('T')[0]] || 0
              ).toLocaleString()}
              color="#8B5E34"
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="事件类型"
              value={Object.keys(stats.eventBreakdown).length}
              color="#6B4E9E"
            />
          </div>
        )}

        {/* ====== Event Breakdown ====== */}
        {stats && Object.keys(stats.eventBreakdown).length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{ background: '#FFFFFF', border: '1px solid #E6E1DA' }}
          >
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#2A2926' }}>
              <BarChart3 size={15} style={{ color: '#0E6B5E' }} />
              事件分布
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(stats.eventBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([event, count]) => {
                  const cfg = EVENT_LABELS[event] || {
                    label: event,
                    color: '#8E8A83',
                    bg: '#F0EDE8',
                  };
                  return (
                    <button
                      key={event}
                      onClick={() => setEventFilter((prev) => (prev === event ? '' : event))}
                      className="rounded-lg p-3 text-left transition-all duration-200 focus:outline-none"
                      style={{
                        background: eventFilter === event ? cfg.color : cfg.bg,
                        border: `1px solid ${eventFilter === event ? cfg.color : 'transparent'}`,
                      }}
                    >
                      <p
                        className="text-lg font-bold"
                        style={{ color: eventFilter === event ? '#FFFFFF' : cfg.color }}
                      >
                        {count}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: eventFilter === event ? '#FFFFFF' : '#8E8A83' }}
                      >
                        {cfg.label}
                      </p>
                    </button>
                  );
                })}
            </div>
            {eventFilter && (
              <p className="mt-3 text-[11px] flex items-center gap-1" style={{ color: '#8E8A83' }}>
                <Filter size={11} />
                已筛选：{EVENT_LABELS[eventFilter]?.label || eventFilter}
                <button
                  onClick={() => setEventFilter('')}
                  className="underline ml-1"
                  style={{ color: '#0E6B5E' }}
                >
                  清除
                </button>
              </p>
            )}
          </div>
        )}

        {/* ====== Filters ====== */}
        <div
          className="rounded-xl p-4 flex flex-wrap items-center gap-3"
          style={{ background: '#FFFFFF', border: '1px solid #E6E1DA' }}
        >
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: '#8E8A83' }} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs rounded-lg border px-2.5 py-1.5 outline-none focus:ring-1"
              style={{ borderColor: '#E6E1DA', background: '#FAF8F5', color: '#2A2926' }}
            />
            <span className="text-xs" style={{ color: '#8E8A83' }}>至</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs rounded-lg border px-2.5 py-1.5 outline-none focus:ring-1"
              style={{ borderColor: '#E6E1DA', background: '#FAF8F5', color: '#2A2926' }}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索 IP、国家、事件、元数据..."
              className="w-full text-xs rounded-lg border px-3 py-1.5 outline-none focus:ring-1 transition-all duration-200"
              style={{ borderColor: '#E6E1DA', background: '#FAF8F5', color: '#2A2926' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#0E6B5E'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E6E1DA'; }}
            />
          </div>

          <p className="text-xs whitespace-nowrap" style={{ color: '#8E8A83' }}>
            共 {filteredLogs.length} 条
          </p>
        </div>

        {/* ====== Log Table ====== */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid #E6E1DA' }}
        >
          {/* Table header */}
          <div
            className="grid gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: '100px 80px 70px 80px 90px 1fr 100px',
              color: '#8E8A83',
              background: '#FAF8F5',
              borderBottom: '1px solid #E6E1DA',
            }}
          >
            <span>时间</span>
            <span>IP</span>
            <span>国家</span>
            <span>城市</span>
            <span>事件</span>
            <span>详情</span>
            <span>会话</span>
          </div>

          {/* Table rows */}
          <div className="divide-y" style={{ borderColor: '#E6E1DA' }}>
            {paginatedLogs.length === 0 && (
              <div className="px-4 py-12 text-center">
                <FileText size={32} className="mx-auto mb-2" style={{ color: '#D4CFC7' }} />
                <p className="text-sm" style={{ color: '#8E8A83' }}>暂无数据</p>
              </div>
            )}

            {paginatedLogs.map((log) => {
              const evCfg = EVENT_LABELS[log.event] || {
                label: log.event,
                color: '#8E8A83',
                bg: '#F0EDE8',
              };
              const isExpanded = expandedKey === log.key;

              return (
                <div key={log.key}>
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : log.key)}
                    className="w-full grid gap-2 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-[#FAF8F5] focus:outline-none"
                    style={{
                      gridTemplateColumns: '100px 80px 70px 80px 90px 1fr 100px',
                      alignItems: 'center',
                    }}
                  >
                    {/* Time */}
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium" style={{ color: '#2A2926' }}>
                        {formatDate(log.timestamp).split(' ')[0]}
                      </span>
                      <span className="text-[10px]" style={{ color: '#8E8A83' }}>
                        {formatDate(log.timestamp).split(' ')[1]}
                      </span>
                    </div>

                    {/* IP */}
                    <span className="text-[11px] font-mono truncate" style={{ color: '#2A2926' }} title={log.ip}>
                      {log.ip}
                    </span>

                    {/* Country */}
                    <div className="flex items-center gap-1">
                      <Globe size={10} style={{ color: '#8E8A83' }} />
                      <span className="text-[11px]" style={{ color: '#2A2926' }}>
                        {log.country || '-'}
                      </span>
                    </div>

                    {/* City */}
                    <div className="flex items-center gap-1">
                      <MapPin size={10} style={{ color: '#8E8A83' }} />
                      <span className="text-[11px] truncate" style={{ color: '#2A2926' }}>
                        {log.city || '-'}
                      </span>
                    </div>

                    {/* Event */}
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold w-fit"
                      style={{ background: evCfg.bg, color: evCfg.color }}
                    >
                      {evCfg.label}
                    </span>

                    {/* Details */}
                    <div className="flex items-center gap-1 min-w-0">
                      <Eye size={10} style={{ color: '#8E8A83', flexShrink: 0 }} />
                      <span className="text-[10px] truncate" style={{ color: '#8E8A83' }}>
                        {Object.keys(log.metadata || {}).length > 0
                          ? JSON.stringify(log.metadata).slice(0, 60)
                          : '-'}
                      </span>
                    </div>

                    {/* Session */}
                    <span className="text-[10px] font-mono truncate" style={{ color: '#8E8A83' }} title={log.sessionId}>
                      {log.sessionId?.slice(0, 8) || '-'}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div
                      className="px-4 py-3 text-[11px] space-y-1.5"
                      style={{ background: '#FAF8F5', borderTop: '1px dashed #E6E1DA' }}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span style={{ color: '#8E8A83' }}>页面：</span>
                          <span className="font-medium" style={{ color: '#2A2926' }}>{log.page || '-'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#8E8A83' }}>地区：</span>
                          <span className="font-medium" style={{ color: '#2A2926' }}>{log.region || '-'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#8E8A83' }}>相对时间：</span>
                          <span className="font-medium" style={{ color: '#2A2926' }}>{getRelativeTime(log.timestamp)}</span>
                        </div>
                        <div>
                          <span style={{ color: '#8E8A83' }}>语言：</span>
                          <span className="font-medium" style={{ color: '#2A2926' }}>{log.acceptLang || '-'}</span>
                        </div>
                      </div>
                      {log.userAgent && (
                        <div>
                          <span style={{ color: '#8E8A83' }}>UA：</span>
                          <span className="font-medium break-all" style={{ color: '#2A2926' }}>{log.userAgent}</span>
                        </div>
                      )}
                      {Object.keys(log.metadata || {}).length > 0 && (
                        <div className="rounded-lg p-2.5" style={{ background: '#F0EDE8' }}>
                          <span style={{ color: '#8E8A83' }}>元数据：</span>
                          <pre className="mt-1 text-[10px] whitespace-pre-wrap break-all" style={{ color: '#2A2926' }}>
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      <p className="text-[10px]" style={{ color: '#B8B3AB' }}>
                        存储键：{log.key}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ====== Pagination ====== */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[11px]" style={{ color: '#8E8A83' }}>
              第 {page} / {totalPages} 页，共 {filteredLogs.length} 条
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border transition-all duration-200 disabled:opacity-30 focus:outline-none"
                style={{ borderColor: '#E6E1DA', color: '#2A2926' }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className="w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none"
                    style={{
                      background: pageNum === page ? '#0E6B5E' : 'transparent',
                      color: pageNum === page ? '#FFFFFF' : '#2A2926',
                      border: pageNum === page ? '1px solid #0E6B5E' : '1px solid #E6E1DA',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border transition-all duration-200 disabled:opacity-30 focus:outline-none"
                style={{ borderColor: '#E6E1DA', color: '#2A2926' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}