import { User, Shield, GraduationCap, Briefcase, Globe, Star } from 'lucide-react';

interface HostProfileProps {
    ownerName?: string;
    hostDetails?: Record<string, any>;
}

export function HostProfile({ ownerName = 'Host', hostDetails }: HostProfileProps) {
    if (!hostDetails) return null;

    const {
        reviewsCount = 0,
        rating = 0,
        yearsHosting = 0,
        school,
        work,
        languages,
        currentLocation,
        bio
    } = hostDetails;

    return (
        <div className="py-8 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-bold mb-8 text-gray-900">Meet your host</h2>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 max-w-2xl flex flex-col items-center relative overflow-hidden mx-auto md:mx-0">
                {/* Decorative Icon */}
                <div className="absolute -top-4 -right-4 p-4 opacity-[0.03]">
                    <Shield className="w-48 h-48" />
                </div>

                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-md z-10">
                    {ownerName ? ownerName.charAt(0).toUpperCase() : <User />}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 z-10 tracking-tight">{ownerName}</h3>
                {currentLocation && <p className="text-sm text-gray-500 mb-6 font-medium z-10">{currentLocation}</p>}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-0 w-full border-y border-gray-100 py-6 mb-6 z-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-gray-900">{reviewsCount}</span>
                        <span className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-wider uppercase mt-1">Reviews</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-x border-gray-100 px-2 lg:px-4">
                        <span className="text-2xl font-extrabold flex items-center gap-1 text-gray-900">
                            {rating} <Star className="w-5 h-5 fill-gray-900 text-gray-900 -mt-1" />
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-wider uppercase mt-1">Rating</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-gray-900">{yearsHosting}</span>
                        <span className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-wider uppercase mt-1">Years hosting</span>
                    </div>
                </div>

                {/* Bio / Tagline */}
                {bio && (
                    <div className="w-full text-left mb-8 z-10">
                        <p className="text-gray-800 leading-relaxed text-base italic font-medium">"{bio}"</p>
                    </div>
                )}

                {/* Personal Details List */}
                <div className="w-full flex flex-col gap-4 text-sm md:text-base text-gray-700 z-10">
                    {school && (
                        <div className="flex items-start gap-4">
                            <GraduationCap className="w-6 h-6 text-gray-400 shrink-0" />
                            <span><strong className="font-semibold text-gray-900">Where I went to school: </strong>{school}</span>
                        </div>
                    )}
                    {work && (
                        <div className="flex items-start gap-4">
                            <Briefcase className="w-6 h-6 text-gray-400 shrink-0" />
                            <span><strong className="font-semibold text-gray-900">My work: </strong>{work}</span>
                        </div>
                    )}
                    {(languages && languages.length > 0) && (
                        <div className="flex items-start gap-4">
                            <Globe className="w-6 h-6 text-gray-400 shrink-0" />
                            <span><strong className="font-semibold text-gray-900">Speaks: </strong>
                                {Array.isArray(languages) ? languages.join(', ') : languages}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
