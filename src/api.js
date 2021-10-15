const API_KEY =
  "ce3fd966e7a1d10d65f907b20bf000552158fd3ed1bd614110baa0ac6cb57a7e";

const tickersHandlers = new Map();

const loadTickers = () => {
  if (tickersHandlers.size === 0) {
    return;
  }

  fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
      ...tickersHandlers.keys(),
    ].join(",")}&tsyms=USD&api_key=${API_KEY}`
  )
    .then((r) => r.json())
    .then((rawData) => {
      const updateData = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value.USD])
      );
      Object.entries(updateData).map(([key, newPrice]) => {
        const handlers = tickersHandlers.get(key) ?? [];
        handlers.forEach((fn) => fn(newPrice));
      });
    });
};

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
};

setInterval(loadTickers, 5000);

window.tickers = tickersHandlers;
