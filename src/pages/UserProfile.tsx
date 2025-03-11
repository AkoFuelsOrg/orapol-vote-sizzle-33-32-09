
// Update the userPolls mapping to include views property
// Around line 80 where userPolls are created

// Update the poll mapping section to include views property:
const userPolls = pollsData.map((poll) => ({
  id: poll.id,
  question: poll.question,
  options: convertJsonToPollOptions(poll.options),
  author: {
    id: poll.profiles.id,
    name: poll.profiles.username || 'Anonymous',
    avatar: poll.profiles.avatar_url || 'https://i.pravatar.cc/150',
  },
  createdAt: poll.created_at,
  totalVotes: poll.total_votes || 0,
  commentCount: poll.comment_count || 0,
  userVoted: votedOptions[poll.id] || null,
  image: poll.image,
  views: poll.views || 0, // Add this line to fix the error
}));
