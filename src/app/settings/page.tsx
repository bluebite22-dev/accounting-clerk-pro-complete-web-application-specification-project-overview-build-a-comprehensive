"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar } from "@/components/ui/avatar";
import {
  User,
  Users,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Plus,
  Edit,
  Trash2,
  X,
  Mail,
  Send,
  Copy,
  Check,
  Clock,
} from "lucide-react";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "users", label: "Users", icon: Users },
  { id: "company", label: "Company", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "localization", label: "Localization", icon: Globe },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    timezone: "UTC",
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: "Acme Corporation",
    address: "123 Business St, Suite 100",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "United States",
    phone: "(555) 123-4567",
    email: "info@acmecorp.com",
    website: "www.acmecorp.com",
    taxId: "XX-XXXXXXX",
    fiscalYearStart: "January",
    currency: "USD",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailInvoiceReceived: true,
    emailPaymentDue: true,
    emailOverdueNotice: true,
    emailWeeklyReport: false,
    pushInvoiceReceived: true,
    pushPaymentDue: true,
    pushOverdueNotice: true,
    pushBudgetAlert: true,
  });

  // Security settings
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    sessionTimeout: "30",
  });

  // Users management state
  const [users, setUsers] = useState([
    { id: "1", firstName: "John", lastName: "Admin", email: "admin@company.com", role: "admin", isActive: true },
    { id: "2", firstName: "Sarah", lastName: "Accountant", email: "sarah@company.com", role: "accountant", isActive: true },
    { id: "3", firstName: "Mike", lastName: "Clerk", email: "mike@company.com", role: "clerk", isActive: true },
  ]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "clerk",
    password: "",
  });

  // Invitations state
  const [invitations, setInvitations] = useState([
    { id: "1", email: "newuser@company.com", role: "clerk", status: "pending", sentAt: "2024-01-15T10:30:00Z", expiresAt: "2024-01-22T10:30:00Z" },
    { id: "2", email: "another@company.com", role: "accountant", status: "accepted", sentAt: "2024-01-10T14:00:00Z", expiresAt: "2024-01-17T14:00:00Z" },
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "clerk", message: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInvitationTab, setShowInvitationTab] = useState(false);

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ firstName: "", lastName: "", email: "", role: "clerk", password: "" });
    setShowUserModal(true);
  };

  const handleEditUser = (user: typeof users[0]) => {
    setEditingUser(user);
    setUserForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, password: "" });
    setShowUserModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, role: userForm.role as any }
          : u
      ));
    } else {
      const newUser = {
        id: Date.now().toString(),
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        role: userForm.role as any,
        isActive: true,
      };
      setUsers([...users, newUser]);
    }
    setShowUserModal(false);
  };

  // Invitation handlers
  const handleSendInvitation = () => {
    if (!inviteForm.email) return;
    
    const newInvitation = {
      id: Date.now().toString(),
      email: inviteForm.email,
      role: inviteForm.role,
      status: "pending",
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setInvitations([newInvitation, ...invitations]);
    setInviteForm({ email: "", role: "clerk", message: "" });
    setShowInviteModal(false);
  };

  const handleResendInvitation = (id: string) => {
    setInvitations(invitations.map(inv => 
      inv.id === id 
        ? { ...inv, sentAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" }
        : inv
    ));
  };

  const handleCancelInvitation = (id: string) => {
    if (confirm("Are you sure you want to cancel this invitation?")) {
      setInvitations(invitations.filter(inv => inv.id !== id));
    }
  };

  const handleCopyInviteLink = (id: string) => {
    const link = `https://app.company.com/join/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-neutral-400">Manage your account and application preferences</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar navigation */}
          <div className="lg:w-64 shrink-0">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {settingsSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? "bg-blue-600/20 text-blue-400"
                          : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                      }`}
                    >
                      <section.icon className="h-5 w-5" />
                      {section.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content area */}
          <div className="flex-1">
            {activeSection === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar name={`${profileForm.firstName} ${profileForm.lastName}`} size="lg" />
                    <div>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                      <p className="mt-1 text-xs text-neutral-500">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">First Name</label>
                      <Input
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Last Name</label>
                      <Input
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Email</label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Phone</label>
                      <Input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-neutral-200">Timezone</label>
                      <select
                        className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={profileForm.timezone}
                        onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "users" && (
              <div className="space-y-6">
                {/* Users Tab Toggle */}
                <div className="flex gap-2 border-b border-neutral-800 pb-2">
                  <button
                    onClick={() => setShowInvitationTab(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !showInvitationTab
                        ? "bg-blue-600 text-white"
                        : "text-neutral-400 hover:text-neutral-100"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Users ({users.length})
                  </button>
                  <button
                    onClick={() => setShowInvitationTab(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showInvitationTab
                        ? "bg-blue-600 text-white"
                        : "text-neutral-400 hover:text-neutral-100"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    Invitations ({invitations.filter(i => i.status === "pending").length})
                  </button>
                </div>

                {!showInvitationTab ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Manage users and their access permissions</CardDescription>
                      </div>
                      <Button onClick={handleAddUser}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-neutral-800">
                              <th className="pb-3 text-left text-sm font-medium text-neutral-400">User</th>
                              <th className="pb-3 text-left text-sm font-medium text-neutral-400">Email</th>
                              <th className="pb-3 text-left text-sm font-medium text-neutral-400">Role</th>
                              <th className="pb-3 text-left text-sm font-medium text-neutral-400">Status</th>
                              <th className="pb-3 text-right text-sm font-medium text-neutral-400">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user.id} className="border-b border-neutral-800/50">
                                <td className="py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                                    <span className="font-medium text-neutral-100">{user.firstName} {user.lastName}</span>
                                  </div>
                                </td>
                                <td className="py-4 text-neutral-400">{user.email}</td>
                                <td className="py-4">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    user.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                                    user.role === "accountant" ? "bg-blue-500/20 text-blue-400" :
                                    user.role === "auditor" ? "bg-green-500/20 text-green-400" :
                                    "bg-neutral-500/20 text-neutral-400"
                                  }`}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    user.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                  }`}>
                                    {user.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>User Invitations</CardTitle>
                        <CardDescription>Invite new users via email</CardDescription>
                      </div>
                      <Button onClick={() => setShowInviteModal(true)}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invitation
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {invitations.length === 0 ? (
                        <div className="text-center py-8 text-neutral-400">
                          <Mail className="h-12 w-12 mx-auto mb-4 text-neutral-600" />
                          <p>No invitations sent yet</p>
                          <p className="text-sm mt-1">Send invitations to add new users to your organization</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-neutral-800">
                                <th className="pb-3 text-left text-sm font-medium text-neutral-400">Email</th>
                                <th className="pb-3 text-left text-sm font-medium text-neutral-400">Role</th>
                                <th className="pb-3 text-left text-sm font-medium text-neutral-400">Status</th>
                                <th className="pb-3 text-left text-sm font-medium text-neutral-400">Sent</th>
                                <th className="pb-3 text-left text-sm font-medium text-neutral-400">Expires</th>
                                <th className="pb-3 text-right text-sm font-medium text-neutral-400">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invitations.map((invitation) => (
                                <tr key={invitation.id} className="border-b border-neutral-800/50">
                                  <td className="py-4 text-white">{invitation.email}</td>
                                  <td className="py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                      invitation.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                                      invitation.role === "accountant" ? "bg-blue-500/20 text-blue-400" :
                                      invitation.role === "auditor" ? "bg-green-500/20 text-green-400" :
                                      "bg-neutral-500/20 text-neutral-400"
                                    }`}>
                                      {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                      invitation.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                      invitation.status === "accepted" ? "bg-green-500/20 text-green-400" :
                                      "bg-red-500/20 text-red-400"
                                    }`}>
                                      {invitation.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                      {invitation.status === "accepted" && <Check className="h-3 w-3 mr-1" />}
                                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="py-4 text-neutral-400">{formatDate(invitation.sentAt)}</td>
                                  <td className="py-4 text-neutral-400">{formatDate(invitation.expiresAt)}</td>
                                  <td className="py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      {invitation.status === "pending" && (
                                        <>
                                          <Button variant="ghost" size="sm" onClick={() => handleCopyInviteLink(invitation.id)}>
                                            {copiedId === invitation.id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                          </Button>
                                          <Button variant="ghost" size="sm" onClick={() => handleResendInvitation(invitation.id)}>
                                            <Send className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleCancelInvitation(invitation.id)}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeSection === "company" && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Settings</CardTitle>
                  <CardDescription>Manage your company information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-neutral-200">Company Name</label>
                      <Input
                        value={companyForm.name}
                        onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-neutral-200">Address</label>
                      <Input
                        value={companyForm.address}
                        onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">City</label>
                      <Input
                        value={companyForm.city}
                        onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-200">State</label>
                        <Input
                          value={companyForm.state}
                          onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-200">ZIP</label>
                        <Input
                          value={companyForm.zip}
                          onChange={(e) => setCompanyForm({ ...companyForm, zip: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Phone</label>
                      <Input
                        value={companyForm.phone}
                        onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Email</label>
                      <Input
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Website</label>
                      <Input
                        value={companyForm.website}
                        onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Tax ID</label>
                      <Input
                        value={companyForm.taxId}
                        onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Fiscal Year Start</label>
                      <select
                        className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={companyForm.fiscalYearStart}
                        onChange={(e) => setCompanyForm({ ...companyForm, fiscalYearStart: e.target.value })}
                      >
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Currency</label>
                      <select
                        className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={companyForm.currency}
                        onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="mb-4 text-sm font-medium text-neutral-200">Email Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { key: "emailInvoiceReceived", label: "Invoice received", description: "Get notified when a new invoice is received" },
                        { key: "emailPaymentDue", label: "Payment due reminder", description: "Remind before payment due dates" },
                        { key: "emailOverdueNotice", label: "Overdue notices", description: "Get notified about overdue payments" },
                        { key: "emailWeeklyReport", label: "Weekly summary", description: "Receive a weekly financial summary" },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between rounded-lg border border-neutral-800 p-4">
                          <div>
                            <p className="text-sm font-medium text-neutral-100">{item.label}</p>
                            <p className="text-xs text-neutral-500">{item.description}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-4 text-sm font-medium text-neutral-200">Push Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { key: "pushInvoiceReceived", label: "Invoice received" },
                        { key: "pushPaymentDue", label: "Payment due reminder" },
                        { key: "pushOverdueNotice", label: "Overdue notices" },
                        { key: "pushBudgetAlert", label: "Budget alerts" },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between rounded-lg border border-neutral-800 p-4">
                          <p className="text-sm font-medium text-neutral-100">{item.label}</p>
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Current Password</label>
                      <Input
                        type="password"
                        value={securityForm.currentPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">New Password</label>
                      <Input
                        type="password"
                        value={securityForm.newPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Confirm New Password</label>
                      <Input
                        type="password"
                        value={securityForm.confirmPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-neutral-800 p-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-100">Two-Factor Authentication</p>
                      <p className="text-xs text-neutral-500">Add an extra layer of security</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={securityForm.twoFactorEnabled}
                      onChange={(e) => setSecurityForm({ ...securityForm, twoFactorEnabled: e.target.checked })}
                      className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-200">Session Timeout (minutes)</label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={securityForm.sessionTimeout}
                      onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeout: e.target.value })}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="240">4 hours</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="mb-4 text-sm font-medium text-neutral-200">Theme</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <button className="rounded-lg border-2 border-blue-500 bg-neutral-900 p-4 text-center">
                        <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-neutral-800" />
                        <p className="text-sm text-neutral-100">Dark</p>
                      </button>
                      <button className="rounded-lg border border-neutral-700 bg-white p-4 text-center">
                        <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-neutral-200" />
                        <p className="text-sm text-neutral-900">Light</p>
                      </button>
                      <button className="rounded-lg border border-neutral-700 bg-gradient-to-b from-white to-neutral-900 p-4 text-center">
                        <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-b from-neutral-200 to-neutral-800" />
                        <p className="text-sm text-neutral-100">System</p>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "localization" && (
              <Card>
                <CardHeader>
                  <CardTitle>Localization Settings</CardTitle>
                  <CardDescription>Set your regional preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Language</label>
                      <select className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="en">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Date Format</label>
                      <select className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Time Format</label>
                      <select className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="12h">12-hour (AM/PM)</option>
                        <option value="24h">24-hour</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">Number Format</label>
                      <select className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="1,000.00">1,000.00</option>
                        <option value="1.000,00">1.000,00</option>
                        <option value="1 000,00">1 000,00</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Success toast */}
        {saved && (
          <div className="fixed bottom-4 right-4 rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg">
            Settings saved successfully!
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {editingUser ? "Edit User" : "Add New User"}
                </h2>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-200">First Name</label>
                    <Input
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-200">Last Name</label>
                    <Input
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-200">Email</label>
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-200">Role</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="admin">Admin - Full access to all features</option>
                    <option value="accountant">Accountant - Manage finances and reports</option>
                    <option value="clerk">Clerk - Basic data entry access</option>
                    <option value="auditor">Auditor - View and review access</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>
                
                {!editingUser && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-200">Password</label>
                    <Input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>
                  {editingUser ? "Update User" : "Add User"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Send Invitation Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md border border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Send User Invitation</h3>
                <button onClick={() => setShowInviteModal(false)} className="text-neutral-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-200">Email Address</label>
                  <Input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="user@company.com"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-neutral-200">Role</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  >
                    <option value="admin">Admin - Full access to all features</option>
                    <option value="accountant">Accountant - Manage finances and reports</option>
                    <option value="clerk">Clerk - Basic data entry access</option>
                    <option value="auditor">Auditor - View and review access</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-neutral-200">Personal Message (Optional)</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    placeholder="Add a personal message to the invitation..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendInvitation}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
