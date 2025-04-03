import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FaWhatsapp, FaEnvelope, FaLinkedin, FaInstagram } from "react-icons/fa";

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
      const { error } = await supabase.from("contact_messages").insert({
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
      console.error("Error submitting contact form:", error);
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
    <footer className="border-t py-6 px-4 md:px-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            © 2025 Spend Smart. By Shobith Kumar. All rights reserved.
          </p>
          <div className="flex justify-center md:justify-start space-x-4 mt-2">
            <button onClick={() => setShowPrivacyPolicy(true)} className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </button>
            <button onClick={() => setShowTerms(true)} className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </button>
            <button onClick={() => setShowContact(true)} className="text-sm text-muted-foreground hover:text-foreground">
              Contact Us
            </button>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex space-x-8 mt-4 md:mt-0">
          <a href="https://wa.me/9393023900?text=Hi Texting You From Spend-Smart." target="_blank" rel="noopener noreferrer">
            <FaWhatsapp className="text-2xl text-muted-foreground hover:text-green-500" />
          </a>
          <a href="mailto:karnatishobith78@gmail.com">
            <FaEnvelope className="text-2xl text-muted-foreground hover:text-red-500" />
          </a>
          <a href="https://www.linkedin.com/in/shobithkarnati0302" target="_blank" rel="noopener noreferrer">
            <FaLinkedin className="text-2xl text-muted-foreground hover:text-blue-600" />
          </a>
          <a href="https://www.instagram.com/_.bunnyy._23_03?igsh=MW94c2lleWRkOWRsZA==" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="text-2xl text-muted-foreground hover:text-pink-500" />
          </a>
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
            <p>We value your privacy. This Privacy Policy explains how we collect and use your data.</p>
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
            <p>By using our platform, you agree to these terms.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Us Form Dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogDescription>Send us a message and we'll get back to you as soon as possible.</DialogDescription>
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
