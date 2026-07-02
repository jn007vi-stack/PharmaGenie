import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserProfile, 
  CloudReport, 
  getAdminStatistics, 
  getAllUsers, 
  updateUserRole, 
  deleteUserAccount,
  AdminStats
} from '../firebase/firestore';
import { 
  Users, 
  FileSpreadsheet, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  Loader2, 
  Check, 
  Trash2, 
  Edit3, 
  Dna, 
  ShieldCheck, 
  Search, 
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

export default function AdminDashboard() {
  const { role, currentUser } = useAuth();
  const { success, warning, info } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [userDeleting, setUserDeleting] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsData = await getAdminStatistics();
      setStats(statsData);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to retrieve admin dashboard records:', err);
      warning('Failed to synchronize SaaS admin records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'Administrator') {
      fetchAdminData();
    }
  }, [role]);

  if (role !== 'Administrator') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md mx-auto my-12 shadow-md">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Access Denied</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">
          Your account is registered as a <span className="text-teal-600 dark:text-teal-400">{role}</span> profile. Only users with the <span className="text-indigo-600 dark:text-indigo-400">Administrator</span> clearance tier can launch this portal.
        </p>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
    if (userId === currentUser?.uid) {
      warning('You cannot modify your own administrative role credentials.');
      return;
    }
    setRoleUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      success('User clearance role successfully updated in Firestore.');
      setUsers((prev) => 
        prev.map((u) => u.uid === userId ? { ...u, role: newRole } : u)
      );
      // Refresh Stats
      const updatedStats = await getAdminStatistics();
      setStats(updatedStats);
    } catch (err) {
      warning('Failed to alter user clearance.');
    } finally {
      setRoleUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.uid) {
      warning('You cannot purge your active account credentials.');
      return;
    }
    if (!window.confirm('Are you absolutely sure you want to delete this clinical practitioner account? This action is permanent and irreversible.')) {
      return;
    }
    setUserDeleting(userId);
    try {
      await deleteUserAccount(userId);
      success('Clinician account purged successfully.');
      setUsers((prev) => prev.filter((u) => u.uid !== userId));
      const updatedStats = await getAdminStatistics();
      setStats(updatedStats);
    } catch (err) {
      warning('Error purging selected clinician profile.');
    } finally {
      setUserDeleting(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.institution.toLowerCase().includes(q) ||
      u.country.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6" id="admin-management-console">
      
      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            SaaS Platform Command Console
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
            Real-time analytics, user database audits, role configurations, and query telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminData}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-3xs"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span>Refresh Console</span>
        </button>
      </div>

      {loading && !stats ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <span className="text-xs font-semibold">Compiling real-time dashboard data stream...</span>
        </div>
      ) : (
        <>
          {/* Key Indicators Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Metric 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Registered Clinicians</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-display block mt-1">{stats?.totalUsers}</span>
                <span className="text-[9px] text-slate-400 font-bold">Total verified accounts</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Reports Created</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-display block mt-1">{stats?.totalReports}</span>
                <span className="text-[9px] text-slate-400 font-bold">Synchronized clinical trials</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Active Monthly Users</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-display block mt-1">{stats?.activeUsers}</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  Highly active clinical base
                </span>
              </div>
            </div>
          </div>

          {/* Visual Analysis Progress / Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Queried Drugs Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Top Queried Therapeutic Drugs
              </span>

              {stats?.drugQueries.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">No query telemetry registered yet.</div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {stats?.drugQueries.map((item, idx) => {
                    const maxVal = Math.max(...(stats?.drugQueries.map(d => d.count) || [1]));
                    const pct = Math.max(8, Math.round((item.count / maxVal) * 100));
                    return (
                      <div key={item.name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-slate-800 dark:text-slate-200 font-mono">{idx + 1}. {item.name}</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{item.count} Queries</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/30 dark:border-slate-800/30">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Queried Genes Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                <Dna className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Top Queried Genetic Factors
              </span>

              {stats?.geneQueries.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">No genetic factors registered.</div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {stats?.geneQueries.map((item, idx) => {
                    const maxVal = Math.max(...(stats?.geneQueries.map(g => g.count) || [1]));
                    const pct = Math.max(8, Math.round((item.count / maxVal) * 100));
                    return (
                      <div key={item.name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-slate-800 dark:text-slate-200 font-mono">{idx + 1}. {item.name}</span>
                          <span className="text-teal-600 dark:text-teal-400">{item.count} Queries</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/30 dark:border-slate-800/30">
                          <div 
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* User Directory Control Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-3xs overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display block">Practitioner Directory Control</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Audit registrations, grant clearanced roles, or delete inactive user accounts.</span>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter clinicians..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-950/60 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="px-5 py-3">Practitioner Details</th>
                    <th className="px-5 py-3">Jurisdiction / Inst.</th>
                    <th className="px-5 py-3">Account Created</th>
                    <th className="px-5 py-3">Clearance Level</th>
                    <th className="px-5 py-3 text-right">Console Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-slate-400 font-semibold">
                        No practitioner accounts matched the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-xs transition-colors duration-150">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border border-teal-500/20 bg-slate-100 dark:bg-slate-950 shrink-0 overflow-hidden flex items-center justify-center">
                              <img referrerPolicy="no-referrer" src={u.profilePhoto} alt={u.fullName} className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-850 dark:text-slate-150">{u.fullName}</span>
                              <span className="text-[10px] text-slate-400 font-semibold font-mono">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-col text-[11px] font-semibold">
                            <span className="text-slate-700 dark:text-slate-350">{u.institution !== 'None' ? u.institution : 'N/A'}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{u.country !== 'None' ? u.country : 'Unknown Country'}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-450 font-mono">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5">
                          {u.uid === currentUser?.uid ? (
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40 rounded-full border border-indigo-200/50">
                              Active Admin
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              disabled={roleUpdating === u.uid}
                              onChange={(e) => handleRoleChange(u.uid, e.target.value as any)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-750 dark:text-slate-250 rounded-lg px-2 py-1 outline-hidden cursor-pointer"
                            >
                              <option value="Student">Student</option>
                              <option value="Researcher">Researcher</option>
                              <option value="Clinician">Clinician</option>
                              <option value="Administrator">Administrator</option>
                            </select>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.uid !== currentUser?.uid && (
                              <button
                                type="button"
                                disabled={userDeleting === u.uid}
                                onClick={() => handleDeleteUser(u.uid)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-150 text-rose-600 rounded-lg border border-rose-200/20 transition-all cursor-pointer hover:scale-105"
                                title="Purge account completely"
                              >
                                {userDeleting === u.uid ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
