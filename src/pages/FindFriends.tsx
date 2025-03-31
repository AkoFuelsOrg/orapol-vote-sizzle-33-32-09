
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import SuggestedUsers from '../components/SuggestedUsers';

const FindFriends: React.FC = () => {
  const navigate = useNavigate();
  
  const handleContinue = () => {
    // Set a flag in session storage to indicate that the page should refresh
    sessionStorage.setItem('shouldRefreshHome', 'true');
    // Force a hard navigation instead of using React Router
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Helmet>
        <title>Tuwaye - Find Friends</title>
      </Helmet>
      
      <Card className="w-full max-w-3xl shadow-lg border-none animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center">
            <div className="mb-3">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className="h-12 w-12 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold">Find Friends on Tuwaye</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Follow some people to get started with your experience
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <SuggestedUsers />
          </div>
          
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleContinue}
              className="bg-[#3eb0ff] hover:bg-[#2ea0ee] px-6"
            >
              Continue to Home <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FindFriends;
