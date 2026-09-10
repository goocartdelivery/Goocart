import React, { forwardRef } from "react";
import { View } from "react-native";

// react-native-maps has no web target (native module only). Metro aliases
// this file on web via metro.config.js so the app still bundles; map screens
// render a placeholder instead of crashing the whole web build. Plain .ts
// (no JSX) so it type-checks on Android/iOS/web alike.

export const PROVIDER_GOOGLE = undefined;

export const DEFAULT_PRECISION = 5;

export function Marker() {
  return null;
}

export const AnimatedRegion = class {
  setValue() {}
  stopAnimation() {}
  stopTracking() {}
  track() {}
};

const MapView = forwardRef((props: any, ref: React.Ref<any>) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion() {},
    animateCamera() {},
    getCamera() {
      return Promise.resolve();
    },
  }));
  return React.createElement(View, { style: props.style });
});

MapView.displayName = "MapView";

export default MapView;