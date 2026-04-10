import { useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AppLayout() {
  const { profile, role, user, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Apenas JPG e PNG', variant: 'destructive' });
      return;
    }
    const path = `${user.id}/${Date.now()}-avatar.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
      return;
    }
    await updateProfile({ avatar_url: path } as any);
    toast({ title: 'Foto atualizada!' });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 min-h-screen">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 py-3">
          <GlobalSearch />
          <div className="flex items-center gap-3">
            <div className="text-right mr-1">
              <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role === 'admin' ? 'Administrador' : 'Dentista'}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  <Avatar className="h-9 w-9">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.full_name} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-2" />
                  Alterar foto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
