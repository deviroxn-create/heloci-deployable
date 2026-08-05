"use client";

import { useState, useRef } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Paperclip,
  Send,
  Smile,
  AtSign,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageComposerProps {
  applicationId: string;
  onSendMessage: (content: string, attachments?: string[]) => Promise<void>;
  isLoading?: boolean;
  staffList?: Array<{ id: string; name: string; email: string }>;
}

export function MessageComposer({
  applicationId,
  onSendMessage,
  isLoading = false,
  staffList = [],
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [isFormatting, setIsFormatting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!content.trim()) return;

    try {
      await onSendMessage(content, attachedFiles.map((f) => f.name));
      setContent("");
      setAttachedFiles([]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFormat = (format: string) => {
    const textarea = document.querySelector(
      `[data-message-editor]`
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);

    let formatted = "";
    switch (format) {
      case "bold":
        formatted = `**${selected}**`;
        break;
      case "italic":
        formatted = `_${selected}_`;
        break;
      case "list":
        formatted = `• ${selected}`;
        break;
      case "link":
        formatted = `[${selected}](url)`;
        break;
    }

    setContent(before + formatted + after);
    textarea.focus();
    textarea.setSelectionRange(start + formatted.length, start + formatted.length);
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((f) => {
        const validTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/zip",
        ];
        const maxSize = 12 * 1024 * 1024; // 12MB
        return validTypes.includes(f.type) && f.size <= maxSize;
      });

      setAttachedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-border bg-white rounded-b-2xl p-4 space-y-3">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 pb-2 border-b border-border">
        <button
          onClick={() => handleFormat("bold")}
          title="Bold"
          className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleFormat("italic")}
          title="Italic"
          className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={() => handleFormat("list")}
          title="Bullet list"
          className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleFormat("ordered")}
          title="Numbered list"
          className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={() => handleFormat("link")}
          title="Add link"
          className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
            className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleAttachFile}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip"
          />
          <button
            title="Emoji"
            className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message Input */}
      <textarea
        data-message-editor
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your message... Use @mentions to notify staff"
        rows={4}
        className="w-full px-4 py-3 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
        disabled={isLoading}
      />

      {/* Attachments Display */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-border"
            >
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700">{file.name}</span>
              <button
                onClick={() => removeAttachment(idx)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isLoading}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
