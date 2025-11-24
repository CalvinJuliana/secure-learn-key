import { Lock, Unlock, FileText, Download, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface FileCardProps {
  id: string;
  title: string;
  type: 'note' | 'test' | 'result';
  size: string;
  uploadedBy: string;
  isEncrypted: boolean;
  hasAccess: boolean;
}

export const FileCard = ({ title, type, size, uploadedBy, isEncrypted, hasAccess }: FileCardProps) => {
  const [isDecrypting, setIsDecrypting] = useState(false);

  const typeColors = {
    note: 'bg-secondary text-secondary-foreground',
    test: 'bg-accent text-accent-foreground',
    result: 'bg-primary text-primary-foreground'
  };

  const handleDecrypt = () => {
    setIsDecrypting(true);
    setTimeout(() => setIsDecrypting(false), 1500);
  };

  return (
    <Card className="p-6 bg-gradient-card hover:shadow-lg transition-all duration-300 group cursor-pointer border border-border/50 hover:border-secondary/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
            <FileText className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">{size}</p>
          </div>
        </div>
        
        {isEncrypted ? (
          isDecrypting ? (
            <Unlock className="w-5 h-5 text-secondary animate-pulse" />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )
        ) : (
          <Unlock className="w-5 h-5 text-secondary" />
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Badge className={typeColors[type]} variant="secondary">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
        {hasAccess && <Badge variant="outline" className="text-secondary border-secondary">Access Granted</Badge>}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Uploaded by <span className="text-foreground font-medium">{uploadedBy}</span>
      </p>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={handleDecrypt}
          disabled={isDecrypting}
        >
          <Eye className="w-4 h-4 mr-2" />
          {isDecrypting ? 'Decrypting...' : 'View'}
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          disabled={!hasAccess}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
