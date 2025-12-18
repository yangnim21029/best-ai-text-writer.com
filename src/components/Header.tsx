'use client';

import React from 'react';
import { PenLine, Zap, Coins, Layers, PanelLeftClose, PanelRightClose, History, Settings } from 'lucide-react';
import { ContentScore } from '../types';
import { useAppStore } from '@/store/useAppStore';

interface HeaderProps {
    sessionCost?: number;
    sessionTokens?: number;
    showInput: boolean;
    showSidebar: boolean;
    onToggleInput: () => void;
    onToggleSidebar: () => void;
    onToggleChangelog: () => void;
    onToggleSettings: () => void;
    contentScore: ContentScore;
    displayScale: number;
    onDisplayScaleChange: (scale: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
    sessionCost = 0,
    sessionTokens = 0,
    showInput,
    showSidebar,
    onToggleInput,
    onToggleSidebar,
    onToggleChangelog,
    onToggleSettings,
    contentScore,
    displayScale,
    onDisplayScaleChange
}) => {
    const { modelFlash } = useAppStore();
    const decreaseScale = () => onDisplayScaleChange(displayScale - 0.1);
    const increaseScale = () => onDisplayScaleChange(displayScale + 0.1);

    return (
        // Refactoring UI: Use shadow instead of border-b for elevation, cleaner look
        <header className="bg-white h-16 flex items-center justify-between px-6 flex-shrink-0 z-30 shadow-sm relative">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-md shadow-blue-200">
                        <PenLine className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden md:flex flex-col">
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 leading-tight">
                            Ai Text Writer <span className="text-blue-600">Pro</span> - Best AI Content Generator
                        </h1>
                        <button
                            onClick={onToggleChangelog}
                            className="text-[10px] text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 w-fit group"
                        >
                            <History className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                            <span>v1.4.0 Changelog</span>
                        </button>
                    </div>
                </div>

                {/* Zen Mode Toggles */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg ml-4 border border-gray-100">
                    <button
                        onClick={onToggleInput}
                        className={`p-1.5 rounded-md transition-all ${showInput ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Toggle Input Panel"
                    >
                        <PanelLeftClose className={`w-4 h-4 transition-transform ${!showInput ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={onToggleSidebar}
                        className={`p-1.5 rounded-md transition-all ${showSidebar ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Toggle Analysis Sidebar"
                    >
                        <PanelRightClose className={`w-4 h-4 transition-transform ${!showSidebar ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Display font sizing */}
                <div className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 ml-2">
                    <button
                        onClick={decreaseScale}
                        className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700 hover:bg-white rounded"
                        title="縮小顯示字級"
                    >
                        A-
                    </button>
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-500 bg-white rounded border border-gray-100">
                        {Math.round(displayScale * 100)}%
                    </div>
                    <button
                        onClick={increaseScale}
                        className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700 hover:bg-white rounded"
                        title="放大顯示字級"
                    >
                        A+
                    </button>
                </div>
            </div>

            {/* Variable Reward: Content Score Indicator */}
            <div className="hidden xl:flex items-center gap-3 mx-auto">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Content Score</span>
                    <span className={`text-sm font-bold ${contentScore.color}`}>{contentScore.label}</span>
                </div>
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className={`${contentScore.color} transition-all duration-1000 ease-out`} strokeDasharray={`${contentScore.value}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <span className={`absolute text-[10px] font-bold ${contentScore.color}`}>{contentScore.value}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Stats Dashboard */}
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                    <div className="flex flex-col items-end px-3 py-0.5 border-r border-gray-200">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Tokens
                        </span>
                        <span className="text-sm font-mono font-medium text-gray-600">
                            {sessionTokens.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col items-end px-3 py-0.5">
                        <span className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Coins className="w-3 h-3" /> Cost
                        </span>
                        <span className="text-lg font-mono font-bold text-emerald-600 leading-none">
                            ${Number(sessionCost || 0).toFixed(4)}
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full shadow-sm">
                    <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span className="text-xs font-semibold">{modelFlash}</span>
                </div>

                <button
                    onClick={onToggleSettings}
                    className="p-2 transition-all text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                    title="System Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};
