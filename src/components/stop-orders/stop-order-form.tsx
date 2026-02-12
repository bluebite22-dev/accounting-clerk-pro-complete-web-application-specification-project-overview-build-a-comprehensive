"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Save, X, UserPlus } from "lucide-react";
import { StopOrder, useDataStore } from "@/stores/data-store";
import { generateId } from "@/lib/utils";

interface StopOrderFormProps {
  order?: StopOrder | null;
  onSave: (order: StopOrder) => void;
  onCancel: () => void;
}

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

const sexOptions = [
  { value: "M", label: "M" },
  { value: "F", label: "F" },
];

const rankOptions = [
  { value: "Officer", label: "Officer" },
  { value: "Soldier", label: "Soldier" },
  { value: "Civilian", label: "Civilian" },
];

const customerOptions = [
  { value: "", label: "Select customer or type below" },
];

export default function StopOrderForm({ order, onSave, onCancel }: StopOrderFormProps) {
  const { customers, addCustomer } = useDataStore();
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [formData, setFormData] = useState<any>(() => order || {
    id: generateId(),
    form_number: `SO-${Date.now()}`,
    form_date: new Date().toISOString().split('T')[0],
    deduction_amount: "",
    duration_months: "",
    start_date: "",
    account_number: "9060160002109",
    full_name: "",
    sex: "M",
    nrc_no: "",
    man_no: "",
    rank: "Soldier",
    barrack: "",
    district: "",
    province: "",
    mobile: "",
    email: "",
    monthly_deduction_from: "",
    monthly_deduction_to: "",
    amount_in_words: "",
    authorized_by: "",
    client_name: "",
    delivery_date: "",
    delivered_by: "",
    product_no: "",
    status: "draft",
    type: "payroll",
    isActive: true,
    notifyOnTrigger: true,
    requireOverride: false,
    triggeredCount: 0,
    blockedAmount: 0,
  });

  const handleCustomerSelect = (customerId: string) => {
    if (!customerId) {
      setSelectedCustomer(null);
      return;
    }
    const customer = customers.find((c: any) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData((prev: any) => ({
        ...prev,
        full_name: customer.name || "",
        mobile: customer.phone || prev.mobile,
        email: customer.email || prev.email,
        barrack: customer.address || prev.barrack,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Generate verification hash
    const dataString = `${formData.full_name || ""}|${formData.nrc_no || ""}|${formData.deduction_amount || ""}`;
    const msgBuffer = new TextEncoder().encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Auto-sync customer
    if (formData.full_name && !selectedCustomer) {
      const existingCustomer = customers.find((c: any) =>
        c.name?.toLowerCase() === (formData.full_name || "").toLowerCase()
      );

      if (!existingCustomer) {
        addCustomer({
          id: generateId(),
          name: formData.full_name,
          email: formData.email || "",
          phone: formData.mobile || "",
          address: `${formData.barrack || ""}, ${formData.district || ""}, ${formData.province || ""}`.trim(),
          status: "active",
          contactPerson: "",
          phone2: "",
          tin: "",
          bankName: "",
          bankAccount: "",
          paymentTerms: "",
          creditLimit: 0,
          paymentTermsNum: 0,
          balance: 0,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const amountNum = parseFloat(formData.deduction_amount) || 0;
    const monthsNum = parseInt(formData.duration_months) || 1;

    const newOrder: StopOrder = {
      ...formData,
      deduction_amount: amountNum,
      duration_months: monthsNum,
      verification_hash: hashHex,
      monthly_deduction_from: formData.monthly_deduction_from ? new Date(formData.monthly_deduction_from).toISOString() : undefined,
      monthly_deduction_to: formData.monthly_deduction_to ? new Date(formData.monthly_deduction_to).toISOString() : undefined,
      form_date: new Date(formData.form_date).toISOString(),
      reason: `Salary deduction for ${formData.full_name || ""} - K${amountNum} for ${monthsNum} month(s)`,
    };

    onSave(newOrder);
    setSaving(false);
  };

  // Build customer options from customers list
  const allCustomerOptions = [
    { value: "", label: "Select customer or type below" },
    ...customers.map((c: any) => ({ value: c.id, label: c.name || "" })),
  ];

  return (
    <Card className="max-w-5xl mx-auto bg-neutral-900 border-neutral-800">
      <CardHeader className="bg-slate-900 text-white">
        <CardTitle className="flex justify-between items-center">
          <div>
            <div className="text-xl">Petrichor5 Limited - Stop Order Form</div>
            <div className="text-xs text-slate-300 mt-1">Farm 2919M Ferngrove Lusaka West, Zambia</div>
          </div>
          <div className="text-sm">Form No: <span className="text-emerald-400">{formData.form_number}</span></div>
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6 bg-neutral-900">
          
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-800">
            <div>
              <Label>Form Date</Label>
              <Input type="date" value={formData.form_date} onChange={(e: any) => setFormData({ ...formData, form_date: e.target.value })} required />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                options={statusOptions}
                value={formData.status || "draft"}
                onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
              />
            </div>
          </div>

          {/* Deduction Details */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h3 className="font-semibold mb-3 text-white">Deduction Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Deduction Amount (K)</Label>
                <Input type="number" step="0.01" value={formData.deduction_amount} onChange={(e: any) => setFormData({ ...formData, deduction_amount: e.target.value })} required />
              </div>
              <div>
                <Label>Duration (Months)</Label>
                <Input type="number" value={formData.duration_months} onChange={(e: any) => setFormData({ ...formData, duration_months: e.target.value })} required />
              </div>
              <div>
                <Label>Start Date (Month/Year)</Label>
                <Input type="month" value={formData.start_date} onChange={(e: any) => setFormData({ ...formData, start_date: e.target.value })} required />
              </div>
            </div>
            <div className="mt-3">
              <Label>Amount in Words</Label>
              <Textarea value={formData.amount_in_words} onChange={(e: any) => setFormData({ ...formData, amount_in_words: e.target.value })} rows={2} />
            </div>
            <div className="mt-3">
              <Label>Account Number (Petrichor5)</Label>
              <Input value={formData.account_number} onChange={(e: any) => setFormData({ ...formData, account_number: e.target.value })} className="font-mono font-bold" readOnly />
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h3 className="font-semibold mb-3 text-white flex items-center justify-between">
              Personal Information
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                New Customer
              </Button>
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Select Existing Customer or Enter New</Label>
                <Select
                  options={allCustomerOptions}
                  value={selectedCustomer?.id || ""}
                  onChange={(e: any) => handleCustomerSelect(e.target.value)}
                />
              </div>
              <div>
                <Label>Full Name (CAPITAL LETTERS)</Label>
                <Input 
                  value={formData.full_name} 
                  onChange={(e: any) => setFormData({ ...formData, full_name: e.target.value.toUpperCase() })} 
                  placeholder="IN CAPITAL LETTERS"
                  className="uppercase font-semibold"
                  required 
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Sex</Label>
                  <Select
                    options={sexOptions}
                    value={formData.sex || "M"}
                    onChange={(e: any) => setFormData({ ...formData, sex: e.target.value })}
                  />
                </div>
                <div>
                  <Label>NRC No</Label>
                  <Input value={formData.nrc_no} onChange={(e: any) => setFormData({ ...formData, nrc_no: e.target.value })} required />
                </div>
                <div>
                  <Label>Man No</Label>
                  <Input value={formData.man_no} onChange={(e: any) => setFormData({ ...formData, man_no: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Rank</Label>
                <Select
                  options={rankOptions}
                  value={formData.rank || "Soldier"}
                  onChange={(e: any) => setFormData({ ...formData, rank: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h3 className="font-semibold mb-3 text-white">Location</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Barrack</Label>
                <Input value={formData.barrack} onChange={(e: any) => setFormData({ ...formData, barrack: e.target.value })} />
              </div>
              <div>
                <Label>District</Label>
                <Input value={formData.district} onChange={(e: any) => setFormData({ ...formData, district: e.target.value })} />
              </div>
              <div>
                <Label>Province</Label>
                <Input value={formData.province} onChange={(e: any) => setFormData({ ...formData, province: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mobile</Label>
              <Input type="tel" value={formData.mobile} onChange={(e: any) => setFormData({ ...formData, mobile: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>

          {/* Monthly Deduction Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly Deduction From</Label>
              <Input type="date" value={formData.monthly_deduction_from} onChange={(e: any) => setFormData({ ...formData, monthly_deduction_from: e.target.value })} />
            </div>
            <div>
              <Label>Monthly Deduction To</Label>
              <Input type="date" value={formData.monthly_deduction_to} onChange={(e: any) => setFormData({ ...formData, monthly_deduction_to: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Authorized By</Label>
            <Input value={formData.authorized_by} onChange={(e: any) => setFormData({ ...formData, authorized_by: e.target.value })} />
          </div>

          {/* For Petrichor5 Section */}
          <div className="bg-amber-900/20 p-4 rounded-lg border-l-4 border-amber-500">
            <h3 className="font-semibold mb-3 text-amber-400">For Petrichor5 (Internal Use)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client Name</Label>
                <Input value={formData.client_name} onChange={(e: any) => setFormData({ ...formData, client_name: e.target.value })} />
              </div>
              <div>
                <Label>Product No</Label>
                <Input value={formData.product_no} onChange={(e: any) => setFormData({ ...formData, product_no: e.target.value })} />
              </div>
              <div>
                <Label>Delivery Date</Label>
                <Input type="date" value={formData.delivery_date} onChange={(e: any) => setFormData({ ...formData, delivery_date: e.target.value })} />
              </div>
              <div>
                <Label>Delivered By</Label>
                <Input value={formData.delivered_by} onChange={(e: any) => setFormData({ ...formData, delivered_by: e.target.value })} />
              </div>
            </div>
          </div>

        </CardContent>

        <CardFooter className="flex justify-end gap-3 bg-slate-900">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Stop Order"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
