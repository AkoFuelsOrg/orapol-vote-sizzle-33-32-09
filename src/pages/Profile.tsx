
import React from 'react';
import { usePollContext } from '../context/PollContext';
import PollCard from '../components/PollCard';
import Header from '../components/Header';

const Profile: React.FC = () => {
  const { polls, currentUser } = usePollContext();
  
  // Filter polls created by the current user
  const userPolls = polls.filter(poll => poll.author.id === currentUser.id);
  
  // Find polls the user has voted on
  const votedPolls = polls.filter(poll => poll.userVoted);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20 px-4 max-w-lg mx-auto pb-20">
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 mb-6 animate-fade-in">
          <div className="flex items-center">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-16 h-16 rounded-full border-2 border-border object-cover"
            />
            <div className="ml-4">
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <p className="text-muted-foreground">@{currentUser.name.toLowerCase().replace(/\s+/g, '')}</p>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{userPolls.length}</p>
              <p className="text-sm text-muted-foreground">Polls</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{votedPolls.length}</p>
              <p className="text-sm text-muted-foreground">Votes</p>
            </div>
          </div>
        </div>
        
        {userPolls.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Your Polls</h3>
            <div className="space-y-4">
              {userPolls.map(poll => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          </div>
        )}
        
        {votedPolls.length > 0 && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Polls You Voted On</h3>
            <div className="space-y-4">
              {votedPolls.map(poll => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          </div>
        )}
        
        {userPolls.length === 0 && votedPolls.length === 0 && (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <p className="mb-4">You haven't created or voted on any polls yet.</p>
            <div className="inline-block">
              <a 
                href="/create" 
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Your First Poll
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
