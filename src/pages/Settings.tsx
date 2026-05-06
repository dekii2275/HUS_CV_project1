import React from 'react';
import { Card } from '../components/UI/Card';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  Shield, 
  Database, 
  User, 
  Languages,
  Save,
  Check,
  X,
  Loader2,
  LogIn,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { signInWithGoogle, signOut } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

const LANGUAGES_MAP = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'vi-VN', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵' },
] as const;

import { 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { userData, updateUserData, isLoading: isSaving, currentUser, isAuthLoading } = useUser();
  
  const [notifications, setNotifications] = React.useState(true);
  const [showLangModal, setShowLangModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);
  
  const seedDemoData = async () => {
    if (!currentUser) {
      alert("Please sign in first to seed data.");
      return;
    }

    setIsSeeding(true);
    try {
      // Seed Incidents
      const incidents = [
        { type: 'Multi-Vehicle Collision', severity: 'Critical', location: 'I-95 North / Exit 22', status: 'Active', node: 'NODE_W11', operatorId: currentUser.uid, description: 'Multiple units dispatched. Two lanes blocked.', x: 45, y: 35 },
        { type: 'Stalled Vehicle', severity: 'Elevated', location: 'Bridge Tunnel Westbound', status: 'Resolved', node: 'NODE_C04', operatorId: currentUser.uid, description: 'Vehicles stalled due to fuel pump failure.', x: 72, y: 65 },
        { type: 'Road Debris', severity: 'Nominal', location: 'Route 66 / Mile 14', status: 'Resolved', node: 'NODE_E01', operatorId: currentUser.uid, description: 'Tire shreds reported in central lane.', x: 25, y: 80 }
      ];

      for (const inc of incidents) {
        await addDoc(collection(db, 'incidents'), {
          ...inc,
          timestamp: serverTimestamp()
        }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, 'incidents');
        });
      }

      // Seed Violations
      const violations = [
        { plate: 'ABC-1234', type: 'Speeding', location: 'I-95 N', confidence: 98.4, status: 'pending' },
        { plate: 'BV-9912-F', type: 'Red Light', location: 'Market 04', confidence: 94.2, status: 'approved' },
        { plate: 'NH-4421-P', type: 'Lane Drift', location: 'Bay Bridge', confidence: 88.7, status: 'rejected' }
      ];

      for (const v of violations) {
        await addDoc(collection(db, 'violations'), {
          ...v,
          timestamp: serverTimestamp()
        }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, 'violations');
        });
      }

      alert("Demo data seeded successfully.");
    } catch (error) {
      console.error("Seeding failed:", error);
      alert("Seeding failed. Check console for details.");
    } finally {
      setIsSeeding(false);
    }
  };
  
  // Temporary states for editing
  const [tempUsername, setTempUsername] = React.useState(userData.username);
  const [tempAvatarUrl, setTempAvatarUrl] = React.useState<string | null>(userData.avatarUrl);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    // If we click the avatar on the main settings page, it might still just trigger file upload
    // But per user request, we usually want these actions to go through the "Edit Profile" flow
    openEditModal();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (isEdit) {
          setTempAvatarUrl(result);
        } else {
          // Immediately update global state if edited directly
          updateUserData({ avatarUrl: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = () => {
    setTempUsername(userData.username);
    setTempAvatarUrl(userData.avatarUrl);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    await updateUserData({
      username: tempUsername,
      avatarUrl: tempAvatarUrl
    });
    setShowEditModal(false);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const currentLang = LANGUAGES_MAP.find(l => l.code === language) || LANGUAGES_MAP[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-text-primary uppercase tracking-[0.3em] font-mono italic">
          {t('settings.title')}
        </h1>
        <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Display Settings Card */}
          <Card 
            title={t('settings.display_config')} 
            subtitle={t('settings.display_subtitle')}
          >
            <div className="p-8 space-y-8 bg-surface">
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-widest mb-1">{t('settings.visual_theme')}</h3>
                    <p className="text-[9px] text-text-muted uppercase font-mono">{t('settings.theme_desc')}</p>
                  </div>
                  <div className="flex gap-2 p-1 bg-background-muted border border-border-subtle">
                    <ThemeOption 
                      active={theme === 'light'} 
                      onClick={() => setTheme('light')}
                      icon={<Sun size={14} />} 
                      label="Light" 
                    />
                    <ThemeOption 
                      active={theme === 'dark'} 
                      onClick={() => setTheme('dark')}
                      icon={<Moon size={14} />} 
                      label="Dark" 
                    />
                    <ThemeOption 
                      active={theme === 'system'} 
                      onClick={() => setTheme('system')}
                      icon={<Monitor size={14} />} 
                      label="System" 
                    />
                  </div>
                </div>
              </section>

              <div className="h-px bg-border-subtle" />

              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-widest mb-1">{t('settings.lang_selection')}</h3>
                    <p className="text-[9px] text-text-muted uppercase font-mono">{t('settings.lang_desc')}</p>
                  </div>
                  <button 
                    onClick={() => setShowLangModal(true)}
                    className="flex items-center gap-3 px-6 py-2 bg-background-muted border border-border-subtle hover:border-brand-primary/50 transition-all group"
                  >
                    <span className="text-lg">{currentLang.flag}</span>
                    <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-widest">{currentLang.label}</span>
                    <Languages size={14} className="text-text-muted group-hover:text-brand-primary" />
                  </button>
                </div>
              </section>

              <div className="h-px bg-border-subtle" />

              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-widest mb-1">{t('settings.grid_density')}</h3>
                    <p className="text-[9px] text-text-muted uppercase font-mono">{t('settings.grid_desc')}</p>
                  </div>
                  <select className="bg-background-muted border border-border-subtle text-[10px] font-mono text-text-muted px-3 py-1.5 outline-none focus:border-[#FF3E00]/50 transition-all uppercase tracking-widest cursor-pointer">
                    <option>{t('settings.grid.standard')}</option>
                    <option>{t('settings.grid.compact')}</option>
                    <option>{t('settings.grid.comfortable')}</option>
                  </select>
                </div>
              </section>
            </div>
          </Card>

          {/* Security & Access Card */}
          <Card 
            title={t('settings.security_title')} 
            subtitle={t('settings.security_subtitle')}
          >
            <div className="p-8 space-y-6 bg-surface">
              <SecurityItem 
                icon={<Shield size={14} />}
                title="Two-Factor Authentication"
                description="Secure account with secondary verification layer"
                enabled={true}
              />
              <SecurityItem 
                icon={<Database size={14} />}
                title="Data Retention Policy"
                description="Automatic purging of non-critical event logs"
                enabled={false}
              />
              <div className="h-px bg-border-subtle" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-widest mb-1">Demo Environmental Seeding</h3>
                  <p className="text-[9px] text-text-muted uppercase font-mono">Populate the cloud database with tactical sample data for evaluation.</p>
                </div>
                <button 
                  onClick={seedDemoData}
                  disabled={isSeeding || !currentUser}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-primary/10 border border-brand-primary/40 hover:bg-brand-primary/20 transition-all text-brand-primary disabled:opacity-50"
                >
                  {isSeeding ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                  <span className="text-[9px] font-bold uppercase tracking-widest">Execute Seeding</span>
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card title={t('settings.user_profile')} subtitle={t('settings.identified_operator')}>
            <div className="p-8 flex flex-col items-center text-center bg-surface">
              <div 
                onClick={handleAvatarClick}
                className="w-20 h-20 bg-background-muted border border-border-subtle flex items-center justify-center mb-4 relative group cursor-pointer overflow-hidden"
              >
                {userData.avatarUrl ? (
                  <img src={userData.avatarUrl} alt="Operator Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={32} className="text-text-muted group-hover:text-brand-primary transition-colors" />
                )}
                {currentUser && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">Update</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFileChange(e, false)} 
                accept="image/*" 
                className="hidden" 
              />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-1">{userData.username}</h3>
              <p className="text-[9px] text-text-muted font-mono uppercase">{t('topbar.unit')}</p>
              
              <div className="w-full mt-8 pt-8 border-t border-border-subtle space-y-3">
                {currentUser ? (
                  <>
                    <button 
                      onClick={openEditModal}
                      className="w-full bg-background-muted border border-border-subtle py-3 text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] hover:text-text-primary hover:border-zinc-500 transition-all font-mono"
                    >
                      {t('settings.edit_profile')}
                    </button>
                    <button 
                      onClick={() => signOut()}
                      className="w-full py-3 text-[9px] font-bold text-brand-primary uppercase tracking-[0.2em] hover:underline flex items-center justify-center gap-2"
                    >
                      <LogOut size={12} />
                      SIGN OUT
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleSignIn}
                    disabled={isAuthLoading}
                    className="w-full bg-brand-primary text-white py-4 text-[9px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-[0_5px_15px_rgba(255,62,0,0.2)] active:scale-95 disabled:opacity-50"
                  >
                    {isAuthLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                    {isAuthLoading ? 'INITIALIZING...' : 'SYNC WITH CLOUD'}
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Card title={t('settings.notifications')} subtitle={t('settings.alert_feed')}>
            <div className="p-8 space-y-4 bg-surface">
              <button 
                onClick={() => setNotifications(!notifications)}
                className={cn(
                  "w-full flex items-center justify-between p-4 border transition-all",
                  notifications ? "bg-background-muted border-brand-primary/30" : "bg-background-muted border-border-subtle"
                )}
              >
                <div className="flex items-center gap-3 text-left">
                  <Bell size={14} className={notifications ? "text-brand-primary" : "text-text-muted"} />
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest", notifications ? "text-text-primary" : "text-text-muted")}>{t('settings.system_alerts')}</span>
                </div>
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  notifications ? "bg-brand-primary shadow-[0_0_8px_var(--color-brand-primary)]" : "bg-zinc-800"
                )} />
              </button>
              
              <div className="flex items-center gap-2 text-text-muted font-mono text-[8px] uppercase tracking-widest px-2 opacity-50">
                <div className="w-1 h-1 bg-text-muted rotate-45" />
                Real-time WebSocket connection active
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-12 right-12 z-50">
        <button className="flex items-center gap-3 bg-[#FF3E00] text-black px-8 py-4 font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_10px_30px_rgba(255,62,0,0.3)] active:scale-95 group">
          <Save size={16} />
          {t('settings.save')}
        </button>
      </div>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {showLangModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLangModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface border border-brand-primary relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-text-primary uppercase tracking-[0.3em]">{t('settings.lang_selection')}</h2>
                  <p className="text-[9px] text-text-muted uppercase font-mono mt-1">{t('settings.lang_desc')}</p>
                </div>
                <button 
                  onClick={() => setShowLangModal(false)}
                  className="p-2 text-text-muted hover:text-brand-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {LANGUAGES_MAP.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setShowLangModal(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 transition-all group border",
                      language === lang.code 
                        ? "bg-brand-primary/5 border-brand-primary text-brand-primary" 
                        : "bg-background-muted/50 border-border-subtle text-text-muted hover:border-zinc-500 hover:text-text-primary"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500">{lang.flag}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{lang.label}</span>
                    </div>
                    {language === lang.code && <Check size={14} className="text-brand-primary" />}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-background-muted border-t border-border-subtle flex justify-end">
                <button 
                  onClick={() => setShowLangModal(false)}
                  className="px-6 py-2 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-lg bg-surface border border-brand-primary relative z-10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden"
            >
              {/* Tactical Header Decor */}
              <div className="h-1 bg-brand-primary w-full" />
              <div className="p-1 flex">
                <div className="h-1 bg-brand-primary/20 flex-1 ml-4" />
                <div className="h-1 bg-brand-primary w-12 ml-1" />
              </div>

              <div className="p-8 border-b border-border-subtle flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text-primary uppercase tracking-[0.4em] font-mono italic">EDIT OPERATOR MANIFEST</h2>
                  <p className="text-[9px] text-brand-primary uppercase font-mono mt-2 tracking-widest opacity-80">Access Level: Level 4 // ID Verification Required</p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-text-muted hover:text-brand-primary transition-colors border border-transparent hover:border-brand-primary/30"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 bg-zinc-950/30">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <div 
                      onClick={() => editFileInputRef.current?.click()}
                      className="w-24 h-24 bg-background-muted border border-border-subtle flex items-center justify-center relative cursor-pointer overflow-hidden transition-all hover:border-brand-primary"
                    >
                      {tempAvatarUrl ? (
                        <img src={tempAvatarUrl} alt="Temp Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-text-muted" />
                      )}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Update Image</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-primary rotate-45" />
                  </div>
                  <input 
                    type="file" 
                    ref={editFileInputRef} 
                    onChange={(e) => handleFileChange(e, true)} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                {/* Username Input */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-brand-primary rotate-45" />
                    Operator Callsign
                  </label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      className="w-full bg-background-muted border border-border-subtle px-5 py-4 text-xs font-mono text-text-primary uppercase tracking-widest outline-none focus:border-brand-primary transition-all pr-12"
                      placeholder="ENTER NEW CALLSIGN..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                      <User size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 bg-brand-primary text-black h-12 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all flex items-center justify-center gap-3 shadow-[0_5px_20px_rgba(255,62,0,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {isSaving ? 'SERIALIZING...' : 'SAVE CHANGES'}
                  </button>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 border border-border-subtle text-text-muted h-12 font-black text-[10px] uppercase tracking-[0.3em] hover:text-text-primary hover:border-zinc-500 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <X size={16} />
                    EXIT CANCEL
                  </button>
                </div>
              </div>

              {/* Bottom Tactical Bar */}
              <div className="p-4 bg-background-muted border-t border-border-subtle flex justify-center">
                 <div className="flex items-center gap-4 text-[7px] font-mono text-text-muted/40 uppercase tracking-widest">
                    <span>STATUS: READY</span>
                    <div className="w-1 h-1 bg-text-muted/20 rotate-45" />
                    <span>ENCRYPTION: AES-256</span>
                    <div className="w-1 h-1 bg-text-muted/20 rotate-45" />
                    <span>BUFFER: CLEARED</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeOption({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 transition-all",
        active 
          ? "bg-surface text-brand-primary" 
          : "text-text-muted hover:text-text-primary"
      )}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SecurityItem({ icon, title, description, enabled }: { icon: React.ReactNode, title: string, description: string, enabled: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-background-muted border border-border-subtle flex items-center justify-center group-hover:border-zinc-500 transition-all">
          <span className="text-text-muted group-hover:text-text-primary transition-colors">{icon}</span>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-widest mb-1">{title}</h4>
          <p className="text-[9px] text-text-muted uppercase font-mono">{description}</p>
        </div>
      </div>
      <div className={cn(
        "px-3 py-1 text-[8px] font-black uppercase tracking-widest border w-fit",
        enabled ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-background-muted border-border-subtle text-text-muted"
      )}>
        {enabled ? 'Verified' : 'Inactive'}
      </div>
    </div>
  );
}
