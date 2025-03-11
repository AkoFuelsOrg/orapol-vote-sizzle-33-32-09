
import { Poll, Comment, User } from './types';

// Mock users
export const users: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    name: 'Sam Chen',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    name: 'Taylor Kim',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    name: 'Jordan Smith',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
];

// Current user (for demo)
export const currentUser = users[0];

// Mock polls
export const initialPolls: Poll[] = [
  {
    id: '1',
    question: 'What\'s your favorite programming language?',
    options: [
      { id: '1a', text: 'JavaScript', votes: 42 },
      { id: '1b', text: 'Python', votes: 37 },
      { id: '1c', text: 'TypeScript', votes: 25 },
      { id: '1d', text: 'Java', votes: 15 },
    ],
    author: users[1],
    createdAt: '2023-11-25T10:30:00Z',
    totalVotes: 119,
    commentCount: 8,
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    views: 250,
  },
  {
    id: '2',
    question: 'Best streaming service?',
    options: [
      { id: '2a', text: 'Netflix', votes: 68 },
      { id: '2b', text: 'Disney+', votes: 42 },
      { id: '2c', text: 'HBO Max', votes: 38 },
      { id: '2d', text: 'Amazon Prime', votes: 29 },
    ],
    author: users[2],
    createdAt: '2023-11-24T15:45:00Z',
    totalVotes: 177,
    commentCount: 12,
    views: 320,
  },
  {
    id: '3',
    question: 'What smartphone do you use?',
    options: [
      { id: '3a', text: 'iPhone', votes: 54 },
      { id: '3b', text: 'Samsung Galaxy', votes: 48 },
      { id: '3c', text: 'Google Pixel', votes: 23 },
      { id: '3d', text: 'Other Android', votes: 19 },
    ],
    author: users[3],
    createdAt: '2023-11-23T09:15:00Z',
    totalVotes: 144,
    commentCount: 15,
    image: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
    views: 280,
  },
  {
    id: '4',
    question: 'Favorite way to relax after work?',
    options: [
      { id: '4a', text: 'TV/Movies', votes: 39 },
      { id: '4b', text: 'Reading', votes: 27 },
      { id: '4c', text: 'Exercise', votes: 32 },
      { id: '4d', text: 'Video Games', votes: 35 },
    ],
    author: users[0],
    createdAt: '2023-11-22T18:20:00Z',
    totalVotes: 133,
    commentCount: 9,
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
    views: 195,
  },
  {
    id: '5',
    question: 'Which cuisine do you prefer?',
    options: [
      { id: '5a', text: 'Italian', votes: 45 },
      { id: '5b', text: 'Japanese', votes: 42 },
      { id: '5c', text: 'Mexican', votes: 38 },
      { id: '5d', text: 'Chinese', votes: 36 },
    ],
    author: users[1],
    createdAt: '2023-11-21T12:10:00Z',
    totalVotes: 161,
    commentCount: 7,
    views: 210,
  },
];

// Mock comments
export const initialComments: Comment[] = [
  {
    id: '1',
    pollId: '1',
    author: users[2],
    content: 'TypeScript has been a game-changer for my projects!',
    createdAt: '2023-11-25T11:15:00Z',
    likes: 7,
  },
  {
    id: '2',
    pollId: '1',
    author: users[3],
    content: 'Python is so versatile, it\'s hard not to love it.',
    createdAt: '2023-11-25T11:30:00Z',
    likes: 5,
  },
  {
    id: '3',
    pollId: '1',
    author: users[0],
    content: 'I started with JavaScript but moved to TypeScript and never looked back.',
    createdAt: '2023-11-25T12:00:00Z',
    likes: 4,
  },
  {
    id: '4',
    pollId: '2',
    author: users[1],
    content: 'Disney+ has the best original content right now.',
    createdAt: '2023-11-24T16:30:00Z',
    likes: 8,
  },
  {
    id: '5',
    pollId: '2',
    author: users[0],
    content: 'Netflix\'s library is still unmatched in terms of variety.',
    createdAt: '2023-11-24T17:15:00Z',
    likes: 10,
  },
];
