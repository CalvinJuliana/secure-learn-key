import { ConnectButton } from '@rainbow-me/rainbowkit';
import { BookOpen } from 'lucide-react';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Secure Learn Key</h1>
            <p className="text-xs text-muted-foreground">Encrypted Learning Progress</p>
          </div>
        </div>
        
        <ConnectButton 
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </header>
  );
};
