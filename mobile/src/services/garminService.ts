/**
 * Facade stabile: i consumer continuano a importare da `services/garminService`.
 * Implementazione SRP in `services/garmin/*`.
 */
export { type GarminLinkStatus, garminService } from './garmin';
