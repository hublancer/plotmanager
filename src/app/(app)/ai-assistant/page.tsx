
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, Send, Loader2, User, Brain, MessageSquareText, Languages } from "lucide-react";
import { chatWithAssistant, type ChatAssistantInput, type ChatAssistantOutput } from "@/ai/flows/chat-assistant-flow";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [language, setLanguage] = useState<'en-US' | 'ur-PK'>('en-US');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const continuousModeRef = useRef(isContinuousMode);
  const { user } = useAuth();

  useEffect(() => {
    continuousModeRef.current = isContinuousMode;
  }, [isContinuousMode]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to use the AI assistant.", variant: "destructive" });
        return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const input: ChatAssistantInput = { userMessage: userMessage.text, userId: user.uid };
      const result: ChatAssistantOutput = await chatWithAssistant(input);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: result.assistantResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (result.audioDataUri && audioRef.current) {
        audioRef.current.src = result.audioDataUri;
        audioRef.current.play().catch(e => {
          console.error("Audio playback failed:", e);
          if (continuousModeRef.current && recognitionRef.current) {
            recognitionRef.current.start();
          }
        });
      } else {
        // No audio from AI, but if in continuous mode, listen again.
        if (continuousModeRef.current && recognitionRef.current) {
          recognitionRef.current.start();
        }
      }

    } catch (error) {
      console.error("Error calling AI assistant:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({ title: "AI Error", description: "Could not get response from AI.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleAudioEnd = () => {
      if (continuousModeRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Could not restart recognition", e);
          setIsContinuousMode(false);
        }
      }
    };

    audioElement.addEventListener('ended', handleAudioEnd);

    return () => {
      audioElement.removeEventListener('ended', handleAudioEnd);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = language;

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          handleSendMessage(transcript);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          // The 'no-speech' error is common and not critical. We'll ignore it and restart if in continuous mode.
          if (event.error === 'no-speech') {
            console.warn("Speech recognition: No speech detected.");
            if (continuousModeRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error("Failed to restart recognition on no-speech", e);
                setIsContinuousMode(false);
              }
            }
            return; // Exit without showing a toast.
          }
          
          // For any other error, show a toast and stop the conversation.
          console.error("Speech recognition error", event.error);
          toast({ title: "Voice Error", description: `Could not recognize voice: ${event.error}`, variant: "destructive" });
          setIsContinuousMode(false);
        };
        
      }
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [toast, handleSendMessage, language]);

  const handleTextInputSubmit = () => {
    handleSendMessage(inputText);
    setInputText("");
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({ title: "Voice Input Not Supported", description: "Your browser does not support voice input, or permission was denied.", variant: "destructive"});
      return;
    }
    if (isContinuousMode) {
      recognitionRef.current.stop();
      if(audioRef.current) audioRef.current.pause();
      setIsContinuousMode(false);
    } else {
      try {
        setIsContinuousMode(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        toast({ title: "Mic Error", description: "Could not start microphone. Check permissions.", variant: "destructive" });
        setIsContinuousMode(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.28))]">
       <audio ref={audioRef} hidden />
      <Card className="flex-1 flex flex-col shadow-2xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            PlotPilot AI Assistant
          </CardTitle>
          <CardDescription>Ask me anything about growing your business or managing properties.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquareText className="h-16 w-16 mb-4" />
                <p className="text-lg">No messages yet.</p>
                <p>Start by typing a message or using the voice input.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 p-3 my-2 rounded-lg max-w-[85%]",
                  msg.sender === "user" ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-secondary"
                )}
              >
                <Avatar className="h-8 w-8 border">
                   <AvatarImage src={msg.sender === 'user' ? undefined : "https://placehold.co/100x100.png?text=AI"} data-ai-hint={msg.sender === 'user' ? "user avatar" : "AI avatar"} />
                  <AvatarFallback>{msg.sender === "user" ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 p-3 my-2 rounded-lg max-w-[85%] mr-auto bg-secondary">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="https://placehold.co/100x100.png?text=AI" data-ai-hint="AI avatar typing" />
                  <AvatarFallback><Brain className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-1 pt-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" /> 
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleMicClick}
              disabled={isLoading && !isContinuousMode}
              className={cn((isListening || isContinuousMode) && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              aria-label={isContinuousMode ? "Stop conversation" : "Start voice conversation"}
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Select 
              value={language} 
              onValueChange={(value) => setLanguage(value as 'en-US' | 'ur-PK')}
              disabled={isLoading || isListening || isContinuousMode}
            >
                <SelectTrigger className="w-[130px]" aria-label="Select language">
                    <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        <SelectValue placeholder="Language" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en-US">English</SelectItem>
                    <SelectItem value="ur-PK">Urdu</SelectItem>
                </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder={isListening ? "Listening..." : (isContinuousMode ? "Continuous mode active..." : "Type your message...")}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoading && handleTextInputSubmit()}
              disabled={isLoading || isListening || isContinuousMode}
              className="flex-1"
            />
            <Button onClick={handleTextInputSubmit} disabled={isLoading || !inputText.trim() || isListening || isContinuousMode} size="icon" aria-label="Send message">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
