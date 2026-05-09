import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  BookOpen,
  FileText,
  History,
  Lightbulb,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Wrench,
  Download,
  ExternalLink,
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Calendar,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { KnowledgeContextFilters } from '../../features/maintenance-knowledge/components/KnowledgeContextFilters';
import {
  machineManuals,
  maintenanceProcedures,
  historicalRecords,
  lessonsLearned,
  sampleChatMessages,
  type ChatMessage,
} from '../../features/maintenance-knowledge';

interface MaintenanceKnowledgeBaseProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

export function MaintenanceKnowledgeBase({ sidebarCollapsed, onNavigate }: MaintenanceKnowledgeBaseProps) {
  const [selectedMachine, setSelectedMachine] = useState('curve-gen-3b');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [messages, setMessages] = useState<ChatMessage[]>(sampleChatMessages);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        role: 'user' as const,
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
    }
  };

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-auto transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex flex-col">
        {/* Page Header */}
        <div className="p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Maintenance Knowledge Base</h2>
              <p className="text-sm text-slate-400">
                AI-powered knowledge hub for maintenance procedures, manuals, and historical insights
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button
                size="sm"
                className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] font-medium"
              >
                <FileText className="w-4 h-4 mr-1" />
                Upload Document
              </Button>
            </div>
          </div>

          <KnowledgeContextFilters
            selectedMachine={selectedMachine}
            onSelectedMachineChange={setSelectedMachine}
            selectedDocType={selectedDocType}
            onSelectedDocTypeChange={setSelectedDocType}
          />
        </div>

        {/* Main Content Area - Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Knowledge Resources */}
          <div className="w-96 border-r border-white/10 bg-[#0a0f1e] overflow-auto">
            <Tabs defaultValue="procedures" className="h-full flex flex-col">
              <div className="border-b border-white/10 px-4 pt-4">
                <TabsList className="grid w-full grid-cols-4 bg-[#141b2e]">
                  <TabsTrigger value="procedures" className="text-xs data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
                    <FileText className="w-3 h-3 mr-1" />
                    SOPs
                  </TabsTrigger>
                  <TabsTrigger value="manuals" className="text-xs data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Manuals
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
                    <History className="w-3 h-3 mr-1" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="lessons" className="text-xs data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Lessons
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Maintenance Procedures */}
              <TabsContent value="procedures" className="flex-1 overflow-auto p-4 m-0">
                <div className="space-y-3">
                  {maintenanceProcedures.map((proc) => (
                    <Card key={proc.id} className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                                {proc.code}
                              </Badge>
                              {proc.relevance > 80 && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                  {proc.relevance}% match
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-white mb-1">{proc.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>Version {proc.version}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {proc.updated}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-8 w-8 p-0">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Machine Manuals */}
              <TabsContent value="manuals" className="flex-1 overflow-auto p-4 m-0">
                <div className="space-y-3">
                  {machineManuals.map((manual) => (
                    <Card key={manual.id} className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs mb-2">
                              {manual.category}
                            </Badge>
                            <h4 className="text-sm font-medium text-white mb-1">{manual.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>v{manual.version}</span>
                              <span>•</span>
                              <span>{manual.pages} pages</span>
                              <span>•</span>
                              <span>{manual.updated}</span>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-8 w-8 p-0">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Historical Records */}
              <TabsContent value="history" className="flex-1 overflow-auto p-4 m-0">
                <div className="space-y-3">
                  {historicalRecords.map((record) => (
                    <Card key={record.id} className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-cyan-400">{record.jobId}</span>
                              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                                {record.machine}
                              </Badge>
                            </div>
                            <p className="text-sm text-white mb-2">{record.issue}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {record.date}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {record.duration}
                              </span>
                              <span>•</span>
                              <span>{record.technician}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Lessons Learned */}
              <TabsContent value="lessons" className="flex-1 overflow-auto p-4 m-0">
                <div className="space-y-3">
                  {lessonsLearned.map((lesson) => (
                    <Card key={lesson.id} className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs mb-2">
                              {lesson.category}
                            </Badge>
                            <h4 className="text-sm font-medium text-white mb-2">{lesson.title}</h4>
                            <p className="text-xs text-slate-300 leading-relaxed mb-2">{lesson.summary}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>{lesson.author}</span>
                              <span>•</span>
                              <span>{lesson.date}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - AI Knowledge Copilot (Primary Interface) */}
          <div className="flex-1 flex flex-col bg-[#0f1623]">
            {/* Copilot Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Maintenance Knowledge Assistant</h3>
                  <p className="text-xs text-slate-400">
                    Ask questions about procedures, manuals, history, or troubleshooting
                  </p>
                </div>
              </div>

              {/* Current Context Display */}
              <div className="mt-4 p-3 bg-[#141b2e] border border-white/10 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <AlertCircle className="w-3 h-3" />
                  <span className="font-medium">Current Context:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                    CURVE-GEN-3B
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Mechanical Failures
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    CURVE GENERATING Station
                  </Badge>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 max-w-4xl">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-4">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-slate-700' : 'bg-cyan-500/20'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-slate-300" />
                      ) : (
                        <Bot className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        <span className="text-xs text-slate-500">{message.timestamp}</span>
                      </div>

                      {/* User Message */}
                      {message.role === 'user' && (
                        <div className="text-sm text-slate-300">
                          {message.content}
                        </div>
                      )}

                      {/* Assistant Message */}
                      {message.role === 'assistant' && (
                        <div>
                          <div className="p-4 bg-[#141b2e] border border-white/10 rounded-lg">
                            <div className="prose prose-sm prose-invert max-w-none">
                              <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                                {message.content}
                              </div>
                            </div>

                            {/* Sources */}
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <BookOpen className="w-3 h-3 text-slate-400" />
                                  <span className="text-xs font-medium text-slate-400">Sources Referenced:</span>
                                </div>
                                <div className="space-y-2">
                                  {message.sources.map((source, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                      <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 flex-shrink-0">
                                        {source.type}
                                      </Badge>
                                      <span className="text-slate-400">
                                        {source.title}
                                        {source.section && ` - ${source.section}`}
                                        {source.version && ` (${source.version})`}
                                        {source.date && ` - ${source.date}`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Confidence Indicator */}
                            {message.confidence && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                    <span className="text-xs text-slate-400">Confidence Score:</span>
                                    <span className="text-xs font-semibold text-green-400">{message.confidence}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-400 hover:text-green-400">
                                      <ThumbsUp className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-400 hover:text-red-400">
                                      <ThumbsDown className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-400 hover:text-cyan-400">
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat Input Area */}
            <div className="p-6 border-t border-white/10">
              {/* Suggested Questions */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                    onClick={() => setInputMessage('Show maintenance history for this machine')}
                  >
                    Show maintenance history
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                    onClick={() => setInputMessage('What are common failure modes?')}
                  >
                    Common failure modes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                    onClick={() => setInputMessage('Recommended preventive maintenance schedule?')}
                  >
                    PM schedule
                  </Button>
                </div>
              </div>

              {/* Input Field */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask about procedures, safety warnings, troubleshooting steps, or historical repairs..."
                    className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 min-h-[44px]"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-[44px] px-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                AI responses reference machine manuals, SOPs, and historical maintenance data. Always verify critical procedures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
