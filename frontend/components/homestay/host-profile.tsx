import { User, GraduationCap, Briefcase, Globe, Star, Award } from 'lucide-react';
import Link from 'next/link';

interface HostProfileProps {
    ownerId?: string;
    ownerName?: string;
    hostDetails?: Record<string, any>;
}

export function HostProfile({ ownerId, ownerName = 'Host', hostDetails }: HostProfileProps) {
    if (!hostDetails) return null;

    const {
        reviewsCount = 0,
        rating = 0,
        yearsHosting = 0,
        school,
        work,
        languages,
        currentLocation,
        bio,
    } = hostDetails;

    const isSuperhost = rating >= 4.5;

    return (
        <section id="host" className="mt-10">
            <h2 className="text-[22px] font-bold mb-6 text-gray-900">Meet your host</h2>

            <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="relative w-fit">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-500 via-primary to-blue-500 p-[3px] shadow-lg">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 text-4xl font-bold text-white">
                            {ownerName ? ownerName.charAt(0).toUpperCase() : <User />}
                        </div>
                    </div>
                    {isSuperhost && (
                        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                            <Award className="h-3 w-3" />
                            Superhost
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight text-gray-900">{ownerName}</h3>
                            {currentLocation && <p className="mt-1 text-sm font-medium text-gray-500">{currentLocation}</p>}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-extrabold text-gray-900">{reviewsCount}</div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-xs">Reviews</div>
                            </div>
                            <div>
                                <div className="flex items-center justify-center gap-1 text-2xl font-extrabold text-gray-900">
                                    {rating} <Star className="h-5 w-5 -mt-1 fill-gray-900 text-gray-900" />
                                </div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-xs">Rating</div>
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold text-gray-900">{yearsHosting}</div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-xs">Years hosting</div>
                            </div>
                        </div>
                    </div>

                    {bio && (
                        <div className="mt-6 border-l-[3px] border-primary/30 pl-4">
                            <p className="text-base font-medium italic leading-relaxed text-gray-700">"{bio}"</p>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-4 text-sm text-gray-700 md:text-base">
                        {school && (
                            <div className="flex items-start gap-4">
                                <GraduationCap className="h-6 w-6 shrink-0 text-gray-400" />
                                <span><strong className="font-semibold text-gray-900">Where I went to school: </strong>{school}</span>
                            </div>
                        )}
                        {work && (
                            <div className="flex items-start gap-4">
                                <Briefcase className="h-6 w-6 shrink-0 text-gray-400" />
                                <span><strong className="font-semibold text-gray-900">My work: </strong>{work}</span>
                            </div>
                        )}
                        {languages && languages.length > 0 && (
                            <div className="flex items-start gap-4">
                                <Globe className="h-6 w-6 shrink-0 text-gray-400" />
                                <span><strong className="font-semibold text-gray-900">Speaks: </strong>{Array.isArray(languages) ? languages.join(', ') : languages}</span>
                            </div>
                        )}
                    </div>

                    {ownerId && (
                        <Link
                            href={`/profile/${ownerId}`}
                            className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                        >
                            View full profile →
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
