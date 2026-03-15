'use client';

interface StageRibbonProps {
    stageTitle: string;
    stageIconUrl: string;
    totalXp: number;
    xpToNextStage?: number;
}

/**
 * Stage Ribbon component for displaying user's current Elevation Engine stage.
 * Shows progress bar to next stage if applicable.
 */
export function StageRibbon({ 
    stageTitle, 
    stageIconUrl, 
    totalXp, 
    xpToNextStage 
}: StageRibbonProps) {
    // Calculate progress percentage
    const progress = xpToNextStage 
        ? Math.min(((totalXp / (totalXp + xpToNextStage)) * 100), 100)
        : 100;
    
    return (
        <div 
            data-testid="stage-ribbon"
            className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20"
        >
            <div className="flex items-center gap-4">
                <img 
                    src={stageIconUrl} 
                    alt={stageTitle}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                        // Fallback to default icon if file not found
                        (e.target as HTMLImageElement).src = '/icons/stages/newcomer.svg';
                    }}
                />
                <div className="flex-1">
                    <div className="font-semibold text-lg text-foreground">
                        {stageTitle}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {totalXp.toLocaleString()} XP
                    </div>
                    {xpToNextStage !== null && xpToNextStage !== undefined && (
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{xpToNextStage} XP to next stage</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
