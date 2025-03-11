import { Poll, Comment, User, PollOption } from './types';

// Sample current user
export const currentUser: User = {
  id: 'user1',
  name: 'Current User',
  avatar: 'https://i.pravatar.cc/150?img=1',
};

// Sample polls data
export const initialPolls: Poll[] = [
  {
    id: 'poll1',
    question: 'What is your favorite programming language?',
    options: [
      { id: 'option1', text: 'JavaScript', votes: 15 },
      { id: 'option2', text: 'Python', votes: 10 },
      { id: 'option3', text: 'Java', votes: 5 },
      { id: 'option4', text: 'C#', votes: 7 },
    ],
    author: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    createdAt: '2023-04-01T10:00:00Z',
    totalVotes: 37,
    commentCount: 12,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    views: 120,
  },
  {
    id: 'poll2',
    question: 'Which frontend framework do you prefer?',
    options: [
      { id: 'option1', text: 'React', votes: 25 },
      { id: 'option2', text: 'Vue', votes: 18 },
      { id: 'option3', text: 'Angular', votes: 12 },
      { id: 'option4', text: 'Svelte', votes: 15 },
    ],
    author: {
      id: 'user3',
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    createdAt: '2023-04-02T14:30:00Z',
    totalVotes: 70,
    commentCount: 24,
    views: 200,
  },
  {
    id: 'poll3',
    question: 'What is your preferred method of learning?',
    options: [
      { id: 'option1', text: 'Video courses', votes: 32 },
      { id: 'option2', text: 'Reading documentation', votes: 15 },
      { id: 'option3', text: 'Interactive tutorials', votes: 28 },
      { id: 'option4', text: 'Building projects', votes: 45 },
    ],
    author: {
      id: 'user4',
      name: 'Sarah Williams',
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
    createdAt: '2023-04-03T09:15:00Z',
    totalVotes: 120,
    commentCount: 35,
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0',
    views: 300,
  },
  {
    id: 'poll4',
    question: 'Which database do you use most often?',
    options: [
      { id: 'option1', text: 'MySQL', votes: 20 },
      { id: 'option2', text: 'PostgreSQL', votes: 25 },
      { id: 'option3', text: 'MongoDB', votes: 18 },
      { id: 'option4', text: 'SQLite', votes: 12 },
    ],
    author: {
      id: 'user5',
      name: 'David Brown',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    createdAt: '2023-04-04T16:45:00Z',
    totalVotes: 75,
    commentCount: 22,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    views: 180,
  },
  {
    id: 'poll5',
    question: 'How do you prefer to work?',
    options: [
      { id: 'option1', text: 'Remote', votes: 42 },
      { id: 'option2', text: 'In office', votes: 18 },
      { id: 'option3', text: 'Hybrid', votes: 35 },
    ],
    author: {
      id: 'user6',
      name: 'Emily Davis',
      avatar: 'https://i.pravatar.cc/150?img=6',
    },
    createdAt: '2023-04-05T11:20:00Z',
    totalVotes: 95,
    commentCount: 30,
    views: 220,
  },
];

// Sample comments data
export const initialComments: Comment[] = [
  {
    id: 'comment1',
    pollId: 'poll1',
    author: {
      id: 'user7',
      name: 'Commenter One',
      avatar: 'https://i.pravatar.cc/150?img=7',
    },
    content: 'I totally agree with JavaScript being a top choice!',
    createdAt: '2023-04-06T08:00:00Z',
    likes: 3,
  },
  {
    id: 'comment2',
    pollId: 'poll1',
    author: {
      id: 'user8',
      name: 'Commenter Two',
      avatar: 'https://i.pravatar.cc/150?img=8',
    },
    content: 'Python is great for its simplicity and versatility.',
    createdAt: '2023-04-06T09:30:00Z',
    likes: 5,
  },
  {
    id: 'comment3',
    pollId: 'poll2',
    author: {
      id: 'user9',
      name: 'Commenter Three',
      avatar: 'https://i.pravatar.cc/150?img=9',
    },
    content: 'React has a strong community and extensive ecosystem.',
    createdAt: '2023-04-07T11:00:00Z',
    likes: 8,
  },
  {
    id: 'comment4',
    pollId: 'poll2',
    author: {
      id: 'user10',
      name: 'Commenter Four',
      avatar: 'https://i.pravatar.cc/150?img=10',
    },
    content: 'Vue is more approachable for beginners.',
    createdAt: '2023-04-07T13:45:00Z',
    likes: 2,
  },
  {
    id: 'comment5',
    pollId: 'poll3',
    author: {
      id: 'user11',
      name: 'Commenter Five',
      avatar: 'https://i.pravatar.cc/150?img=11',
    },
    content: 'Building projects is the best way to solidify your understanding.',
    createdAt: '2023-04-08T15:20:00Z',
    likes: 10,
  },
];
