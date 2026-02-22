import { getIcon } from "@/lib/amenity-icons";

interface QuickFactsProps {
    facts: Record<string, string>;
}

export function QuickFacts({ facts }: QuickFactsProps) {
    if (!facts || Object.keys(facts).length === 0) return null;

    return (
        <div className="py-8 border-b border-gray-200">
            <h2 className="text-xl font-bold mb-5 text-gray-900">Know Before You Go</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(facts).map(([key, value]) => (
                    <div
                        key={key}
                        className="bg-muted/30 p-4 rounded-2xl flex flex-col items-start border border-border/50 hover:bg-muted/50 transition-colors shadow-sm"
                    >
                        <span className="text-2xl mb-2 leading-none" role="img" aria-hidden="true">
                            {getIcon(key)}
                        </span>
                        <h4 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                            {key}
                        </h4>
                        <p
                            className="text-sm font-medium text-gray-900 leading-tight w-full"
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}
                            title={value}
                        >
                            {value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
