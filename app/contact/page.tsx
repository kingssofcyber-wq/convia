"use client";

import { useState, type FormEvent } from "react";
import { Mail, MessageSquareText, ArrowUpRight } from "lucide-react";

const SUPPORT_EMAIL = "support@convia.com"; // Verify that this mailbox is active before launch.

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Convia support request from ${name.trim()}`);
    const body = encodeURIComponent(`Name: ${name.trim()}\nReply email: ${email.trim()}\n\nMessage:\n${message.trim()}`);
    setNotice("Your email app should open with a draft. Review it and press Send to deliver your message.");
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-14 sm:py-20">
      <header className="mb-10 text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">We are here to help</p><h1 className="text-4xl font-extrabold tracking-tight">Contact Convia</h1><p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Send a question, report a problem with a tool or share feedback. Do not include passwords or sensitive documents in your message.</p></header>
      <div className="grid gap-6 md:grid-cols-[1.1fr_.9fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">Send a message</h2>
          <label className="block text-sm font-medium">Your name<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" placeholder="Your name" /></label>
          <label className="block text-sm font-medium">Your email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" /></label>
          <label className="block text-sm font-medium">Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={5000} rows={5} className="mt-2 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" placeholder="How can we help?" /></label>
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Open email draft <ArrowUpRight size={17} /></button>
          {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
          <p className="text-xs leading-5 text-muted-foreground">This form opens your device's email application. It does not submit a message to a Convia server.</p>
        </form>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"><Mail className="mb-4 h-8 w-8 text-primary"/><h2 className="font-bold">Email support</h2><a className="mt-2 inline-block font-semibold text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a><p className="mt-2 text-sm leading-6 text-muted-foreground">Use this address for support questions, feedback and corrections. Confirm the mailbox is active before launch.</p></div>
          <div className="rounded-3xl border border-border bg-muted/30 p-6 sm:p-8"><MessageSquareText className="mb-4 h-8 w-8 text-primary"/><h2 className="font-bold">Report a tool issue</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Include the tool name, browser, approximate file size and the exact error text. Do not attach confidential files unless requested through a secure support process.</p></div>
        </aside>
      </div>
    </main>
  );
}
