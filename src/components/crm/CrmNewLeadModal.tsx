import { useState } from "react";
import { X, UserPlus, Building, Mail, Phone, MapPin, DollarSign, Briefcase } from "lucide-react";
import { SAINT_LUCIA_LOCATIONS } from "../../crm/types";

interface CrmNewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLead: (leadData: any) => Promise<void>;
}

export function CrmNewLeadModal({ isOpen, onClose, onCreateLead }: CrmNewLeadModalProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("Castries");
  const [serviceRequested, setServiceRequested] = useState("Managed IT Support");
  const [estimatedValue, setEstimatedValue] = useState(5000);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [leadSource, setLeadSource] = useState("Direct Phone Call");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !name.trim()) return;

    setSubmitting(true);
    try {
      await onCreateLead({
        name: name.trim(),
        company: company.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || phone.trim() || undefined,
        location,
        serviceRequested,
        estimatedValue: Number(estimatedValue) || 0,
        priority,
        leadSource,
        message: message.trim() || undefined
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-app-bg border border-app-border rounded-3xl p-6 max-w-lg w-full space-y-4 text-xs shadow-2xl animate-fade-in-once">
        <div className="flex items-center justify-between border-b border-app-border/60 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-sky-500" />
            <h3 className="text-sm font-bold text-app-text font-display">Capture New CRM Lead</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-app-btn-sec text-app-text-muted hover:text-app-text transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rodney Bay Hotel"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus Joseph"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +1 (758) 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">WhatsApp Number</label>
              <input
                type="tel"
                placeholder="e.g. +17585550199"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="contact@company.lc"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Saint Lucia Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              >
                {SAINT_LUCIA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Service Requested</label>
              <select
                value={serviceRequested}
                onChange={(e) => setServiceRequested(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              >
                <option value="Managed IT Support">Managed IT Support</option>
                <option value="Network Infrastructure & Wi-Fi">Network Infrastructure & Wi-Fi</option>
                <option value="VoIP Phone Systems">VoIP Phone Systems</option>
                <option value="Cybersecurity & Backup">Cybersecurity & Backup</option>
                <option value="Web & SaaS Development">Web & SaaS Development</option>
                <option value="Cloud Migration">Cloud Migration</option>
                <option value="Hardware Procurement">Hardware Procurement</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Est. Deal Value (XCD)</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Lead Source</label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              >
                <option value="Direct Phone Call">Direct Phone Call</option>
                <option value="WhatsApp Inquiry">WhatsApp Inquiry</option>
                <option value="Referral / Word of Mouth">Referral / Word of Mouth</option>
                <option value="In-Person Meeting">In-Person Meeting</option>
                <option value="Website Contact Form">Website Contact Form</option>
                <option value="Cold Outreach">Cold Outreach</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Initial Inquiry / Message</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Client's initial questions, pain points, or project scope..."
              className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-app-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-app-btn-sec text-app-text font-semibold hover:bg-app-btn-sec/80 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving Lead..." : "Save & Score Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
