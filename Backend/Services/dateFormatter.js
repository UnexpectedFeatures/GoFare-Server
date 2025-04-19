function getFormattedGMT8() {
  const options = {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return new Intl.DateTimeFormat("en-US", options)
    .format(new Date())
    .replace(",", "");
}


export default getFormattedGMT8;