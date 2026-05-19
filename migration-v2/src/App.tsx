import React, { useState, useEffect } from 'react';
import { Activity, Weight, Calendar, Plus, CheckCircle2, History, Timer, Info, X, Dumbbell, Trophy, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Auth } from './components/Auth';
import './App.css';

// Tipi
interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  target_reps: string;
  target_sets: number;
  training_day: string;
  notes?: string;
  completed?: boolean;
  last_weight?: number;
  is_pr?: boolean;
}

const DAYS = ['DOMENICA', 'LUNEDI', 'MARTEDI', 'MERCOLEDI', 'GIOVEDI', 'VENERDI', 'SABATO'];

const ExerciseCard: React.FC<{ ex: Exercise; onLog: () => void; isCompex?: boolean }> = ({ ex, onLog, isCompex }) => (
  <div className={`ex-card ${ex.completed ? 'completed' : ''} ${isCompex ? 'compex-card' : ''}`}>
    <div className="ex-main">
      <div className="ex-info">
        <span className="ex-group" style={{ color: isCompex ? '#00ccff' : 'var(--accent)' }}>
          {ex.muscle_group || (isCompex ? 'RECUPERO' : 'VARIE')}
        </span>
        <h3 className="ex-name">
          {ex.name} {ex.is_pr && <Trophy size={14} className="pr-icon" />}
        </h3>
        <p className="ex-target">Target: {ex.target_sets} serie • Last: {ex.last_weight || '--'}kg</p>
      </div>
      <div className="ex-action">
        {ex.completed ? (
          <CheckCircle2 color={isCompex ? '#00ccff' : 'var(--accent)'} size={28} />
        ) : (
          <button className="log-btn" onClick={onLog} style={{ background: isCompex ? '#00ccff' : 'var(--accent)' }}>
            <Plus size={20} />
          </button>
        )}
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEx, setShowAddEx] = useState(false);
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);
  
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('8');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const fetchData = async () => {
    setLoading(true);
    const oggi = DAYS[new Date().getDay()];
    
    const { data: exData, error: exError } = await supabase
      .from('exercises')
      .select('*')
      .eq('training_day', oggi)
      .order('order_index', { ascending: true });

    if (exError) console.error(exError);
    
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const { data: logData } = await supabase
      .from('training_logs')
      .select('exercise_id, weight, reps')
      .gte('created_at', startOfDay.toISOString());

    let vol = 0;
    const completedIds = new Set(logData?.map(l => l.exercise_id));
    logData?.forEach(l => vol += (l.weight * l.reps));

    setTotalVolume(vol);
    setExercises(exData?.map(ex => ({
      ...ex,
      completed: completedIds.has(ex.id),
    })) || []);
    
    setLoading(false);
  };

  const handleSaveLog = async () => {
    if (!selectedEx || !weight || !user) return;
    const reps = 10;
    const weightVal = parseFloat(weight);

    await supabase
      .from('training_logs')
      .insert([{ 
        user_id: user.id,
        exercise_id: selectedEx.id, 
        weight: weightVal, 
        reps: reps, 
        rpe: parseInt(rpe)
      }]);

    setSelectedEx(null);
    setTimer(90);
    setTimerActive(true);
    fetchData();
  };

  const handleAddExercise = async () => {
    if (!newName || !user) return;
    await supabase.from('exercises').insert([{ 
      user_id: user.id,
      name: newName, 
      muscle_group: newGroup, 
      training_day: DAYS[new Date().getDay()],
      target_reps: '10',
      target_sets: 3,
      notes: 'PALESTRA'
    }]);
    setShowAddEx(false);
    fetchData();
  };

  const gymExercises = exercises.filter(ex => ex.notes !== 'COMPEX');
  const compexExercises = exercises.filter(ex => ex.notes === 'COMPEX');
  const progresso = exercises.length > 0 ? (exercises.filter(ex => ex.completed).length / exercises.length) * 100 : 0;

  return (
    <div className="app-container">
      {loading && <div className="loader-overlay"><div className="spinner"></div></div>}

      {timerActive && (
        <div className="timer-overlay" onClick={() => setTimerActive(false)}>
          <div className="timer-circle">
            <span className="timer-val">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
            <span className="timer-label">RECUPERO</span>
          </div>
        </div>
      )}

      <header className="header">
        <div className="date-info">
          <span className="subtitle">{DAYS[new Date().getDay()]} {new Date().toLocaleDateString('it-IT')}</span>
          <h1 className="title">AI COACH <span className="version">V2</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="add-main-btn" style={{ width: '40px', background: 'transparent' }} onClick={signOut}>
            <LogOut size={20} color="var(--danger)" />
          </button>
          <button className="add-main-btn" onClick={() => setShowAddEx(true)}>
            <Plus size={24} />
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Weight size={18} /></div>
          <div className="stat-info">
            <span className="stat-val">{totalVolume.toLocaleString()}</span>
            <span className="stat-label">Volume (kg)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Activity size={18} /></div>
          <div className="stat-info">
            <span className="stat-val">{Math.round(progresso)}%</span>
            <span className="stat-label">Progresso</span>
          </div>
        </div>
      </section>

      <main className="exercise-list">
        {gymExercises.length > 0 && (
          <>
            <div className="section-header"><h2 className="section-title">Palestra</h2><span className="count">{gymExercises.length}</span></div>
            {gymExercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onLog={() => { setSelectedEx(ex); setWeight(''); }} />
            ))}
          </>
        )}

        {compexExercises.length > 0 && (
          <>
            <div className="section-header" style={{ marginTop: '32px' }}><h2 className="section-title" style={{ color: '#00ccff' }}>Compex</h2><span className="count">{compexExercises.length}</span></div>
            {compexExercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onLog={() => { setSelectedEx(ex); setWeight(''); }} isCompex />
            ))}
          </>
        )}

        {exercises.length === 0 && !loading && (
          <div className="empty-state">
            <Dumbbell size={48} color="#333" />
            <p>Nessun esercizio per oggi.<br/>Aggiungine uno con il tasto +</p>
          </div>
        )}
      </main>

      {showAddEx && (
        <div className="modal-overlay" onClick={() => setShowAddEx(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Nuovo Esercizio</h2><button className="close-btn" onClick={() => setShowAddEx(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="input-group"><label>Nome</label><input value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div className="input-group"><label>Gruppo</label><input value={newGroup} onChange={e => setNewGroup(e.target.value)} /></div>
              <button className="save-btn" onClick={handleAddExercise}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {selectedEx && (
        <div className="modal-overlay" onClick={() => setSelectedEx(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">{selectedEx.name}</h2><button className="close-btn" onClick={() => setSelectedEx(null)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="input-group"><label>Peso (kg)</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} autoFocus /></div>
              <div className="input-group"><label>Sforzo (RPE)</label><input type="number" value={rpe} onChange={e => setRpe(e.target.value)} /></div>
              <button className="save-btn" onClick={handleSaveLog}>Salva Set</button>
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button className="nav-item active"><Calendar size={24} /><span>Oggi</span></button>
        <button className="nav-item"><History size={24} /><span>Storico</span></button>
        <button className="nav-item"><Timer size={24} /><span>Timer</span></button>
        <button className="nav-item"><Info size={24} /><span>Info</span></button>
      </nav>
    </div>
  );
};

const MainSwitcher: React.FC = () => {
  const { session, loading } = useAuth();
  if (loading) return <div className="loader-overlay"><div className="spinner"></div></div>;
  return session ? <AppContent /> : <Auth />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainSwitcher />
    </AuthProvider>
  );
};

export default App;
