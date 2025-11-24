import { useState } from 'react';
import { Header } from '@/components/Header';
import { useAccount } from 'wagmi';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock, CheckCircle2, Lock, Unlock, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const Index = () => {
  const { isConnected, address } = useAccount();
  const {
    encryptedStudyMinutes,
    encryptedTaskCount,
    decryptedStudyMinutes,
    decryptedTaskCount,
    isLoading,
    message,
    addStudyMinutes,
    completeTask,
    decryptStudyMinutes,
    decryptTaskCount,
    loadEncryptedData,
  } = useLearningProgress(CONTRACT_ADDRESS);

  const [studyMinutesInput, setStudyMinutesInput] = useState('');

  const handleAddStudyMinutes = async () => {
    const minutes = parseInt(studyMinutesInput);
    if (isNaN(minutes) || minutes < 1) {
      alert('Please enter a valid number of minutes (at least 1)');
      return;
    }
    try {
      await addStudyMinutes(minutes);
      setStudyMinutesInput('');
    } catch (error) {
      console.error('Error adding study minutes:', error);
    }
  };

  const handleCompleteTask = async () => {
    try {
      await completeTask();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-12 h-12 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Secure Learn Key</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Encrypted Learning Progress Tracker
            </p>
            <p className="text-muted-foreground">
              Record your study minutes and task completions with complete privacy. 
              Only you can decrypt and view your progress.
            </p>
          </div>

          {!isConnected ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-muted-foreground">
                    Please connect your Rainbow Wallet to start tracking your learning progress
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : !CONTRACT_ADDRESS ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Contract Not Configured
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Please set VITE_CONTRACT_ADDRESS in ui/.env.local
                  </p>
                  <div className="text-left bg-muted p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-sm font-mono text-muted-foreground">
                      1. Deploy contract: npx hardhat deploy --network localhost<br/>
                      2. Copy contract address<br/>
                      3. Add to ui/.env.local:<br/>
                      <span className="text-primary">VITE_CONTRACT_ADDRESS=0x...</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {message && (
                <Alert className={message.includes("Error") || message.includes("not configured") ? "border-destructive" : message.includes("Initializing") ? "border-blue-500" : ""}>
                  <AlertDescription>
                    {message}
                    {message.includes("Contract address not configured") && (
                      <div className="mt-2 text-sm">
                        <p className="font-semibold mb-1">Steps to fix:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1 ml-2">
                          <li>Deploy contract: <code className="bg-muted px-1 rounded text-xs">npx hardhat deploy --network localhost</code></li>
                          <li>Copy the contract address from the deployment output</li>
                          <li>Create <code className="bg-muted px-1 rounded text-xs">ui/.env.local</code> with: <code className="bg-muted px-1 rounded text-xs">VITE_CONTRACT_ADDRESS=0x...</code></li>
                          <li>Restart the dev server</li>
                        </ol>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Add Study Minutes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Add Study Minutes
                  </CardTitle>
                  <CardDescription>
                    Record your study time. Data is encrypted before being stored on-chain.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter study minutes"
                      value={studyMinutesInput}
                      onChange={(e) => setStudyMinutesInput(e.target.value)}
                      min="1"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleAddStudyMinutes}
                      disabled={isLoading || !studyMinutesInput}
                    >
                      Add Minutes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Complete Task */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Complete Task
                  </CardTitle>
                  <CardDescription>
                    Mark a task as completed. The count is encrypted and stored on-chain.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleCompleteTask}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Complete Task
                  </Button>
                </CardContent>
              </Card>

              {/* Study Minutes Display */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Study Minutes
                      </CardTitle>
                      <CardDescription>
                        Your encrypted total study minutes
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadEncryptedData}
                      disabled={isLoading}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Encrypted Handle:</p>
                    <p className="font-mono text-xs break-all">
                      {encryptedStudyMinutes || 'No data yet'}
                    </p>
                  </div>
                  {decryptedStudyMinutes !== undefined && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Decrypted Total:</p>
                      <p className="text-2xl font-bold text-primary">
                        {decryptedStudyMinutes} minutes
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={decryptStudyMinutes}
                    disabled={isLoading || !encryptedStudyMinutes}
                    variant="outline"
                    className="w-full"
                  >
                    {decryptedStudyMinutes !== undefined ? (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Re-decrypt Minutes
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Decrypt Minutes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Task Count Display */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Task Completion Count
                      </CardTitle>
                      <CardDescription>
                        Your encrypted total completed tasks
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadEncryptedData}
                      disabled={isLoading}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Encrypted Handle:</p>
                    <p className="font-mono text-xs break-all">
                      {encryptedTaskCount || 'No data yet'}
                    </p>
                  </div>
                  {decryptedTaskCount !== undefined && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Decrypted Total:</p>
                      <p className="text-2xl font-bold text-primary">
                        {decryptedTaskCount} tasks
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={decryptTaskCount}
                    disabled={isLoading || !encryptedTaskCount}
                    variant="outline"
                    className="w-full"
                  >
                    {decryptedTaskCount !== undefined ? (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Re-decrypt Task Count
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Decrypt Task Count
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
