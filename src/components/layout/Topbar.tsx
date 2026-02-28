import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, X, User, Calendar, Package, Trash2, CheckCheck, Camera, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/api/SupabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Patient {
  id: string;
  nome: string;
  telefone: string | null;
}

export function Topbar() {
  const { profile, role, signOut } = useAuth();
  const nome = profile?.nome || 'Usuário';
  const initials = nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(nome);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    } else if (profile && 'avatar_url' in profile && profile.avatar_url) {
      setAvatarUrl(profile.avatar_url as string);
    }
  }, [profile]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        
        localStorage.setItem('user_avatar', base64);
        
        setAvatarUrl(base64);
        setIsUploading(false);
        toast.success('Foto de perfil atualizada!');
      };
      
      reader.onerror = () => {
        toast.error('Erro ao ler a imagem');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao atualizar foto de perfil');
      setIsUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error('Nome não pode estar vazio');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ nome: editedName.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Nome atualizado com sucesso!');
      setIsEditingName(false);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.error('Erro ao atualizar nome');
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setSidebarCollapsed(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const handleSidebarChange = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored !== null) {
        setSidebarCollapsed(JSON.parse(stored));
      }
    };

    window.addEventListener('sidebar-collapse', handleSidebarChange);
    return () => window.removeEventListener('sidebar-collapse', handleSidebarChange);
  }, []);

  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.trim().length > 0) {
        const { data } = await supabase
          .from('pacientes')
          .select('id, nome, telefone')
          .eq('ativo', true)
          .or(`nome.ilike.%${searchQuery}%,telefone.ilike.%${searchQuery}%`)
          .limit(5);
        
        if (data) {
          setSearchResults(data);
          setShowResults(true);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (patientId: string) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/pacientes/${patientId}/prontuario`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'patient':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'stock':
        return <Package className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  return (
    <header 
      className="fixed top-0 z-30 flex h-16 items-center justify-between border-b px-6 transition-all duration-300"
      style={{ 
        backgroundColor: 'hsl(var(--sidebar-background))', 
        borderColor: 'hsl(var(--sidebar-border))',
        left: sidebarWidth,
        width: `calc(100% - ${sidebarWidth})`
      }}
    >
      {/* Search */}
      <div className="relative w-full max-w-md" ref={searchRef}>
        <Search 
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" 
          style={{ color: 'hsl(var(--sidebar-muted))' }} 
        />
        <Input
          placeholder="Buscar pacientes, prontuários..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim().length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="h-9 rounded-lg border border-transparent bg-white/90 pl-10 pr-10 text-sm focus-visible:ring-1 focus:border-primary"
          style={{ 
            color: '#000000',
          }}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
            style={{ color: 'hsl(var(--sidebar-muted))' }}
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full rounded-lg border bg-card shadow-lg overflow-hidden">
            {searchResults.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleResultClick(patient.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {patient.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{patient.nome}</p>
                  <p className="text-xs text-muted-foreground">{patient.telefone || 'Sem telefone'}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && searchQuery && searchResults.length === 0 && (
          <div className="absolute top-full mt-2 w-full rounded-lg border bg-card shadow-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Nenhum paciente encontrado</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'hsl(var(--sidebar-muted))' }}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span 
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="font-semibold text-sm">Notificações</span>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="h-3 w-3" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                    title="Limpar todas"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`flex items-start gap-3 px-3 py-3 cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div 
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/10 cursor-pointer"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback 
                  className="text-xs font-semibold"
                  style={{ 
                    backgroundColor: 'hsl(var(--sidebar-primary))', 
                    color: 'hsl(var(--sidebar-primary-foreground))' 
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-none text-white">
                  {nome}
                </p>
                <p className="text-xs capitalize text-white/70">
                  {role || ''}
                </p>
              </div>
              <ChevronDown className="hidden h-3 w-3 md:block text-white/70" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)} className="gap-2">
              <User className="h-4 w-4" />
              Editar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Avatar with upload */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl font-semibold" style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">Clique na câmera para alterar a foto</p>

            {/* Name editing */}
            <div className="w-full space-y-2">
              <Label className="text-sm font-medium">Nome</Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSaveName}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingName(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm">{nome}</p>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingName(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Role display */}
            <div className="w-full space-y-2">
              <Label className="text-sm font-medium">Função</Label>
              <p className="text-sm capitalize text-muted-foreground">{role}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
