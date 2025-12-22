import React, { useEffect, useRef, useState } from 'react';
import {
  Heading2,
  Heading3,
  Type,
  Bold,
  Italic,
  Underline,
  Eraser,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Link2Off,
  Image as ImageIcon,
  Loader2,
  Download,
  Undo,
  Redo,
  ListTodo,
  GalleryHorizontalEnd,
  Gem,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface EditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onRemoveBold: () => void;
  onOpenBatchVisuals: () => void;
  onDownloadAllImages: () => void;
  isDownloadingImages: boolean;
  onToggleKeyPoints: () => void;
  showKeyPoints: boolean;
  hasKeyPoints: boolean;
  onRebrand: () => void;
  isRebranding: boolean;
  productName?: string;
  onToggleMetaPanel: () => void;
  showMetaPanel: boolean;
  onUndo: () => void;
  onRedo: () => void;
  askAiBadgeSlotRef?: React.RefObject<HTMLDivElement>;
  extraActions?: React.ReactNode;
}

const ToolbarButton = ({
  icon: Icon,
  command,
  value,
  label,
  onClick,
  active,
  onCommand,
}: {
  icon: React.ElementType;
  command?: string;
  value?: string;
  label?: string;
  onClick?: () => void;
  active?: boolean;
  onCommand: (command: string, value?: string) => void;
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      if (onClick) onClick();
      else if (command) onCommand(command, value);
    }}
    className={cn(
      'p-2 rounded transition-colors',
      active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
    )}
    title={label}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const accentBase =
  'flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200';
const accentDefault = 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100';
const accentActive = 'bg-indigo-600 text-white border border-indigo-600 shadow-sm';
const accentDisabled = 'bg-indigo-50 text-indigo-300 border border-indigo-100 cursor-not-allowed';
const accentGhost = 'text-indigo-700 hover:text-indigo-900 border-none bg-transparent';
const accentGhostActive = 'text-indigo-900 border-none bg-transparent';
const accentGhostDisabled = 'text-indigo-300 border-none bg-transparent cursor-not-allowed';

const AccentButton = ({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  loading,
  iconOnly = false,
  variant = 'solid',
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
  variant?: 'solid' | 'ghost';
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const delayMs = 2000;

  const handleEnter = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setShowTooltip(true), delayMs);
  };

  const handleLeave = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setShowTooltip(false);
  };

  useEffect(
    () => () => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    },
    []
  );

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (disabled) return;
          onClick();
        }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        disabled={disabled || loading}
        aria-label={label}
        className={cn(
          accentBase,
          'justify-center',
          iconOnly ? 'px-2.5 py-2' : 'px-3 py-1.5',
          variant === 'ghost'
            ? disabled || loading
              ? accentGhostDisabled
              : active
                ? accentGhostActive
                : accentGhost
            : disabled || loading
              ? accentDisabled
              : active
                ? accentActive
                : accentDefault
        )}
      >
        <Icon className={cn('w-3.5 h-3.5', loading ? 'animate-spin' : '')} />
        {!iconOnly && <span>{label}</span>}
        {iconOnly && <span className="sr-only">{label}</span>}
      </button>
      {showTooltip && (
        <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg z-50">
          {label}
        </div>
      )}
    </div>
  );
};

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onCommand,
  onRemoveBold,
  onOpenBatchVisuals,
  onDownloadAllImages,
  isDownloadingImages,
  onToggleKeyPoints,
  showKeyPoints,
  hasKeyPoints,
  onRebrand,
  isRebranding,
  productName,
  onToggleMetaPanel,
  showMetaPanel,
  onUndo,
  onRedo,
  askAiBadgeSlotRef,
  extraActions,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 z-20 overflow-x-auto whitespace-nowrap [scrollbar-width:thin] custom-scrollbar">
      <div className="flex items-center gap-2 pr-3 mr-1 border-r border-gray-300 flex-shrink-0">
        {hasKeyPoints && (
          <AccentButton
            icon={ListTodo}
            onClick={onToggleKeyPoints}
            label="Key Points"
            active={showKeyPoints}
            iconOnly
            variant="ghost"
          />
        )}

        <AccentButton
          icon={ImageIcon}
          onClick={onOpenBatchVisuals}
          label="Batch Visuals"
          iconOnly
          variant="ghost"
        />
        <AccentButton
          icon={Gem}
          onClick={onRebrand}
          label="Rebrand"
          disabled={isRebranding || !productName}
          loading={isRebranding}
          iconOnly
          variant="ghost"
        />
        <AccentButton
          icon={Sparkles}
          onClick={onToggleMetaPanel}
          label="SEO Meta"
          active={showMetaPanel}
          iconOnly
          variant="ghost"
        />
        <div ref={askAiBadgeSlotRef} className="flex items-center pl-1" />
      </div>

      <div className="flex items-center gap-1 flex-nowrap flex-shrink-0">
        <div className="flex items-center space-x-1 pr-2 border-r border-gray-300 flex-shrink-0">
          <ToolbarButton
            icon={Heading2}
            command="formatBlock"
            value="<h2>"
            label="Heading 2"
            onCommand={onCommand}
          />
          <ToolbarButton
            icon={Heading3}
            command="formatBlock"
            value="<h3>"
            label="Heading 3"
            onCommand={onCommand}
          />
          <ToolbarButton
            icon={Type}
            command="formatBlock"
            value="<p>"
            label="Paragraph"
            onCommand={onCommand}
          />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300 flex-shrink-0">
          <ToolbarButton icon={Bold} command="bold" label="Bold" onCommand={onCommand} />
          <ToolbarButton icon={Italic} command="italic" label="Italic" onCommand={onCommand} />
          <ToolbarButton
            icon={Underline}
            command="underline"
            label="Underline"
            onCommand={onCommand}
          />
          <ToolbarButton
            icon={Eraser}
            onClick={onRemoveBold}
            label="Remove All Bold Formatting & Quotes"
            onCommand={onCommand}
          />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300 flex-shrink-0">
          <ToolbarButton
            icon={List}
            command="insertUnorderedList"
            label="Bullet List"
            onCommand={onCommand}
          />
          <ToolbarButton
            icon={ListOrdered}
            command="insertOrderedList"
            label="Numbered List"
            onCommand={onCommand}
          />
          <ToolbarButton
            icon={Quote}
            command="formatBlock"
            value="<blockquote>"
            label="Quote"
            onCommand={onCommand}
          />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300 flex-shrink-0">
          <ToolbarButton
            icon={AlignLeft}
            command="alignLeft"
            label="Align Left"
            onCommand={onCommand}
          />
          <ToolbarButton
            icon={AlignCenter}
            command="alignCenter"
            label="Align Center"
            onCommand={onCommand}
          />
          <ToolbarButton
            icon={AlignRight}
            command="alignRight"
            label="Align Right"
            onCommand={onCommand}
          />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300 flex-shrink-0">
          <ToolbarButton
            icon={LinkIcon}
            onClick={() => onCommand('link')}
            label="Insert Link"
            onCommand={onCommand}
          />
          <ToolbarButton
            icon={Link2Off}
            onClick={() => onCommand('unlink')}
            label="Remove Link"
            onCommand={onCommand}
          />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300 flex-shrink-0">
          <ToolbarButton
            icon={isDownloadingImages ? Loader2 : Download}
            onClick={onDownloadAllImages}
            label="Download all images in editor"
            onCommand={onCommand}
          />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onUndo();
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRedo();
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>
      {extraActions && (
        <div className="flex items-center gap-2 pl-3 ml-auto flex-shrink-0">{extraActions}</div>
      )}
    </div>
  );
};
