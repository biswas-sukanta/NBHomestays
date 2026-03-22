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
        <div className="grid gap-4 md:grid-cols-2">
            {items.map(item => (
                <div key={item.id} className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 shadow-sm">
                    <div className="flex flex-row items-start gap-4">
                        <span className="mt-1 text-3xl leading-none" aria-hidden="true" role="img">
                            {getIcon(item.iconKey)}
                        </span>
                        <div className="flex flex-col">
                            <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm leading-7 text-gray-600 break-words">
                                {item.subtitle}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
