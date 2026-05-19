import { useState, useEffect, type FC } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Activity, Weight, Calendar, Plus, CheckCircle2, History, Timer, Info, X, Dumbbell, Play, Square } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Auth } from './components/Auth';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { saveLogSafely, syncOfflineLogs } from './lib/offlineSync';
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
  sets_done?: number; 
}

const DAYS = ['DOMENICA', 'LUNEDI', 'MARTEDI', 'MERCOLEDI', 'GIOVEDI', 'VENERDI', 'SABATO'];

const getMuscleColor = (group: string, notes?: string) => {
  if (notes === 'COMPEX') return 'var(--color-compex)';
  const g = group.toLowerCase();
  if (g.includes('petto')) return 'var(--color-petto)';
  if (g.includes('dorso') || g.includes('schiena')) return 'var(--color-dorso)';
  if (g.includes('gambe') || g.includes('quad') || g.includes('femor')) return 'var(--color-gambe)';
  if (g.includes('spalle') || g.includes('delto')) return 'var(--color-spalle)';
  if (g.includes('braccia') || g.includes('bici') || g.includes('trici')) return 'var(--color-braccia)';
  if (g.includes('core') || g.includes('addo')) return 'var(--color-core)';
  return 'var(--color-default)';
};

const ProgressRing: FC<{ progress: number }> = ({ progress }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-container">
      <svg width="84" height="84" className="progress-ring">
        <circle className="progress-ring-bg" stroke="#1c1c1e" strokeWidth="8" fill="transparent" r={radius} cx="42" cy="42" />
        <circle 
          className="progress-ring-circle" 
          stroke="var(--accent)" 
          strokeWidth="8" 
          strokeDasharray={circumference} 
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round" 
          fill="transparent" 
          r={radius} cx="42" cy="42" 
        />
      </svg>
      <div className="progress-val-overlay">
        <span className="prog-percent">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

const ExerciseCard: FC<{ ex: Exercise; onLog: () => void }> = ({ ex, onLog }) => {
  const color = getMuscleColor(ex.muscle_group, ex.notes);
  
  return (
    <div className={`ex-card-premium ${ex.completed ? 'completed' : ''}`} style={{ '--ex-color': color } as any}>
      <div className="ex-accent-bar" style={{ background: color }}></div>
      <div className="ex-content-premium">
        <div className="ex-header-premium">
          <span className="ex-group-premium" style={{ color: color }}>{ex.muscle_group}</span>
          <h3 className="ex-name-premium">{ex.name}</h3>
        </div>
        <div className="ex-stats-premium">
          <div className="ex-stat-item">
            <span className="ex-stat-label">Serie</span>
            <span className="ex-stat-val">
              <strong style={{ color: (ex.sets_done||0) >= ex.target_sets ? 'var(--accent)' : '#fff' }}>{ex.sets_done || 0}</strong>/{ex.target_sets}
            </span>
          </div>
          <div className="ex-stat-item">
            <span className="ex-stat-label">Target</span>
            <span className="ex-stat-val">{ex.target_reps} reps</span>
          </div>
          {ex.last_weight && (
            <div className="ex-stat-item">
              <span className="ex-stat-label">Ultimo</span>
              <span className="ex-stat-val">{ex.last_weight} kg</span>
            </div>
          )}
        </div>
      </div>
      <div className="ex-action-premium">
        {(ex.sets_done||0) >= ex.target_sets ? (
          <div className="done-badge" style={{ background: color + '20', color: color }}>
            <CheckCircle2 size={24} />
          </div>
        ) : (
          <button className="log-btn-premium" onClick={onLog} style={{ background: color }}>
            <Plus size={24} color="#000" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
};

const OggiView: FC<{
  exercises: Exercise[];
  loading: boolean;
  totalVolume: number;
  progresso: number;
  activeSession: string | null;
  startWorkout: () => void;
  endWorkout: () => void;
  setShowAddEx: (s: boolean) => void;
  setSelectedEx: (e: Exercise) => void;
  setWeight: (w: string) => void;
  setReps: (r: string) => void;
}> = ({ exercises, loading, totalVolume, progresso, activeSession, startWorkout, endWorkout, setShowAddEx, setSelectedEx, setWeight, setReps }) => {
  const gymExercises = exercises.filter(ex => ex.notes !== 'COMPEX');
  const compexExercises = exercises.filter(ex => ex.notes === 'COMPEX');

  return (
    <div className="view-content animate-fade">
      <header className="header-pro">
        <div className="header-main">
          <div className="header-info">
            <span className="header-date">{DAYS[new Date().getDay()]} {new Date().toLocaleDateString('it-IT')}</span>
            <h1 className="header-title">TRAINING</h1>
          </div>
          <ProgressRing progress={progresso} />
        </div>
        
        <div className="header-stats-strip">
          <div className="mini-stat">
            <Weight size={14} /> <span>{totalVolume.toLocaleString()} kg</span>
          </div>
          <div className="mini-stat">
            <Activity size={14} /> <span>{exercises.length} esercizi</span>
          </div>
          <div className="spacer"></div>
          {!activeSession ? (
            <button className="pro-start-btn" onClick={startWorkout}><Play size={16} fill="currentColor"/> START</button>
          ) : (
            <button className="pro-end-btn" onClick={endWorkout}><Square size={14} fill="currentColor"/> STOP</button>
          )}
        </div>
      </header>

      <main className="main-scroll">
        {loading && <div className="loader-container">Aggiornamento...</div>}
        {!activeSession && exercises.length > 0 && !loading && (
          <div className="glass-nudge">
            <Info size={16} /> Pronti per la sessione? Clicca su Start!
          </div>
        )}
        
        {gymExercises.length > 0 && (
          <section className="exercise-section">
            <div className="section-title-row">
              <h2 className="pro-section-title">Palestra</h2>
              <button className="pro-add-btn" onClick={() => setShowAddEx(true)}><Plus size={18} /></button>
            </div>
            <div className="exercises-grid-premium">
              {gymExercises.map((ex) => (
                <ExerciseCard key={ex.id} ex={ex} onLog={() => { setSelectedEx(ex); setWeight(''); setReps(ex.target_reps); }} />
              ))}
            </div>
          </section>
        )}

        {compexExercises.length > 0 && (
          <section className="exercise-section" style={{ marginTop: '32px' }}>
            <h2 className="pro-section-title" style={{ color: 'var(--color-compex)' }}>Compex</h2>
            <div className="exercises-grid-premium">
              {compexExercises.map((ex) => (
                <ExerciseCard key={ex.id} ex={ex} onLog={() => { setSelectedEx(ex); setWeight(''); setReps(ex.target_reps); }} />
              ))}
            </div>
          </section>
        )}

        {exercises.length === 0 && !loading && (
          <div className="empty-state-pro">
            <Dumbbell size={64} className="icon-pulse" />
            <p>Nessun esercizio pianificato.<br/>Aggiungi un movimento per iniziare.</p>
            <button className="save-btn" onClick={() => setShowAddEx(true)} style={{ width: 'auto', padding: '12px 32px' }}>Aggiungi</button>
          </div>
        )}
      </main>
    </div>
  );
};

const AppContent: FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEx, setShowAddEx] = useState(false);
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [currentExLogs, setCurrentExLogs] = useState<any[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('10');
  const [rpe, setRpe] = useState('8');

  useEffect(() => {
    if (user) {
      checkActiveSession();
      fetchData();
      
      const handleOnline = () => syncOfflineLogs();
      window.addEventListener('online', handleOnline);
      syncOfflineLogs(); 
      
      return () => window.removeEventListener('online', handleOnline);
    }
  }, [user]);

  useEffect(() => {
    if (selectedEx) {
      fetchCurrentExLogs();
    } else {
      setCurrentExLogs([]);
    }
  }, [selectedEx]);

  useEffect(() => {
    let interval: any;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const fetchCurrentExLogs = async () => {
    if (!selectedEx || !user) return;
    
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const { data } = await supabase
      .from('training_logs')
      .select('*')
      .eq('exercise_id', selectedEx.id)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: true });
    
    const queueStr = localStorage.getItem('training_logs_offline_queue');
    const offlineLogs = queueStr ? JSON.parse(queueStr).filter((l: any) => l.exercise_id === selectedEx.id) : [];
    
    if (data) setCurrentExLogs([...data, ...offlineLogs]);
  };

  const checkActiveSession = async () => {
    const { data } = await supabase
      .from('workout_sessions')
      .select('id')
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) setActiveSession(data.id);
  };

  const startWorkout = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert([{ user_id: user.id, start_time: new Date().toISOString() }])
      .select()
      .single();
    
    if (error) {
      toast.error("Errore nell'avvio della sessione");
      return;
    }
    
    if (data) {
      setActiveSession(data.id);
      toast.success("Allenamento iniziato!");
    }
  };

  const endWorkout = async () => {
    if (!activeSession) return;
    if (!window.confirm("Vuoi terminare l'allenamento?")) return;
    
    const { error } = await supabase
      .from('workout_sessions')
      .update({ end_time: new Date().toISOString() })
      .eq('id', activeSession);
    
    if (error) {
      toast.error("Errore nella chiusura sessione");
    } else {
      setActiveSession(null);
      toast.success("Allenamento completato. Ottimo lavoro!");
      fetchData();
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const oggi = DAYS[new Date().getDay()];
    
    const { data: exData } = await supabase
      .from('exercises')
      .select('*')
      .eq('training_day', oggi)
      .order('order_index', { ascending: true });
    
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const { data: logData } = await supabase
      .from('training_logs')
      .select('exercise_id, weight, reps')
      .gte('created_at', startOfDay.toISOString());

    const queueStr = localStorage.getItem('training_logs_offline_queue');
    const offlineLogs = queueStr ? JSON.parse(queueStr) : [];

    let vol = 0;
    const setCounts: Record<string, number> = {};
    
    logData?.forEach(l => {
      vol += (l.weight * l.reps);
      setCounts[l.exercise_id] = (setCounts[l.exercise_id] || 0) + 1;
    });

    offlineLogs.forEach((l: any) => {
      vol += (l.weight * l.reps);
      setCounts[l.exercise_id] = (setCounts[l.exercise_id] || 0) + 1;
    });

    setTotalVolume(vol);
    setExercises(exData?.map(ex => ({
      ...ex,
      sets_done: setCounts[ex.id] || 0,
      completed: (setCounts[ex.id] || 0) >= ex.target_sets,
    })) || []);
    
    setLoading(false);
  };

  const handleSaveLog = async () => {
    if (!selectedEx || !user) return;
    
    const weightVal = parseFloat(weight);
    const repsVal = parseInt(reps);
    const rpeVal = parseInt(rpe);

    if (isNaN(weightVal) || weightVal < 0) {
      toast.error("Inserisci un peso valido");
      return;
    }
    if (isNaN(repsVal) || repsVal <= 0) {
      toast.error("Ripetizioni non valide");
      return;
    }

    const { error, isOffline } = await saveLogSafely({ 
      user_id: user.id,
      exercise_id: selectedEx.id, 
      session_id: activeSession,
      weight: weightVal, 
      reps: repsVal, 
      rpe: rpeVal
    });

    if (error) {
      toast.error("Errore durante il salvataggio");
    } else {
      if (!isOffline) toast.success("Set salvato!");
      setTimer(90);
      setTimerActive(true);
      fetchData();
      fetchCurrentExLogs();
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (id.length > 20) { 
       const queueStr = localStorage.getItem('training_logs_offline_queue');
       if (queueStr) {
         const queue = JSON.parse(queueStr).filter((l: any) => l.tempId !== id);
         localStorage.setItem('training_logs_offline_queue', JSON.stringify(queue));
         toast.success("Set offline rimosso");
         fetchData();
         fetchCurrentExLogs();
       }
       return;
    }

    if (!window.confirm("Vuoi eliminare questo set?")) return;
    const { error } = await supabase.from('training_logs').delete().eq('id', id);
    if (!error) {
      toast.success("Set eliminato");
      fetchData();
      fetchCurrentExLogs();
    }
  };

  const calculateE1RM = (w: number, r: number) => {
    if (r === 1) return w;
    return Math.round(w / (1.0278 - 0.0278 * r));
  };

  const handleAddExercise = async () => {
    if (!newName.trim() || !user) {
      toast.error("Il nome dell'esercizio è obbligatorio");
      return;
    }

    const { error } = await supabase.from('exercises').insert([{ 
      user_id: user.id,
      name: newName.trim(), 
      muscle_group: newGroup.trim() || 'Varie', 
      training_day: DAYS[new Date().getDay()],
      target_reps: '10',
      target_sets: 3,
      notes: 'PALESTRA'
    }]);

    if (error) {
      toast.error("Errore nell'aggiunta dell'esercizio");
    } else {
      toast.success("Esercizio aggiunto al catalogo");
      setNewName('');
      setNewGroup('');
      setShowAddEx(false);
      fetchData();
    }
  };

  const progresso = exercises.length > 0 ? (exercises.filter(ex => ex.completed).length / exercises.length) * 100 : 0;

  return (
    <div className="app-container">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' }
      }} />
      
      {timerActive && (
        <div className="timer-overlay" onClick={() => setTimerActive(false)}>
          <div className="timer-circle">
            <span className="timer-val">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
            <span className="timer-label">RECUPERO</span>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/oggi" replace />} />
        <Route path="/oggi" element={
          <OggiView 
            exercises={exercises} 
            loading={loading} 
            totalVolume={totalVolume}
            progresso={progresso}
            activeSession={activeSession}
            startWorkout={startWorkout}
            endWorkout={endWorkout}
            setShowAddEx={setShowAddEx}
            setSelectedEx={setSelectedEx}
            setWeight={setWeight}
            setReps={setReps}
          />
        } />
        <Route path="/storico" element={<HistoryView />} />
        <Route path="/timer" element={
          <div className="empty-state">
            <Timer size={48} color="var(--accent)" />
            <h2>Timer Manuale</h2>
            <p>In arrivo: Fase 6 della Roadmap.<br/>Configura i tuoi tempi di riposo.</p>
          </div>
        } />
        <Route path="/info" element={<ProfileView />} />
      </Routes>

      {showAddEx && (
        <div className="modal-overlay" onClick={() => setShowAddEx(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Nuovo Esercizio</h2><button className="close-btn" onClick={() => setShowAddEx(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="input-group"><label>Nome</label><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Es. Panca Piana" /></div>
              <div className="input-group"><label>Gruppo Muscolare</label><input value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="Es. Petto" /></div>
              <button className="save-btn" onClick={handleAddExercise}>Salva nel Catalogo</button>
            </div>
          </div>
        </div>
      )}

      {selectedEx && (
        <div className="modal-overlay" onClick={() => setSelectedEx(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h2 className="modal-title">{selectedEx.name}</h2>
                <span className="modal-subtitle">Target: {selectedEx.target_sets} serie da {selectedEx.target_reps}</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedEx(null)}><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              {currentExLogs.length > 0 && (
                <div className="current-logs-list">
                  <h3 className="section-subtitle">Set Completati</h3>
                  {currentExLogs.map((log, idx) => (
                    <div key={log.id || log.tempId} className="log-item-row">
                      <div className="log-idx">{idx + 1}</div>
                      <div className="log-vals">
                        <strong>{log.weight} kg</strong> x {log.reps} 
                        <span className="log-rpe">RPE {log.rpe}</span>
                      </div>
                      <div className="log-e1rm">
                        e1RM: {calculateE1RM(log.weight, log.reps)}kg
                      </div>
                      <button className="delete-log-btn" onClick={() => handleDeleteLog(log.id || log.tempId)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="new-log-form">
                <h3 className="section-subtitle">{(selectedEx.sets_done || 0) < selectedEx.target_sets ? `Prossimo Set: ${(selectedEx.sets_done || 0) + 1}` : 'Set Extra'}</h3>
                <div className="input-row">
                  <div className="input-group">
                    <label>Peso (kg)</label>
                    <input type="number" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} autoFocus placeholder="0" />
                  </div>
                  <div className="input-group">
                    <label>Ripetizioni</label>
                    <input type="number" value={reps} onChange={e => setReps(e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Sforzo (RPE 1-10)</label>
                  <input type="number" min="1" max="10" value={rpe} onChange={e => setRpe(e.target.value)} />
                </div>
                <button className="save-btn" onClick={handleSaveLog}>
                  Salva Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <NavLink to="/oggi" className="nav-item"><Calendar size={24} /><span>Oggi</span></NavLink>
        <NavLink to="/storico" className="nav-item"><History size={24} /><span>Storico</span></NavLink>
        <NavLink to="/timer" className="nav-item"><Timer size={24} /><span>Timer</span></NavLink>
        <NavLink to="/info" className="nav-item"><Info size={24} /><span>Info</span></NavLink>
      </nav>
    </div>
  );
};

const MainSwitcher: FC = () => {
  const { session, loading } = useAuth();
  if (loading) return <div className="loader-overlay"><div className="spinner"></div></div>;
  return session ? <AppContent /> : <Auth />;
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
