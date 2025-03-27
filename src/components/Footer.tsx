
import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Twitter, Facebook, Instagram, Mail, Github, Linkedin, Youtube, Heart } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, type LanguageCode } from '../context/LanguageContext';

// Language options
const languages = [
  { code: 'en', name: 'English' },
  { code: 'lg', name: 'Luganda' },
  { code: 'sw', name: 'Swahili' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
];

const Footer = () => {
  const { language, setLanguage } = useLanguage();
  
  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguageCode);
    // In a real app, this would trigger language change throughout the app
    console.log(`Language changed to: ${value}`);
  };

  return (
    <footer className="w-full bg-gradient-to-br from-blue-900 to-blue-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className="h-10 w-10 bg-white rounded-full p-1"
              />
              <h3 className="text-xl font-bold">Tuwaye</h3>
            </div>
            <p className="text-blue-200 text-sm">
              Connect with friends and community. Share your thoughts, join conversations, and discover new perspectives.
            </p>
            <div className="pt-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-blue-300" />
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-36 bg-blue-800/30 border-blue-700 focus:ring-blue-400 text-sm h-8">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-blue-100">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-blue-200 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/groups" className="text-blue-200 hover:text-white transition-colors">Groups</Link></li>
              <li><Link to="/marketplaces" className="text-blue-200 hover:text-white transition-colors">Marketplaces</Link></li>
              <li><Link to="/vibezone" className="text-blue-200 hover:text-white transition-colors">Vibezone</Link></li>
              <li><Link to="/create" className="text-blue-200 hover:text-white transition-colors">Create Poll</Link></li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-blue-100">Information</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-blue-100">Connect With Us</h4>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="bg-blue-800/50 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="bg-blue-800/50 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-blue-800/50 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-blue-800/50 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="bg-blue-800/50 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="bg-blue-800/50 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-4">
              <p className="text-sm text-blue-200">
                Subscribe to our newsletter for updates.
              </p>
              <div className="mt-2 flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="text-sm bg-blue-800/30 border border-blue-700 rounded-l-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400 text-white"
                />
                <button className="bg-blue-600 hover:bg-blue-500 transition-colors text-white rounded-r-md px-4 text-sm font-medium">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-blue-300">
            &copy; {new Date().getFullYear()} Tuwaye. All rights reserved.
          </p>
          <p className="text-sm text-blue-300 flex items-center mt-2 md:mt-0">
            Made with <Heart className="h-3 w-3 text-red-400 mx-1" /> in Uganda
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
