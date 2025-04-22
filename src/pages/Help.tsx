
import React from 'react';
import { HelpCircle, Mail, MessageCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Help = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <HelpCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help you?</h1>
        <p className="text-lg text-gray-600">
          Find answers to common questions and learn how to make the most of our platform
        </p>
      </div>

      {/* Quick Help Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <MessageCircle className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Live Chat Support</h3>
          <p className="text-gray-600 mb-4">Get instant help from our support team through live chat</p>
          <Button variant="outline" className="w-full">Start Chat</Button>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Mail className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Email Support</h3>
          <p className="text-gray-600 mb-4">Send us an email and we'll get back to you within 24 hours</p>
          <Button variant="outline" className="w-full">Contact Support</Button>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <HelpCircle className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">FAQs</h3>
          <p className="text-gray-600 mb-4">Find quick answers to common questions</p>
          <Button variant="outline" className="w-full">View FAQs</Button>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I get started?</AccordionTrigger>
            <AccordionContent>
              Getting started is easy! Simply create an account, complete your profile, and you'll be ready to explore all our features.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
            <AccordionContent>
              We accept all major credit cards, PayPal, and bank transfers. Your payment information is always secure with us.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How can I change my password?</AccordionTrigger>
            <AccordionContent>
              You can change your password by going to your account settings and selecting "Change Password". Follow the prompts to set a new password.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>What if I need additional help?</AccordionTrigger>
            <AccordionContent>
              Our support team is available 24/7. You can reach us through live chat, email, or by submitting a support ticket.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Contact Section */}
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
        <p className="text-gray-600 mb-6">
          Our support team is available 24/7 to assist you with any questions or concerns
        </p>
        <Button className="bg-primary hover:bg-primary/90">Contact Support</Button>
      </div>
    </div>
  );
};

export default Help;
