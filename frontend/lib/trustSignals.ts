export type TrustSignal =
  | 'FAST_REPLY'
  | 'GUEST_FAVORITE'
  | 'POPULAR_STAY'
  | 'NEW_LISTING'
  | 'TRUSTED_HOST'
  | 'HIGH_DEMAND';

export const SIGNAL_LABELS: Record<TrustSignal, string> = {
  FAST_REPLY: 'Fast reply',
  GUEST_FAVORITE: 'Guest favorite',
  POPULAR_STAY: 'Popular stay',
  NEW_LISTING: 'New listing',
  TRUSTED_HOST: 'Hosted by trusted locals',
  HIGH_DEMAND: 'High demand this season',
};

export function getTrustSignalLabel(signal: string): string {
  return (SIGNAL_LABELS as Record<string, string | undefined>)[signal] ?? signal;
}
