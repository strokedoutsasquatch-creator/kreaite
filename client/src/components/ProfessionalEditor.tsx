import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Plus,
  Minus,
  Trash2,
  Columns,
  Rows,
  Highlighter,
  Palette,
  Type,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  CheckSquare,
  Maximize2,
  Minimize2,
  Search,
  Replace,
  X,
  FileText,
  Printer,
  Download,
  Sparkles,
  RotateCcw,
  Copy,
  Scissors,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Save,
  Eye,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

interface ProfessionalEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
  showWordCount?: boolean;
  maxCharacters?: number;
  editable?: boolean;
}

const fontSizes = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];
const fontFamilies = [
  { value: 'Georgia, serif', label: 'Georgia (Book)' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Palatino Linotype, serif', label: 'Palatino' },
  { value: 'Garamond, serif', label: 'Garamond' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Courier New, monospace', label: 'Courier New' },
];

const highlightColors = [
  { value: '#fef08a', label: 'Yellow' },
  { value: '#bbf7d0', label: 'Green' },
  { value: '#bfdbfe', label: 'Blue' },
  { value: '#fecaca', label: 'Red' },
  { value: '#e9d5ff', label: 'Purple' },
  { value: '#fed7aa', label: 'Orange' },
];

const textColors = [
  { value: '#000000', label: 'Black' },
  { value: '#374151', label: 'Gray' },
  { value: '#dc2626', label: 'Red' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#16a34a', label: 'Green' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#7c3aed', label: 'Purple' },
];

export default function ProfessionalEditor({
  content,
  onChange,
  onSave,
  placeholder = "Start writing your content...",
  className = "",
  showWordCount = true,
  maxCharacters,
  editable = true,
}: ProfessionalEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [zoom, setZoom] = useState(100);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 min-w-[100px]',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 bg-gray-100 font-bold',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxCharacters,
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6',
        style: `font-family: Georgia, serif; font-size: ${zoom}%;`,
      },
    },
  });

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
    }
  }, [editor, imageUrl]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
    }
  }, [editor, linkUrl]);

  const insertTable = useCallback((rows: number, cols: number) => {
    if (editor) {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();
  const pageCount = Math.ceil(wordCount / 250);

  return (
    <div className={`flex flex-col bg-white dark:bg-zinc-900 rounded-lg border shadow-sm ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
      
      <div className="border-b bg-gray-50 dark:bg-zinc-800 p-2 flex flex-wrap items-center gap-1">
        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
            data-testid="button-editor-undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
            data-testid="button-editor-redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <Select
            value="Georgia, serif"
            onValueChange={(value) => editor.chain().focus().setMark('textStyle', { fontFamily: value }).run()}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs" data-testid="select-font-family">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <Button
            size="icon"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
            data-testid="button-editor-bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
            data-testid="button-editor-italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
            data-testid="button-editor-underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
            data-testid="button-editor-strike"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('subscript') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            title="Subscript"
            data-testid="button-editor-subscript"
          >
            <SubscriptIcon className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('superscript') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            title="Superscript"
            data-testid="button-editor-superscript"
          >
            <SuperscriptIcon className="w-4 h-4" />
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" title="Text Color" data-testid="button-text-color">
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {textColors.map((color) => (
                <button
                  key={color.value}
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: color.value }}
                  onClick={() => editor.chain().focus().setColor(color.value).run()}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" title="Highlight" data-testid="button-highlight">
              <Highlighter className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {highlightColors.map((color) => (
                <button
                  key={color.value}
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: color.value }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
                  title={color.label}
                />
              ))}
              <button
                className="w-6 h-6 rounded border bg-white flex items-center justify-center"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
                title="Remove highlight"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <Button
            size="icon"
            variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
            data-testid="button-editor-h1"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
            data-testid="button-editor-h2"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
            data-testid="button-editor-h3"
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <Button
            size="icon"
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
            data-testid="button-editor-bullet-list"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
            data-testid="button-editor-ordered-list"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('taskList') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Task List"
            data-testid="button-editor-task-list"
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
            data-testid="button-editor-quote"
          >
            <Quote className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <Button
            size="icon"
            variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align Left"
            data-testid="button-editor-align-left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Align Center"
            data-testid="button-editor-align-center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align Right"
            data-testid="button-editor-align-right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justify"
            data-testid="button-editor-align-justify"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" title="Insert Link" data-testid="button-insert-link">
              <LinkIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                data-testid="input-link-url"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={setLink} data-testid="button-set-link">Insert Link</Button>
                <Button size="sm" variant="outline" onClick={() => editor.chain().focus().unsetLink().run()}>
                  Remove Link
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" title="Insert Image" data-testid="button-insert-image">
              <ImageIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div>
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  data-testid="input-image-url"
                />
                <Button size="sm" className="mt-2" onClick={addImage} data-testid="button-add-image-url">
                  Insert from URL
                </Button>
              </div>
              <Separator />
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-image"
                >
                  Upload from Computer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" title="Insert Table" data-testid="button-insert-table">
              <TableIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <div className="space-y-2">
              <Label>Insert Table</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline" onClick={() => insertTable(2, 2)}>2x2</Button>
                <Button size="sm" variant="outline" onClick={() => insertTable(3, 3)}>3x3</Button>
                <Button size="sm" variant="outline" onClick={() => insertTable(4, 4)}>4x4</Button>
                <Button size="sm" variant="outline" onClick={() => insertTable(3, 2)}>3x2</Button>
                <Button size="sm" variant="outline" onClick={() => insertTable(4, 3)}>4x3</Button>
                <Button size="sm" variant="outline" onClick={() => insertTable(5, 5)}>5x5</Button>
              </div>
              {editor.isActive('table') && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <Label>Table Actions</Label>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                        <Plus className="w-3 h-3 mr-1" />Col
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor.chain().focus().addRowAfter().run()}>
                        <Plus className="w-3 h-3 mr-1" />Row
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor.chain().focus().deleteColumn().run()}>
                        <Minus className="w-3 h-3 mr-1" />Col
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor.chain().focus().deleteRow().run()}>
                        <Minus className="w-3 h-3 mr-1" />Row
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => editor.chain().focus().deleteTable().run()}>
                        <Trash2 className="w-3 h-3 mr-1" />Table
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setShowFindReplace(!showFindReplace)}
            title="Find & Replace"
            data-testid="button-find-replace"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            title="Zoom Out"
            data-testid="button-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs w-10 text-center">{zoom}%</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            title="Zoom In"
            data-testid="button-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            data-testid="button-fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          {onSave && (
            <Button
              size="sm"
              onClick={onSave}
              className="h-8"
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>

      {showFindReplace && (
        <div className="border-b bg-muted/30 p-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Find..."
              className="w-40 h-8"
              data-testid="input-find-text"
            />
          </div>
          <div className="flex items-center gap-2">
            <Replace className="w-4 h-4 text-muted-foreground" />
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              className="w-40 h-8"
              data-testid="input-replace-text"
            />
          </div>
          <Button size="sm" variant="outline" className="h-8" data-testid="button-replace-one">
            Replace
          </Button>
          <Button size="sm" variant="outline" className="h-8" data-testid="button-replace-all">
            Replace All
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 ml-auto"
            onClick={() => setShowFindReplace(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div 
        className={`flex-1 overflow-auto ${isFullscreen ? 'p-8' : 'p-4'}`}
        style={{ 
          background: 'linear-gradient(to right, #f5f5f5 0%, white 5%, white 95%, #f5f5f5 100%)',
        }}
      >
        <div 
          className="bg-white dark:bg-zinc-900 mx-auto shadow-lg border"
          style={{ 
            maxWidth: isFullscreen ? '800px' : '100%',
            minHeight: isFullscreen ? 'calc(100vh - 200px)' : '500px',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <EditorContent editor={editor} data-testid="editor-content" />
        </div>
      </div>

      {showWordCount && (
        <div className="border-t bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{characterCount.toLocaleString()} characters</span>
            <span>~{pageCount} pages</span>
          </div>
          <div className="flex items-center gap-2">
            {maxCharacters && (
              <Badge variant={characterCount > maxCharacters ? 'destructive' : 'secondary'}>
                {characterCount}/{maxCharacters}
              </Badge>
            )}
            <span className="text-green-600">Auto-saved</span>
          </div>
        </div>
      )}
    </div>
  );
}
