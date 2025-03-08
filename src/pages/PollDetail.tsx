
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePollContext } from '../context/PollContext';
import PollCard from '../components/PollCard';
import CommentSection from '../components/CommentSection';
import Header from '../components/Header';

const PollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getPollById } = usePollContext();
  const navigate = useNavigate();
  
  const poll = getPollById(id || '');
  
  if (!poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-lg mb-4">Poll not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20 px-4 max-w-lg mx-auto pb-20">
        <div className="mb-4 animate-fade-in">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to Polls</span>
          </Link>
        </div>
        
        <div className="mb-6">
          <PollCard poll={poll} preview={true} />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5">
          <CommentSection pollId={poll.id} />
        </div>
      </main>
    </div>
  );
};

export default PollDetail;
