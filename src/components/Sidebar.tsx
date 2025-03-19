
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import {
  Home,
  User,
  PieChart,
  MessageSquare,
  Bell,
  Users,
  LogOut,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { useSupabase } from "../context/SupabaseContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import CreatePollModal from "./CreatePollModal";
import CreatePostModal from "./CreatePostModal";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface SidebarLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  highlight?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon: Icon,
  label,
  count,
  highlight,
}) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center py-3 px-4 rounded-lg mb-1 transition-colors ${
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-primary/5 text-gray-600 hover:text-primary"
        } ${highlight ? "font-semibold" : ""}`
      }
    >
      <Icon
        size={20}
        className={`mr-3 shrink-0 ${highlight ? "text-primary" : ""}`}
      />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  const { user, profile, signOut } = useSupabase();
  const [createType, setCreateType] = useState<"poll" | "post" | null>(null);

  const handleCreateClick = (type: "poll" | "post") => {
    setCreateType(type);
  };

  const handleDialogClose = () => {
    setCreateType(null);
  };

  return (
    <div className="w-64 border-r border-input bg-background fixed left-0 top-0 h-screen pt-14 z-10">
      <div className="py-4 px-3 flex flex-col h-full">
        {user && profile && (
          <div className="mb-6 flex items-center px-3">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage
                src={profile.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`}
                alt={profile.username || 'User'}
              />
              <AvatarFallback>
                {profile?.username ? profile.username[0].toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="truncate">
              <div className="font-medium truncate">
                {profile?.username || "User"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-1 mb-6">
          <SidebarLink to="/" icon={Home} label="Home" />
          {user && (
            <>
              <SidebarLink to="/profile" icon={User} label="Profile" />
              <SidebarLink
                to="/voted-polls"
                icon={PieChart}
                label="Your Polls"
              />
              <SidebarLink
                to="/messages"
                icon={MessageSquare}
                label="Messages"
              />
              <SidebarLink
                to="/notifications"
                icon={Bell}
                label="Notifications"
              />
              <SidebarLink to="/groups" icon={Users} label="Groups" />
            </>
          )}
        </nav>

        {user && (
          <div className="mt-auto space-y-4">
            <Dialog open={createType !== null} onOpenChange={handleDialogClose}>
              <div className="space-y-2">
                <DialogTrigger asChild>
                  <Button
                    onClick={() => handleCreateClick("poll")}
                    className="w-full justify-start"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Poll
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => handleCreateClick("post")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
              </div>
              <DialogContent className="sm:max-w-[600px] p-0">
                {createType === "poll" && <CreatePollModal onClose={handleDialogClose} />}
                {createType === "post" && <CreatePostModal onClose={handleDialogClose} />}
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}

        {!user && (
          <div className="mt-auto space-y-2">
            <Button asChild className="w-full">
              <NavLink to="/auth">Sign in</NavLink>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
