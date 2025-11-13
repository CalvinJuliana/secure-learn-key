import { ConnectButton } from '@rainbow-me/rainbowkit';
import logo from '@/assets/logo.png';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Encrypted Study Resources" className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Encrypted Study</h1>
            <p className="text-xs text-muted-foreground">Secure Learning Platform</p>
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
