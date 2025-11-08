'use client';

import Link from 'next/link';
import { BUSINESS_NAME } from '@/lib/site-config';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole } from '@/lib/models';
import { Search, MapPin, ChevronDown, User, Calendar, Settings, Plus, LogIn, Trophy, Users, Award, Play } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LogoutButton from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/button';


interface HeaderProps {
  activePage?: 'home' | 'events' | 'dashboard';
  onSearch?: (searchTerm: string, location: string) => void;
  initialLocation?: string;
  initialSearchTerm?: string;
}

export function Header({ 
  onSearch,
  initialLocation = '',
  initialSearchTerm = ''
}: HeaderProps) {
  const { user, firebaseUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [location, setLocation] = useState(initialLocation);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Update location when initialLocation prop changes
  useEffect(() => {
    if (initialLocation !== undefined) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  // Update search term when initialSearchTerm prop changes
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm, location);
    }
    setIsMobileSearchOpen(false);
  };

  // Trigger search when inputs change (debounced) ONLY if at least one field is non-empty
  useEffect(() => {
    if (onSearch) {
      const hasQuery = (searchTerm?.trim() ?? '') !== '' || (location?.trim() ?? '') !== '';
      if (!hasQuery) return; // avoid auto-navigation from pages like /login

      const timeoutId = setTimeout(() => {
        onSearch(searchTerm, location);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, location, onSearch]);
  
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-sm border-b border-primary/10 shadow-lg shadow-primary/5">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Main header row */}
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0 hover:scale-105 transition-all duration-300">
           <div className="relative flex items-center gap-3">
             {/* Chess piece with gradient background */}
             <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
               <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                 <span className="text-2xl md:text-3xl font-bold text-primary-foreground block">♟</span>
               </div>
             </div>
             {/* Brand name with better typography */}
             <div className="flex flex-col">
               <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-tight">
                 {BUSINESS_NAME}
               </span>
               <span className="text-xs text-muted-foreground hidden sm:block">Chess Events & Tournaments</span>
             </div>
           </div>
          </Link>

          
          {/* Desktop Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative flex rounded-xl border-2 border-primary/20 overflow-hidden bg-white/80 backdrop-blur-sm shadow-lg shadow-primary/10 focus-within:border-primary focus-within:shadow-xl focus-within:shadow-primary/20 transition-all duration-300">
                <div className="flex items-center px-4 bg-gradient-to-b from-primary/5 to-primary/10 border-r border-primary/10">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <input
                  type="text"
                  placeholder="Search chess tournaments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                />
                <div className="flex items-center border-l border-primary/10 bg-gradient-to-b from-accent/5 to-accent/10">
                  <div className="flex items-center px-4 py-3 text-sm text-foreground">
                    <MapPin className="h-4 w-4 mr-1.5 text-primary" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="outline-none bg-transparent min-w-[120px] placeholder:text-muted-foreground"
                      placeholder="Location"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-6 py-3 hover:from-primary/90 hover:to-primary/80 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
          
          {/* Mobile search toggle, Create Event button, and user menu */}
          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/20 hover:border-primary/40"
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5 text-primary" />
            </button>
            
            {/* Create Event Button - only show for admin/owner */}
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER) && (
              <Link href="/dashboard/event/new">
                <Button variant="default" size="default" className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all duration-300">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Event</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </Link>
            )}



            
            {/* User Menu: show only for authenticated admin/owner */}
            {firebaseUser && (user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER) ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-primary/10 transition-all duration-300 border border-transparent hover:border-primary/20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm"></div>
                    <div className="relative w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="hidden md:block text-sm font-medium truncate max-w-[100px] text-foreground">{(user?.displayName || firebaseUser?.displayName || firebaseUser?.email || 'User')}</span>
                  <ChevronDown className="hidden md:block h-4 w-4 text-primary" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName || firebaseUser?.displayName || 'Account'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || firebaseUser?.email || ''}</p>
                      {user?.role && (
                        <p className="text-xs leading-none text-primary font-medium capitalize">{user.role}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/event/new" className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create Event</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/events" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Events</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <LogoutButton className="w-full justify-start text-left px-2 py-1.5 text-sm" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Show a styled button for admin/owner login
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              >
                <Link href="/login" title="Admin/Owner Login">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Login</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        {isMobileSearchOpen && (
          <div className="lg:hidden py-4 border-t border-primary/10 bg-gradient-to-b from-background to-background/95">
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <div className="flex items-center px-3 py-2.5 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-primary/20 focus-within:border-primary focus-within:shadow-md transition-all">
                  <Search className="h-5 w-5 text-primary mr-3" />
                  <input
                    type="text"
                    placeholder="Search chess tournaments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center px-3 py-2.5 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-primary/20 focus-within:border-primary focus-within:shadow-md transition-all">
                  <MapPin className="h-5 w-5 text-primary mr-3" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                    placeholder="Location"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground py-3 rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
              >
                Search Events
              </button>
            </form>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="border-t border-primary/10 bg-gradient-to-b from-background/95 to-background">
          <nav className="flex items-center justify-center gap-1 md:gap-2 py-3 overflow-x-auto hide-scrollbar">
            <Link
              href="/events"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              <span>Events</span>
            </Link>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 whitespace-nowrap cursor-not-allowed opacity-60"
              disabled
              title="Coming soon"
            >
              <Users className="h-4 w-4" />
              <span>Clubs</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 whitespace-nowrap cursor-not-allowed opacity-60"
              disabled
              title="Coming soon"
            >
              <Trophy className="h-4 w-4" />
              <span>Tournaments</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 whitespace-nowrap cursor-not-allowed opacity-60"
              disabled
              title="Coming soon"
            >
              <Award className="h-4 w-4" />
              <span>Leaderboards</span>
            </button>
            <Link
              href="/rules"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 whitespace-nowrap"
            >
              <span className="text-lg">♟️</span>
              <span>Rules</span>
            </Link>
            <Link
              href="/play"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 transition-all duration-300 whitespace-nowrap shadow-md hover:shadow-lg"
            >
              <Play className="h-4 w-4" />
              <span>Play Now</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;