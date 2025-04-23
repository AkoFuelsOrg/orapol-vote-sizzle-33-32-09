
import React, { useState } from 'react';
import { Mail, User, MessageSquare, PhoneCall, HelpCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    contactPreference: 'email'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contactPreference: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Here you would typically send the form data to a backend service
    // For now, we'll just show a success toast
    toast.success('Thank you for your message! We will get back to you soon.');
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      contactPreference: 'email'
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="text-center mb-8">
        <Link to="/help" className="text-primary hover:text-primary/80 text-sm inline-flex items-center">
          <HelpCircle className="mr-1 h-4 w-4" />
          Return to Help Center
        </Link>
        <h1 className="text-4xl font-bold mt-2 text-gray-800">
          Get in Touch
        </h1>
        <p className="text-gray-600 mt-2 max-w-lg mx-auto">
          Have questions, feedback, or need assistance? We're here to help. Reach out to us using any of the methods below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Contact Information */}
        <div className="col-span-1">
          <div className="space-y-6">
            <Card className="p-6 border-l-4 border-primary bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Email</h3>
                  <p className="text-gray-600 mt-1">support@tuwaye.com</p>
                  <p className="text-gray-500 text-sm mt-2">For general inquiries</p>
                  <p className="text-gray-600 mt-1">info@tuwaye.com</p>
                  <p className="text-gray-500 text-sm">For business opportunities</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-primary bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <div className="bg-primary/10 p-3 rounded-full">
                  <PhoneCall className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Phone</h3>
                  <p className="text-gray-600 mt-1">+1 (234) 567-8900</p>
                  <p className="text-gray-500 text-sm mt-2">Mon-Fri: 9am-6pm</p>
                  <p className="text-gray-600 mt-1">+1 (234) 567-8901</p>
                  <p className="text-gray-500 text-sm">Technical Support: 24/7</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-primary bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <div className="bg-primary/10 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Live Chat</h3>
                  <p className="text-gray-600 mt-1">Available 24/7</p>
                  <p className="text-gray-500 text-sm mt-1">Average response time: 5 minutes</p>
                  <Button className="mt-3 bg-primary/10 text-primary hover:bg-primary/20">
                    Start Live Chat
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Contact Form */}
        <div className="col-span-1 lg:col-span-2">
          <Card className="p-8 bg-white shadow-lg rounded-xl">
            <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input 
                      id="name"
                      type="text" 
                      name="name"
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input 
                      id="email"
                      type="email" 
                      name="email"
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input 
                      id="phone"
                      type="tel" 
                      name="phone"
                      placeholder="+1 (234) 567-8900" 
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject"
                    type="text" 
                    name="subject"
                    placeholder="What is this regarding?" 
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Your Message <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-4 text-gray-400" />
                  <Textarea 
                    id="message"
                    name="message"
                    placeholder="Please describe how we can help you..." 
                    value={formData.message}
                    onChange={handleChange}
                    className="pl-10 min-h-[150px]"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Contact Method</Label>
                <RadioGroup value={formData.contactPreference} onValueChange={handleRadioChange} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="cursor-pointer">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone" />
                    <Label htmlFor="phone" className="cursor-pointer">Phone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="chat" id="chat" />
                    <Label htmlFor="chat" className="cursor-pointer">Live Chat</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button type="submit" className="w-full md:w-auto mt-4 bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
      
      {/* Office Location */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Visit Our Office</h2>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="aspect-w-16 aspect-h-9 w-full h-[400px] bg-gray-200">
            {/* Replace with an actual map or embed Google Maps here */}
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold mb-2">Tuwaye Headquarters</h3>
                <p className="text-gray-700">123 Tech Avenue</p>
                <p className="text-gray-700">Kampala, Uganda</p>
                <p className="mt-4 text-gray-600">
                  <strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM
                </p>
                <Button className="mt-4 bg-primary hover:bg-primary/90">
                  Get Directions
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Center Link */}
      <div className="text-center mb-10">
        <p className="text-gray-600 mb-4">
          Looking for quick answers to common questions?
        </p>
        <Link 
          to="/help" 
          className="text-primary hover:text-primary/80 font-medium inline-flex items-center"
        >
          <HelpCircle className="mr-2 h-5 w-5" />
          Visit our Help Center
        </Link>
      </div>
    </div>
  );
};

export default ContactUs;

