import React from 'react';
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
    onOpenImageModal: () => void;
    onDownloadAllImages: () => void;
    isDownloadingImages: boolean;
    onToggleKeyPoints: () => void;
    showKeyPoints: boolean;
    hasKeyPoints: boolean;
    onToggleVisualAssets: () => void;
    showVisualAssets: boolean;
    onRebrand: () => void;
    isRebranding: boolean;
    productName?: string;
    onToggleMetaPanel: () => void;
    showMetaPanel: boolean;
    onUndo: () => void;
    onRedo: () => void;
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

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    onCommand,
    onRemoveBold,
    onOpenImageModal,
    onDownloadAllImages,
    isDownloadingImages,
    onToggleKeyPoints,
    showKeyPoints,
    hasKeyPoints,
    onToggleVisualAssets,
    showVisualAssets,
    onRebrand,
    isRebranding,
    productName,
    onToggleMetaPanel,
    showMetaPanel,
    onUndo,
    onRedo,
}) => {
    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 z-20">
            <div className="flex items-center space-x-1 pr-2 border-r border-gray-300">
                <ToolbarButton icon={Heading2} command="formatBlock" value="<h2>" label="Heading 2" onCommand={onCommand} />
                <ToolbarButton icon={Heading3} command="formatBlock" value="<h3>" label="Heading 3" onCommand={onCommand} />
                <ToolbarButton icon={Type} command="formatBlock" value="<p>" label="Paragraph" onCommand={onCommand} />
            </div>

            <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
                <ToolbarButton icon={Bold} command="bold" label="Bold" onCommand={onCommand} />
                <ToolbarButton icon={Italic} command="italic" label="Italic" onCommand={onCommand} />
                <ToolbarButton icon={Underline} command="underline" label="Underline" onCommand={onCommand} />
                <ToolbarButton icon={Eraser} onClick={onRemoveBold} label="Remove All Bold Formatting & Quotes" onCommand={onCommand} />
            </div>

            <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
                <ToolbarButton icon={List} command="insertUnorderedList" label="Bullet List" onCommand={onCommand} />
                <ToolbarButton icon={ListOrdered} command="insertOrderedList" label="Numbered List" onCommand={onCommand} />
                <ToolbarButton icon={Quote} command="formatBlock" value="<blockquote>" label="Quote" onCommand={onCommand} />
            </div>

            <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
                <ToolbarButton icon={AlignLeft} command="alignLeft" label="Align Left" onCommand={onCommand} />
                <ToolbarButton icon={AlignCenter} command="alignCenter" label="Align Center" onCommand={onCommand} />
                <ToolbarButton icon={AlignRight} command="alignRight" label="Align Right" onCommand={onCommand} />
            </div>

            <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
                <ToolbarButton icon={LinkIcon} onClick={() => onCommand('link')} label="Insert Link" onCommand={onCommand} />
                <ToolbarButton icon={Link2Off} onClick={() => onCommand('unlink')} label="Remove Link" onCommand={onCommand} />
            </div>

            <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
                <ToolbarButton icon={ImageIcon} onClick={onOpenImageModal} label="Insert AI Image" onCommand={onCommand} />
                <ToolbarButton
                    icon={isDownloadingImages ? Loader2 : Download}
                    onClick={onDownloadAllImages}
                    label="Download all images in editor"
                    onCommand={onCommand}
                />
            </div>

            <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
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

            <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
                {hasKeyPoints && (
                    <ToolbarButton
                        icon={ListTodo}
                        onClick={onToggleKeyPoints}
                        label="Toggle Key Points Checklist"
                        active={showKeyPoints}
                        onCommand={onCommand}
                    />
                )}
                <ToolbarButton
                    icon={GalleryHorizontalEnd}
                    onClick={onToggleVisualAssets}
                    label="Toggle Visual Assets Manager"
                    active={showVisualAssets}
                    onCommand={onCommand}
                />
            </div>

            <div className="flex items-center space-x-1 px-2">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onRebrand();
                    }}
                    disabled={isRebranding || !productName}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        isRebranding ? 'bg-purple-50 text-purple-400 cursor-not-allowed' : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 shadow-sm'
                    }`}
                    title={productName ? `Inject brand: ${productName}` : 'No Product Profile Active'}
                >
                    {isRebranding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gem className="w-3.5 h-3.5" />}
                    <span>Rebrand</span>
                </button>
            </div>

            <div className="flex items-center space-x-1 px-2">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleMetaPanel();
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                        showMetaPanel ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    title="SEO Meta Settings"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SEO Meta</span>
                </button>
            </div>
        </div>
    );
};
