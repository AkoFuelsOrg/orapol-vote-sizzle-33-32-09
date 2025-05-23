
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { User } from '@/lib/types';

interface ReplyInputProps {
  user: User | null;
  replyContent: string;
  onChange: (v: string) => void;
  onSubmit: (e?: React.FormEvent) => void; // Updated to accept an optional event parameter
  onCancel: () => void;
  submittingReply: boolean;
  placeholder?: string;
}

const ReplyInput: React.FC<ReplyInputProps> = ({
  user,
  replyContent,
  onChange,
  onSubmit,
  onCancel,
  submittingReply,
  placeholder = "Add a reply..."
}) => {
  return (
    <div className="mt-3 flex items-center space-x-2">
      <Avatar className="h-6 w-6 flex-shrink-0">
        {user?.user_metadata?.avatar_url && (
          <img
            src={user?.user_metadata?.avatar_url as string}
            alt={user?.user_metadata?.username as string || 'User'}
            className="rounded-full"
          />
        )}
      </Avatar>
      <Input
        type="text"
        placeholder={placeholder}
        className="flex-1 h-8 text-sm"
        value={replyContent}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(); // This now accepts no parameters, which matches our updated definition
          }
        }}
      />
      <div className="flex space-x-1">
        <Button
          size="sm"
          onClick={() => onSubmit()} // Call without event, which matches our updated definition
          disabled={submittingReply || !replyContent.trim()}
          className="h-8"
        >
          {submittingReply ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Reply"
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ReplyInput;
