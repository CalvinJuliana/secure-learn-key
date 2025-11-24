import { useState } from 'react';
import { Header } from '@/components/Header';
import { FileCard } from '@/components/FileCard';
import { UploadModal } from '@/components/UploadModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { useAccount } from 'wagmi';
import heroBackground from '@/assets/hero-background.png';

// Sample data
const sampleFiles = [
  {
    id: '1',
    title: 'Advanced Calculus Notes',
    type: 'note' as const,
    size: '2.4 MB',
    uploadedBy: '0x1234...5678',
    isEncrypted: true,
    hasAccess: true,
  },
  {
    id: '2',
    title: 'Computer Science Midterm',
    type: 'test' as const,
    size: '1.8 MB',
    uploadedBy: '0xabcd...ef01',
    isEncrypted: true,
    hasAccess: false,
  },
  {
    id: '3',
    title: 'Physics Lab Results',
    type: 'result' as const,
    size: '856 KB',
    uploadedBy: '0x9876...4321',
    isEncrypted: true,
    hasAccess: true,
  },
  {
    id: '4',
    title: 'Literature Essay Guide',
    type: 'note' as const,
    size: '1.2 MB',
    uploadedBy: '0x5555...6666',
    isEncrypted: false,
    hasAccess: true,
  },
  {
    id: '5',
    title: 'Chemistry Final Exam',
    type: 'test' as const,
    size: '3.1 MB',
    uploadedBy: '0x7777...8888',
    isEncrypted: true,
    hasAccess: true,
  },
  {
    id: '6',
    title: 'Statistics Assignment Results',
    type: 'result' as const,
    size: '645 KB',
    uploadedBy: '0x2222...3333',
    isEncrypted: true,
    hasAccess: false,
  },
];

const Index = () => {
  const { isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = sampleFiles.filter(file =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground">
              Study Smarter, Stay Secure
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Share and access encrypted learning materials with blockchain-powered security.
              Only authorized parties can decrypt your study resources.
            </p>
            
            {isConnected ? (
              <UploadModal />
            ) : (
              <div className="mt-8">
                <p className="text-primary-foreground/80 mb-4">
                  Connect your Rainbow Wallet to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search study resources..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>
      </section>

      {/* Files Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Available Resources
            </h2>
            <p className="text-muted-foreground">
              {filteredFiles.length} encrypted study materials found
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Please connect your Rainbow Wallet to view and access encrypted study resources
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map(file => (
                <FileCard key={file.id} {...file} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
