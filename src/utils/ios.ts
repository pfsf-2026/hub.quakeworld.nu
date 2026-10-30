// iphone, ipad and ipod, in any browser (all use webkit). ipados safari reports a mac
// user agent by default, so an ipad is a "mac" with a touch screen
export function isIOS(
  userAgent = navigator.userAgent,
  maxTouchPoints = navigator.maxTouchPoints,
): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return true;
  }

  return userAgent.includes("Macintosh") && maxTouchPoints > 1;
}

if (import.meta.vitest) {
  const { expect, test } = import.meta.vitest;

  test("isIOS", () => {
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1";
    const mac =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
    const android =
      "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36";

    expect(isIOS(iphone, 5)).toBe(true);
    expect(isIOS(mac, 5)).toBe(true); // ipad
    expect(isIOS(mac, 0)).toBe(false);
    expect(isIOS(android, 5)).toBe(false);
  });
}
