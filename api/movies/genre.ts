import { getGenreMovies } from './_lib/handlers';
import { withRateLimit } from './_lib/rate-limit';

export const GET = withRateLimit(getGenreMovies);
