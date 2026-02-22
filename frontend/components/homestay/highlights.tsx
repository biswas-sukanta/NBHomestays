import { getIcon } from "@/lib/amenity-icons";

export interface HighlightItem {
    id: string;
    title: string;
    subtitle: string;
    iconKey: string;
}

interface HighlightsProps {
    items: HighlightItem[];
}

export function Highlights({ items }: HighlightsProps) {
    if (!items || items.length === 0) return null;

    return (
        <div className="flex flex-col gap-6 py-8 border-b border-gray-200">
            {items.map(item => (
                <div key={item.id} className="flex flex-row items-start gap-4">
                    <span className="text-3xl leading-none mt-1" aria-hidden="true" role="img">
                        {getIcon(item.iconKey)}
                    </span>
                    <div className="flex flex-col">
                        <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-snug break-words">
                            {item.subtitle}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
