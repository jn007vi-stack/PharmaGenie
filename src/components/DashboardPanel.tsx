import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CloudReport, 
  getUserReports 
} from '../firebase/firestore';
import { 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  FileSpreadsheet, 
  User, 
  Dna, 
  Beaker,
  Loader2,
  Lock,
  Scale,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from './Toast';

interface DashboardPanelProps {
  onNavigate: (tab: string) => void;
  onLoadReport: (report: any) => void;
  refreshTrigger: number;
}

export default function DashboardPanel({ onNavigate, onLoadReport, refreshTrigger }: DashboardPanelProps) {
  const { userProfile, isGuest, currentUser, role, subscriptionTier, setUpgradeModalOpen } = useAuth();
  const { info } = useToast();
  
  const [reports, setReports] = useState<CloudReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const data = await getUserReports(
          currentUser.uid,
          localStorage.getItem('pharmagenie_session_id') || ''
        );
        setReports(data);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [currentUser, refreshTrigger]);

  const totalCount = reports.length;
  const highRiskCount = reports.filter((r) => r.riskLevel === 'High Risk').length;
  const cautionCount = reports.filter((r) => r.riskLevel === 'Caution').length;
  const lowRiskCount = reports.filter((r) => r.riskLevel === 'Low Risk').length;

  const lastLoginFormatted = userProfile?.lastLogin 
    ? new Date(userProfile.lastLogin).toLocaleString() 
    : 'Just now';

  const recentReports = reports.slice(0, 4);

  return (
    <div className="flex flex-col gap-6" id="dashboard-saas-panel">
      
      {/* Welcome Hero Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-slate-850 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        {/* Decorative ambient visual element */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-teal-500/35 bg-slate-800 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-md">
              <img referrerPolicy="no-referrer" src={userProfile?.profilePhoto} alt="User Avatar" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] bg-teal-500/15 text-teal-300 font-black px-2.5 py-0.5 rounded-full border border-teal-500/20 uppercase tracking-wider">
                  {role} account
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  subscriptionTier === 'enterprise'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35 shadow-sm shadow-indigo-500/10'
                    : subscriptionTier === 'pro'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/35 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-800 text-slate-350 border-slate-700'
                }`} id="subscription-badge-dashboard">
                  {subscriptionTier === 'enterprise' ? 'ENTERPRISE' : subscriptionTier === 'pro' ? 'PRO' : 'FREE'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1.5 font-display tracking-tight text-white">
                Welcome back, {userProfile?.fullName || 'Physician Specialist'}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {userProfile?.institution !== 'None' ? userProfile?.institution : 'PharmaGenie Clinical Workspace'} • {userProfile?.country !== 'None' ? userProfile?.country : 'Sandbox Server'}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-750 p-3 rounded-2xl text-right shrink-0">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-teal-400" />
              Last Signed In
            </span>
            <span className="text-xs text-slate-200 font-semibold font-mono block mt-1">
              {lastLoginFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics & Counters Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sync Reports */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Reports</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100 font-display tracking-tight">{totalCount}</span>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1">Active synchronized records</p>
          </div>
        </div>

        {/* High Risk Cases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">High Risk Cases</span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-display tracking-tight">{highRiskCount}</span>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1">Requires drug modification</p>
          </div>
        </div>

        {/* Medium Risk Caution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Medium Risk</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-amber-500 dark:text-amber-400 font-display tracking-tight">{cautionCount}</span>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1">Dose calibration warning</p>
          </div>
        </div>

        {/* Low Risk Safety */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Low Risk</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-display tracking-tight">{lowRiskCount}</span>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1">Standard clinical safety</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column - Recent Activity & History preview */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Recent Clinical Activity
              </span>
              <button
                onClick={() => onNavigate('History')}
                className="text-[10px] font-black text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600 dark:text-teal-400" />
                <span>Loading active history logs...</span>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">No logs compiled yet.</span>
                <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                  Reports generated in the workbench will appear here for synchronization.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 flex-1">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => {
                      onLoadReport(report);
                      onNavigate('Reports');
                      info(`Loaded report for Patient ${report.patientId} into active workspace.`);
                    }}
                    className="p-3 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-teal-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        {report.patientId.substring(0, 5)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Beaker className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          {report.drug}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold font-mono">
                          {report.gene} • {report.phenotype}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${
                        report.riskLevel === 'High Risk' 
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' 
                          : report.riskLevel === 'Caution'
                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                      }`}>
                        {report.riskLevel}
                      </span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold font-mono mt-1">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Tool Permissions */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs flex flex-col h-full justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Quick Clinical Actions
              </span>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Action 1 */}
                <button
                  onClick={() => onNavigate('Reports')}
                  className="p-3 text-left bg-slate-50/50 dark:bg-slate-950/30 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-950 hover:border-teal-200/50 dark:hover:border-teal-900/60 border border-slate-200/50 dark:border-slate-800 rounded-xl cursor-pointer transition-all flex items-start gap-3 shadow-3xs"
                >
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-teal-600 dark:text-teal-400 shrink-0">
                    <Dna className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Generate New PGx Assessment</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 block leading-tight mt-0.5">Use active clinical datasets and Gemini engine to evaluate metabolisms.</span>
                  </div>
                </button>

                {/* Action 2 */}
                <button
                  onClick={() => onNavigate('Profile')}
                  className="p-3 text-left bg-slate-50/50 dark:bg-slate-950/30 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-950 hover:border-teal-200/50 dark:hover:border-teal-900/60 border border-slate-200/50 dark:border-slate-800 rounded-xl cursor-pointer transition-all flex items-start gap-3 shadow-3xs"
                >
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-teal-600 dark:text-teal-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Manage Physician Profile</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 block leading-tight mt-0.5">Edit institution affiliation, country, theme preference, and password credentials.</span>
                  </div>
                </button>

                {/* Action 3 (Administrator only) */}
                {role === 'Administrator' && (
                  <button
                    onClick={() => onNavigate('Admin')}
                    className="p-3 text-left bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-200 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl cursor-pointer transition-all flex items-start gap-3 shadow-3xs"
                  >
                    <div className="p-2 bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Activity className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-350 block">Launch Administrator Console</span>
                      <span className="text-[10px] text-indigo-550 dark:text-indigo-450 block leading-tight mt-0.5">Analyze SaaS statistics, alter user roles, delete accounts, and audit databases.</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Premium Feature Hub */}
            <div className="mt-4 p-4 bg-gradient-to-br from-teal-50/25 to-indigo-50/20 dark:from-teal-950/10 dark:to-indigo-950/5 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider block mb-3">
                Premium Suite Feature Lock
              </span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'AI Clinical Assistant', icon: Sparkles, active: subscriptionTier !== 'free' },
                  { name: 'Unlimited Reports', icon: Layers, active: subscriptionTier !== 'free' },
                  { name: 'Advanced Comparison', icon: Scale, active: subscriptionTier !== 'free' },
                  { name: 'Team Collaboration', icon: Users, active: subscriptionTier !== 'free' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (!item.active) {
                          setUpgradeModalOpen(true);
                        } else {
                          info(`${item.name} is fully unlocked and ready in your active session.`);
                        }
                      }}
                      className="p-2.5 text-left bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-teal-200 dark:hover:border-teal-900 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg text-teal-600 dark:text-teal-400">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      
                      {item.active ? (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                          Unlocked
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>Locked</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Roles Info Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-4">
              <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Role Privileges:</strong>
              • Student: workbench access, saving reports.<br />
              • Researcher: Student + dataset exports.<br />
              • Clinician: Researcher + advanced therapeutic tools.<br />
              • Administrator: full platform control.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
