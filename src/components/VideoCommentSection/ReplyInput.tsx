
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ReplyInputProps {
  user: any;
  replyContent: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submittingReply: boolean;
}

const ReplyInput: React.FC<ReplyInputProps> = ({
  user,
  replyContent,
  onChange,
  onSubmit,
  onCancel,
  submittingReply
}) => {
  return (
    <div className="mt-3 flex items-center space-x-2">
      <Avatar className="h-6 w-6 flex-shrink-0">
        {user?.user_metadata?.avatar_url && (
          <img
            src={user?.user_metadata?.avatar_url as string}
            alt={user?.user_metadata?.username as string}
            className="rounded-full"
          />
        )}
      </Avatar>
      <Input
        type="text"
        placeholder="Add a reply..."
        className="flex-1 h-8 text-sm"
        value={replyContent}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="flex space-x-1">
        <Button
          size="sm"
          onClick={onSubmit}
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
