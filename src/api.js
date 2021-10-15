const API_KEY =
  "6bd25f7512b175ef720f2f0a7dca050b1d92704f4d70fc3bb1960f2d1b785032";

const tickersHandlers = new Map(); // {BTC: cb(price)...,} cb - реактивно меняет данные во App.vue компоненте отсюда нам достаточно вызвать cb и передать в него newPrice
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);
const AGGREGATE_INDEX = "5";

// Ожидает ответа от Websocket затем вызывает колбэк нужного тикера
socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
  } = JSON.parse(e.data);

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

// Добавление cb в Map. Пример - {'BTC': fn1, fn2, fn3, cb} или создание такого ключа и доабвление в него первого cb
export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWS(ticker);
};

// Удаление тикера из Map
export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unSubscribeToTickerOnWS(ticker);
};

// Сообщение для отписки от Websocket
function unSubscribeToTickerOnWS(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

// Сообщение для подписки на обновления на Websocket
function subscribeToTickerOnWS(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

// Устанавливает соединение с WebSocket
function sendToWebSocket(massage) {
  const stringifyedMessage = JSON.stringify(massage);

  if (socket.readyState === socket.OPEN) {
    socket.send(stringifyedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifyedMessage);
    },
    { once: true }
  );
}

