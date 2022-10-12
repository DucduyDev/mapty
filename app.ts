interface Runnable {
  location: [number, number];
  distance: number;
  time: number;
  pace: number;
  cadence: number;
}

interface Cyclable {
  location: [number, number];
  distance: number;
  time: number;
  speed: number;
  elevationGain?: number;
}

class Workout implements Runnable, Cyclable {
  location: [number, number];
  distance: number;
  time: number;
  pace: number;
  cadence: number;
  speed: number;
  // elevationGain: number;
}
