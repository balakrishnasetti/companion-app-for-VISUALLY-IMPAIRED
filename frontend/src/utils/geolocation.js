export function getCurrentLocation(options = {}) {
  const { enableHighAccuracy = true, timeout = 15000, maximumAge = 60000 } = options;

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('Location is not available in this browser.'));
  }

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  if (typeof window !== 'undefined' && !window.isSecureContext && host !== 'localhost' && host !== '127.0.0.1') {
    return Promise.reject(new Error('Location access requires a secure connection. Use localhost or HTTPS and try again.'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let watchId;
    let fallbackTimer;
    let overallTimer;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(overallTimer);
      callback(value);
    };

    const onPosition = ({ coords }) => {
      const latitude = Number(coords.latitude);
      const longitude = Number(coords.longitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
        || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        finish(reject, new Error('Your browser returned invalid location coordinates. Try again.'));
        return;
      }
      finish(resolve, {
        latitude,
        longitude,
        accuracy: Number.isFinite(coords.accuracy) ? Number(coords.accuracy) : 0,
      });
    };

    const onFallbackError = (error) => {
      if (error?.code === 1) finish(reject, new Error(getGeolocationErrorMessage(error)));
    };

    const tryWatchFallback = (error) => {
      if (settled) return;
      if (error?.code === 1) {
        finish(reject, new Error(getGeolocationErrorMessage(error)));
        return;
      }
      if (typeof navigator.geolocation.watchPosition !== 'function') {
        finish(reject, new Error(getGeolocationErrorMessage(error)));
        return;
      }
      try {
        watchId = navigator.geolocation.watchPosition(
          onPosition,
          onFallbackError,
          { enableHighAccuracy: true, timeout: timeout + 12000, maximumAge: 0 },
        );
        fallbackTimer = window.setTimeout(() => {
          finish(reject, new Error(getGeolocationErrorMessage(error)));
        }, 12000);
      } catch (watchError) {
        finish(reject, new Error(getGeolocationErrorMessage(watchError)));
      }
    };

    overallTimer = window.setTimeout(() => {
      finish(reject, new Error('Location lookup timed out. Check device location services and browser permissions, then try again.'));
    }, timeout + 12000);

    navigator.geolocation.getCurrentPosition(
      onPosition,
      tryWatchFallback,
      { enableHighAccuracy, timeout, maximumAge },
    );
  });
}

export function getGeolocationErrorMessage(error) {
  if (!error) return 'Your location could not be determined. Try again or enter a location manually.';
  if (error.code === 1) {
    return 'Location permission was denied. Enable location access in your browser settings and try again.';
  }
  if (error.code === 2) {
    return 'Location information is temporarily unavailable. Try again when your signal is stronger.';
  }
  if (error.code === 3) {
    return 'Location lookup timed out. Try again and keep the browser on this page.';
  }
  return 'Your location could not be determined. Try again or enter a location manually.';
}
