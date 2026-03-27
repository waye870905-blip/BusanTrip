function updateKoreaTime() {
  const koreaTimeEl = document.getElementById("korea-time");
  if (!koreaTimeEl) return;

  const now = new Date();
  const koreaTime = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  koreaTimeEl.textContent = koreaTime;
}

function weatherCodeToText(code) {
  const map = {
    0: "晴天",
    1: "大致晴",
    2: "多雲",
    3: "陰天",
    45: "有霧",
    48: "霧凇",
    51: "毛毛雨",
    53: "細雨",
    55: "較強毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "陣雨",
    81: "較強陣雨",
    82: "強烈陣雨",
    95: "雷雨"
  };
  return map[code] || "天氣更新中";
}

async function loadBusanWeather() {
  const weatherMain = document.getElementById("weather-main");
  const weatherSub = document.getElementById("weather-sub");

  if (!weatherMain || !weatherSub) return;

  try {
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.1796&longitude=129.0756&current=temperature_2m,weather_code&timezone=Asia%2FSeoul");
    const data = await res.json();

    const temp = data?.current?.temperature_2m;
    const code = data?.current?.weather_code;
    const text = weatherCodeToText(code);

    if (temp !== undefined) {
      weatherMain.textContent = `${temp}°C`;
      weatherSub.textContent = `${text}｜釜山目前狀態`;
    } else {
      weatherMain.textContent = "無法取得";
      weatherSub.textContent = "稍後再試一次";
    }
  } catch (error) {
    console.error("天氣讀取失敗：", error);
    weatherMain.textContent = "讀取失敗";
    weatherSub.textContent = "請確認網路或稍後重整";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateKoreaTime();
  setInterval(updateKoreaTime, 1000);
  loadBusanWeather();
});
