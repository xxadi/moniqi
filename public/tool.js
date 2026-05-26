function makeRadom(length) {
  // 定义字符库：a-z + 0-9
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // 生成指定长度的随机字符串
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
}

function getTimeNow(type) {
  const now = new Date();

  // 辅助函数：补零
  const padZero = (num) => num.toString().padStart(2, "0");

  switch (type) {
    case "year":
      return now.getFullYear().toString();
    case "month":
      return padZero(now.getMonth() + 1); // getMonth() 返回 0-11，需要 +1
    case "day":
      return padZero(now.getDate());
    case "hour":
      return padZero(now.getHours());
    case "min":
      return padZero(now.getMinutes());
    case "sec":
      return padZero(now.getSeconds());
    default:
      // 如果没有指定类型或类型不匹配，返回完整的时间字符串 yyyy/MM/dd HH:mm:ss 格式
      const year = now.getFullYear();
      const month = padZero(now.getMonth() + 1);
      const day = padZero(now.getDate());
      const hour = padZero(now.getHours());
      const minute = padZero(now.getMinutes());
      const second = padZero(now.getSeconds());

      return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  }
}
