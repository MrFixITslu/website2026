import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Mail, MapPin, Send, CheckCircle, AlertCircle, Building2, Users, Lock } from "lucide-react";
import { FieldError } from "./ui/FieldError";

const CHALLENGES = [
  "Poor internet reliability / downtime",
  "Lack of IT support & maintenance",
  "Cybersecurity threats & data breaches",
  "Outdated hardware or software",
  "Moving to cloud / Microsoft 365",
  "Custom software or application needs",
  "Disaster recovery & backup concerns",
  "Network speed or Wi-Fi issues",
  "Other / Not sure yet",
];

const EMPLOYEE_RANGES = ["1–5", "6–20", "21–50", "51–100", "100+"];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    employees: "", biggestChallenge: "", message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.company.trim()) errs.company = "Company name is required.";
    if (!form.email.trim()) errs.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setServerError(null);

    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      const token = await new Promise<string>((resolve, reject) => {
        // @ts-expect-error grecaptcha loaded via script tag in index.html
        if (!window.grecaptcha) { reject(new Error("reCAPTCHA not loaded")); return; }
        // @ts-expect-error
        window.grecaptcha.ready(() => {
          // @ts-expect-error
          window.grecaptcha.execute(siteKey, { action: "submit" }).then(resolve).catch(reject);
        });
      });

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recaptchaToken: token }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || "Submission failed."); }
      else { setSubmitted(true); }
    } catch {
      setServerError("Connection error. Please call us or email directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-app-input border rounded-xl px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted/50 focus:outline-none focus:ring-1 transition-all ${
      errors[field]
        ? "border-v79-coral focus:ring-v79-coral/40"
        : "border-app-input-border focus:ring-v79-teal/40 focus:border-v79-teal/60"
    }`;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-10 px-6 lg:px-8 text-center space-y-4"
      >
        <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">Get in Touch</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white">
          Let's Talk About Your Business Technology
        </h1>
        <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light leading-relaxed">
          Fill out the form below and our team will reach out within one business day to schedule your free ICT consultation.
        </p>
      </motion.section>

      <section className="px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {/* Contact Info */}
          <div className="space-y-5">
            <h2 className="text-base font-extrabold font-display text-app-text dark:text-white">Contact Information</h2>
            {[
              { icon: Phone, label: "Phone", value: "+1 758 726 0035", href: "tel:+17587260035" },
              { icon: Mail, label: "Email", value: "vision79slu@gmail.com", href: "mailto:vision79slu@gmail.com" },
              { icon: MapPin, label: "Location", value: "Castries, Saint Lucia", href: null },
            ].map((c, i) => {
              const Icon = c.icon;
              const content = (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -2 }}
                  className="flex items-start gap-3 glass rounded-xl p-4 border border-app-border hover:border-v79-teal/30 hover:shadow-lg transition-[border-color,box-shadow] group"
                >
                  <div className="w-9 h-9 rounded-lg bg-v79-teal/10 border border-v79-teal/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-v79-teal" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest">{c.label}</div>
                    <div className="text-sm font-semibold text-app-text dark:text-white group-hover:text-v79-teal transition">{c.value}</div>
                  </div>
                </motion.div>
              );
              return c.href ? <a key={c.label} href={c.href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded-xl block">{content}</a> : content;
            })}

            <div className="glass rounded-xl p-4 border border-app-border space-y-2">
              <div className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest">Business Hours</div>
              <div className="space-y-1 text-xs text-app-text-sec font-light">
                <div className="flex justify-between"><span>Mon – Fri</span><span className="font-semibold text-app-text">8:00 AM – 5:00 PM</span></div>
                <div className="flex justify-between"><span>Saturday</span><span className="font-semibold text-app-text">9:00 AM – 1:00 PM</span></div>
                <div className="flex justify-between"><span>Emergency</span><span className="font-semibold text-v79-teal-light">24/7 MSP Clients</span></div>
              </div>
            </div>

            {/* Location graphic */}
            <div className="relative rounded-xl overflow-hidden border border-app-border h-32 grid-texture bg-v79-sand-light/40 dark:bg-v79-navy-light/20 flex items-center justify-center">
              <div className="relative z-10 flex flex-col items-center gap-1 text-v79-teal">
                <div className="w-9 h-9 rounded-full bg-v79-teal/15 border border-v79-teal/30 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-app-text-sec">Castries, Saint Lucia</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[10px] text-app-text-muted font-mono px-1">
              <Lock className="w-3 h-3 shrink-0 mt-0.5" />
              <span>Your contact details are encrypted and stored securely.</span>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-2xl border border-v79-teal/30 bg-v79-teal/5 p-10 text-center space-y-4 h-full flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-v79-teal/15 border border-v79-teal/30 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-v79-teal-light" />
                  </div>
                  <h2 className="text-2xl font-extrabold font-display text-app-text dark:text-white">Request Received!</h2>
                  <p className="text-sm text-app-text-sec font-light max-w-sm">
                    Thank you for contacting V79SL. A member of our team will reach out to you within one business day to discuss your ICT needs.
                  </p>
                  <div className="text-[11px] font-mono text-app-text-muted pt-2">
                    For urgent matters: <a href="tel:+17587260035" className="text-v79-teal hover:underline">+1 758 726 0035</a>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="glass rounded-2xl border border-app-border p-6 sm:p-8 space-y-5"
                  noValidate
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-app-text-sec">Full Name *</label>
                      <input id="contact-name" name="name" value={form.name} onChange={handleChange} placeholder="Neil Verdant" className={inputClass("name")} />
                      <FieldError message={errors.name} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-app-text-sec">Company *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                        <input id="contact-company" name="company" value={form.company} onChange={handleChange} placeholder="Island Retail Ltd." className={inputClass("company") + " pl-9"} />
                      </div>
                      <FieldError message={errors.company} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-app-text-sec">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                        <input id="contact-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" className={inputClass("email") + " pl-9"} />
                      </div>
                      <FieldError message={errors.email} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-app-text-sec">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                        <input id="contact-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 758 000 0000" className={inputClass("phone") + " pl-9"} />
                      </div>
                      <FieldError message={errors.phone} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-app-text-sec">Team Size</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted pointer-events-none" />
                        <select id="contact-employees" name="employees" value={form.employees} onChange={handleChange} className={inputClass("employees") + " pl-9 appearance-none cursor-pointer"}>
                          <option value="">Select employees...</option>
                          {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r} employees</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-app-text-sec">Biggest ICT Challenge</label>
                      <select id="contact-challenge" name="biggestChallenge" value={form.biggestChallenge} onChange={handleChange} className={inputClass("biggestChallenge") + " appearance-none cursor-pointer"}>
                        <option value="">Select challenge...</option>
                        {CHALLENGES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-app-text-sec">Additional Details</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us more about your current IT setup, goals, or any specific challenges you're facing..."
                      className={inputClass("message") + " resize-none"}
                    />
                  </div>

                  <AnimatePresence>
                    {serverError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        role="alert"
                        className="flex items-center gap-2.5 p-3.5 rounded-xl bg-v79-coral/10 border border-v79-coral/20 text-v79-coral-light text-xs font-mono"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {serverError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    id="contact-submit"
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-v79-coral hover:bg-v79-coral-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-v79-coral/20 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send My Request
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-[10px] text-app-text-muted text-center font-mono">
                    <Lock className="w-3 h-3 shrink-0" />
                    We respond within 1 business day. Your information is encrypted and never shared.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
