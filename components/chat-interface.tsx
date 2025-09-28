"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "./ui/markdown-renderer"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Welcome. I am the Student Success Agent. Please provide a student ID or query to begin your analysis.",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input.trim() }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "Sorry, I encountered an error processing your request.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error calling API:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-center mb-6 pt-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Success Agent</h1>
          <p className="text-muted-foreground">Powered by databricks</p>
        </div>
      </div>

      {/* Messages Container */}
      <Card className="flex-1 flex flex-col overflow-hidden backdrop-blur-sm bg-card/80 border-border/50">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3 max-w-[80%]", message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-xs font-medium",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "message-gradient text-card-foreground border border-border/50",
                )}
              >
                {message.role === "assistant" ? (
                  <MarkdownRenderer content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <div
                  className={cn(
                    "text-xs mt-2 opacity-70",
                    message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="message-gradient text-card-foreground border border-border/50 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-border/50 p-4 bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              disabled={isLoading}
              className="flex-1 bg-background/80 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
