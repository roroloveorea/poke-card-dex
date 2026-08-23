export function SearchForm({ query = "" }: { query?: string }) {
  return (
    <form className="search-form" action="/search" role="search">
      <label htmlFor="catalog-query">Search card printings</label>
      <div className="search-row">
        <input id="catalog-query" name="q" defaultValue={query} placeholder="Name, number, or set" autoComplete="off" />
        <button className="button" type="submit">Search</button>
      </div>
    </form>
  );
}
