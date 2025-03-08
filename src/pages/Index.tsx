
import React, { useState, useEffect } from 'react';
import { usePollContext } from '../context/PollContext';
import { useSupabase } from '../context/SupabaseContext';
import { Link } from 'react-router-dom';
import PollCard from '../components/PollCard';
import Header from '../components/Header';

const Index: React.FC = () => {
  const { polls } = usePollContext();
  const { user } = useSupabase();
  const [animateItems, setAnimateItems] = useState(false);
  
  useEffect(() => {
    // Trigger animations after a small delay for a staggered effect
    setAnimateItems(true);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="pt-20 px-4 max-w-lg mx-auto">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold">Discover Polls</h2>
          <p className="text-muted-foreground">Vote and share your opinion</p>
        </div>
        
        {!user && (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 mb-6 text-center animate-fade-in">
            <h3 className="text-lg font-medium mb-2">Join Orapol Today</h3>
            <p className="text-muted-foreground mb-4">Sign up to create your own polls and vote on others</p>
            <Link 
              to="/auth" 
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign Up / Login
            </Link>
          </div>
        )}
        
        <div className="space-y-4">
          {polls.map((poll, index) => (
            <div 
              key={poll.id} 
              className={`transition-opacity duration-500 ${
                animateItems 
                  ? 'opacity-100' 
                  : 'opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <PollCard poll={poll} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
