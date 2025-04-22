
import React from 'react';
import { Shield, Lock, UserCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto pt-8 pb-16 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          At Tuwaye, we take your privacy seriously. This policy outlines what information we collect and how we use it.
        </p>
      </div>

      <Card className="mb-8 border-primary/10 shadow-md">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Information We Collect
          </CardTitle>
          <CardDescription>
            Details about the data we gather when you use Tuwaye
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Account Information</h3>
              <p className="text-gray-700 leading-relaxed">
                When you create a Tuwaye account, we collect information such as your name, email address, password, and profile information.
                You may also provide additional information such as a profile picture, bio, and other details to enhance your profile.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Content You Share</h3>
              <p className="text-gray-700 leading-relaxed">
                We collect content you create, upload, or share on Tuwaye, including posts, polls, comments, messages, and other interactions.
                This includes photos, videos, and other media you share through our service.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Usage Information</h3>
              <p className="text-gray-700 leading-relaxed">
                We collect information about how you use Tuwaye, such as the types of content you view, the features you use, the actions you take, and the time, frequency, and duration of your activities.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Device Information</h3>
              <p className="text-gray-700 leading-relaxed">
                We collect information about the devices you use to access Tuwaye, including hardware and software information such as IP address, device type and model, operating system, and browser type.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 border-primary/10 shadow-md">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            How We Use Your Information
          </CardTitle>
          <CardDescription>
            How we utilize the data we collect to provide and improve our services
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Providing and Personalizing Our Services</h3>
              <p className="text-gray-700 leading-relaxed">
                We use the information we collect to provide, personalize, and improve our services, including showing content that may be relevant or interesting to you based on your interactions.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Communications</h3>
              <p className="text-gray-700 leading-relaxed">
                We use your information to communicate with you about our services, to respond to you when you contact us, and to send you notifications and updates.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Research and Development</h3>
              <p className="text-gray-700 leading-relaxed">
                We use information to improve our services and develop new features, products, and services based on user behavior and feedback.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Security and Safety</h3>
              <p className="text-gray-700 leading-relaxed">
                We use information to verify accounts, detect and prevent harmful conduct, detect and prevent spam and other unwanted activity, maintain the integrity of our services, and promote safety and security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 border-primary/10 shadow-md">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            Your Rights and Choices
          </CardTitle>
          <CardDescription>
            Understanding your data rights and how to control your information
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Access and Portability</h3>
              <p className="text-gray-700 leading-relaxed">
                You can access and download a copy of your data through your account settings at any time.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Correction and Deletion</h3>
              <p className="text-gray-700 leading-relaxed">
                You can edit or update your account information at any time. You may also request deletion of your account and associated data.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Communication Preferences</h3>
              <p className="text-gray-700 leading-relaxed">
                You can manage your communication preferences to control what notifications and emails you receive from Tuwaye.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-md">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Updates to this Policy
          </CardTitle>
          <CardDescription>
            How we'll notify you about changes to our privacy practices
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-gray-700 leading-relaxed">
            We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page and, where appropriate, by sending you a notification or otherwise providing notice within our services.
            We encourage you to review our privacy policy periodically.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            Last updated: April 22, 2025
          </p>
        </CardContent>
      </Card>

      <div className="mt-10 text-center">
        <p className="text-sm text-muted-foreground">
          If you have any questions about this Privacy Policy, please contact us at privacy@tuwaye.com
        </p>
      </div>
    </div>
  );
};

export default Privacy;
