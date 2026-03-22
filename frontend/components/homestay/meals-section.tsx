'use client';

import { UtensilsCrossed, Leaf, MessageCircle, Flame, ChefHat } from 'lucide-react';

interface MealExtra {
    code: string;
    title: string;
    price: number;
    unit: string;
}

interface MealConfig {
    defaultMealPlan?: string;
    mealPlanLabel?: string;
    mealsIncludedPerDay?: number;
    mealPricePerGuest?: number | null;
    dietTypes?: string[];
    extras?: MealExtra[];
}

interface MealsSectionProps {
    mealConfig: MealConfig;
}

const DIET_LABELS: Record<string, string> = {
    'veg': '🥬 Veg',
    'non-veg': '🍗 Non-Veg',
    'jain': '🪷 Jain',
    'vegan': '🌱 Vegan',
    'organic': '🌿 Organic',
    'children': '👶 Children'
};

const MEAL_PLAN_LABELS: Record<string, string> = {
    'none': 'Meals not included',
    '1_bd': 'Breakfast included',
    '2_bd': 'Breakfast & Dinner',
    '2_ld': 'Lunch & Dinner',
    '3_all': 'All meals included',
    '4_all': 'All meals included',
};

const EXTRA_ICONS: Record<string, React.ReactNode> = {
    'bonfire': <Flame className="w-4 h-4 text-orange-500" />,
    'chicken_bbq': <ChefHat className="w-4 h-4 text-rose-500" />,
};

export function MealsSection({ mealConfig }: MealsSectionProps) {
    if (!mealConfig || !mealConfig.defaultMealPlan || mealConfig.defaultMealPlan === 'none') return null;

    const planLabel = mealConfig.mealPlanLabel || MEAL_PLAN_LABELS[mealConfig.defaultMealPlan] || mealConfig.defaultMealPlan;
    const isIncluded = !mealConfig.mealPricePerGuest;

    return (
        <section id="meals" data-testid="meals-section">
            <h2 className="text-[22px] font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                🍽️ Meals & Dining
            </h2>

            <div className="space-y-5">
                {/* Meal plan summary card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5">
                    <div className="absolute -top-4 -right-4 text-6xl opacity-[0.06]">🍽️</div>
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <p className="text-lg font-bold text-emerald-900">{planLabel}</p>
                            <p className="text-sm text-emerald-700 mt-1">
                                {mealConfig.mealsIncludedPerDay && mealConfig.mealsIncludedPerDay > 0
                                    ? (isIncluded
                                        ? `${mealConfig.mealsIncludedPerDay} meal${mealConfig.mealsIncludedPerDay > 1 ? 's' : ''}/day included in your stay`
                                        : `${mealConfig.mealsIncludedPerDay} meal${mealConfig.mealsIncludedPerDay > 1 ? 's' : ''}/day available`)
                                    : 'Meals available on request'}
                            </p>
                            {mealConfig.mealPricePerGuest && (
                                <p className="text-sm font-semibold text-emerald-800 mt-2">
                                    ₹{mealConfig.mealPricePerGuest}/guest/day
                                </p>
                            )}
                        </div>
                        {isIncluded && (
                            <span className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-full uppercase tracking-wider">
                                Included
                            </span>
                        )}
                    </div>
                </div>

                {/* Diet types */}
                {mealConfig.dietTypes && mealConfig.dietTypes.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                            <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Diet Options
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {mealConfig.dietTypes.map((dt: string) => (
                                <span key={dt} className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
                                    {DIET_LABELS[dt] || dt}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Extras */}
                {mealConfig.extras && mealConfig.extras.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Extras</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {mealConfig.extras.map((extra) => (
                                <div key={extra.code} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2.5">
                                        {EXTRA_ICONS[extra.code] || <UtensilsCrossed className="w-4 h-4 text-gray-400" />}
                                        <span className="text-sm font-medium text-gray-800">{extra.title}</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-700">₹{extra.price}<span className="text-xs text-gray-400 font-normal">/{extra.unit}</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="flex items-center gap-2 pt-1 text-sm text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    <span>Contact host for special dietary requirements or custom meals</span>
                </div>
            </div>
        </section>
    );
}
