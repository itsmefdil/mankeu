import { Search, Sun, Moon, LogOut, Settings, User, Coins, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePreferencesStore } from '@/hooks/usePreferences';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from 'react-router-dom';

export const TopBar = () => {
    const { user, logout } = useAuthStore();
    const { toggleTheme } = useTheme();
    const { isAmountHidden, toggleAmountVisibility } = usePreferencesStore();


    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 pt-safe transition-all duration-300">
            <div className="flex h-16 items-center gap-4 px-4 md:px-6">
                <div className="w-full flex-1">
                    {/* Mobile: Logo */}
                    <div className="md:hidden flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20 dark:ring-black/20">
                            <Coins className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-lg leading-none bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                Mankeu
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase scale-90 origin-left">
                                Finance
                            </span>
                        </div>
                    </div>

                    {/* Desktop: Search Form */}
                    <form onSubmit={(e) => e.preventDefault()} className="hidden md:block">
                        <div className="relative group max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="search"
                                placeholder="Search..."
                                className="w-full bg-muted/40 border border-transparent rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/70"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <Button variant="ghost" size="icon" onClick={toggleAmountVisibility} className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                        {isAmountHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        <span className="sr-only">Toggle amount visibility</span>
                    </Button>

                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                        <Sun className="h-5 w-5 dark:hidden scale-100 dark:scale-0 transition-transform duration-200" />
                        <Moon className="h-5 w-5 hidden dark:block scale-0 dark:scale-100 transition-transform duration-200" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>



                    <div className="h-6 w-px bg-border/60 mx-1 hidden md:block"></div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="rounded-xl pl-1 pr-3 gap-3 h-10 hover:bg-muted/60 transition-all group outline-none">
                                <div className="h-8 w-8 rounded-lg overflow-hidden ring-2 ring-background group-hover:ring-primary/20 transition-all shadow-md shadow-primary/20 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="text-lg">🤠</span>
                                </div>
                                <div className="flex flex-col items-start hidden sm:flex text-left">
                                    <span className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{user?.name || 'Guest'}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pro Plan</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to="/settings" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/settings" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};
