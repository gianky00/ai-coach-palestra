import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Activity, Dumbbell, HeartPulse, Watch } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

import { profileService } from '../../services/profileService';
import { useAuth } from '../auth/AuthProvider';

export const OnboardingView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    height: '',
    birth_year: '',
    biological_sex: '',
    experience_level: '',
    primary_goal: '',
    training_days_per_week: '',
    injuries_notes: '',
    gym_equipment: '',
    garmin_connected: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      await profileService.saveSettings(user.id, {
        height: formData.height ? parseFloat(formData.height) : null,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        biological_sex: formData.biological_sex,
        experience_level: formData.experience_level,
        primary_goal: formData.primary_goal,
        training_days_per_week: formData.training_days_per_week ? parseInt(formData.training_days_per_week) : null,
        injuries_notes: formData.injuries_notes,
        gym_equipment: formData.gym_equipment,
        garmin_connected: formData.garmin_connected,
        onboarding_completed: true,
      });
      toast.success('Profilo completato! Iniziamo.');
      onComplete();
    } catch (error) {
      console.error(error);
      toast.error('Errore durante il salvataggio.');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Activity size={48} color="var(--accent)" style={{ marginBottom: 20 }} />
            <h2>Benvenuto in KineFit AI</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>
              Per creare il tuo programma perfetto, l'AI ha bisogno di conoscerti meglio. 
              Rispondi a qualche veloce domanda per calibrare i tuoi allenamenti.
            </p>
          </motion.div>
        );
      case 2:
        return (
          <motion.div className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2>Dati Biometrici</h2>
            <div className="form-group">
              <label>Altezza (cm)</label>
              <input type="number" value={formData.height} onChange={(e) => handleChange('height', e.target.value)} placeholder="es. 180" className="glass-input" />
            </div>
            <div className="form-group">
              <label>Anno di Nascita</label>
              <input type="number" value={formData.birth_year} onChange={(e) => handleChange('birth_year', e.target.value)} placeholder="es. 1990" className="glass-input" />
            </div>
            <div className="form-group">
              <label>Sesso Biologico</label>
              <select value={formData.biological_sex} onChange={(e) => handleChange('biological_sex', e.target.value)} className="glass-input">
                <option value="">Seleziona...</option>
                <option value="M">Uomo</option>
                <option value="F">Donna</option>
              </select>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Dumbbell size={48} color="var(--accent)" style={{ marginBottom: 20 }} />
            <h2>Esperienza & Obiettivi</h2>
            <div className="form-group">
              <label>Livello di Esperienza</label>
              <select value={formData.experience_level} onChange={(e) => handleChange('experience_level', e.target.value)} className="glass-input">
                <option value="">Seleziona...</option>
                <option value="beginner">Neofita (0-6 mesi)</option>
                <option value="intermediate">Intermedio (6 mesi - 3 anni)</option>
                <option value="advanced">Avanzato (3+ anni)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Obiettivo Primario</label>
              <select value={formData.primary_goal} onChange={(e) => handleChange('primary_goal', e.target.value)} className="glass-input">
                <option value="">Seleziona...</option>
                <option value="hypertrophy">Ipertrofia (Bodybuilding)</option>
                <option value="strength">Forza (Powerlifting)</option>
                <option value="fat_loss">Dimagrimento</option>
                <option value="maintenance">Mantenimento / Salute</option>
              </select>
            </div>
            <div className="form-group">
              <label>Giorni di allenamento a settimana</label>
              <input type="number" value={formData.training_days_per_week} onChange={(e) => handleChange('training_days_per_week', e.target.value)} min="1" max="7" placeholder="es. 4" className="glass-input" />
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <HeartPulse size={48} color="#ff4a4a" style={{ marginBottom: 20 }} />
            <h2>Salute & Setup</h2>
            <div className="form-group">
              <label>Infortuni o limitazioni fisiche</label>
              <textarea 
                value={formData.injuries_notes} 
                onChange={(e) => handleChange('injuries_notes', e.target.value)} 
                placeholder="es. Fastidio alla spalla destra durante la panca piana, ernia L5-S1..." 
                className="glass-input"
                style={{ height: '100px', resize: 'none' }}
              />
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '5px' }}>
                L'AI userà queste info per evitare esercizi pericolosi per te.
              </small>
            </div>
            <div className="form-group">
              <label>Attrezzatura disponibile</label>
              <select value={formData.gym_equipment} onChange={(e) => handleChange('gym_equipment', e.target.value)} className="glass-input">
                <option value="">Seleziona...</option>
                <option value="commercial">Palestra Completa</option>
                <option value="home_gym">Home Gym (Bilanciere, Rack, Panca)</option>
                <option value="dumbbells">Solo Manubri</option>
                <option value="bodyweight">Corpo Libero</option>
              </select>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Watch size={48} color="#007cc3" style={{ marginBottom: 20 }} />
            <h2>Wearables & Tracking</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              KineFit AI può usare i dati del tuo smartwatch per calibrare il recupero (HRV, Sleep Score, Stress).
            </p>
            <div className="setting-card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleChange('garmin_connected', !formData.garmin_connected)}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/25/Garmin_logo.svg" alt="Garmin" style={{ height: 16, filter: 'invert(1)' }} />
                  Connetti Garmin
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Sincronizza Vivoactive, Fenix, Forerunner, ecc.
                </p>
              </div>
              <div className={`toggle-switch ${formData.garmin_connected ? 'active' : ''}`} />
            </div>
            
            {formData.garmin_connected && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 20, padding: 15, background: 'rgba(0,124,195,0.1)', borderRadius: 12, border: '1px solid rgba(0,124,195,0.3)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#007cc3' }}>
                  Mock-up: La connessione OAuth ufficiale verrà implementata. Per ora, il tuo Vivoactive 5 è simulato come connesso.
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '30px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Progress Bar */}
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '30px', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            style={{ height: '100%', background: 'var(--accent)' }}
          />
        </div>

        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
          <button 
            className="glass-button" 
            onClick={handleBack} 
            disabled={step === 1}
            style={{ opacity: step === 1 ? 0.3 : 1 }}
          >
            <ChevronLeft size={20} /> Indietro
          </button>
          
          {step < totalSteps ? (
            <button className="primary-button" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Avanti <ChevronRight size={20} />
            </button>
          ) : (
            <button className="primary-button" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#000' }}>
              Completa <Check size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
