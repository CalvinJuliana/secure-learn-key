import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Lock } from 'lucide-react';
import { toast } from 'sonner';

export const UploadModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('note');

  const handleUpload = () => {
    if (!fileName) {
      toast.error('Please select a file');
      return;
    }
    
    toast.success('File encrypted and uploaded successfully!');
    setIsOpen(false);
    setFileName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
          <Upload className="w-5 h-5 mr-2" />
          Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-secondary" />
            Upload Encrypted Resource
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input 
              id="file" 
              type="file" 
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Resource Type</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Study Notes</SelectItem>
                <SelectItem value="test">Test/Exam</SelectItem>
                <SelectItem value="result">Test Results</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access">Access Control (Wallet Address)</Label>
            <Input 
              id="access" 
              placeholder="0x..." 
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} className="bg-gradient-secondary">
            <Lock className="w-4 h-4 mr-2" />
            Encrypt & Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
