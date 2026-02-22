export const AMENITY_ICONS: Record<string, string> = {
    // Highlights
    'Mountain View': '🏔️',
    'Hot water': '♨️',
    'Free Wi-Fi': '📶',
    'Water Dispenser': '💧',
    'Common hangout area': '🛋️',
    'Cafe': '☕',
    'In-house Activities': '🎯',
    'Bedside Lamps': '🪔',
    'Breakfast (Extra)': '🍳',
    'UPI Payment Accepted': '📱',
    'Pets Allowed': '🐾',
    'Parking (public)': '🅿️',
    'Charging Points': '🔌',
    'Power Backup': '🔋',
    'Indoor Games': '🎲',
    'Bonfire (Extra)': '🔥',

    // Bathroom
    'Bath': '🛁',
    'Hairdryer': '💨',
    'Cleaning products': '🧽',
    'Shampoo': '🧴',
    'Body soap': '🧼',
    'Shower gel': '🧴',

    // Bedroom & Laundry
    'Free washer': '🧺',
    'Free dryer': '🧣',
    'Essentials (Towels, bed sheets, soap, TP)': '🛏️',
    'Hangers': '🧥',
    'Bed linen': '🛌',
    'Cotton linen': '🧶',
    'Extra pillows/blankets': '🧣',
    'Room-darkening blinds': '🪟',
    'Iron': '👕',
    'Clothes drying rack': '👚',
    'Clothes storage': '🧳',

    // Entertainment & Family
    'Books/reading material': '📚',
    'Children’s books/toys': '🧸',
    'Fireplace guards': '🧯',

    // Heating & Cooling
    'Indoor fireplace': '🪵',
    'Portable fans': '🌬️',
    'Heating': '🌡️',

    // Home Safety
    'Smoke alarm': '🚨',

    // Internet & Office
    'Wifi': '🌐',
    'Dedicated workspace': '💻',

    // Kitchen & Dining
    'Kitchen': '🍳',
    'Cooking space': '🥘',
    'Fridge': '🧊',
    'Microwave': '♨️',
    'Cooking basics': '🧂',
    'Crockery/cutlery': '🍽️',
    'Freezer': '❄️',
    'Dishwasher': '🍽️',
    'Gas cooker': '🔥',
    'Oven': '🥐',
    'Kettle': '🫖',
    'Coffee maker': '☕',
    'Wine glasses': '🍷',
    'Toaster': '🍞',
    'Blender': '🥤',
    'Dining table': '🪑',

    // Services
    'Luggage drop-off allowed': '🧳',
    'Host greets you': '👋',

    // Unavailable
    'Lock on bedroom door': '🔒',
    'Exterior security cameras': '📹',
    'TV': '📺',
    'Air conditioning': '❄️',
    'Carbon monoxide alarm': '🚨',

    // Quick Facts Mapping
    'Check-in': '🕒',
    'Check-out': '🕙',
    'Location': '📍',
    'Alcohol': '🍷',
    'Hike': '🥾',
    'Mobile Network': '📱',
    'Outsiders': '🚫'
};

export const getIcon = (key: string): string => {
    return AMENITY_ICONS[key] || '✨'; // Fallback sparkle
};
