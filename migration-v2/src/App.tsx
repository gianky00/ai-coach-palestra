import React, { useState, useEffect } from 'react';
import { Activity, Weight, Calendar, Plus, CheckCircle2, History, Timer, Info, X, Dumbbell } from 'lucide-react';
import { supabase } from './lib/supabase';
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
  last?: number;
}

const DAYS = ['DOMENICA', 'LUNEDI', 'MARTEDI', 'MERCOLEDI', 'GIOVEDI', 'VENERDI', 'SABATO'];

// Sotto-componente Card per pulizia codice
const ExerciseCard: React.FC<{ ex: Exercise; onLog: () => void; isCompex?: boolean }> = ({ ex, onLog, isCompex }) => (
  <div className={`ex-card ${ex.completed ? 'completed' : ''} ${isCompex ? 'compex-card' : ''}`}>
    <div className="ex-main">
      <div className="ex-info">
        <span className="ex-group" style={{ color: isCompex ? '#00ccff' : 'var(--accent)' }}>
          {ex.muscle_group || (isCompex ? 'RECUPERO' : 'VARIE')}
        </span>
        <h3 className="ex-name">{ex.name}</h3>
        <p className="ex-target">Target: {ex.target_sets} serie • Last: {ex.last || '--'}kg</p>
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

const App: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEx, setShowAddEx] = useState(false);
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  
  // Form nuovi esercizi
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newDay, setNewDay] = useState(DAYS[new Date().getDay()]);

  // Log set
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('8');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setLoading(true);
    const oggi = DAYS[new Date().getDay()];
    
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('training_day', oggi)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Errore fetch:', error);
    } else {
      setExercises(data || []);
    }
    setLoading(false);
  };

  const gymExercises = exercises.filter(ex => ex.notes !== 'COMPEX');
  const compexExercises = exercises.filter(ex => ex.notes === 'COMPEX');
  const progresso = exercises.length > 0 ? (exercises.filter(ex => ex.completed).length / exercises.length) * 100 : 0;

  const handleAddExercise = async () => {
    if (!newName) return;
    
    const { error } = await supabase
      .from('exercises')
      .insert([{ 
        name: newName, 
        muscle_group: newGroup, 
        training_day: newDay,
        target_reps: '10',
        target_sets: 3,
        notes: 'PALESTRA'
      }]);

    if (!error) {
      setNewName('');
      setShowAddEx(false);
      fetchExercises();
    }
  };

  const handleSaveLog = async () => {
    if (!selectedEx) return;
    setExercises(prev => prev.map(ex => 
      ex.id === selectedEx.id ? { ...ex, completed: true, last: parseFloat(weight) } : ex
    ));
    setSelectedEx(null);
  };

  return (
    <div className="app-container">
      {loading && <div className="loader-overlay"><div className="spinner"></div></div>}

      <header className="header">
        <div className="date-info">
          <span className="subtitle">{DAYS[new Date().getDay()]} {new Date().toLocaleDateString('it-IT')}</span>
          <h1 className="title">AI COACH <span className="version">V2</span></h1>
        </div>
        <button className="add-main-btn" onClick={() => setShowAddEx(true)}>
          <Plus size={24} />
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Weight size={18} /></div>
          <div className="stat-info">
            <span className="stat-val">--</span>
            <span className="stat-label">Volume</span>
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
            <div className="section-header">
              <h2 className="section-title">Palestra</h2>
              <span className="count">{gymExercises.length}</span>
            </div>
            {gymExercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onLog={() => { setSelectedEx(ex); setWeight((ex.last||'').toString()); }} />
            ))}
          </>
        )}

        {compexExercises.length > 0 && (
          <>
            <div className="section-header" style={{ marginTop: '32px' }}>
              <h2 className="section-title" style={{ color: '#00ccff' }}>Compex</h2>
              <span className="count">{compexExercises.length}</span>
            </div>
            {compexExercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onLog={() => { setSelectedEx(ex); setWeight((ex.last||'').toString()); }} isCompex />
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
            <div className="modal-header">
              <h2 className="modal-title">Nuovo Esercizio</h2>
              <button className="close-btn" onClick={() => setShowAddEx(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>Nome Esercizio</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Es. Panca Piana" />
              </div>
              <div className="input-group">
                <label>Gruppo Muscolare</label>
                <input value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="Es. Petto" />
              </div>
              <div className="input-group">
                <label>Giorno Allenamento</label>
                <select value={newDay} onChange={e => setNewDay(e.target.value)} className="custom-select">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button className="save-btn" onClick={handleAddExercise}>Salva nel Catalogo</button>
            </div>
          </div>
        </div>
      )}

      {selectedEx && (
        <div className="modal-overlay" onClick={() => setSelectedEx(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedEx.name}</h2>
              <button className="close-btn" onClick={() => setSelectedEx(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>Peso (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} autoFocus />
              </div>
              <div className="input-group">
                <label>Sforzo (RPE 1-10)</label>
                <input type="number" value={rpe} onChange={e => setRpe(e.target.value)} />
              </div>
              <button className="save-btn" onClick={handleSaveLog}>Conferma Allenamento</button>
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

export default App;
