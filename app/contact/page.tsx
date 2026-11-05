"use client";

import { Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactUs() {
  return (
    <div className="container max-w-5xl py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Get in Touch</h1>
        <p className="text-muted-foreground">Have a question, feedback, or need help with a tool? We'd love to hear from you.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-card border border-border p-8 md:p-10 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-sm font-semibold mb-2 block">Your Name</label>
              <Input type="text" placeholder="John Doe" required />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Email Address</label>
              <Input type="email" placeholder="john@example.com" required />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Message</label>
              <textarea 
                className="w-full flex min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="How can we help you?"
                required
              ></textarea>
            </div>
            <Button type="button" className="w-full gradient-primary text-white" onClick={() => alert("This is a demo form. Thank you for testing!")}>
              Send Message
            </Button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-8 rounded-3xl shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Email Us</h3>
              <p className="text-muted-foreground text-sm mb-2">For support, queries, or copyright issues.</p>
              <a href="mailto:support@convia.com" className="text-primary font-medium hover:underline">support@convia.com</a>
            </div>
          </div>

          <div className="bg-card border border-border p-8 rounded-3xl shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Live Support</h3>
              <p className="text-muted-foreground text-sm mb-2">We usually reply within 24 hours.</p>
              <p className="font-medium text-foreground">Monday - Friday (9 AM - 6 PM)</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary to-violet-500 p-8 rounded-3xl shadow-md text-white">
            <h3 className="font-bold text-xl mb-2">Want to collaborate?</h3>
            <p className="text-white/80 text-sm mb-4">If you are a developer or a business looking to partner with us, reach out!</p>
            <a href="mailto:business@convia.com" className="inline-block bg-white text-primary font-bold px-6 py-2 rounded-xl text-sm transition-transform hover:scale-105">
              Contact Business Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}