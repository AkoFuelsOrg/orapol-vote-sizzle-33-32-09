
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Home, 
  User, 
  BarChart3, 
  Activity, 
  MessageSquare, 
  Users, 
  UserCheck, 
  Store 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSupabase } from '../context/SupabaseContext';
import { Button } from './ui/button';
import { useMarketplace } from '../context/MarketplaceContext';
import { useGroup } from '../context/GroupContext';

export interface SidebarNavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLinkClick }) => {
  const location = useLocation();
  const { user, profile } = useSupabase();
  const { joinedGroups } = useGroup();
  const { joinedMarketplaces } = useMarketplace();

  if (!user) return null;

  const routes: SidebarNavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: <Home size={20} />,
    },
    {
      name: 'Profile',
      href: `/user/${user.id}`,
      icon: <User size={20} />,
    },
    {
      name: 'My Polls',
      href: '/polls/voted',
      icon: <BarChart3 size={20} />,
    },
    {
      name: 'Activity',
      href: '/activity',
      icon: <Activity size={20} />,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: <MessageSquare size={20} />,
    },
  ];

  return (
    <aside className="pb-12 h-full w-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="px-3 py-2">
          <div className="my-1 mb-4">
            <h2 className="mb-1 px-2 text-lg font-semibold tracking-tight">
              Navigation
            </h2>
            <div className="space-y-1">
              {routes.map((route) => (
                <Button
                  key={route.href}
                  variant={location.pathname === route.href ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("w-full justify-start", 
                    location.pathname === route.href ? "font-medium" : "font-normal"
                  )}
                  asChild
                  onClick={onLinkClick}
                >
                  <Link to={route.href}>
                    {route.icon} <span className="ml-2">{route.name}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="py-2">
            <h2 className="mb-1 px-2 flex items-center justify-between text-lg font-semibold tracking-tight">
              Groups
              <Link to="/groups" onClick={onLinkClick}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Users size={16} />
                </Button>
              </Link>
            </h2>
            <div className="space-y-1">
              {joinedGroups.length > 0 ? (
                joinedGroups.slice(0, 5).map((group) => (
                  <Button
                    key={group.id}
                    variant={location.pathname === `/group/${group.id}` ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm overflow-hidden"
                    asChild
                    onClick={onLinkClick}
                  >
                    <Link to={`/group/${group.id}`} className="truncate">
                      <div className="flex items-center w-full">
                        <div className="h-6 w-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
                          <img 
                            src={group.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`}
                            alt={group.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="truncate">{group.name}</span>
                      </div>
                    </Link>
                  </Button>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No groups joined yet
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start font-normal"
                asChild
                onClick={onLinkClick}
              >
                <Link to="/groups">
                  <UserCheck size={16} className="mr-2" /> View All Groups
                </Link>
              </Button>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="py-2">
            <h2 className="mb-1 px-2 flex items-center justify-between text-lg font-semibold tracking-tight">
              Marketplaces
              <Link to="/marketplaces" onClick={onLinkClick}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Store size={16} />
                </Button>
              </Link>
            </h2>
            <div className="space-y-1">
              {joinedMarketplaces.length > 0 ? (
                joinedMarketplaces.slice(0, 5).map((marketplace) => (
                  <Button
                    key={marketplace.id}
                    variant={location.pathname === `/marketplace/${marketplace.id}` ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm overflow-hidden"
                    asChild
                    onClick={onLinkClick}
                  >
                    <Link to={`/marketplace/${marketplace.id}`} className="truncate">
                      <div className="flex items-center w-full">
                        <div className="h-6 w-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
                          <img 
                            src={marketplace.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(marketplace.name)}&background=random`}
                            alt={marketplace.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="truncate">{marketplace.name}</span>
                      </div>
                    </Link>
                  </Button>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No marketplaces joined yet
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start font-normal"
                asChild
                onClick={onLinkClick}
              >
                <Link to="/marketplaces">
                  <Store size={16} className="mr-2" /> View All Marketplaces
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
