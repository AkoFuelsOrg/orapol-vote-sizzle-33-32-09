
import React from 'react';
import { HelpCircle, Mail, MessageCircle, PhoneCall, Contact, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Help = () => {
  const navigate = useNavigate();
  
  const handleContactSupport = () => {
    navigate('/contact-us');
  };
  
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
          <Button variant="outline" className="w-full" onClick={handleContactSupport}>
            Start Chat
          </Button>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Mail className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Email Support</h3>
          <p className="text-gray-600 mb-4">Send us an email and we'll get back to you within 24 hours</p>
          <Button variant="outline" className="w-full" onClick={handleContactSupport}>
            Contact Support
          </Button>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <PhoneCall className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Phone Support</h3>
          <p className="text-gray-600 mb-4">Speak directly with our customer support team</p>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = 'tel:+1234567890'}>
            Call Us
          </Button>
        </Card>
      </div>

      {/* Direct Contact Info */}
      <div className="max-w-3xl mx-auto mb-12 p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <Mail className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Email Us</h3>
              <p className="text-gray-600 mt-1">support@tuwaye.com</p>
              <p className="text-gray-600">info@tuwaye.com</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <PhoneCall className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Call Us</h3>
              <p className="text-gray-600 mt-1">+1 (234) 567-8900</p>
              <p className="text-gray-600">Mon-Fri: 9am-6pm</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MessageCircle className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Live Chat</h3>
              <p className="text-gray-600 mt-1">Available 24/7</p>
              <p className="text-gray-600">Response time: ~5 mins</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Contact className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Office</h3>
              <p className="text-gray-600 mt-1">123 Tech Avenue</p>
              <p className="text-gray-600">Kampala, Uganda</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I get started with Tuwaye?</AccordionTrigger>
            <AccordionContent>
              Getting started with Tuwaye is easy! Simply create an account, complete your profile with your interests, and you'll be ready to connect with others. You can then explore content, join discussions, and participate in polls.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I find friends and connect with others?</AccordionTrigger>
            <AccordionContent>
              You can find friends through the "Find Friends" page, by searching for specific usernames, or by exploring groups based on your interests. When you find someone you'd like to connect with, you can follow them to see their updates in your feed.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How can I change my account settings?</AccordionTrigger>
            <AccordionContent>
              To change your account settings, navigate to your profile by clicking on your avatar in the sidebar. From there, you can access settings to update your profile information, privacy settings, notification preferences, and change your password if needed.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>How do I create and share content?</AccordionTrigger>
            <AccordionContent>
              You can create content by clicking the "Create Post" button in the sidebar or on your feed. From there, you can choose to create a regular post, poll, or upload media to Vibezone. Your content will be shared with your followers and can be discovered by other users.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>What is Vibezone?</AccordionTrigger>
            <AccordionContent>
              Vibezone is our multimedia platform where users can share and watch videos, create engaging visual content, and interact through comments. It's a great way to express yourself through video and connect with others who share similar interests.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>How can I report inappropriate content?</AccordionTrigger>
            <AccordionContent>
              If you encounter content that violates our community guidelines, you can report it by clicking on the options menu (three dots) on the post or comment and selecting "Report." Our moderation team will review your report and take appropriate action.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Contact Form CTA */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="bg-gradient-to-r from-primary/10 to-purple-100 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-2/3 mb-6 md:mb-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Need more detailed assistance?</h3>
            <p className="text-gray-700">
              Fill out our contact form and our team will get back to you as soon as possible
            </p>
          </div>
          <div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg" 
              onClick={handleContactSupport}
            >
              Contact Form
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Support Channels */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
        <p className="text-gray-600 mb-6">
          Our support team is available 24/7 to assist you with any questions or concerns
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg" 
            onClick={handleContactSupport}
          >
            Contact Support
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = 'mailto:support@tuwaye.com'}
          >
            Email Us
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = 'tel:+1234567890'}
          >
            Call Us
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Help;
