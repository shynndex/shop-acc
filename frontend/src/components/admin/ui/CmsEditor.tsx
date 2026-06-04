import React, { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Label } from "@/components/ui/label";
import { cloudinaryService } from "@/services/admin/cloudinary.service";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Eraser,
  Upload,
  Link as LinkIcon2,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { Editor } from "@tiptap/react";

// ═════════════════════════════════════════════════════════════════════════
// HTML Sanitizer — fix invalid nesting (<div> inside <p>) via browser parser
// ═════════════════════════════════════════════════════════════════════════

function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerHTML;
}

// ═════════════════════════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════════════════════════

interface CmsEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

interface ToolbarDividerProps {
  vertical?: boolean;
}

// ═════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════

const ToolbarButton = ({ onClick, title, active, children }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    data-active={active ? "true" : undefined}
    className={`inline-flex items-center justify-center size-8 rounded-md text-sm font-medium transition-colors
      ${
        active
          ? "bg-primary/15 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }
      active:scale-95`}
  >
    {children}
  </button>
);

const ToolbarDivider = ({ vertical = true }: ToolbarDividerProps) => (
  <div
    className={
      vertical
        ? "w-px h-6 bg-border shrink-0"
        : "h-px w-full bg-border my-1"
    }
  />
);

// ═════════════════════════════════════════════════════════════════════════
// Link Dialog
// ═════════════════════════════════════════════════════════════════════════

const LinkDialog = ({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) => {
  const existingHref = editor.getAttributes("link").href || "";
  const [url, setUrl] = useState(existingHref);

  const handleSetLink = () => {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    }
    onClose();
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-lg border p-4 w-80 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium">Chèn / Sửa Link</p>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSetLink()}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSetLink}
            className="flex-1 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Áp dụng
          </button>
          {existingHref && (
            <button
              type="button"
              onClick={handleRemoveLink}
              className="px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              Xoá link
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Image Dialog
// ═════════════════════════════════════════════════════════════════════════

const ImageDialog = ({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) => {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInsert = (imageUrl?: string) => {
    const src = imageUrl || url.trim();
    if (src) {
      editor.chain().focus().setImage({ src, alt: alt.trim() }).run();
    }
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được quá 5MB");
      return;
    }

    setUploading(true);
    try {
      const { url: imageUrl } = await cloudinaryService.uploadImage(file);
      handleInsert(imageUrl);
    } catch {
      toast.error("Tải ảnh lên thất bại");
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-lg border p-4 w-96 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium">Chèn ảnh</p>

        {/* Tab bar */}
        <div className="flex rounded-md border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded px-3 py-1.5 transition-colors ${
              activeTab === "upload"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="size-3" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded px-3 py-1.5 transition-colors ${
              activeTab === "url"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LinkIcon2 className="size-3" />
            URL
          </button>
        </div>

        {/* Upload tab */}
        {activeTab === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Đang tải lên...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {dragActive ? "Thả ảnh vào đây..." : "Click hoặc kéo thả ảnh vào đây"}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  JPG, PNG, WebP • Tối đa 5MB
                </p>
              </div>
            )}
          </div>
        )}

        {/* URL tab */}
        {activeTab === "url" && (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleInsert()}
          />
        )}

        {/* Alt text — always visible */}
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Mô tả ảnh (alt text)"
          className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          onKeyDown={(e) => e.key === "Enter" && handleInsert()}
        />

        {/* Preview */}
        {(url || uploading) && (
          <div className="relative rounded-md overflow-hidden border">
            {uploading ? (
              <div className="h-32 bg-muted flex items-center justify-center">
                <Loader2 className="size-6 text-primary animate-spin" />
              </div>
            ) : url ? (
              <img
                src={url}
                alt={alt || "Preview"}
                className="h-32 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";
                }}
              />
            ) : null}
            {url && !uploading && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleInsert()}
            disabled={(activeTab === "url" && !url.trim()) || (activeTab === "upload" && !url && !uploading)}
            className="flex-1 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Chèn
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Main CmsEditor Component
// ═════════════════════════════════════════════════════════════════════════

const CmsEditor: React.FC<CmsEditorProps> = ({
  value,
  onChange,
  label = "Nội dung",
  placeholder = "Nhập nội dung...",
  minHeight = "300px",
}) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4],
          },
          // StarterKit v3 bundles link & underline — disable them since we add them separately
          link: false,
          underline: false,
          // Override paragraph to render <div> instead of <p> to avoid
          // React hydration warning: "<div> cannot be a descendant of <p>"
          paragraph: false,
        }),
        // Override paragraph to use <div> instead of <p> in the live DOM.
        // addNodeView controls the actual DOM element inside <EditorContent>.
        // parseHTML accepts both <div> and <p> from existing content.
        // renderHTML controls serialization (getHTML/clipboard).
        Paragraph.extend({
          parseHTML() {
            return [{ tag: "div" }, { tag: "p" }];
          },
          renderHTML({ HTMLAttributes }) {
            return ["div", HTMLAttributes, 0];
          },
          addNodeView() {
            return ({ HTMLAttributes }) => {
              const dom = document.createElement("div");
              for (const [key, val] of Object.entries(HTMLAttributes)) {
                dom.setAttribute(key, String(val));
              }
              return { dom, contentDOM: dom };
            };
          },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-2 hover:text-primary/80",
          },
        }),
        Image.configure({
          inline: false,
          allowBase64: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
      ],
      content: sanitizeHtml(value || ""),
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
      editorProps: {
        attributes: {
          class:
            "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
          style: `min-height: ${minHeight}`,
        },
      },
      immediatelyRender: false,
    },
    [],
  );

  // Sync external value changes (e.g., switching between popups/pages)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(sanitizeHtml(value || ""), false);
    }
  }, [editor, value]);

  const handleInsertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div
          className="border rounded-lg bg-muted/10 flex items-center justify-center animate-pulse"
          style={{ minHeight }}
        >
          <p className="text-sm text-muted-foreground">Đang tải editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {/* Toolbar */}
      <div className="border rounded-t-lg bg-muted/10">
        {/* Row 1: Text formatting */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Làm lại (Ctrl+Shift+Z)"
          >
            <Redo2 className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Đậm (Ctrl+B)"
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Nghiêng (Ctrl+I)"
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Gạch chân (Ctrl+U)"
          >
            <UnderlineIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Gạch ngang"
          >
            <Strikethrough className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            active={editor.isActive("heading", { level: 4 })}
            title="Heading 4"
          >
            <Heading4 className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Danh sách"
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Danh sách đánh số"
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
            active={editor.isActive({ textAlign: "left" })}
            title="Căn trái"
          >
            <AlignLeft className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
            active={editor.isActive({ textAlign: "center" })}
            title="Căn giữa"
          >
            <AlignCenter className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
            active={editor.isActive({ textAlign: "right" })}
            title="Căn phải"
          >
            <AlignRight className="size-4" />
          </ToolbarButton>
        </div>

        {/* Row 2: Insert & Block */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 pb-1.5">
          <ToolbarButton
            onClick={() => setShowLinkDialog(true)}
            active={editor.isActive("link")}
            title="Chèn link"
          >
            <LinkIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowImageDialog(true)}
            title="Chèn ảnh"
          >
            <ImageIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleInsertTable}
            title="Chèn bảng"
          >
            <TableIcon className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code block"
          >
            <Code className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Đường kẻ ngang"
          >
            <Minus className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Xoá định dạng"
          >
            <Eraser className="size-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div
        className="border-x border-b rounded-b-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-end text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          {editor.isActive("link") && (
            <span className="inline-flex items-center gap-1">
              <LinkIcon className="size-3" />
              {editor.getAttributes("link").href}
            </span>
          )}
          {editor.isActive("table") && "Bảng"}
        </span>
      </div>

      {/* Dialogs */}
      {showLinkDialog && (
        <LinkDialog editor={editor} onClose={() => setShowLinkDialog(false)} />
      )}
      {showImageDialog && (
        <ImageDialog editor={editor} onClose={() => setShowImageDialog(false)} />
      )}
    </div>
  );
};

export default CmsEditor;
