
import React, { useState, useEffect } from 'react';
import { User, Organization, LegalCase } from '../types';
import { getOrganizationById, getUsers, addMemberToOrganization, getCases, createOrganizationForUser } from '../services/db';
import { Users, Building2, Plus, UserPlus, FolderOpen, Mail, Shield, Trash2, Search, ArrowRight } from 'lucide-react';

interface TeamDashboardProps {
  user: User;
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ user }) => {
  const [org, setOrg] = useState<Organization | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'SHARED'>('MEMBERS');
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [sharedCases, setSharedCases] = useState<LegalCase[]>([]);
  
  // Invite State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');

  // Create Firm State
  const [newFirmName, setNewFirmName] = useState('');

  useEffect(() => {
    if (user.organizationId) {
      const organization = getOrganizationById(user.organizationId);
      setOrg(organization);
      
      if (organization) {
        // Load Members
        const allUsers = getUsers();
        const members = allUsers.filter(u => organization.members.includes(u.id));
        setTeamMembers(members);

        // Load Shared Cases
        const allCases = getCases();
        const shared = allCases.filter(c => organization.sharedCaseIds?.includes(c.id));
        setSharedCases(shared);
      }
    }
  }, [user]);

  const handleCreateFirm = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newFirmName) return;
      
      // Call service to create org and update user
      const updatedUser = createOrganizationForUser(user, newFirmName);
      
      // Update local state by forcing a reload (simplest way to propagate user change up app tree would be better, but we rely on local storage sync in services/db)
      // Since App.tsx holds 'user', we ideally need to trigger an update there. 
      // For this interaction, we'll reload the page to refresh the user session.
      window.location.reload(); 
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    
    setInviteStatus('Adding...');
    const result = addMemberToOrganization(org.id, inviteName, inviteEmail);
    
    if (result.success) {
      setInviteStatus('Success!');
      setInviteName('');
      setInviteEmail('');
      // Refresh list
      const organization = getOrganizationById(org.id);
      if (organization) {
         setOrg(organization);
         const allUsers = getUsers();
         setTeamMembers(allUsers.filter(u => organization.members.includes(u.id)));
      }
    } else {
      setInviteStatus(result.msg || 'Error');
    }
  };

  if (!org) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
         <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
             <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-slate-400" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Law Firm</h2>
             <p className="text-gray-500 mb-8">
                 Upgrade your individual account to a Firm account to invite colleagues and share research.
             </p>
             
             <form onSubmit={handleCreateFirm} className="space-y-4">
                 <div>
                     <label className="block text-left text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Firm Name</label>
                     <input 
                        type="text" 
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-gold-500 outline-none"
                        placeholder="e.g. Myanmar Legal Associates"
                        value={newFirmName}
                        onChange={e => setNewFirmName(e.target.value)}
                     />
                 </div>
                 <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
                 >
                    Create Organization <ArrowRight className="w-4 h-4" />
                 </button>
             </form>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Team Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-slate-900 text-gold-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8" />
               </div>
               <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900">{org.name}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                     <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {teamMembers.length} / {org.maxSeats} Seats</span>
                     <span className="bg-gold-100 text-gold-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{org.plan.replace('_', ' ')}</span>
                  </div>
               </div>
            </div>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
               <button 
                  onClick={() => setActiveTab('MEMBERS')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'MEMBERS' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  Team Members
               </button>
               <button 
                  onClick={() => setActiveTab('SHARED')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'SHARED' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  Shared Library
               </button>
            </div>
         </div>
      </div>

      {activeTab === 'MEMBERS' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Members List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Active Lawyers</h3>
               </div>
               <div className="divide-y divide-gray-100">
                  {teamMembers.map(member => (
                     <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                              {member.name.charAt(0)}
                           </div>
                           <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                 {member.name}
                                 {member.id === org.adminUserId && <Shield className="w-3 h-3 text-gold-500" />}
                              </div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                           </div>
                        </div>
                        {member.id !== org.adminUserId && (
                            <button className="text-gray-300 hover:text-red-500 p-2">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                     </div>
                  ))}
               </div>
            </div>

            {/* Invite Form */}
            <div className="lg:col-span-1">
               <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 text-white">
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                     <UserPlus className="w-5 h-5 text-gold-500" /> Invite Colleague
                  </h3>
                  <p className="text-slate-400 text-xs mb-6">Add a new lawyer to your firm's workspace.</p>
                  
                  <form onSubmit={handleInvite} className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Full Name</label>
                        <input 
                           type="text" 
                           required
                           value={inviteName}
                           onChange={(e) => setInviteName(e.target.value)}
                           className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-gold-500 outline-none"
                           placeholder="U Mya"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Email Address</label>
                        <input 
                           type="email" 
                           required
                           value={inviteEmail}
                           onChange={(e) => setInviteEmail(e.target.value)}
                           className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-gold-500 outline-none"
                           placeholder="lawyer@firm.com"
                        />
                     </div>
                     
                     <button type="submit" className="w-full bg-gold-500 text-slate-900 font-bold py-2 rounded hover:bg-gold-400 transition mt-2">
                        Send Invitation
                     </button>
                     {inviteStatus && <p className="text-center text-xs mt-2 text-gold-400">{inviteStatus}</p>}
                  </form>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'SHARED' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div>
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                     <FolderOpen className="w-5 h-5 text-gold-500" /> Firm Research Library
                  </h3>
                  <p className="text-sm text-gray-500">Cases pinned by team members for collective reference.</p>
               </div>
               <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search shared cases..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gold-500 outline-none w-64" />
               </div>
            </div>
            
            <div className="divide-y divide-gray-100">
               {sharedCases.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                     <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p>No cases have been shared with the firm yet.</p>
                     <p className="text-xs mt-1">Use the "Share with Team" button on any case detail page.</p>
                  </div>
               ) : (
                  sharedCases.map(c => (
                     <div key={c.id} className="p-6 hover:bg-gray-50 transition group">
                        <div className="flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="bg-slate-100 text-slate-600 text-xs font-mono px-2 py-0.5 rounded">{c.citation}</span>
                                 <span className="text-xs font-bold uppercase text-gold-600 tracking-wider">{c.caseType}</span>
                              </div>
                              <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-900 font-myanmar">{c.caseName}</h4>
                              <p className="text-gray-500 text-sm mt-1 line-clamp-2 font-myanmar">{c.summary}</p>
                           </div>
                           <button className="text-xs font-bold text-slate-400 hover:text-slate-900 border border-gray-200 px-3 py-1 rounded hover:bg-white transition">
                              View Case
                           </button>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      )}
    </div>
  );
};
