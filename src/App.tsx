import './App.css';

import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Calendar, Cloud, CloudOff, History, Info, Timer } from 'lucide-react';
import { type FC, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';

import {
  AddExerciseModal,
  AnalyticsView,
  Auth,
  AuthProvider,
  HistoryView,
  LogExerciseModal,
  OggiView,
  ProfileView,
  TimerView,
  useAuth,
  WorkoutSummaryModal,
} from './components';
import { useTimer } from './hooks/useTimer';
import { useWorkoutData } from './hooks/useWorkoutData';
import { useStore } from './store/useStore';
import type { Exercise } from './types';

const PageTransition: FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

const AppContent: FC = () => {
  const {
    user,
    exercises,
    loading,
    totalVolume,
    activeSession,
    startWorkout,
    endWorkout,
    fetchData,
    progresso,
    setProgress,
    volumeProgress,
  } = useWorkoutData();

  const { timer, setTimer, timerActive, setTimerActive, startTimer } = useTimer();

  const { offlineQueueCount, showSummary, setShowSummary, lastWorkoutSummary } = useStore();

  const location = useLocation();
  const [showAddEx, setShowAddEx] = useState(false);
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);

  const [initialTimerVal, setInitialTimerVal] = useState(90);
  const timerProgress = timerActive ? (timer / initialTimerVal) * 100 : 0;

  const handleStartTimer = (secs: number) => {
    setInitialTimerVal(secs);
    startTimer(secs);
  };

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Aurora Glow Blobs */}
      <div className="aurora-glow-container">
        <div className="aurora-glow glow-1"></div>
        <div className="aurora-glow glow-2"></div>
        <div className="aurora-glow glow-3"></div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' },
        }}
      />

      {/* Sync Indicator */}
      <div
        className="sync-status-indicator"
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          padding: '6px 12px',
          borderRadius: '100px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {offlineQueueCount > 0 ? (
          <>
            <CloudOff size={14} color="#ff9f0a" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#ff9f0a' }}>
              {offlineQueueCount} IN CODA
            </span>
          </>
        ) : (
          <>
            <Cloud size={14} color="var(--accent)" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)' }}>SYNC</span>
          </>
        )}
      </div>

      {timerActive && (
        <div
          className="mini-timer-bar"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(0, 255, 136, 0.2)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${timerProgress}%` }}
            style={{
              height: '100%',
              background: 'var(--accent)',
              boxShadow: '0 0 10px var(--accent)',
              transition: 'width 1s linear',
            }}
          />
        </div>
      )}

      <AnimatePresence>
        {timerActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="timer-overlay"
            onClick={() => setTimerActive(false)}
          >
            <div className="timer-circle">
              <span className="timer-val">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>
              <span className="timer-label">RECUPERO</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/oggi" replace />} />
            <Route
              path="/oggi"
              element={
                <PageTransition>
                  <OggiView
                    exercises={exercises}
                    loading={loading}
                    totalVolume={totalVolume}
                    progresso={progresso}
                    setProgress={setProgress}
                    volumeProgress={volumeProgress}
                    activeSession={activeSession}
                    startWorkout={startWorkout}
                    endWorkout={endWorkout}
                    setShowAddEx={setShowAddEx}
                    setSelectedEx={setSelectedEx}
                  />
                </PageTransition>
              }
            />
            <Route
              path="/storico"
              element={
                <PageTransition>
                  <HistoryView />
                </PageTransition>
              }
            />
            <Route
              path="/analisi"
              element={
                <PageTransition>
                  <AnalyticsView />
                </PageTransition>
              }
            />
            <Route
              path="/timer"
              element={
                <PageTransition>
                  <TimerView
                    externalTimer={timer}
                    externalTimerActive={timerActive}
                    onTimerChange={setTimer}
                    onTimerActiveChange={setTimerActive}
                  />
                </PageTransition>
              }
            />
            <Route
              path="/info"
              element={
                <PageTransition>
                  <ProfileView />
                </PageTransition>
              }
            />
          </Routes>
      </AnimatePresence>

      <AnimatePresence>
        {showAddEx && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 2000 }}
          >
            <AddExerciseModal
              userId={user.id}
              onClose={() => setShowAddEx(false)}
              onSuccess={fetchData}
            />
          </motion.div>
        )}

        {selectedEx && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ position: 'fixed', inset: 0, zIndex: 2001 }}
          >
            <LogExerciseModal
              user={user}
              selectedEx={selectedEx}
              activeSession={activeSession}
              onClose={() => setSelectedEx(null)}
              onSuccess={(timerSecs) => {
                fetchData();
                if (timerSecs) handleStartTimer(timerSecs);
              }}
            />
          </motion.div>
        )}

        {showSummary && lastWorkoutSummary && (
          <WorkoutSummaryModal summary={lastWorkoutSummary} onClose={() => setShowSummary(false)} />
        )}
      </AnimatePresence>

      <nav className="bottom-nav">
        <NavLink to="/oggi" className="nav-item">
          <Calendar size={24} />
          <span>Oggi</span>
        </NavLink>
        <NavLink to="/storico" className="nav-item">
          <History size={24} />
          <span>Storico</span>
        </NavLink>
        <NavLink to="/analisi" className="nav-item">
          <Activity size={24} />
          <span>Analisi</span>
        </NavLink>
        <NavLink to="/timer" className="nav-item">
          <Timer size={24} />
          <span>Timer</span>
        </NavLink>
        <NavLink to="/info" className="nav-item">
          <Info size={24} />
          <span>Info</span>
        </NavLink>
      </nav>
    </div>
  );
};

const MainSwitcher: FC = () => {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <div className="loader-overlay">
        <div className="spinner"></div>
      </div>
    );
  
  return (
    <main id="main-content">
       <h1 className="sr-only">KineFit - Smart Training Assistant</h1>
       {session ? <AppContent /> : <Auth />}
    </main>
  );
};

const App: FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainSwitcher />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
