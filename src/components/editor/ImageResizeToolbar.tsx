import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize,
  Minimize,
  Trash2,
  Layout,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ImageResizeToolbarProps {
  onResize: (size: 'small' | 'medium' | 'full' | 'original') => void;
  onAlign: (align: 'left' | 'center' | 'right') => void;
  onRemove: () => void;
  currentWidth?: string | number | null;
  currentAlign?: string | null;
}

export const ImageResizeToolbar: React.FC<ImageResizeToolbarProps> = ({
  onResize,
  onAlign,
  onRemove,
  currentWidth,
  currentAlign,
}) => {
  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-xl p-1 gap-1 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-0.5 border-r border-gray-100 pr-1">
        <ToolbarIconButton
          icon={AlignLeft}
          onClick={() => onAlign('left')}
          active={currentAlign === 'left'}
          label="Align Left"
        />
        <ToolbarIconButton
          icon={AlignCenter}
          onClick={() => onAlign('center')}
          active={currentAlign === 'center'}
          label="Align Center"
        />
        <ToolbarIconButton
          icon={AlignRight}
          onClick={() => onAlign('right')}
          active={currentAlign === 'right'}
          label="Align Right"
        />
      </div>

      <div className="flex items-center gap-0.5 border-r border-gray-100 pr-1 px-1">
        <button
          onClick={() => onResize('small')}
          className={cn(
            'px-2 py-1 text-[10px] font-bold rounded hover:bg-gray-100 transition-colors',
            currentWidth === '300' || currentWidth === '300px'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-500'
          )}
        >
          S
        </button>
        <button
          onClick={() => onResize('medium')}
          className={cn(
            'px-2 py-1 text-[10px] font-bold rounded hover:bg-gray-100 transition-colors',
            currentWidth === '600' || currentWidth === '600px'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-500'
          )}
        >
          M
        </button>
        <button
          onClick={() => onResize('full')}
          className={cn(
            'px-2 py-1 text-[10px] font-bold rounded hover:bg-gray-100 transition-colors',
            currentWidth === '100%' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
          )}
        >
          L
        </button>
      </div>

      <div className="flex items-center gap-0.5 pl-1">
        <ToolbarIconButton icon={Trash2} onClick={onRemove} variant="danger" label="Remove Image" />
      </div>
    </div>
  );
};

const ToolbarIconButton = ({
  icon: Icon,
  onClick,
  active,
  label,
  variant = 'default',
}: {
  icon: any;
  onClick: () => void;
  active?: boolean;
  label: string;
  variant?: 'default' | 'danger';
}) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={cn(
      'p-1.5 rounded transition-all',
      active ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100',
      variant === 'danger' && 'hover:text-red-600 hover:bg-red-50'
    )}
    title={label}
  >
    <Icon className="w-4 h-4" />
  </button>
);
