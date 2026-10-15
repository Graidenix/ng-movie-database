import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { Movie } from '@core/movies/movie.models';
import { MovieCard } from './movie-card';

const MOVIE: Movie = {
  id: 603,
  title: 'The Matrix',
  overview: 'A hacker learns the truth about reality.',
  poster_path: null,
  backdrop_path: null,
  release_date: '1999-03-31',
  vote_average: 8.2,
};

describe('MovieCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MovieCard],
      providers: [provideRouter([])],
    });
    TestBed.inject(LanguageService).setLanguage('en');
  });

  it('renders title, overview, year, rating and links to details', async () => {
    const fixture = TestBed.createComponent(MovieCard);
    fixture.componentRef.setInput('movie', MOVIE);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h3')?.textContent).toContain('The Matrix');
    expect(element.textContent).toContain('A hacker learns the truth about reality.');
    expect(element.textContent).toContain('1999');
    expect(element.textContent).toContain('8.2');
    expect(element.textContent).toContain('No poster');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/movie/603');
  });
});
