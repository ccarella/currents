import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
};

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

function getConnectionSpeed() {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
    };
  };
  return nav?.connection?.effectiveType || 'unknown';
}

function sendToAnalytics(metric: WebVitalsMetric) {
  const analyticsId = process.env['NEXT_PUBLIC_ANALYTICS_ID'];

  if (!analyticsId) {
    return;
  }

  const body = {
    dsn: analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  };

  const blob = new Blob([new URLSearchParams(body).toString()], {
    type: 'application/x-www-form-urlencoded',
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, blob);
  } else {
    fetch(vitalsUrl, {
      body: blob,
      method: 'POST',
      credentials: 'omit',
      keepalive: true,
    });
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
}
