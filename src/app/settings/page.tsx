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
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
} from "lucide-react";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
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
                  <div>
                    <h4 className="mb-4 text-sm font-medium text-neutral-200">Change Password</h4>
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
                  </div>

                  <div className="rounded-lg border border-neutral-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-100">Two-Factor Authentication</p>
                        <p className="text-xs text-neutral-500">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline" size="sm">
                        {securityForm.twoFactorEnabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-200">Session Timeout (minutes)</label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-48"
                      value={securityForm.sessionTimeout}
                      onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeout: e.target.value })}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="0">Never</option>
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
                  <CardTitle>Appearance Settings</CardTitle>
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
                      <label className="text-sm font-medium text-neutral-200">Number Format</label>
                      <select className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="1,234.56">1,234.56</option>
                        <option value="1.234,56">1.234,56</option>
                        <option value="1 234.56">1 234.56</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-200">First Day of Week</label>
                      <select className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="sunday">Sunday</option>
                        <option value="monday">Monday</option>
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
      </div>
    </AppLayout>
  );
}
