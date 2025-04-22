import React from 'react';
import { BookText, Shield, FileText, Scale } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import DraggableIcon from '@/components/DraggableIcon';

const Terms: React.FC = () => {
  return (
    <>
      <DraggableIcon />
      <div className="max-w-4xl mx-auto pt-8 pb-16 px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <BookText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Please read these terms carefully before using the Tuwaye platform.
          </p>
        </div>

        <Card className="mb-8 border-primary/10 shadow-md">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Agreement to Terms
            </CardTitle>
            <CardDescription>
              Understanding your relationship with Tuwaye
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Acceptance of Terms</h3>
                <p className="text-gray-700 leading-relaxed">
                  By accessing or using Tuwaye, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Changes to Terms</h3>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. We will always post the most current version on our website and notify you of any significant changes. Your continued use of the platform following changes to these terms constitutes your acceptance of those changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-primary/10 shadow-md">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              User Accounts
            </CardTitle>
            <CardDescription>
              Your responsibilities regarding your Tuwaye account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Registration Requirements</h3>
                <p className="text-gray-700 leading-relaxed">
                  To use certain features of Tuwaye, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Account Security</h3>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Age Restrictions</h3>
                <p className="text-gray-700 leading-relaxed">
                  You must be at least 13 years old to use Tuwaye. By using our services, you represent that you are at least 13 years old. If you are under 18, you must have permission from a parent or legal guardian to use our services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-primary/10 shadow-md">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              User Content
            </CardTitle>
            <CardDescription>
              Rules regarding the content you share on Tuwaye
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Content Ownership</h3>
                <p className="text-gray-700 leading-relaxed">
                  You retain all rights to the content you post on Tuwaye. By posting content, you grant us a non-exclusive, royalty-free, transferable, sub-licensable, worldwide license to use, store, display, reproduce, modify, and distribute your content across our services.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Content Guidelines</h3>
                <p className="text-gray-700 leading-relaxed">
                  You agree not to post content that violates these terms or our Community Guidelines. This includes content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Content Removal</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may remove or refuse to display content that we reasonably believe violates these terms or our policies, or that could harm Tuwaye, our users, or third parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-primary/10 shadow-md">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Limitation of Liability
            </CardTitle>
            <CardDescription>
              Legal limitations on Tuwaye's responsibility
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Disclaimer of Warranties</h3>
                <p className="text-gray-700 leading-relaxed">
                  Tuwaye is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, timely, secure, or error-free.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Limitation of Liability</h3>
                <p className="text-gray-700 leading-relaxed">
                  To the maximum extent permitted by law, Tuwaye and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or related to your use of our service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-md">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <BookText className="h-5 w-5 text-primary" />
              General Provisions
            </CardTitle>
            <CardDescription>
              Additional legal terms governing the use of Tuwaye
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Governing Law</h3>
                <p className="text-gray-700 leading-relaxed">
                  These Terms shall be governed by the laws of the jurisdiction in which Tuwaye is registered, without regard to its conflict of law provisions.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Dispute Resolution</h3>
                <p className="text-gray-700 leading-relaxed">
                  Any dispute arising from or relating to these Terms or our services shall first be resolved through good-faith negotiations. If such negotiations fail, the dispute shall be resolved through arbitration in accordance with the rules of the jurisdiction in which Tuwaye is registered.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Entire Agreement</h3>
                <p className="text-gray-700 leading-relaxed">
                  These Terms constitute the entire agreement between you and Tuwaye regarding your use of our services and supersede all prior agreements and understandings.
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed mt-6">
              Last updated: April 22, 2025
            </p>
          </CardContent>
        </Card>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            If you have any questions about these Terms of Service, please contact us at legal@tuwaye.com
          </p>
        </div>
      </div>
    </>
  );
};

export default Terms;
