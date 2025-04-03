import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase, ContactMessage } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  message: z.string().min(10, "Message must be at least 10 characters.")
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const Footer = () => {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: user?.email || "",
      message: ""
    }
  });

  const onSubmitContact = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      // Insert the contact form data directly using a raw query
      // This bypasses the TypeScript type checking issue
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user?.id || null,
          name: values.name,
          email: values.email,
          message: values.message,
          created_at: new Date().toISOString(),
          resolved: false
        } as any);

      if (error) throw error;
      
      toast({
        title: "Message sent",
        description: "Thank you for contacting us. We'll get back to you shortly."
      });
      
      form.reset();
      setShowContact(false);
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message || "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t py-4 px-4 md:px-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            © 2025 Spend Smart. By Shobith Kumar. All rights reserved. 
          </p>
        </div>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <button
            onClick={() => setShowPrivacyPolicy(true)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setShowTerms(true)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Terms of Service
          </button>
          <button
            onClick={() => setShowContact(true)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Contact Us
          </button>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <DialogDescription>Last updated: April 3, 2025</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <h3 className="font-semibold">1. Introduction</h3>
            <p>
              Welcome to Spend Smart ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, and share information about you when you use our services.
            </p>

            <h3 className="font-semibold">2. Information We Collect</h3>
            <p>
              We collect information you provide directly to us, such as when you create an account, update your profile, use interactive features, make a purchase, request customer support, or otherwise communicate with us. This information may include your name, email address, phone number, billing information, and any other information you choose to provide.
            </p>

            <h3 className="font-semibold">3. How We Use Your Information</h3>
            <p>
              We use the information we collect to provide, maintain, and improve our services, process transactions, send you related information, communicate with you, personalize your experience, and understand how users interact with our services.
            </p>

            <h3 className="font-semibold">4. Sharing of Information</h3>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to outside parties except as described in this Privacy Policy. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
            </p>

            <h3 className="font-semibold">5. Security</h3>
            <p>
              We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
            </p>

            <h3 className="font-semibold">6. Changes to This Privacy Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogDescription>Last updated: April 3, 2025</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <h3 className="font-semibold">1. Acceptance of Terms</h3>
            <p>
              By accessing or using the Spend Smart application, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, you may not access or use our services.
            </p>

            <h3 className="font-semibold">2. Description of Service</h3>
            <p>
              Spend Smart provides a personal finance management platform that allows users to track expenses, create budgets, and generate financial reports. We reserve the right to modify, suspend or discontinue the service at any time without notice.
            </p>

            <h3 className="font-semibold">3. User Accounts</h3>
            <p>
              You are responsible for maintaining the security of your account, and you are fully responsible for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other breach of security.
            </p>

            <h3 className="font-semibold">4. User Content</h3>
            <p>
              You retain ownership of any content you submit to the service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, modify, publish, and display such content in connection with providing the service.
            </p>

            <h3 className="font-semibold">5. Prohibited Conduct</h3>
            <p>
              You agree not to use the service to engage in any illegal activity, violate any third-party rights, or attempt to gain unauthorized access to any systems or networks connected to the service.
            </p>

            <h3 className="font-semibold">6. Termination</h3>
            <p>
              We may terminate or suspend your account and access to the service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of the service, us, or third parties, or for any other reason.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Us Form Dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogDescription>
              Send us a message and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitContact)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="your.email@example.com" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Your message..." rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;
