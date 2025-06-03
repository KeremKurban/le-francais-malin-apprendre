
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (name: string) => void;
}

const LoginModal = ({ isOpen, onLogin }: LoginModalProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-6 h-6 text-blue-600" />
            <span>Bienvenue sur FrançaisPro</span>
          </DialogTitle>
          <DialogDescription>
            Entrez votre nom pour commencer votre apprentissage du français
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Votre nom</Label>
            <Input
              id="name"
              type="text"
              placeholder="Entrez votre nom..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
            disabled={!name.trim()}
          >
            Commencer l'apprentissage
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
